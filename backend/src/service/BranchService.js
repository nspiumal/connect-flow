'use strict';
const { v4: uuidv4 } = require('uuid');
const BranchRepository = require('../repository/BranchRepository');

module.exports = {
  async getAll() {
    return BranchRepository.findAll();
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
