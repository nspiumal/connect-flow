'use strict';
const { User, UserRole, Branch } = require('../model');
const { Op } = require('sequelize');

const include = [{ model: UserRole, as: 'roles', include: [{ model: Branch, as: 'branch' }] }];

module.exports = {
  findAll: () => User.findAll({ include }),
  findById: (id) => User.findByPk(id, { include }),
  findByEmail: (email) => User.findOne({ where: { email }, include }),
  findByRole: (role) => User.findAll({ include: [{ model: UserRole, as: 'roles', where: { role }, include: [{ model: Branch, as: 'branch' }] }] }),
  findByBranch: (branchId) => User.findAll({ include: [{ model: UserRole, as: 'roles', where: { branchId }, include: [{ model: Branch, as: 'branch' }] }] }),
  create: (data) => User.create(data),
  update: (id, data) => User.update(data, { where: { id } }),
  findPaginated: ({ page, size, sortBy, sortDir, name, email, role, branchId }) => {
    const where = {};
    if (name) where.fullName = { [Op.like]: `%${name}%` };
    if (email) where.email = { [Op.like]: `%${email}%` };
    const roleWhere = {};
    if (role) roleWhere.role = role;
    if (branchId) roleWhere.branchId = branchId;
    return User.findAndCountAll({
      where,
      include: [{ model: UserRole, as: 'roles', where: Object.keys(roleWhere).length ? roleWhere : undefined, required: Object.keys(roleWhere).length > 0, include: [{ model: Branch, as: 'branch' }] }],
      limit: size,
      offset: page * size,
      order: [[sortBy || 'created_at', sortDir || 'desc']],
      distinct: true,
    });
  },
};
