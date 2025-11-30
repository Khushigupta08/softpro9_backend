const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Message = sequelize.define("Message", {
  name: { 
    type: DataTypes.STRING(100), 
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  email: { 
    type: DataTypes.STRING(255), 
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  phone: { 
    type: DataTypes.STRING(20), 
    allowNull: true,
    validate: {
      is: /^[0-9+\-() ]*$/i
    }
  },
  service: { 
    type: DataTypes.STRING(100), 
    allowNull: true,
    validate: {
      isIn: [['SAP', 'Web & App Development', 'Digital Marketing', 'Other']]
    }
  },
  message: { 
    type: DataTypes.TEXT, 
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [10, 5000]
    }
  },
  ip: { 
    type: DataTypes.STRING(45), 
    allowNull: true 
  },
  status: {
    type: DataTypes.ENUM('unread', 'read', 'replied'),
    defaultValue: 'unread'
  }
}, {
  tableName: 'Messages',
  timestamps: true,
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = Message;