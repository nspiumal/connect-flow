'use strict';
const { ActivityLogEntry } = require('../model');
const { Op } = require('sequelize');

module.exports = {
  async getLogs(req, res) {
    try {
      const { page = 0, size = 20, userId, action } = req.query;
      const where = {};
      if (userId) where.userId = userId;
      if (action) where.action = { [Op.like]: `%${action}%` };
      const { count, rows } = await ActivityLogEntry.findAndCountAll({
        where,
        limit: +size,
        offset: +page * +size,
        order: [['created_at', 'DESC']],
      });
      res.json({
        content: rows,
        pageNumber: +page,
        pageSize: +size,
        totalElements: count,
        totalPages: Math.ceil(count / size),
        last: (+page + 1) * +size >= count,
      });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  },
};
