'use strict';
const { v4: uuidv4 } = require('uuid');
const PawnTransactionRepository = require('../repository/PawnTransactionRepository');
const PawnRedemptionRepository = require('../repository/PawnRedemptionRepository');
const TransactionEditHistoryRepository = require('../repository/TransactionEditHistoryRepository');

/**
 * Interest calculation mirroring PawnRedemptionService.java exactly.
 */
function calculateAccrualInterest(transaction) {
  if (!transaction.pawnDate) return { monthlyInterest: 0, weeklyInterest: 0, weeklyPeriodsCharged: 0, totalInterest: 0 };

  const pawnDate = new Date(transaction.pawnDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  pawnDate.setHours(0, 0, 0, 0);

  if (today < pawnDate) return { monthlyInterest: 0, weeklyInterest: 0, weeklyPeriodsCharged: 0, totalInterest: 0 };

  const principal = parseFloat(
    transaction.remainingBalance != null ? transaction.remainingBalance : transaction.loanAmount
  ) || 0;
  if (principal <= 0) return { monthlyInterest: 0, weeklyInterest: 0, weeklyPeriodsCharged: 0, totalInterest: 0 };

  const normalRate = parseFloat(transaction.interestRatePercent) || 0;
  const firstMonthRate = parseFloat(transaction.firstMonthInterestRatePercent) || normalRate;
  const weeklyRatePercent = normalRate / 52;

  // firstMonthEndInclusive = pawnDate + 1 month + 1 day (inclusive)
  const firstMonthEnd = new Date(pawnDate);
  firstMonthEnd.setMonth(firstMonthEnd.getMonth() + 1);
  firstMonthEnd.setDate(firstMonthEnd.getDate() + 1);

  // weeklyStart = firstMonthEnd + 1 day
  const weeklyStart = new Date(firstMonthEnd);
  weeklyStart.setDate(weeklyStart.getDate() + 1);

  // accrual starts from day after last redemption (or pawn date)
  let accrualStart = new Date(pawnDate);
  if (transaction.lastRedemptionDate) {
    accrualStart = new Date(transaction.lastRedemptionDate);
    accrualStart.setDate(accrualStart.getDate() + 1);
  }
  accrualStart.setHours(0, 0, 0, 0);

  if (accrualStart > today) return { monthlyInterest: 0, weeklyInterest: 0, weeklyPeriodsCharged: 0, totalInterest: 0 };

  // Monthly interest (first month, only if no prior redemption)
  let monthlyInterest = 0;
  if (!transaction.lastRedemptionDate) {
    const appliedFirstMonthRate = today > firstMonthEnd ? normalRate : firstMonthRate;
    const monthlyRatePercent = appliedFirstMonthRate / 12;
    monthlyInterest = round2(principal * monthlyRatePercent / 100);
  }

  // Weekly periods
  const weeklyPeriodsCharged = countWeeklyPeriods(accrualStart, today, weeklyStart);
  const weeklyInterest = round2(principal * (weeklyRatePercent / 100) * weeklyPeriodsCharged);

  const totalInterest = round2(monthlyInterest + weeklyInterest);
  return { monthlyInterest, weeklyInterest, weeklyPeriodsCharged, totalInterest };
}

function countWeeklyPeriods(accrualStart, today, weeklyAnchorStart) {
  if (today < weeklyAnchorStart) return 0;

  const effectiveStart = accrualStart > weeklyAnchorStart ? accrualStart : weeklyAnchorStart;
  const daysFromAnchorToStart = Math.floor((effectiveStart - weeklyAnchorStart) / 86400000);
  const weeksOffset = Math.ceil(daysFromAnchorToStart / 7);
  const firstChargeDate = new Date(weeklyAnchorStart);
  firstChargeDate.setDate(firstChargeDate.getDate() + weeksOffset * 7);

  if (firstChargeDate > today) return 0;

  const daysBetween = Math.floor((today - firstChargeDate) / 86400000);
  return Math.floor(daysBetween / 7) + 1;
}

function round2(val) {
  return Math.round(val * 100) / 100;
}

module.exports = {
  async getOutstandingBalance(transactionId) {
    const tx = await PawnTransactionRepository.findById(transactionId);
    if (!tx) throw { status: 404, message: 'Transaction not found' };

    const principal = parseFloat(tx.remainingBalance != null ? tx.remainingBalance : tx.loanAmount) || 0;
    const breakdown = calculateAccrualInterest(tx);
    const charges = 0;
    const total = round2(principal + breakdown.totalInterest + charges);

    return {
      principal,
      accrualInterest: breakdown.totalInterest,
      monthlyInterest: breakdown.monthlyInterest,
      weeklyInterest: breakdown.weeklyInterest,
      weeklyPeriodsCharged: breakdown.weeklyPeriodsCharged,
      charges,
      total,
      loanStatus: tx.status,
      ratePercent: parseFloat(tx.interestRatePercent),
      pawnDate: tx.pawnDate,
      maturityDate: tx.maturityDate,
    };
  },

  async processRedemption(transactionId, { redemptionAmount, notes }, paidBy, paidByName) {
    const tx = await PawnTransactionRepository.findById(transactionId);
    if (!tx) throw { status: 404, message: 'Transaction not found' };

    const outstanding = await this.getOutstandingBalance(transactionId);
    const amount = parseFloat(redemptionAmount);

    if (!amount || amount <= 0) throw { status: 400, message: 'Redemption amount must be positive' };
    if (amount > outstanding.total) {
      throw { status: 400, message: `Redemption amount exceeds outstanding balance. Outstanding: ${outstanding.total}` };
    }

    // Allocation: Interest → Charges → Principal
    let remaining = amount;
    let interestPaid = 0;
    let chargesPaid = 0;
    let principalPaid = 0;

    if (remaining > 0 && outstanding.accrualInterest > 0) {
      interestPaid = Math.min(remaining, outstanding.accrualInterest);
      remaining = round2(remaining - interestPaid);
    }
    if (remaining > 0 && outstanding.charges > 0) {
      chargesPaid = Math.min(remaining, outstanding.charges);
      remaining = round2(remaining - chargesPaid);
    }
    if (remaining > 0) {
      principalPaid = remaining;
      remaining = 0;
    }

    const remainingPrincipal = round2(outstanding.principal - principalPaid);
    const remainingInterest = round2(outstanding.accrualInterest - interestPaid);
    const isFullRedemption = remainingPrincipal <= 0 && remainingInterest <= 0;
    const redemptionType = isFullRedemption ? 'FULL' : 'PARTIAL';

    const today = new Date().toISOString().slice(0, 10);

    // Update transaction
    const updateData = {
      lastRedemptionDate: today,
      remainingBalance: isFullRedemption ? 0 : remainingPrincipal,
      status: isFullRedemption ? 'Completed' : 'Active',
    };
    if (!isFullRedemption) {
      const newMaturity = new Date();
      newMaturity.setMonth(newMaturity.getMonth() + (tx.periodMonths || 6));
      updateData.maturityDate = newMaturity.toISOString().slice(0, 10);
    }
    await PawnTransactionRepository.update(transactionId, updateData);

    // Save redemption record
    const redemption = await PawnRedemptionRepository.create({
      id: uuidv4(),
      transactionId,
      pawnId: tx.pawnId,
      redemptionAmount: amount,
      principalPaid,
      interestPaid,
      chargesPaid,
      remainingPrincipal,
      remainingInterest,
      isFullRedemption,
      redemptionType,
      paidBy,
      paidByName,
      notes,
    });

    // Log to edit history
    const prevStatus = tx.status;
    await TransactionEditHistoryRepository.create({
      id: uuidv4(),
      transactionId,
      pawnId: tx.pawnId,
      editedBy: paidBy,
      editedByName: paidByName,
      editType: 'REDEMPTION',
      previousStatus: prevStatus,
      newStatus: updateData.status,
      previousLoanAmount: tx.loanAmount,
      newLoanAmount: remainingPrincipal,
      previousRemarks: tx.remarks,
      newRemarks: `Redemption: ${amount} | Interest: ${interestPaid} | Charges: ${chargesPaid} | Principal: ${principalPaid} | Remaining: ${remainingPrincipal}`,
    });

    return redemption;
  },

  async getRedemptionHistory(transactionId) {
    return PawnRedemptionRepository.findByTransactionId(transactionId);
  },
};
