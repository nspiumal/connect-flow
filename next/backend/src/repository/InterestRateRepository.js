'use strict';
const { InterestRate } = require('../model');

module.exports = {
  findAll:       () => InterestRate.findAll({ order: [['created_at', 'DESC']] }),
  findAllActive: () => InterestRate.findAll({ where: { is_active: true }, order: [['name', 'ASC']] }),
  findById:      (id) => InterestRate.findByPk(id),
  findDefault:   () => InterestRate.findOne({ where: { is_default: true, is_active: true } }),
  create:        (data) => InterestRate.create(data),
  update:        (id, data) => InterestRate.update(data, { where: { id } }),
  delete:        (id) => InterestRate.destroy({ where: { id } }),
};
