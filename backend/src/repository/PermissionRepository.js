'use strict';
const { Permission, Role } = require('../model');
const { Op } = require('sequelize');

module.exports = {
  findAll: () => Permission.findAll({ order: [['module', 'ASC'], ['key', 'ASC']] }),
  findByKeys: (keys) => Permission.findAll({ where: { key: { [Op.in]: keys } } }),
  findKeysByRoleName: async (roleName) => {
    const role = await Role.findOne({
      where: { name: roleName },
      include: [{ model: Permission, as: 'permissions', attributes: ['key'] }],
    });
    if (!role) return [];
    return role.permissions.map((p) => p.key);
  },
};