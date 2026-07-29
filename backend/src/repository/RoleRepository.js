'use strict';
const { Role, Permission, UserRole } = require('../model');

module.exports = {
  // NOTE: order key is the raw column 'created_at', not 'createdAt' — this
  // model (like Branch/User) passes `createdAt: 'created_at'` as an explicit
  // option, which combined with the global `underscored: true` in
  // config/database.js makes 'created_at' the actual attribute name too.
  findAll: () => Role.findAll({ order: [['created_at', 'ASC']] }),
  findById: (id) => Role.findByPk(id),
  findByName: (name) => Role.findOne({ where: { name } }),
  create: (data) => Role.create(data),
  update: (id, data) => Role.update(data, { where: { id } }),
  delete: (id) => Role.destroy({ where: { id } }),
  findWithPermissions: (name) =>
    Role.findOne({ where: { name }, include: [{ model: Permission, as: 'permissions' }] }),
  countUsers: (name) => UserRole.count({ where: { role: name } }),
};