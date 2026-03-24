'use strict';
const { Customer } = require('../model');
const { Op } = require('sequelize');

module.exports = {
  findAll: ({ isActive } = {}) => {
    const where = {};
    if (isActive !== undefined) where.isActive = isActive;
    return Customer.findAll({ where });
  },
  findById: (id) => Customer.findByPk(id),
  findByNic: (nic) => Customer.findOne({ where: { nic } }),
  nicExists: async (nic) => !!(await Customer.findOne({ where: { nic } })),
  findPaginated: ({ page, size, sortBy, sortDir, query, nic, phone, name, customerType, isActive }) => {
    const where = {};
    if (isActive !== undefined && isActive !== null) where.isActive = isActive;
    if (customerType) where.customerType = customerType;
    if (nic) where.nic = { [Op.like]: `%${nic}%` };
    if (phone) where.phone = { [Op.like]: `%${phone}%` };
    if (name) where.fullName = { [Op.like]: `%${name}%` };
    if (query) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${query}%` } },
        { nic: { [Op.like]: `%${query}%` } },
        { phone: { [Op.like]: `%${query}%` } },
      ];
    }
    return Customer.findAndCountAll({
      where,
      limit: size,
      offset: page * size,
      order: [[sortBy || 'created_at', sortDir || 'desc']],
    });
  },
  findByType: (type) => Customer.findAll({ where: { customerType: type } }),
  create: (data) => Customer.create(data),
  update: (id, data) => Customer.update(data, { where: { id } }),
  delete: (id) => Customer.destroy({ where: { id } }),
};
