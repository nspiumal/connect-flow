'use strict';
const { v4: uuidv4 } = require('uuid');
const ItemTypeRepository = require('../repository/ItemTypeRepository');

module.exports = {
  async getAll() {
    return ItemTypeRepository.findAll();
  },
  async getActive() {
    return ItemTypeRepository.findActive();
  },
  async search({ page = 0, size = 10, name, isActive, sortBy = 'name', sortDir = 'asc' }) {
    const ia = isActive !== undefined ? (isActive === 'true' || isActive === true) : undefined;
    const { count, rows } = await ItemTypeRepository.findPaginated({ page, size, name, isActive: ia, sortBy, sortDir });
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
    const t = await ItemTypeRepository.findById(id);
    if (!t) throw { status: 404, message: 'Item type not found' };
    return t;
  },
  async create({ name, description, createdBy }) {
    const existing = await ItemTypeRepository.findByName(name);
    if (existing) throw { status: 409, message: 'Item type name already exists' };
    return ItemTypeRepository.create({ id: uuidv4(), name, description, isActive: true, createdBy });
  },
  async update(id, data) {
    const t = await ItemTypeRepository.findById(id);
    if (!t) throw { status: 404, message: 'Item type not found' };
    await ItemTypeRepository.update(id, data);
    return ItemTypeRepository.findById(id);
  },
  async toggleActive(id) {
    const t = await ItemTypeRepository.findById(id);
    if (!t) throw { status: 404, message: 'Item type not found' };
    await ItemTypeRepository.update(id, { isActive: !t.isActive });
    return ItemTypeRepository.findById(id);
  },
  async delete(id) {
    await ItemTypeRepository.delete(id);
  },
};
