'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {
  id: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  label: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.STRING(255) },
  isSystem: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_system' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
}, {
  tableName: 'roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Role;