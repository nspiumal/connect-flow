'use strict';
const { v4: uuidv4 } = require('uuid');
const BlacklistRepository = require('../repository/BlacklistRepository');

module.exports = {
  async getAll() {
    return BlacklistRepository.findAll();
  },

  async getActive() {
    return BlacklistRepository.findActive();
  },

  async getById(id) {
    const b = await BlacklistRepository.findById(id);
    if (!b) throw { status: 404, message: 'Blacklist entry not found' };
    return b;
  },

  async getByBranch(branchId) {
    return BlacklistRepository.findByBranchId(branchId);
  },

  async checkByNic(nic) {
    return BlacklistRepository.findActiveByNic(nic);
  },

  async verifyNic(nic) {
    const entries = await BlacklistRepository.findActiveByNic(nic);
    return {
      nic,
      isBlacklisted: entries.length > 0,
      entries,
    };
  },

  async getPaginated({ page = 0, size = 10, sortBy = 'created_at', sortDir = 'desc', nic, policeReport, isActive } = {}) {
    const ia = isActive !== undefined ? (isActive === 'true' || isActive === true) : undefined;
    const { count, rows } = await BlacklistRepository.findPaginated({ page, size, sortBy, sortDir, nic, policeReport, isActive: ia });
    return {
      content: rows,
      pageNumber: page,
      pageSize: size,
      totalElements: count,
      totalPages: Math.ceil(count / size),
      last: (page + 1) * size >= count,
    };
  },

  async create({ customerName, customerNic, reason, policeReportNumber, policeReportDate, branchId, addedBy }) {
    return BlacklistRepository.create({
      id: uuidv4(),
      customerName,
      customerNic,
      reason,
      policeReportNumber,
      policeReportDate,
      branchId,
      addedBy,
      isActive: true,
    });
  },

  async update(id, data) {
    const b = await BlacklistRepository.findById(id);
    if (!b) throw { status: 404, message: 'Blacklist entry not found' };
    await BlacklistRepository.update(id, data);
    return BlacklistRepository.findById(id);
  },

  async toggleActive(id) {
    const b = await BlacklistRepository.findById(id);
    if (!b) throw { status: 404, message: 'Blacklist entry not found' };
    await BlacklistRepository.update(id, { isActive: !b.isActive });
    return BlacklistRepository.findById(id);
  },

  async delete(id) {
    await BlacklistRepository.delete(id);
  },
};
