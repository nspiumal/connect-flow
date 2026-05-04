'use strict';
const ItemTypeService = require('../service/ItemTypeService');

function handleErr(res, err) {
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
}

module.exports = {
  async getAll(req, res) {
    try { res.json(await ItemTypeService.getAll()); } catch (e) { handleErr(res, e); }
  },
  async search(req, res) {
    try {
      const { page = 0, size = 10, name, isActive, sortBy = 'name', sortDir = 'asc' } = req.query;
      res.json(await ItemTypeService.search({ page: +page, size: +size, name, isActive, sortBy, sortDir }));
    } catch (e) { handleErr(res, e); }
  },
  async getActive(req, res) {
    try { res.json(await ItemTypeService.getActive()); } catch (e) { handleErr(res, e); }
  },
  async getById(req, res) {
    try { res.json(await ItemTypeService.getById(req.params.id)); } catch (e) { handleErr(res, e); }
  },
  async create(req, res) {
    try {
      const createdBy = req.user ? req.user.id : null;
      res.status(201).json(await ItemTypeService.create({ ...req.body, createdBy }));
    } catch (e) { handleErr(res, e); }
  },
  async update(req, res) {
    try { res.json(await ItemTypeService.update(req.params.id, req.body)); } catch (e) { handleErr(res, e); }
  },
  async toggleActive(req, res) {
    try { res.json(await ItemTypeService.toggleActive(req.params.id)); } catch (e) { handleErr(res, e); }
  },
  async delete(req, res) {
    try { await ItemTypeService.delete(req.params.id); res.status(204).send(); } catch (e) { handleErr(res, e); }
  },
};
