'use strict';
const PermissionService = require('../service/PermissionService');

function handleErr(res, err) {
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
}

module.exports = {
  async getAll(req, res) {
    try { res.json(await PermissionService.getAll()); } catch (e) { handleErr(res, e); }
  },
  async getGrouped(req, res) {
    try { res.json(await PermissionService.getGroupedByModule()); } catch (e) { handleErr(res, e); }
  },
};