'use strict';
const PawnTransactionService = require('../service/PawnTransactionService');
const PawnRedemptionService = require('../service/PawnRedemptionService');

function handleErr(res, err) {
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
}

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
      const { search, branchId, pawnId, customerNic, status, minAmount, maxAmount, patternMode, startDate, endDate, ...rest } = req.query;
      if (pawnId || customerNic || status || minAmount || maxAmount || patternMode || startDate || endDate) {
        res.json(await PawnTransactionService.searchAdvanced({
          pawnId, customerNic,
          status: status && status !== 'all' ? status : undefined,
          minAmount, maxAmount, patternMode, branchId, startDate, endDate,
          ...paginationParams(rest),
        }));
      } else {
        res.json(await PawnTransactionService.search({ search, branchId, ...paginationParams(rest) }));
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

  async getPatternConfig(req, res) {
    try { res.json(await PawnTransactionService.getPatternConfig()); } catch (e) { handleErr(res, e); }
  },

  async getOutstandingBalance(req, res) {
    try { res.json(await PawnRedemptionService.getOutstandingBalance(req.params.id)); } catch (e) { handleErr(res, e); }
  },

  async getEditHistory(req, res) {
    try { res.json(await PawnTransactionService.getEditHistory(req.params.id)); } catch (e) { handleErr(res, e); }
  },

  async create(req, res) {
    try {
      const branchId = req.body.branchId || (req.user && req.user.branchId);
      const createdBy = req.user ? req.user.id : null;
      res.status(201).json(await PawnTransactionService.create(req.body, branchId, createdBy));
    } catch (e) { handleErr(res, e); }
  },

  async update(req, res) {
    try {
      const editedBy = req.user ? req.user.id : null;
      const editedByName = req.user ? req.user.fullName : 'Unknown';
      res.json(await PawnTransactionService.update(req.params.id, req.body, editedBy, editedByName));
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

  async delete(req, res) {
    try { await PawnTransactionService.delete(req.params.id); res.status(204).send(); } catch (e) { handleErr(res, e); }
  },
};
