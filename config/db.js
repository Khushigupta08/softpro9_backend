// config/db.js
const { Sequelize } = require('sequelize');

// Use PostgreSQL on production (Render), SQLite on local
const isProduction = process.env.NODE_ENV === 'production';
const hasDatabaseURL = Boolean(process.env.DATABASE_URL);

// Accept multiple common env var names for compatibility
const PGHOST = process.env.PGHOST || process.env.DB_HOST || process.env.DB_HOSTNAME;
const PGUSER = process.env.PGUSER || process.env.DB_USER || process.env.DB_USERNAME;
const PGPASSWORD = process.env.PGPASSWORD || process.env.DB_PASSWORD;
const PGDATABASE = process.env.PGDATABASE || process.env.DB_NAME || process.env.DB_DATABASE;
const PGPORT = process.env.PGPORT || process.env.DB_PORT;
const SQLITE_PATH = process.env.SQLITE_PATH || process.env.DB_FILE || './database.sqlite';

let sequelize;

function maskConnectionString(conn) {
  if (!conn) return '';
  try {
    // try to parse postgres connection strings like postgres://user:pass@host:port/db
    const m = conn.match(/^(.*:\/\/)(.*?)(:.*?@)(.*)$/);
    if (m) {
      return m[1] + m[2] + ':*****@' + m[4];
    }
    // fallback: mask password-looking parts
    return conn.replace(/:(?:[^@]+)@/, ':*****@');
  } catch (e) {
    return '***masked***';
  }
}

if (isProduction && hasDatabaseURL) {
  // PostgreSQL on Render with DATABASE_URL
  console.log('USING_POSTGRES', maskConnectionString(process.env.DATABASE_URL));
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else if (isProduction && !hasDatabaseURL) {
  // Production without DATABASE_URL - try to use pg connection string from environment
  console.warn('⚠️  DATABASE_URL not set in production. Attempting to connect with PostgreSQL environment variables.');
  const connPreview = `host=${PGHOST || 'localhost'} user=${PGUSER || ''} db=${PGDATABASE || ''}`;
  console.log('USING_POSTGRES', connPreview);
  sequelize = new Sequelize({
    dialect: 'postgres',
    host: PGHOST || 'localhost',
    port: PGPORT || 5432,
    database: PGDATABASE || 'softpro9_db',
    username: PGUSER || 'softpro9_user',
    password: PGPASSWORD,
    logging: false,
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  // SQLite locally (development only)
  const storageFile = SQLITE_PATH;
  console.log('USING_SQLITE', storageFile);
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storageFile,
    logging: false,
  });
}

  // Add a connection helper with retry logic to make startup resilient
  async function wait(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  async function connectWithRetry(options = {}) {
    const maxRetries = Number(process.env.DB_MAX_RETRIES) || options.maxRetries || 10;
    const initialDelay = Number(process.env.DB_RETRY_DELAY_MS) || options.initialDelay || 2000;

    let attempt = 0;

    while (true) {
      try {
        attempt += 1;
        await sequelize.authenticate();
        // sync models after successful authentication
        await sequelize.sync({ alter: true });
        console.log('✅ Database connected & synced');
        return;
      } catch (err) {
        if (attempt >= maxRetries) {
          console.error('❌ Database connection failed after retries:', err);
          throw err;
        }
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.warn(`⚠️  DB connect attempt ${attempt} failed. Retrying in ${delay}ms...`);
        await wait(delay);
      }
    }
  }

  // Preserve compatibility: export sequelize instance, and attach helper
  sequelize.connectWithRetry = connectWithRetry;

  module.exports = sequelize;
