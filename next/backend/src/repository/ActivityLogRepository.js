'use strict';
const { ActivityLogEntry } = require('../model');
const { Op } = require('sequelize');

module.exports = {
  findPaginated: ({ page, size, userId, action }) => {
    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = { [Op.like]: `%${action}%` };
    return ActivityLogEntry.findAndCountAll({
      where,
      limit: size,
      offset: page * size,
      order: [['created_at', 'DESC']],
    });
  },
  create: (data) => ActivityLogEntry.create(data),
};
