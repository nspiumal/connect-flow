'use strict';
const { v4: uuidv4 } = require('uuid');
const TransactionProfitRepository = require('../repository/TransactionProfitRepository');
const PawnTransactionRepository = require('../repository/PawnTransactionRepository');

module.exports = {
  async getAll() {
    return TransactionProfitRepository.findAll();
  },

  async getPaginated({ page = 0, size = 10, sortBy = 'profit_recorded_date', sortDir = 'desc' } = {}) {
    const { count, rows } = await TransactionProfitRepository.findPaginated({ page, size, sortBy, sortDir });
    return {
      content: rows,
      pageNumber: page,
      pageSize: size,
      totalElements: count,
      totalPages: Math.ceil(count / size),
      last: (page + 1) * size >= count,
    };
  },

  async search({ pawnId, customerNic, page = 0, size = 10 } = {}) {
    // Fetch all profits with joined transaction+customer in one query set
    const { TransactionProfit, PawnTransaction, Customer } = require('../model');
    const { Op } = require('sequelize');

    const txWhere = {};
    const customerWhere = {};
    if (pawnId) txWhere.pawnId = { [Op.like]: `%${pawnId}%` };
    if (customerNic) customerWhere.nic = { [Op.like]: `%${customerNic}%` };

    const { count, rows } = await TransactionProfit.findAndCountAll({
      include: [{
        model: PawnTransaction,
        as: 'transaction',
        where: Object.keys(txWhere).length ? txWhere : undefined,
        required: Object.keys(txWhere).length > 0,
        include: [{
          model: Customer,
          as: 'customer',
          where: Object.keys(customerWhere).length ? customerWhere : undefined,
          required: Object.keys(customerWhere).length > 0,
        }],
      }],
      limit: size,
      offset: page * size,
      order: [['profit_recorded_date', 'DESC']],
      distinct: true,
    });

    return {
      content: rows,
      pageNumber: page,
      pageSize: size,
      totalElements: count,
      totalPages: Math.ceil(count / size),
      last: (page + 1) * size >= count,
    };
  },

  async setProfit(transactionId, { profitAmount, notes }, userId) {
    const existing = await TransactionProfitRepository.findByTransactionId(transactionId);
    if (existing) throw { status: 409, message: 'Profit already recorded for this transaction' };
    const tx = await PawnTransactionRepository.findById(transactionId);
    if (!tx) throw { status: 404, message: 'Transaction not found' };

    const profit = await TransactionProfitRepository.create({
      id: uuidv4(),
      transactionId,
      profitAmount,
      pawnId: tx.pawnId,
      profitNotes: notes,
      profitRecordedDate: new Date(),
      profitRecordedBy: userId,
    });

    await PawnTransactionRepository.update(transactionId, { status: 'Profited' });
    return profit;
  },
};
