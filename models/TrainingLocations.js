const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const TrainingLocation = sequelize.define("TrainingLocation", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  slug: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING(300),
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  course: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  highlights: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  duration: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  mode: {
    type: DataTypes.STRING(100),
    defaultValue: 'Online & Offline'
  },
  fees: {
    type: DataTypes.STRING(100),
    defaultValue: 'Contact for details'
  },
  isSAP: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  
  // SEO fields
  metaTitle: {
    type: DataTypes.STRING(300)
  },
  metaDescription: {
    type: DataTypes.TEXT
  },
  metaKeywords: {
    type: DataTypes.STRING(500)
  },
  
  // Rich Content
  content_data: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('content_data');
      if (!rawValue) return null;
      try {
        return JSON.parse(rawValue);
      } catch (error) {
        console.error('Error parsing content_data:', error);
        return null;
      }
    },
    set(value) {
      if (value === null || value === undefined) {
        this.setDataValue('content_data', null);
      } else {
        try {
          // Handle both string and object inputs
          const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
          this.setDataValue('content_data', stringValue);
        } catch (error) {
          console.error('Error stringifying content_data:', error);
          this.setDataValue('content_data', null);
        }
      }
    }
  },
  
  // 🆕 NEW: Company Logos Storage
  company_logos: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of {name: string, logo: string (base64 or URL)}'
  },
  
  // Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'training_locations',
  timestamps: true,
  indexes: [
    { fields: ['slug'] },
    { fields: ['category'] },
    { fields: ['isActive'] }
  ]
});

module.exports = TrainingLocation;