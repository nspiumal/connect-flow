'use strict';
const { v4: uuidv4 } = require('uuid');
const BranchRepository = require('../repository/BranchRepository');

module.exports = {
  async getAll() {
    return BranchRepository.findAll();
  },

  async getActive() {
    return BranchRepository.findActive();
  },

  async getPaginated({ page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc' }) {
    const { count, rows } = await BranchRepository.findPaginated({ page, size, sortBy, sortDir });
    return {
      content: rows,
      pageNumber: page,
      pageSize: size,
      totalElements: count,
      totalPages: Math.ceil(count / size),
      last: (page + 1) * size >= count,
    };
  },

  async getById(id) {
    const branch = await BranchRepository.findById(id);
    if (!branch) throw { status: 404, message: 'Branch not found' };
    return branch;
  },

  async create({ name, address, phone, managerId, isActive = true }) {
    const existing = await BranchRepository.findByName(name);
    if (existing) throw { status: 409, message: 'Branch name already exists' };
    return BranchRepository.create({ id: uuidv4(), name, address, phone, managerId, isActive });
  },

  async update(id, data) {
    const branch = await BranchRepository.findById(id);
    if (!branch) throw { status: 404, message: 'Branch not found' };
    await BranchRepository.update(id, data);
    return BranchRepository.findById(id);
  },

  async delete(id) {
    await BranchRepository.delete(id);
  },
};
