'use strict';
const { Branch, User } = require('../model');

module.exports = {
  findAll: () => Branch.findAll({ include: [{ model: User, as: 'manager' }] }),
  findActive: () => Branch.findAll({ where: { isActive: true }, include: [{ model: User, as: 'manager' }], order: [['name', 'ASC']] }),
  findPaginated: ({ page, size, sortBy, sortDir }) => {
    return Branch.findAndCountAll({
      include: [{ model: User, as: 'manager' }],
      limit: size,
      offset: page * size,
      order: [[sortBy || 'createdAt', sortDir || 'desc']],
      distinct: true,
    });
  },
  findById: (id) => Branch.findByPk(id, { include: [{ model: User, as: 'manager' }] }),
  findByName: (name) => Branch.findOne({ where: { name } }),
  create: (data) => Branch.create(data),
  update: (id, data) => Branch.update(data, { where: { id } }),
  delete: (id) => Branch.destroy({ where: { id } }),
};
