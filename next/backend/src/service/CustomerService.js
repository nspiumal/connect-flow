'use strict';
const { v4: uuidv4 } = require('uuid');
const CustomerRepository = require('../repository/CustomerRepository');

module.exports = {
  async getAll({ isActive = true } = {}) {
    return CustomerRepository.findAll({ isActive });
  },

  async getById(id) {
    const c = await CustomerRepository.findById(id);
    if (!c) throw { status: 404, message: 'Customer not found' };
    return c;
  },

  async getByNic(nic) {
    const c = await CustomerRepository.findByNic(nic);
    if (!c) throw { status: 404, message: 'Customer not found' };
    return c;
  },

  async checkNic(nic) {
    const exists = await CustomerRepository.nicExists(nic);
    return { exists, nic };
  },

  async getByType(type) {
    return CustomerRepository.findByType(type);
  },

  async getPaginated({ page = 0, size = 10, sortBy = 'created_at', sortDir = 'desc', query, nic, phone, name, customerType, isActive } = {}) {
    const ia = isActive !== undefined ? (isActive === 'true' || isActive === true) : undefined;
    const { count, rows } = await CustomerRepository.findPaginated({ page, size, sortBy, sortDir, query, nic, phone, name, customerType, isActive: ia });
    return {
      content: rows,
      pageNumber: page,
      pageSize: size,
      totalElements: count,
      totalPages: Math.ceil(count / size),
      last: (page + 1) * size >= count,
    };
  },

  async create({ fullName, nic, phone, address, gender, customerType, isActive = true }) {
    if (!fullName) throw { status: 400, message: 'Customer name is required' };
    if (nic) {
      const existing = await CustomerRepository.findByNic(nic);
      if (existing) throw { status: 409, message: 'NIC already registered' };
    }
    return CustomerRepository.create({ id: uuidv4(), fullName, nic, phone, address, gender, customerType, isActive });
  },

  async update(id, data) {
    const c = await CustomerRepository.findById(id);
    if (!c) throw { status: 404, message: 'Customer not found' };
    await CustomerRepository.update(id, data);
    return CustomerRepository.findById(id);
  },

  async delete(id) {
    await CustomerRepository.delete(id);
  },
};
