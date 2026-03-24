'use strict';
const { PawnRedemption } = require('../model');

module.exports = {
  findByTransactionId: (transactionId) =>
    PawnRedemption.findAll({ where: { transactionId }, order: [['created_at', 'DESC']] }),
  create: (data) => PawnRedemption.create(data),
};
