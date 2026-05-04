'use strict';
const { ItemType } = require('../model');

const { Op } = require('sequelize');

module.exports = {
  findAll: () => ItemType.findAll(),
  findActive: () => ItemType.findAll({ where: { isActive: true }, order: [['name', 'ASC']] }),
  findPaginated: ({ page, size, name, isActive, sortBy, sortDir }) => {
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (isActive !== undefined) where.isActive = isActive;
    return ItemType.findAndCountAll({
      where,
      limit: size,
      offset: page * size,
      order: [[sortBy || 'name', sortDir || 'asc']],
    });
  },
  findById: (id) => ItemType.findByPk(id),
  findByName: (name) => ItemType.findOne({ where: { name } }),
  create: (data) => ItemType.create(data),
  update: (id, data) => ItemType.update(data, { where: { id } }),
  delete: (id) => ItemType.destroy({ where: { id } }),
};
