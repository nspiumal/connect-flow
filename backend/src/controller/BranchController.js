'use strict';
const BranchService = require('../service/BranchService');

function handleErr(res, err) {
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
}

module.exports = {
  async getAll(req, res) {
    try { res.json(await BranchService.getAll()); } catch (e) { handleErr(res, e); }
  },
  async getById(req, res) {
    try { res.json(await BranchService.getById(req.params.id)); } catch (e) { handleErr(res, e); }
  },
  async create(req, res) {
    try { res.status(201).json(await BranchService.create(req.body)); } catch (e) { handleErr(res, e); }
  },
  async update(req, res) {
    try { res.json(await BranchService.update(req.params.id, req.body)); } catch (e) { handleErr(res, e); }
  },
  async delete(req, res) {
    try { await BranchService.delete(req.params.id); res.status(204).send(); } catch (e) { handleErr(res, e); }
  },
};
