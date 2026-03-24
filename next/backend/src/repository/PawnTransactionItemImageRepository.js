'use strict';
const { PawnTransactionItemImage } = require('../model');

module.exports = {
  findByItemId: (itemId) => PawnTransactionItemImage.findAll({ where: { itemId }, order: [['image_order', 'ASC']] }),
  findByTransactionId: (transactionId) => PawnTransactionItemImage.findAll({ where: { transactionId } }),
  create: (data) => PawnTransactionItemImage.create(data),
  deleteByItemId: (itemId) => PawnTransactionItemImage.destroy({ where: { itemId } }),
};
