'use strict';
const { v4: uuidv4 } = require('uuid');
const PawnTransactionRepository = require('../repository/PawnTransactionRepository');
const PawnTransactionItemRepository = require('../repository/PawnTransactionItemRepository');
const PawnTransactionItemImageRepository = require('../repository/PawnTransactionItemImageRepository');
const TransactionEditHistoryRepository = require('../repository/TransactionEditHistoryRepository');
const CustomerRepository = require('../repository/CustomerRepository');
const InterestRateRepository = require('../repository/InterestRateRepository');
const BlacklistService = require('./BlacklistService');
require('dotenv').config();

const SPECIAL_PATTERN = process.env.SPECIAL_PATTERN || 'TND';

async function generatePawnId() {
  const latest = await PawnTransactionRepository.getLatestPawnId();
  if (!latest) return 'A-0001';
  const lastId = latest.pawnId;
  const parts = lastId.split('-');
  const prefix = parts[0];
  const num = parseInt(parts[1] || '0', 10) + 1;
  const padded = String(num).padStart(4, '0');
  return `${prefix}-${padded}`;
}

module.exports = {
  async getAll() {
    return PawnTransactionRepository.findAll();
  },

  async getPaginated({ page = 0, size = 10, sortBy = 'created_at', sortDir = 'desc', branchId, status } = {}) {
    const { count, rows } = await PawnTransactionRepository.findPaginated({ page, size, sortBy, sortDir, branchId, status });
    return {
      content: rows,
      pageNumber: page,
      pageSize: size,
      totalElements: count,
      totalPages: Math.ceil(count / size),
      last: (page + 1) * size >= count,
    };
  },

  async getById(id) {
    const t = await PawnTransactionRepository.findById(id);
    if (!t) throw { status: 404, message: 'Transaction not found' };
    return t;
  },

  async getByPawnId(pawnId) {
    const t = await PawnTransactionRepository.findByPawnId(pawnId);
    if (!t) throw { status: 404, message: 'Transaction not found' };
    return t;
  },

  async getByBranch(branchId) {
    return PawnTransactionRepository.findByBranchId(branchId);
  },

  async search({ search, branchId, page = 0, size = 10, sortBy = 'created_at', sortDir = 'desc' } = {}) {
    const { count, rows } = await PawnTransactionRepository.search({ search, branchId, page, size, sortBy, sortDir });
    return {
      content: rows,
      pageNumber: page,
      pageSize: size,
      totalElements: count,
      totalPages: Math.ceil(count / size),
      last: (page + 1) * size >= count,
    };
  },

  async searchAdvanced({ pawnId, customerNic, status, minAmount, maxAmount, patternMode, branchId, startDate, endDate, page = 0, size = 10, sortBy = 'created_at', sortDir = 'desc' } = {}) {
    const { count, rows } = await PawnTransactionRepository.searchAdvanced({ pawnId, customerNic, status, minAmount, maxAmount, patternMode, branchId, startDate, endDate, page, size, sortBy, sortDir });
    return {
      content: rows,
      pageNumber: page,
      pageSize: size,
      totalElements: count,
      totalPages: Math.ceil(count / size),
      last: (page + 1) * size >= count,
    };
  },

  async getPatternConfig() {
    return { specialPattern: SPECIAL_PATTERN };
  },

  async create(request, branchId, createdBy) {
    if (!request.customerName) throw { status: 400, message: 'Customer name is required' };
    if (!request.customerNic) throw { status: 400, message: 'Customer NIC is required' };
    if (!request.items || request.items.length === 0) throw { status: 400, message: 'At least one item is required' };

    // Blacklist check
    const blacklisted = await BlacklistService.checkByNic(request.customerNic.trim());
    if (blacklisted.length > 0) {
      throw { status: 400, message: `Customer is blacklisted. Cannot create transaction for NIC: ${request.customerNic}. Reason: ${blacklisted[0].reason}` };
    }

    // Create or update customer
    let customer = await CustomerRepository.findByNic(request.customerNic.trim());
    if (!customer) {
      customer = await CustomerRepository.create({
        id: uuidv4(),
        fullName: request.customerName,
        nic: request.customerNic.trim(),
        phone: request.customerPhone || null,
        address: request.customerAddress || null,
        gender: request.customerGender || null,
        customerType: request.customerType || 'Individual',
        isActive: true,
      });
    } else {
      // Update existing customer info if changed
      const updates = {};
      if (request.customerName && request.customerName !== customer.fullName) updates.fullName = request.customerName;
      if (request.customerPhone && request.customerPhone !== customer.phone) updates.phone = request.customerPhone;
      if (request.customerAddress && request.customerAddress !== customer.address) updates.address = request.customerAddress;
      if (Object.keys(updates).length > 0) {
        await CustomerRepository.update(customer.id, updates);
        customer = await CustomerRepository.findById(customer.id);
      }
    }

    const pawnId = await generatePawnId();
    const pawnDate = request.pawnDate || new Date().toISOString().slice(0, 10);
    const periodMonths = request.periodMonths || 6;
    const maturityDate = request.maturityDate || (() => {
      const d = new Date(pawnDate);
      d.setMonth(d.getMonth() + periodMonths);
      return d.toISOString().slice(0, 10);
    })();

    // Resolve interest rate values
    let interestRatePercent = request.interestRatePercent;
    let firstMonthInterestRatePercent = request.firstMonthInterestRatePercent;
    if (!interestRatePercent && request.interestRateId) {
      const rate = await InterestRateRepository.findById(request.interestRateId);
      if (rate) {
        interestRatePercent = parseFloat(rate.ratePercent);
        if (!firstMonthInterestRatePercent) firstMonthInterestRatePercent = parseFloat(rate.firstMonthRatePercent || rate.ratePercent);
      }
    }
    if (!interestRatePercent) interestRatePercent = 8.50;
    if (!firstMonthInterestRatePercent) firstMonthInterestRatePercent = +(interestRatePercent / 12).toFixed(4);

    // Calculate total loan amount from items
    let totalLoanAmount = request.loanAmount;
    if (!totalLoanAmount) {
      totalLoanAmount = request.items.reduce((sum, item) => sum + (parseFloat(item.appraisedValue) || 0), 0);
    }

    const txId = uuidv4();
    const transaction = await PawnTransactionRepository.create({
      id: txId,
      pawnId,
      branchId,
      customerId: customer.id,
      idType: request.idType || 'NIC',
      patternMode: request.patternMode || 'A',
      loanAmount: totalLoanAmount,
      remainingBalance: totalLoanAmount,
      interestRateId: request.interestRateId || null,
      interestRatePercent,
      firstMonthInterestRatePercent,
      periodMonths,
      pawnDate,
      maturityDate,
      status: 'Active',
      remarks: request.remarks || null,
      createdBy,
    });

    // Save items
    for (let i = 0; i < request.items.length; i++) {
      const item = request.items[i];
      const itemId = uuidv4();
      await PawnTransactionItemRepository.create({
        id: itemId,
        transactionId: txId,
        itemDescription: item.description || item.itemDescription,
        itemContent: item.content || item.itemContent,
        itemCondition: item.condition || item.itemCondition || 'Good',
        weightGrams: item.weightGrams,
        karat: item.karat || 'N/A',
        appraisedValue: item.appraisedValue,
        marketValue: item.marketValue,
        itemOrder: i + 1,
      });
      // Save images if any
      if (item.images && item.images.length > 0) {
        for (let j = 0; j < item.images.length; j++) {
          await PawnTransactionItemImageRepository.create({
            id: uuidv4(),
            itemId,
            transactionId: txId,
            imageUrl: item.images[j],
            imageOrder: j + 1,
          });
        }
      }
    }

    return PawnTransactionRepository.findById(txId);
  },

  async update(id, data, editedBy, editedByName) {
    const tx = await PawnTransactionRepository.findById(id);
    if (!tx) throw { status: 404, message: 'Transaction not found' };

    const prevStatus = tx.status;
    const prevLoan = tx.loanAmount;
    const prevRemarks = tx.remarks;

    const updateData = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.loanAmount !== undefined) updateData.loanAmount = data.loanAmount;
    if (data.remainingBalance !== undefined) updateData.remainingBalance = data.remainingBalance;
    if (data.remarks !== undefined) updateData.remarks = data.remarks;
    if (data.interestRateId !== undefined) updateData.interestRateId = data.interestRateId;
    if (data.interestRatePercent !== undefined) updateData.interestRatePercent = data.interestRatePercent;
    if (data.firstMonthInterestRatePercent !== undefined) updateData.firstMonthInterestRatePercent = data.firstMonthInterestRatePercent;
    if (data.periodMonths !== undefined) updateData.periodMonths = data.periodMonths;
    if (data.maturityDate !== undefined) updateData.maturityDate = data.maturityDate;
    if (data.pawnDate !== undefined) updateData.pawnDate = data.pawnDate;

    await PawnTransactionRepository.update(id, updateData);

    // Log edit history
    await TransactionEditHistoryRepository.create({
      id: uuidv4(),
      transactionId: id,
      pawnId: tx.pawnId,
      editedBy,
      editedByName,
      editType: data.editType || 'UPDATE',
      previousStatus: prevStatus,
      newStatus: data.status || prevStatus,
      previousLoanAmount: prevLoan,
      newLoanAmount: data.loanAmount || prevLoan,
      previousRemarks: prevRemarks,
      newRemarks: data.remarks || prevRemarks,
      editReason: data.editReason || null,
    });

    return PawnTransactionRepository.findById(id);
  },

  async changeStatus(id, status, editedBy, editedByName, reason) {
    return this.update(id, { status, editType: 'STATUS_CHANGE', editReason: reason }, editedBy, editedByName);
  },

  async getEditHistory(id) {
    return TransactionEditHistoryRepository.findByTransactionId(id);
  },

  async delete(id) {
    await PawnTransactionRepository.delete(id);
  },
};
