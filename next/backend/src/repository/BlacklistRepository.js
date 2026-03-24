'use strict';
const { Blacklist, Branch, User } = require('../model');
const { Op } = require('sequelize');

const include = [
  { model: Branch, as: 'branch' },
  { model: User, as: 'addedByUser' },
];

module.exports = {
  findAll: () => Blacklist.findAll({ include }),
  findById: (id) => Blacklist.findByPk(id, { include }),
  findActive: () => Blacklist.findAll({ where: { isActive: true }, include }),
  findByBranchId: (branchId) => Blacklist.findAll({ where: { branchId }, include }),
  findByNic: (nic) => Blacklist.findAll({ where: { customerNic: nic } }),
  findActiveByNic: (nic) => Blacklist.findAll({ where: { customerNic: nic, isActive: true } }),
  findPaginated: ({ page, size, sortBy, sortDir, nic, policeReport, isActive }) => {
    const where = {};
    if (nic) where.customerNic = { [Op.like]: `%${nic}%` };
    if (policeReport) where.policeReportNumber = { [Op.like]: `%${policeReport}%` };
    if (isActive !== undefined && isActive !== null) where.isActive = isActive;
    return Blacklist.findAndCountAll({
      where,
      include,
      limit: size,
      offset: page * size,
      order: [[sortBy || 'created_at', sortDir || 'desc']],
      distinct: true,
    });
  },
  create: (data) => Blacklist.create(data),
  update: (id, data) => Blacklist.update(data, { where: { id } }),
  delete: (id) => Blacklist.destroy({ where: { id } }),
};
