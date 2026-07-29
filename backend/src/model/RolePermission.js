'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Joins on the role NAME (references roles.name), not an id — see roles/permissions
// migration notes in backend/migrations/001_roles_permissions.sql.
const RolePermission = sequelize.define('RolePermission', {
  id: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  roleName: { type: DataTypes.STRING(50), allowNull: false, field: 'role_name' },
  permissionId: { type: DataTypes.CHAR(36), allowNull: false, field: 'permission_id' },
}, {
  tableName: 'role_permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = RolePermission;