'use strict';
const PawnRedemptionService = require('../service/PawnRedemptionService');

function handleErr(res, err) {
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
}

module.exports = {
  async getOutstandingBalance(req, res) {
    try { res.json(await PawnRedemptionService.getOutstandingBalance(req.params.transactionId)); } catch (e) { handleErr(res, e); }
  },

  async redeem(req, res) {
    try {
      const paidBy = req.user ? req.user.id : null;
      const paidByName = req.user ? req.user.fullName : 'Unknown';
      const result = await PawnRedemptionService.processRedemption(req.params.transactionId, req.body, paidBy, paidByName);
      res.status(201).json(result);
    } catch (e) { handleErr(res, e); }
  },

  async getHistory(req, res) {
    try { res.json(await PawnRedemptionService.getRedemptionHistory(req.params.transactionId)); } catch (e) { handleErr(res, e); }
  },
};
