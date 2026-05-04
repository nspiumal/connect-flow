'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InterestRate = sequelize.define('InterestRate', {
  id: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  name: { type: DataTypes.STRING(255), allowNull: false },
  ratePercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, field: 'rate_percent' },
  firstMonthRatePercent: { type: DataTypes.DECIMAL(5, 2), field: 'first_month_rate_percent' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_default' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
}, {
  tableName: 'interest_rates',
  timestamps: false,
});

module.exports = InterestRate;
