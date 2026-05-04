'use strict';
const BranchService = require('../service/BranchService');
const handleErr = require('../utils/handleErr');

module.exports = {
  async getAll(req, res) {
    try { res.json(await BranchService.getAll()); } catch (e) { handleErr(res, e); }
  },
  async getActive(req, res) {
    try { res.json(await BranchService.getActive()); } catch (e) { handleErr(res, e); }
  },
  async getPaginated(req, res) {
    try { res.json(await BranchService.getPaginated(req.query)); } catch (e) { handleErr(res, e); }
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
