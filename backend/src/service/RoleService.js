'use strict';
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const RoleRepository = require('../repository/RoleRepository');
const PermissionRepository = require('../repository/PermissionRepository');
const { RolePermission } = require('../model');
const { invalidateRole, invalidateAll } = require('../security/permissionCache');
const { wrapWithLogging } = require('../utils/methodLogger');

const RoleService = {
  async getAll() {
    return RoleRepository.findAll();
  },

  async getById(id) {
    const role = await RoleRepository.findById(id);
    if (!role) throw { status: 404, message: 'Role not found' };
    return role;
  },

  async create({ name, label, description }) {
    if (!name || !label) throw { status: 400, message: 'name and label are required' };
    const normalizedName = name.trim().toUpperCase();
    const existing = await RoleRepository.findByName(normalizedName);
    if (existing) throw { status: 409, message: 'A role with this name already exists' };
    return RoleRepository.create({
      id: uuidv4(),
      name: normalizedName,
      label,
      description: description || null,
      isSystem: false,
      isActive: true,
    });
  },

  async update(id, data) {
    const role = await RoleRepository.findById(id);
    if (!role) throw { status: 404, message: 'Role not found' };

    const update = {};
    if (data.label !== undefined) update.label = data.label;
    if (data.description !== undefined) update.description = data.description;
    if (data.isActive !== undefined) update.isActive = data.isActive;

    // Renaming a role is only safe when no user currently holds it — user_roles.role
    // has no FK to cascade, so a rename after assignment would orphan those rows.
    if (data.name !== undefined) {
      const normalizedName = data.name.trim().toUpperCase();
      if (normalizedName !== role.name) {
        if (role.isSystem) throw { status: 400, message: 'System roles cannot be renamed' };
        const userCount = await RoleRepository.countUsers(role.name);
        if (userCount > 0) {
          throw { status: 409, message: `Cannot rename: ${userCount} user(s) currently hold this role` };
        }
        const existing = await RoleRepository.findByName(normalizedName);
        if (existing) throw { status: 409, message: 'A role with this name already exists' };
        update.name = normalizedName;
      }
    }

    await RoleRepository.update(id, update);
    if (update.name) invalidateAll();
    else invalidateRole(role.name);
    return RoleRepository.findById(id);
  },

  async delete(id) {
    const role = await RoleRepository.findById(id);
    if (!role) throw { status: 404, message: 'Role not found' };
    if (role.isSystem) throw { status: 400, message: 'System roles cannot be deleted' };
    const userCount = await RoleRepository.countUsers(role.name);
    if (userCount > 0) {
      throw { status: 409, message: `Cannot delete: ${userCount} user(s) currently hold this role` };
    }
    await RoleRepository.delete(id);
    invalidateRole(role.name);
  },

  async getPermissions(roleName) {
    const role = await RoleRepository.findByName(roleName);
    if (!role) throw { status: 404, message: 'Role not found' };
    return PermissionRepository.findKeysByRoleName(roleName);
  },

  async setPermissions(roleName, permissionKeys = []) {
    const role = await RoleRepository.findByName(roleName);
    if (!role) throw { status: 404, message: 'Role not found' };

    if (roleName !== 'SUPERADMIN' && permissionKeys.includes('roles.manage')) {
      throw { status: 400, message: 'roles.manage can only be granted to SUPERADMIN' };
    }

    const permissions = await PermissionRepository.findByKeys(permissionKeys);
    if (permissions.length !== permissionKeys.length) {
      throw { status: 400, message: 'One or more permission keys are invalid' };
    }

    await sequelize.transaction(async (t) => {
      await RolePermission.destroy({ where: { roleName }, transaction: t });
      if (permissions.length > 0) {
        await RolePermission.bulkCreate(
          permissions.map((p) => ({ id: uuidv4(), roleName, permissionId: p.id })),
          { transaction: t }
        );
      }
    });

    invalidateRole(roleName);
    return PermissionRepository.findKeysByRoleName(roleName);
  },
};

module.exports = wrapWithLogging('RoleService', RoleService, {
  create: { level: 'info' },
  update: { level: 'info' },
  delete: { level: 'info' },
  setPermissions: { level: 'info' },
});