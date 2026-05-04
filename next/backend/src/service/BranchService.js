'use strict';
const { v4: uuidv4 } = require('uuid');
const BranchRepository = require('../repository/BranchRepository');

module.exports = {
  async getAll() {
    return BranchRepository.findAll();
  },

  async getActive() {
    return BranchRepository.findAllActive();
  },

  async getPaginated({ page = 0, size = 10, sortBy = 'name', sortDir = 'asc', name, isActive }) {
    const { count, rows } = await BranchRepository.findPaginated({
      page: parseInt(page, 10),
      size: parseInt(size, 10),
      sortBy,
      sortDir,
      name,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : undefined,
    });
    return {
      content: rows,
      totalElements: count,
      totalPages: Math.ceil(count / parseInt(size, 10)),
      page: parseInt(page, 10),
      size: parseInt(size, 10),
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
