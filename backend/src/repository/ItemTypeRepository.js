'use strict';
const { ItemType } = require('../model');

module.exports = {
  findAll: () => ItemType.findAll(),
  findById: (id) => ItemType.findByPk(id),
  findByName: (name) => ItemType.findOne({ where: { name } }),
  create: (data) => ItemType.create(data),
  update: (id, data) => ItemType.update(data, { where: { id } }),
  delete: (id) => ItemType.destroy({ where: { id } }),
};
