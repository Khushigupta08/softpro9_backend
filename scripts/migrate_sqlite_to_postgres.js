#!/usr/bin/env node
/*
  migrate_sqlite_to_postgres.js
  Simple migration tool that copies schema and data from SQLite to Postgres.

  Usage examples:
    node scripts/migrate_sqlite_to_postgres.js --sqlite ./database.sqlite --pg "postgres://user:pass@host:5432/db"
    DATABASE_URL="postgres://..." node scripts/migrate_sqlite_to_postgres.js --sqlite ./database.sqlite
    node scripts/migrate_sqlite_to_postgres.js --sqlite ./database.sqlite --dry

  Notes:
    - Does not attempt to map complex SQLite constraints (CHECK, partial indexes, triggers).
    - Uses PRAGMA table_info and basic type mapping.
    - Requires Node packages: sqlite3 and pg (already in project deps/devDeps).
*/

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const sqlite3 = require('sqlite3');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { dry: false, batch: 500 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--sqlite' && args[i + 1]) { out.sqlite = args[++i]; }
    else if (a === '--pg' && args[i + 1]) { out.pg = args[++i]; }
    else if (a === '--dry') { out.dry = true; }
    else if (a === '--batch' && args[i + 1]) { out.batch = Number(args[++i]) || 500; }
  }
  return out;
}

function mapSqliteTypeToPostgres(sqliteType) {
  if (!sqliteType) return 'TEXT';
  const t = sqliteType.toUpperCase();
  if (t.includes('INT')) return 'INTEGER';
  if (t.includes('CHAR') || t.includes('CLOB') || t.includes('TEXT')) return 'TEXT';
  if (t.includes('BLOB')) return 'BYTEA';
  if (t.includes('REAL') || t.includes('FLOA') || t.includes('DOUB')) return 'REAL';
  if (t.includes('NUM')) return 'NUMERIC';
  if (t.includes('DATE') || t.includes('TIME')) return 'TIMESTAMP';
  return 'TEXT';
}

function sqliteAll(db, sql, params=[]) {
  return new Promise((res, rej) => {
    db.all(sql, params, (err, rows) => err ? rej(err) : res(rows));
  });
}

function sqliteGet(db, sql, params=[]) {
  return new Promise((res, rej) => {
    db.get(sql, params, (err, row) => err ? rej(err) : res(row));
  });
}

async function migrate({ sqlite: sqlitePath, pg: pgConn, dry=false, batch=500 }) {
  if (!sqlitePath) throw new Error('Missing --sqlite <path>');
  if (!pgConn) pgConn = process.env.DATABASE_URL;
  if (!pgConn) throw new Error('Missing Postgres connection string: provide --pg or set DATABASE_URL');

  sqlitePath = path.resolve(sqlitePath);
  if (!fs.existsSync(sqlitePath)) throw new Error(`SQLite file not found: ${sqlitePath}`);

  console.log(`Opening SQLite file: ${sqlitePath}`);
  const sqliteDb = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY);

  console.log(`Connecting to Postgres: ${pgConn.replace(/:(?:[^@]+)@/, ':*****@')}`);
  const pg = new Client({ connectionString: pgConn });
  await pg.connect();

  try {
    const tables = await sqliteAll(sqliteDb, `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`);
    const tableNames = tables.map(r => r.name);

    const summary = [];

    for (const table of tableNames) {
      console.log('\n----');
      console.log(`Processing table: ${table}`);

      const cols = await sqliteAll(sqliteDb, `PRAGMA table_info(${table})`);
      if (!cols || cols.length === 0) {
        console.warn(`Skipping empty or unknown table: ${table}`);
        continue;
      }

      const pkCols = cols.filter(c => c.pk).sort((a,b)=>a.pk-b.pk).map(c=>c.name);

      const colDefs = cols.map(c => {
        const pgType = mapSqliteTypeToPostgres(c.type);
        let def = `"${c.name}" ${pgType}`;
        if (c.notnull) def += ' NOT NULL';
        if (c.dflt_value !== null && c.dflt_value !== undefined) def += ` DEFAULT ${c.dflt_value}`;
        return def;
      });

      let createSQL = `CREATE TABLE IF NOT EXISTS "${table}" (\n  ${colDefs.join(',\n  ')}`;
      if (pkCols.length > 0) {
        createSQL += `,\n  PRIMARY KEY (${pkCols.map(c=>`"${c}"`).join(', ')})`;
      }
      createSQL += '\n);';

      console.log('Create SQL:');
      console.log(createSQL);

      if (!dry) {
        await pg.query('BEGIN');
        try {
          await pg.query(createSQL);
          await pg.query('COMMIT');
        } catch (err) {
          await pg.query('ROLLBACK');
          throw err;
        }
      }

      // Copy data
      const rows = await sqliteAll(sqliteDb, `SELECT * FROM "${table}"`);
      console.log(`Rows in sqlite: ${rows.length}`);
      let copied = 0;

      if (rows.length > 0) {
        const colNames = Object.keys(rows[0]);
        const nonPkCols = colNames.filter(c => !pkCols.includes(c));

        // Prepare upsert SQL template
        const insertBase = `INSERT INTO "${table}" (${colNames.map(c=>`"${c}"`).join(',')}) VALUES `;

        const conflictClause = pkCols.length > 0 ? `ON CONFLICT (${pkCols.map(c=>`"${c}"`).join(',')}) DO UPDATE SET ${nonPkCols.map(c=>`"${c}"=EXCLUDED."${c}"`).join(',')}` : '';

        for (let i = 0; i < rows.length; i += batch) {
          const chunk = rows.slice(i, i + batch);
          const values = [];
          const placeholders = chunk.map((r, ri) => {
            const p = colNames.map((c, ci) => {
              values.push(r[c]);
              return `$${values.length}`;
            });
            return `(${p.join(',')})`;
          });

          const sql = insertBase + placeholders.join(',') + (conflictClause ? ` ${conflictClause}` : '');

          console.log(`Batch ${Math.floor(i/batch)+1}: ${chunk.length} rows`);
          if (dry) {
            console.log(sql);
          } else {
            await pg.query('BEGIN');
            try {
              await pg.query(sql, values);
              await pg.query('COMMIT');
              copied += chunk.length;
            } catch (err) {
              await pg.query('ROLLBACK');
              console.error('Error inserting batch:', err.message || err);
              throw err;
            }
          }
        }
      }

      // Verification counts
      const sqliteCountRow = await sqliteGet(sqliteDb, `SELECT count(*) as c FROM "${table}"`);
      const sqliteCount = sqliteCountRow ? sqliteCountRow.c : 0;
      let pgCount = null;
      if (!dry) {
        const res = await pg.query(`SELECT count(*)::int as c FROM "${table}"`);
        pgCount = res.rows[0].c;
      }

      console.log(`Table ${table} summary: sqlite=${sqliteCount} postgres=${pgCount} copied=${copied}`);
      if (!dry && pgCount !== sqliteCount) {
        console.warn(`WARNING: count mismatch for ${table}: sqlite=${sqliteCount}, postgres=${pgCount}`);
      }

      summary.push({ table, sqliteCount, pgCount, copied });
    }

    console.log('\n==== Migration Summary ====');
    summary.forEach(s => {
      console.log(`${s.table}: sqlite=${s.sqliteCount} postgres=${s.pgCount} copied=${s.copied}`);
    });

  } finally {
    sqliteDb.close();
    await pg.end();
  }
}

(async () => {
  try {
    const args = parseArgs();
    await migrate(args);
    console.log('\nMigration finished.');
  } catch (err) {
    console.error('Migration failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
