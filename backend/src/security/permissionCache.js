'use strict';
// In-process cache of roleName -> Set<permissionKey>, so requirePermission()
// doesn't join role_permissions/permissions on every request. Invalidated by
// RoleService whenever a role's permissions, name, or existence changes.
// A multi-instance deployment would need this to be shared (e.g. Redis); this
// app runs as a single Node process (see CLAUDE.md), so a module-level Map is fine.

const cache = new Map();

async function getPermissionSet(roleName) {
  if (cache.has(roleName)) return cache.get(roleName);
  const PermissionRepository = require('../repository/PermissionRepository');
  const keys = await PermissionRepository.findKeysByRoleName(roleName);
  const set = new Set(keys);
  cache.set(roleName, set);
  return set;
}

function invalidateRole(roleName) {
  cache.delete(roleName);
}

function invalidateAll() {
  cache.clear();
}

module.exports = { getPermissionSet, invalidateRole, invalidateAll };