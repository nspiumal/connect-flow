'use strict';
const { PawnTransactionItem, PawnTransactionItemImage } = require('../model');

module.exports = {
  findByTransactionId: (transactionId) =>
    PawnTransactionItem.findAll({
      where: { transactionId },
      include: [{ model: PawnTransactionItemImage, as: 'images' }],
      order: [['item_order', 'ASC']],
    }),
  create: (data) => PawnTransactionItem.create(data),
  deleteByTransactionId: (transactionId) => PawnTransactionItem.destroy({ where: { transactionId } }),
};
