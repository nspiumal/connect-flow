'use strict';
const { v4: uuidv4 } = require('uuid');
const ItemTypeRepository = require('../repository/ItemTypeRepository');

module.exports = {
  async getAll() {
    return ItemTypeRepository.findAll();
  },
  async getActive() {
    return ItemTypeRepository.findAllActive();
  },
  async search({ page = 0, size = 10, sortBy = 'name', sortDir = 'asc', name, isActive }) {
    const { count, rows } = await ItemTypeRepository.findPaginated({
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
      totalPages: Math.ceil(count / size),
      page: parseInt(page, 10),
      size: parseInt(size, 10),
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
