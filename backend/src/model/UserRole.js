'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserRole = sequelize.define('UserRole', {
  id: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  userId: { type: DataTypes.CHAR(36), allowNull: true, field: 'user_id' },
  // Was a Postgres ENUM; widened to STRING so Super Admin can create custom
  // roles (backend/migrations/001_roles_permissions.sql relaxes the column and
  // drops the enum type). The value must match a `roles.name` row.
  role: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  branchId: { type: DataTypes.CHAR(36), field: 'branch_id' },
}, {
  tableName: 'user_roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = UserRole;
