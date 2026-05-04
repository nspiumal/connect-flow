'use strict';
const TransactionProfitService = require('../service/TransactionProfitService');
const handleErr = require('../utils/handleErr');

// Map camelCase query params → snake_case DB columns
const SORT_FIELD_MAP = {
  profitRecordedDate: 'profit_recorded_date',
  profitAmount:       'profit_amount',
  pawnId:             'pawn_id',
  transactionId:      'transaction_id',
  createdAt:          'created_at',
};

module.exports = {
  async getAll(req, res) {
    try { res.json(await TransactionProfitService.getAll()); } catch (e) { handleErr(res, e); }
  },

  async getPaginated(req, res) {
    try {
      const { page = 0, size = 10, sortDir = 'desc' } = req.query;
      const rawSortBy = req.query.sortBy || 'profitRecordedDate';
      const sortBy = SORT_FIELD_MAP[rawSortBy] || rawSortBy;
      res.json(await TransactionProfitService.getPaginated({
        page: +page, size: +size, sortBy, sortDir,
      }));
    } catch (e) { handleErr(res, e); }
  },

  async search(req, res) {
    try {
      const { pawnId, customerNic, page = 0, size = 10 } = req.query;
      res.json(await TransactionProfitService.search({ pawnId, customerNic, page: +page, size: +size }));
    } catch (e) { handleErr(res, e); }
  },

  async setProfit(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const { transactionId, profitAmount, notes } = req.body;
      res.status(201).json(await TransactionProfitService.setProfit(transactionId, { profitAmount, notes }, userId));
    } catch (e) { handleErr(res, e); }
  },
};
