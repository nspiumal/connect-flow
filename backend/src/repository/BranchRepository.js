'use strict';
const { Branch, User } = require('../model');

module.exports = {
  findAll: () => Branch.findAll({ include: [{ model: User, as: 'manager' }] }),
  findById: (id) => Branch.findByPk(id, { include: [{ model: User, as: 'manager' }] }),
  findByName: (name) => Branch.findOne({ where: { name } }),
  create: (data) => Branch.create(data),
  update: (id, data) => Branch.update(data, { where: { id } }),
  delete: (id) => Branch.destroy({ where: { id } }),
};
