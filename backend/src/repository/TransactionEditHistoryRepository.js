'use strict';
const { TransactionEditHistory } = require('../model');

module.exports = {
  findByTransactionId: (transactionId) =>
    TransactionEditHistory.findAll({ where: { transactionId }, order: [['created_at', 'DESC']] }),
  create: (data) => TransactionEditHistory.create(data),
};
