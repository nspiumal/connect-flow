'use strict';
const UserService = require('../service/UserService');

function handleErr(res, err) {
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
}

module.exports = {
  async getAll(req, res) {
    try { res.json(await UserService.getAllUsers()); } catch (e) { handleErr(res, e); }
  },

  async getPaginated(req, res) {
    try {
      const { page = 0, size = 10, sortBy = 'created_at', sortDir = 'desc', name, email, role, branchId } = req.query;
      res.json(await UserService.getPaginatedUsers({ page: +page, size: +size, sortBy, sortDir, name, email, role, branchId }));
    } catch (e) { handleErr(res, e); }
  },

  async filter(req, res) {
    try {
      const { name, email, role, branchId } = req.query;
      res.json(await UserService.getPaginatedUsers({ page: 0, size: 100, name, email, role, branchId }));
    } catch (e) { handleErr(res, e); }
  },

  async getById(req, res) {
    try { res.json(await UserService.getUserById(req.params.id)); } catch (e) { handleErr(res, e); }
  },

  async getByEmail(req, res) {
    try { res.json(await UserService.getUserByEmail(req.params.email)); } catch (e) { handleErr(res, e); }
  },

  async getByRole(req, res) {
    try { res.json(await UserService.getUsersByRole(req.params.role)); } catch (e) { handleErr(res, e); }
  },

  async getByBranch(req, res) {
    try { res.json(await UserService.getUsersByBranch(req.params.branchId)); } catch (e) { handleErr(res, e); }
  },

  async hasPin(req, res) {
    try { res.json(await UserService.hasPin(req.params.id)); } catch (e) { handleErr(res, e); }
  },

  async create(req, res) {
    try { res.status(201).json(await UserService.createUser(req.body)); } catch (e) { handleErr(res, e); }
  },

  async update(req, res) {
    try { res.json(await UserService.updateUser(req.params.id, req.body)); } catch (e) { handleErr(res, e); }
  },

  async setPin(req, res) {
    try { res.json(await UserService.setPin(req.params.id, req.body.pin)); } catch (e) { handleErr(res, e); }
  },

  async verifyPin(req, res) {
    try { res.json(await UserService.verifyPin(req.params.id, req.body.pin)); } catch (e) { handleErr(res, e); }
  },
};
