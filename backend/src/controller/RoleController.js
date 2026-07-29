'use strict';
const RoleService = require('../service/RoleService');

function handleErr(res, err) {
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
}

module.exports = {
  async getAll(req, res) {
    try { res.json(await RoleService.getAll()); } catch (e) { handleErr(res, e); }
  },
  async getById(req, res) {
    try { res.json(await RoleService.getById(req.params.id)); } catch (e) { handleErr(res, e); }
  },
  async create(req, res) {
    try { res.status(201).json(await RoleService.create(req.body)); } catch (e) { handleErr(res, e); }
  },
  async update(req, res) {
    try { res.json(await RoleService.update(req.params.id, req.body)); } catch (e) { handleErr(res, e); }
  },
  async delete(req, res) {
    try { await RoleService.delete(req.params.id); res.status(204).send(); } catch (e) { handleErr(res, e); }
  },
  async getPermissions(req, res) {
    try { res.json(await RoleService.getPermissions(req.params.name)); } catch (e) { handleErr(res, e); }
  },
  async setPermissions(req, res) {
    try { res.json(await RoleService.setPermissions(req.params.name, req.body.permissions)); } catch (e) { handleErr(res, e); }
  },
};