'use strict';
const PawnTransactionService = require('../service/PawnTransactionService');
const PawnRedemptionService = require('../service/PawnRedemptionService');
const TransactionProfitService = require('../service/TransactionProfitService');
const handleErr = require('../utils/handleErr');

function paginationParams(query) {
  const { page = 0, size = 10, sortBy = 'created_at', sortDir = 'desc' } = query;
  return { page: +page, size: +size, sortBy, sortDir };
}

module.exports = {
  async getAll(req, res) {
    try { res.json(await PawnTransactionService.getAll()); } catch (e) { handleErr(res, e); }
  },
  async getPaginated(req, res) {
    try {
      const { branchId, status, ...rest } = req.query;
      res.json(await PawnTransactionService.getPaginated({ ...paginationParams(rest), branchId, status }));
    } catch (e) { handleErr(res, e); }
  },
  async search(req, res) {
    try {
      const { search, branchId, pawnId, customerNic, status, minAmount, maxAmount, patternMode, startDate, endDate, filterBranchId, ...rest } = req.query;
      const effectiveBranchId = filterBranchId || branchId;
      if (pawnId || customerNic || status || minAmount || maxAmount || patternMode || startDate || endDate) {
        res.json(await PawnTransactionService.searchAdvanced({ pawnId, customerNic, status: status && status !== 'all' ? status : undefined, minAmount, maxAmount, patternMode, branchId: effectiveBranchId, startDate, endDate, ...paginationParams(rest) }));
      } else {
        res.json(await PawnTransactionService.search({ search, branchId: effectiveBranchId, ...paginationParams(rest) }));
      }
    } catch (e) { handleErr(res, e); }
  },
  async getById(req, res) {
    try { res.json(await PawnTransactionService.getById(req.params.id)); } catch (e) { handleErr(res, e); }
  },
  async getByPawnId(req, res) {
    try { res.json(await PawnTransactionService.getByPawnId(req.params.pawnId)); } catch (e) { handleErr(res, e); }
  },
  async getByBranch(req, res) {
    try { res.json(await PawnTransactionService.getByBranch(req.params.branchId)); } catch (e) { handleErr(res, e); }
  },
  async getByBranchPaginated(req, res) {
    try {
      res.json(await PawnTransactionService.getPaginated({ ...paginationParams(req.query), branchId: req.params.branchId }));
    } catch (e) { handleErr(res, e); }
  },
  async getByStatus(req, res) {
    try {
      res.json(await PawnTransactionService.getPaginated({ ...paginationParams(req.query), status: req.params.status }));
    } catch (e) { handleErr(res, e); }
  },
  async getPatternConfig(req, res) {
    try { res.json(await PawnTransactionService.getPatternConfig()); } catch (e) { handleErr(res, e); }
  },
  async getOutstandingBalance(req, res) {
    try { res.json(await PawnRedemptionService.getOutstandingBalance(req.params.id)); } catch (e) { handleErr(res, e); }
  },
  async getEditHistory(req, res) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      res.json(await PawnTransactionService.getEditHistory(req.params.id, limit));
    } catch (e) { handleErr(res, e, 'PawnTransaction.getEditHistory'); }
  },
  async getProfit(req, res) {
    try { res.json(await TransactionProfitService.getByTransactionId(req.params.id)); } catch (e) { handleErr(res, e); }
  },
  async create(req, res) {
    try {
      const branchId = req.body.branchId || (req.user && req.user.branchId);
      if (!branchId) {
        return res.status(400).json({ message: 'Branch ID is required. Please ensure you are logged in with a branch-assigned account.' });
      }
      const createdBy = req.user ? req.user.id : null;
      res.status(201).json(await PawnTransactionService.create(req.body, branchId, createdBy));
    } catch (e) {
      handleErr(res, e, 'PawnTransaction.create');
    }
  },
  async update(req, res) {
    try {
      const editedBy = req.user ? req.user.id : null;
      const editedByName = req.user ? req.user.fullName : 'Unknown';
      res.json(await PawnTransactionService.update(req.params.id, req.body, editedBy, editedByName));
    } catch (e) { handleErr(res, e); }
  },
  async updateRemarks(req, res) {
    try {
      const editedBy = req.user ? req.user.id : null;
      const editedByName = req.user ? req.user.fullName : 'Unknown';
      res.json(await PawnTransactionService.update(req.params.id, { remarks: req.body.remarks, editType: 'REMARKS_UPDATE' }, editedBy, editedByName));
    } catch (e) { handleErr(res, e); }
  },
  async updateBlockReason(req, res) {
    try {
      const editedBy = req.user ? req.user.id : null;
      const editedByName = req.user ? req.user.fullName : 'Unknown';
      res.json(await PawnTransactionService.update(req.params.id, { ...req.body, editType: 'BLOCK_REASON_UPDATE' }, editedBy, editedByName));
    } catch (e) { handleErr(res, e); }
  },
  async updateDetails(req, res) {
    try {
      const editedBy = req.user ? req.user.id : null;
      const editedByName = req.user ? req.user.fullName : 'Unknown';
      res.json(await PawnTransactionService.update(req.params.id, { ...req.body, editType: 'DETAILS_UPDATE' }, editedBy, editedByName));
    } catch (e) { handleErr(res, e); }
  },
  async changeStatus(req, res) {
    try {
      const editedBy = req.user ? req.user.id : null;
      const editedByName = req.user ? req.user.fullName : 'Unknown';
      const { status, reason } = req.body;
      res.json(await PawnTransactionService.changeStatus(req.params.id, status, editedBy, editedByName, reason));
    } catch (e) { handleErr(res, e); }
  },
  async setProfit(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const { profitAmount, notes } = req.body;
      res.status(201).json(await TransactionProfitService.setProfit(req.params.id, { profitAmount, notes }, userId));
    } catch (e) { handleErr(res, e); }
  },
  async delete(req, res) {
    try { await PawnTransactionService.delete(req.params.id); res.status(204).send(); } catch (e) { handleErr(res, e); }
  },
};
