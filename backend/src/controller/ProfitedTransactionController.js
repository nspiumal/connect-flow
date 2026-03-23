'use strict';
const TransactionProfitService = require('../service/TransactionProfitService');

function handleErr(res, err) {
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
}

module.exports = {
  async getAll(req, res) {
    try { res.json(await TransactionProfitService.getAll()); } catch (e) { handleErr(res, e); }
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
