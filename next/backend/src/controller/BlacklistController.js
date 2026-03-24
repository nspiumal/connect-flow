'use strict';
const BlacklistService = require('../service/BlacklistService');

function handleErr(res, err) {
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
}

module.exports = {
  async getAll(req, res) {
    try { res.json(await BlacklistService.getAll()); } catch (e) { handleErr(res, e); }
  },

  async getPaginated(req, res) {
    try {
      const { page = 0, size = 10, sortBy = 'created_at', sortDir = 'desc' } = req.query;
      res.json(await BlacklistService.getPaginated({ page: +page, size: +size, sortBy, sortDir }));
    } catch (e) { handleErr(res, e); }
  },

  async getActive(req, res) {
    try { res.json(await BlacklistService.getActive()); } catch (e) { handleErr(res, e); }
  },

  async getById(req, res) {
    try { res.json(await BlacklistService.getById(req.params.id)); } catch (e) { handleErr(res, e); }
  },

  async getByBranch(req, res) {
    try { res.json(await BlacklistService.getByBranch(req.params.branchId)); } catch (e) { handleErr(res, e); }
  },

  async check(req, res) {
    try {
      const entries = await BlacklistService.checkByNic(req.params.nic);
      res.json({ isBlacklisted: entries.length > 0, entries });
    } catch (e) { handleErr(res, e); }
  },

  async verify(req, res) {
    try { res.json(await BlacklistService.verifyNic(req.params.nic)); } catch (e) { handleErr(res, e); }
  },

  async search(req, res) {
    try {
      const { nic, page = 0, size = 10 } = req.query;
      res.json(await BlacklistService.getPaginated({ nic, page: +page, size: +size }));
    } catch (e) { handleErr(res, e); }
  },

  async filter(req, res) {
    try {
      const { nic, policeReport, status } = req.query;
      const isActive = status !== undefined ? (status === 'true' || status === 'active') : undefined;
      res.json(await BlacklistService.getPaginated({ nic, policeReport, isActive, page: 0, size: 100 }));
    } catch (e) { handleErr(res, e); }
  },

  async create(req, res) {
    try {
      const addedBy = req.user ? req.user.id : null;
      res.status(201).json(await BlacklistService.create({ ...req.body, addedBy }));
    } catch (e) { handleErr(res, e); }
  },

  async update(req, res) {
    try { res.json(await BlacklistService.update(req.params.id, req.body)); } catch (e) { handleErr(res, e); }
  },

  async toggleActive(req, res) {
    try { res.json(await BlacklistService.toggleActive(req.params.id)); } catch (e) { handleErr(res, e); }
  },

  async delete(req, res) {
    try { await BlacklistService.delete(req.params.id); res.status(204).send(); } catch (e) { handleErr(res, e); }
  },
};
