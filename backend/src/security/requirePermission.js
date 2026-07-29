'use strict';
const { getPermissionSet } = require('./permissionCache');

function getRoleName(req) {
  const roles = req.user && req.user.roles;
  return roles && roles.length > 0 ? roles[0].role : null;
}

/**
 * requirePermission('users.create') -> express middleware.
 * SUPERADMIN always passes (belt-and-braces on top of it being seeded with
 * every permission). Everyone else needs `key` in their role's permission set.
 */
function requirePermission(key) {
  return async (req, res, next) => {
    try {
      const roleName = getRoleName(req);
      if (!roleName) {
        return res.status(403).json({ message: 'Permission denied', required: key });
      }
      if (roleName === 'SUPERADMIN') return next();

      const permissions = await getPermissionSet(roleName);
      if (!permissions.has(key)) {
        return res.status(403).json({ message: 'Permission denied', required: key });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Restricts a route to the SUPERADMIN role, regardless of granted permissions. */
function requireSuperAdmin(req, res, next) {
  const roleName = getRoleName(req);
  if (roleName !== 'SUPERADMIN') {
    return res.status(403).json({ message: 'Super Admin only' });
  }
  next();
}

module.exports = { requirePermission, requireSuperAdmin };