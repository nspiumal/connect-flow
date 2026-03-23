'use strict';
const { TransactionProfit } = require('../model');

module.exports = {
  findAll: () => TransactionProfit.findAll({ order: [['profit_recorded_date', 'DESC']] }),
  findByTransactionId: (transactionId) => TransactionProfit.findOne({ where: { transactionId } }),
  findPaginated: ({ page, size, sortBy, sortDir }) =>
    TransactionProfit.findAndCountAll({
      limit: size,
      offset: page * size,
      order: [[sortBy || 'profit_recorded_date', sortDir || 'desc']],
    }),
  create: (data) => TransactionProfit.create(data),
};
