const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ExpertRequest = sequelize.define("ExpertRequest", {
  name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  email: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  message: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  },
  expertDateTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Preferred consultation date and time'
  },
  status: {
    type: DataTypes.ENUM('pending', 'contacted', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  ip: { 
    type: DataTypes.STRING, 
    allowNull: true 
  }
}, {
  tableName: 'ExpertRequest',
  timestamps: true
});

module.exports = ExpertRequest;