'use strict';
const ItemTypeService = require('../service/ItemTypeService');
const handleErr = require('../utils/handleErr');

module.exports = {
  async getAll(req, res) {
    try { res.json(await ItemTypeService.getAll()); } catch (e) { handleErr(res, e); }
  },
  async getActive(req, res) {
    try { res.json(await ItemTypeService.getActive()); } catch (e) { handleErr(res, e); }
  },
  async search(req, res) {
    try { res.json(await ItemTypeService.search(req.query)); } catch (e) { handleErr(res, e); }
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
