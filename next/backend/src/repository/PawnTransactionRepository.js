'use strict';
const { PawnTransaction, Customer, Branch, PawnTransactionItem, PawnTransactionItemImage, InterestRate } = require('../model');
const { Op } = require('sequelize');

const defaultInclude = [
  { model: Customer, as: 'customer' },
  { model: Branch, as: 'branch' },
  { model: InterestRate, as: 'interestRate' },
  {
    model: PawnTransactionItem, as: 'items',
    include: [{ model: PawnTransactionItemImage, as: 'images' }],
  },
];

module.exports = {
  findAll: () => PawnTransaction.findAll({ include: defaultInclude, order: [['created_at', 'DESC']] }),

  findById: (id) => PawnTransaction.findByPk(id, { include: defaultInclude }),

  findByPawnId: (pawnId) => PawnTransaction.findOne({ where: { pawnId }, include: defaultInclude }),

  findByBranchId: (branchId) => PawnTransaction.findAll({ where: { branchId }, include: defaultInclude }),

  findActiveOverdue: (today) =>
    PawnTransaction.findAll({
      where: {
        status: 'Active',
        maturityDate: { [Op.lt]: today },
      },
    }),

  findPaginated: ({ page, size, sortBy, sortDir, branchId, status }) => {
    const where = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    return PawnTransaction.findAndCountAll({
      where,
      include: defaultInclude,
      limit: size,
      offset: page * size,
      order: [[sortBy || 'created_at', sortDir === 'asc' ? 'ASC' : 'DESC']],
      distinct: true,
    });
  },

  search: ({ search, branchId, page, size, sortBy, sortDir }) => {
    const customerWhere = {};
    const txWhere = {};
    if (branchId) txWhere.branchId = branchId;
    if (search) {
      txWhere[Op.or] = [
        { pawnId: { [Op.like]: `%${search}%` } },
        { status: { [Op.like]: `%${search}%` } },
        { '$customer.full_name$': { [Op.like]: `%${search}%` } },
        { '$customer.nic$': { [Op.like]: `%${search}%` } },
      ];
    }
    return PawnTransaction.findAndCountAll({
      where: txWhere,
      include: defaultInclude,
      limit: size,
      offset: page * size,
      order: [[sortBy || 'created_at', sortDir === 'asc' ? 'ASC' : 'DESC']],
      distinct: true,
      subQuery: false,
    });
  },

  searchAdvanced: ({ pawnId, customerNic, status, minAmount, maxAmount, patternMode, branchId, startDate, endDate, page, size, sortBy, sortDir }) => {
    const where = {};
    if (branchId) where.branchId = branchId;
    if (pawnId) where.pawnId = { [Op.like]: `%${pawnId}%` };
    if (status) where.status = status;
    if (patternMode) where.patternMode = patternMode;
    if (minAmount) where.loanAmount = { ...(where.loanAmount || {}), [Op.gte]: minAmount };
    if (maxAmount) where.loanAmount = { ...(where.loanAmount || {}), [Op.lte]: maxAmount };
    if (startDate) where.pawnDate = { ...(where.pawnDate || {}), [Op.gte]: startDate };
    if (endDate) where.pawnDate = { ...(where.pawnDate || {}), [Op.lte]: endDate };

    const customerInclude = { model: Customer, as: 'customer' };
    if (customerNic) customerInclude.where = { nic: { [Op.like]: `%${customerNic}%` } };

    return PawnTransaction.findAndCountAll({
      where,
      include: [
        customerInclude,
        { model: Branch, as: 'branch' },
        { model: InterestRate, as: 'interestRate' },
        { model: PawnTransactionItem, as: 'items', include: [{ model: PawnTransactionItemImage, as: 'images' }] },
      ],
      limit: size,
      offset: page * size,
      order: [[sortBy || 'created_at', sortDir === 'asc' ? 'ASC' : 'DESC']],
      distinct: true,
    });
  },

  create: (data) => PawnTransaction.create(data),

  update: (id, data) => PawnTransaction.update(data, { where: { id } }),

  save: (instance) => instance.save(),

  delete: (id) => PawnTransaction.destroy({ where: { id } }),

  countAll: () => PawnTransaction.count(),

  getLatestPawnId: () =>
    PawnTransaction.findOne({
      order: [['created_at', 'DESC']],
      attributes: ['pawnId'],
    }),
};
