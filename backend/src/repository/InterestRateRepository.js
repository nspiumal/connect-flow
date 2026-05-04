'use strict';
const { InterestRate } = require('../model');

module.exports = {
  findAll: () => InterestRate.findAll({ order: [['name', 'ASC']] }),
  findActive: () => InterestRate.findAll({ where: { isActive: true }, order: [['name', 'ASC']] }),
  findById: (id) => InterestRate.findByPk(id),
  findDefault: () => InterestRate.findOne({ where: { isDefault: true, isActive: true } }),
  create: (data) => InterestRate.create(data),
  update: (id, data) => InterestRate.update(data, { where: { id } }),
  delete: (id) => InterestRate.destroy({ where: { id } }),
};
