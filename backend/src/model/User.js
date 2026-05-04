'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  fullName: { type: DataTypes.STRING(255), allowNull: false, field: 'full_name' },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  phone: { type: DataTypes.STRING(20) },
  pin: { type: DataTypes.STRING(255) },
  password: { type: DataTypes.STRING(255), allowNull: false },
  createdAt: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP'), field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP'), onUpdate: sequelize.literal('CURRENT_TIMESTAMP'), field: 'updated_at' },
}, {
  tableName: 'profiles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;
