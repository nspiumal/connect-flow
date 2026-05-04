'use strict';
const { TransactionEditHistory } = require('../model');

module.exports = {
  findByTransactionId: (transactionId, limit = 50) =>
    TransactionEditHistory.findAll({
      where: { transactionId },
      order: [['created_at', 'DESC']],
      limit,
    }),
  create: (data) => TransactionEditHistory.create(data),
};
