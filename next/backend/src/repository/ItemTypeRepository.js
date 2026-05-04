'use strict';
const { ItemType } = require('../model');
const { Op } = require('sequelize');

module.exports = {
  findAll: () => ItemType.findAll({ order: [['name', 'ASC']] }),
  findAllActive: () => ItemType.findAll({ where: { is_active: true }, order: [['name', 'ASC']] }),
  findById: (id) => ItemType.findByPk(id),
  findByName: (name) => ItemType.findOne({ where: { name } }),
  create: (data) => ItemType.create(data),
  update: (id, data) => ItemType.update(data, { where: { id } }),
  delete: (id) => ItemType.destroy({ where: { id } }),
  findPaginated: ({ page = 0, size = 10, sortBy = 'name', sortDir = 'asc', name, isActive }) => {
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (isActive !== undefined) where.is_active = isActive;
    return ItemType.findAndCountAll({
      where,
      limit: size,
      offset: page * size,
      order: [[sortBy, sortDir.toUpperCase()]],
    });
  },
};
