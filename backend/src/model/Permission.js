'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  module: { type: DataTypes.STRING(50), allowNull: false },
  label: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.STRING(255) },
}, {
  tableName: 'permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Permission;