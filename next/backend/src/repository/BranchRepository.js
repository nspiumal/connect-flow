'use strict';
const { Branch, User } = require('../model');
const { Op } = require('sequelize');

const include = [{ model: User, as: 'manager' }];

module.exports = {
  findAll: () => Branch.findAll({ include }),
  findAllActive: () => Branch.findAll({ where: { is_active: true }, include, order: [['name', 'ASC']] }),
  findById: (id) => Branch.findByPk(id, { include }),
  findByName: (name) => Branch.findOne({ where: { name } }),
  create: (data) => Branch.create(data),
  update: (id, data) => Branch.update(data, { where: { id } }),
  delete: (id) => Branch.destroy({ where: { id } }),
  findPaginated: ({ page = 0, size = 10, sortBy = 'name', sortDir = 'asc', name, isActive }) => {
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (isActive !== undefined) where.is_active = isActive;
    return Branch.findAndCountAll({
      where,
      include,
      limit: size,
      offset: page * size,
      order: [[sortBy, sortDir.toUpperCase()]],
      distinct: true,
    });
  },
};
