'use strict';
const InterestRateService = require('../service/InterestRateService');

function handleErr(res, err) {
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
}

module.exports = {
  async getAll(req, res) {
    try { res.json(await InterestRateService.getAll()); } catch (e) { handleErr(res, e); }
  },
  async getById(req, res) {
    try { res.json(await InterestRateService.getById(req.params.id)); } catch (e) { handleErr(res, e); }
  },
  async getDefault(req, res) {
    try { res.json(await InterestRateService.getDefault()); } catch (e) { handleErr(res, e); }
  },
  async create(req, res) {
    try { res.status(201).json(await InterestRateService.create(req.body)); } catch (e) { handleErr(res, e); }
  },
  async update(req, res) {
    try { res.json(await InterestRateService.update(req.params.id, req.body)); } catch (e) { handleErr(res, e); }
  },
  async delete(req, res) {
    try { await InterestRateService.delete(req.params.id); res.status(204).send(); } catch (e) { handleErr(res, e); }
  },
};
