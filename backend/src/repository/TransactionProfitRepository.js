'use strict';
const { TransactionProfit } = require('../model');

module.exports = {
  findAll: () => TransactionProfit.findAll({ order: [['profitRecordedDate', 'DESC']] }),
  findByTransactionId: (transactionId) => TransactionProfit.findOne({ where: { transactionId } }),
  findPaginated: ({ page, size, sortBy, sortDir }) =>
    TransactionProfit.findAndCountAll({
      limit: size,
      offset: page * size,
      order: [[sortBy || 'profitRecordedDate', sortDir || 'desc']],
    }),
  create: (data) => TransactionProfit.create(data),
};
