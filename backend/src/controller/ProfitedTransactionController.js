'use strict';
const TransactionProfitService = require('../service/TransactionProfitService');

function handleErr(res, err) {
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
}

module.exports = {
  async getAll(req, res) {
    try { res.json(await TransactionProfitService.getAll()); } catch (e) { handleErr(res, e); }
  },

  async getPaginated(req, res) {
    try {
      const { page = 0, size = 10, sortBy = 'profitRecordedDate', sortDir = 'desc' } = req.query;
      res.json(await TransactionProfitService.getPaginated({ page: +page, size: +size, sortBy, sortDir }));
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

  async setProfitForTransaction(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const { profitAmount, notes } = req.body;
      res.status(201).json(await TransactionProfitService.setProfit(req.params.id, { profitAmount, notes }, userId));
    } catch (e) { handleErr(res, e); }
  },

  async getByTransactionId(req, res) {
    try {
      const profit = await TransactionProfitService.getByTransactionId(req.params.id);
      if (!profit) return res.status(404).json({ message: 'Profit record not found' });
      res.json(profit);
    } catch (e) { handleErr(res, e); }
  },
};
