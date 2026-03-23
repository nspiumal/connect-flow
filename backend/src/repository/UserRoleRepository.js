'use strict';
const { UserRole } = require('../model');

module.exports = {
  findByUserId: (userId) => UserRole.findAll({ where: { userId } }),
  findByUserIdAndRole: (userId, role) => UserRole.findOne({ where: { userId, role } }),
  create: (data) => UserRole.create(data),
  deleteByUserId: (userId) => UserRole.destroy({ where: { userId } }),
};
