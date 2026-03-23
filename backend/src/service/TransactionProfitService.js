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
    const all = await TransactionProfitRepository.findAll();
    let filtered = await Promise.all(
      all.map(async (p) => {
        const tx = await PawnTransactionRepository.findById(p.transactionId);
        return { profit: p, tx };
      })
    );
    if (pawnId) filtered = filtered.filter(({ tx }) => tx && tx.pawnId && tx.pawnId.toLowerCase().includes(pawnId.toLowerCase()));
    if (customerNic) filtered = filtered.filter(({ tx }) => tx && tx.customer && tx.customer.nic && tx.customer.nic.toLowerCase().includes(customerNic.toLowerCase()));
    const total = filtered.length;
    const slice = filtered.slice(page * size, (page + 1) * size).map(({ profit }) => profit);
    return {
      content: slice,
      pageNumber: page,
      pageSize: size,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      last: (page + 1) * size >= total,
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
