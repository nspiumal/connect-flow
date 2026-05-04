'use strict';
const { ActivityLogEntry } = require('../model');
const { Op } = require('sequelize');
const handleErr = require('../utils/handleErr');

module.exports = {
  async getLogs(req, res) {
    try {
      const { page = 0, size = 20, userName, action } = req.query;
      const pageNum  = parseInt(page, 10);
      const pageSize = parseInt(size, 10);

      // Build WHERE from query params — columns now stored directly in the table
      const where = {};
      if (action)   where.action    = { [Op.like]: `%${action}%` };
      if (userName) {
        where[Op.or] = [
          { userName:  { [Op.like]: `%${userName}%` } },
          { userEmail: { [Op.like]: `%${userName}%` } },
        ];
      }

      const { count, rows } = await ActivityLogEntry.findAndCountAll({
        where,
        limit:  pageSize,
        offset: pageNum * pageSize,
        order:  [['created_at', 'DESC']],
      });

      res.json({
        // Each row already has the exact fields the frontend expects
        content:       rows.map((r) => r.toJSON()),
        pageNumber:    pageNum,
        pageSize,
        totalElements: count,
        totalPages:    Math.ceil(count / pageSize),
        last:          (pageNum + 1) * pageSize >= count,
      });
    } catch (e) {
      handleErr(res, e, 'ActivityLog');
    }
  },
};
