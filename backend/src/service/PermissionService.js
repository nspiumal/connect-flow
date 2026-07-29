'use strict';
const PermissionRepository = require('../repository/PermissionRepository');

const PermissionService = {
  async getAll() {
    return PermissionRepository.findAll();
  },

  async getGroupedByModule() {
    const permissions = await PermissionRepository.findAll();
    const grouped = {};
    for (const p of permissions) {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push(p);
    }
    return grouped;
  },

  /** Permission keys for a user's role — SUPERADMIN implicitly has every permission. */
  async getKeysForUser(user) {
    const roles = user.roles && user.roles.length > 0 ? user.roles : [];
    const primaryRole = roles[0] ? roles[0].role : null;
    if (!primaryRole) return [];
    if (primaryRole === 'SUPERADMIN') {
      const all = await PermissionRepository.findAll();
      return all.map((p) => p.key);
    }
    return PermissionRepository.findKeysByRoleName(primaryRole);
  },
};

module.exports = PermissionService;