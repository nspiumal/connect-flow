'use strict';
const CustomerService = require('../service/CustomerService');

function handleErr(res, err) {
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
}

module.exports = {
  async getAll(req, res) {
    try { res.json(await CustomerService.getAll({ isActive: true })); } catch (e) { handleErr(res, e); }
  },

  async search(req, res) {
    try {
      const { query, page = 0, size = 10, sortBy = 'created_at', sortDir = 'desc' } = req.query;
      res.json(await CustomerService.getPaginated({ query, page: +page, size: +size, sortBy, sortDir }));
    } catch (e) { handleErr(res, e); }
  },

  async searchAdvanced(req, res) {
    try {
      const { nic, phone, name, customerType, status, page = 0, size = 10 } = req.query;
      const isActive = status ? (status === 'active' ? true : status === 'inactive' ? false : undefined) : undefined;
      res.json(await CustomerService.getPaginated({ nic, phone, name, customerType, isActive, page: +page, size: +size }));
    } catch (e) { handleErr(res, e); }
  },

  async filter(req, res) {
    try {
      const { nic, phone, status } = req.query;
      const isActive = status !== undefined ? (status === 'true' || status === 'active') : undefined;
      res.json(await CustomerService.getPaginated({ nic, phone, isActive, page: 0, size: 100 }));
    } catch (e) { handleErr(res, e); }
  },

  async getByNic(req, res) {
    try { res.json(await CustomerService.getByNic(req.params.nic)); } catch (e) { handleErr(res, e); }
  },

  async getById(req, res) {
    try { res.json(await CustomerService.getById(req.params.id)); } catch (e) { handleErr(res, e); }
  },

  async getByType(req, res) {
    try { res.json(await CustomerService.getByType(req.params.type)); } catch (e) { handleErr(res, e); }
  },

  async checkNic(req, res) {
    try { res.json(await CustomerService.checkNic(req.params.nic)); } catch (e) { handleErr(res, e); }
  },

  async create(req, res) {
    try { res.status(201).json(await CustomerService.create(req.body)); } catch (e) { handleErr(res, e); }
  },

  async update(req, res) {
    try { res.json(await CustomerService.update(req.params.id, req.body)); } catch (e) { handleErr(res, e); }
  },

  async delete(req, res) {
    try { await CustomerService.delete(req.params.id); res.status(204).send(); } catch (e) { handleErr(res, e); }
  },
};
