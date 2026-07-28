'use strict';
const { v4: uuidv4 } = require('uuid');
const PawnTransactionRepository = require('../repository/PawnTransactionRepository');
const PawnRedemptionRepository = require('../repository/PawnRedemptionRepository');
const TransactionEditHistoryRepository = require('../repository/TransactionEditHistoryRepository');

/**
 * Interest calculation mirroring PawnRedemptionService.java exactly, extended with a
 * selectable recurring-cadence calculation period (Monthly / 2 Weeks) - a deliberate
 * divergence from the Java reference, which has no such concept.
 */
function normalizeCalculationPeriod(value) {
  const v = String(value || '').toUpperCase().replace(/[\s-]/g, '_');
  return v === 'TWO_WEEKS' || v === '2_WEEKS' || v === 'TWOWEEKS' ? 'TWO_WEEKS' : 'MONTHLY';
}

function calculateAccrualInterest(transaction, calculationPeriod) {
  const period = normalizeCalculationPeriod(calculationPeriod);
  if (!transaction.pawnDate) return { monthlyInterest: 0, weeklyInterest: 0, weeklyPeriodsCharged: 0, totalInterest: 0, calculationPeriod: period };

  const pawnDate = new Date(transaction.pawnDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  pawnDate.setHours(0, 0, 0, 0);

  if (today < pawnDate) return { monthlyInterest: 0, weeklyInterest: 0, weeklyPeriodsCharged: 0, totalInterest: 0, calculationPeriod: period };

  const principal = parseFloat(
    transaction.remainingBalance != null ? transaction.remainingBalance : transaction.loanAmount
  ) || 0;
  if (principal <= 0) return { monthlyInterest: 0, weeklyInterest: 0, weeklyPeriodsCharged: 0, totalInterest: 0, calculationPeriod: period };

  const normalRate = parseFloat(transaction.interestRatePercent) || 0;
  const firstMonthRate = parseFloat(transaction.firstMonthInterestRatePercent) || normalRate;
  const recurringRatePercent = normalRate / 12;

  // firstMonthEndInclusive = pawnDate + 1 month + 1 day (inclusive)
  const firstMonthEnd = new Date(pawnDate);
  firstMonthEnd.setMonth(firstMonthEnd.getMonth() + 1);
  firstMonthEnd.setDate(firstMonthEnd.getDate() + 1);

  // recurringStart = firstMonthEnd + 1 day
  const recurringStart = new Date(firstMonthEnd);
  recurringStart.setDate(recurringStart.getDate() + 1);

  // accrual starts from day after last redemption (or pawn date)
  let accrualStart = new Date(pawnDate);
  if (transaction.lastRedemptionDate) {
    accrualStart = new Date(transaction.lastRedemptionDate);
    accrualStart.setDate(accrualStart.getDate() + 1);
  }
  accrualStart.setHours(0, 0, 0, 0);

  if (accrualStart > today) return { monthlyInterest: 0, weeklyInterest: 0, weeklyPeriodsCharged: 0, totalInterest: 0, calculationPeriod: period };

  // Monthly interest (first month, only if no prior redemption).
  // firstMonthRate is already a monthly rate (e.g. annual 30% -> firstMonthRate 2.5%), so it's
  // applied directly and must NOT be divided by 12 again. normalRate is still an annual rate,
  // so it does need the /12 conversion when it's the one being applied.
  let monthlyInterest = 0;
  if (!transaction.lastRedemptionDate) {
    const appliedFirstMonthRatePercent = today > firstMonthEnd ? (normalRate / 12) : firstMonthRate;
    monthlyInterest = round2(principal * appliedFirstMonthRatePercent / 100);
  }

  // Recurring periods, always counted on a calendar-month cadence
  const weeklyPeriodsCharged = countCalendarMonthPeriods(accrualStart, today, recurringStart);
  const weeklyInterest = round2(principal * (recurringRatePercent / 100) * weeklyPeriodsCharged);

  // Monthly's total is the base calculation; 2-Weeks is exactly half of it (24 = 12 * 2 divisor
  // relationship, i.e. a two-week period charges half of what a calendar month charges).
  const totalMonthlyInterest = round2(monthlyInterest + weeklyInterest);
  if (period === 'TWO_WEEKS') {
    monthlyInterest = round2(monthlyInterest / 2);
    const halvedWeeklyInterest = round2(weeklyInterest / 2);
    return {
      monthlyInterest,
      weeklyInterest: halvedWeeklyInterest,
      weeklyPeriodsCharged,
      totalInterest: round2(totalMonthlyInterest / 2),
      calculationPeriod: period,
    };
  }

  return { monthlyInterest, weeklyInterest, weeklyPeriodsCharged, totalInterest: totalMonthlyInterest, calculationPeriod: period };
}

function countCalendarMonthPeriods(accrualStart, today, anchorStart) {
  if (today < anchorStart) return 0;

  const effectiveStart = accrualStart > anchorStart ? accrualStart : anchorStart;

  // Find the first calendar-month boundary at or after effectiveStart, anchored on anchorStart's day-of-month.
  let firstChargeDate = new Date(anchorStart);
  while (firstChargeDate < effectiveStart) {
    firstChargeDate.setMonth(firstChargeDate.getMonth() + 1);
  }

  if (firstChargeDate > today) return 0;

  let count = 0;
  let cursor = new Date(firstChargeDate);
  while (cursor <= today) {
    count += 1;
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return count;
}

function round2(val) {
  return Math.round(val * 100) / 100;
}

/** Redemption amounts are always rounded up to the nearest 10, so the outstanding
 * balance used for validation/display must match or a rounded-up payment would
 * incorrectly be rejected as exceeding the (unrounded) outstanding balance. */
function roundUpToNearest10(val) {
  return Math.ceil(val / 10) * 10;
}

module.exports = {
  async getOutstandingBalance(transactionId, calculationPeriod) {
    const tx = await PawnTransactionRepository.findById(transactionId);
    if (!tx) throw { status: 404, message: 'Transaction not found' };

    const principal = parseFloat(tx.remainingBalance != null ? tx.remainingBalance : tx.loanAmount) || 0;
    const breakdown = calculateAccrualInterest(tx, calculationPeriod);
    const charges = 0;
    const total = roundUpToNearest10(principal + breakdown.totalInterest + charges);

    return {
      principal,
      accrualInterest: breakdown.totalInterest,
      monthlyInterest: breakdown.monthlyInterest,
      weeklyInterest: breakdown.weeklyInterest,
      weeklyPeriodsCharged: breakdown.weeklyPeriodsCharged,
      calculationPeriod: breakdown.calculationPeriod,
      charges,
      total,
      loanStatus: tx.status,
      ratePercent: parseFloat(tx.interestRatePercent),
      pawnDate: tx.pawnDate,
      maturityDate: tx.maturityDate,
    };
  },

  async processRedemption(transactionId, { redemptionAmount, notes, charges, calculationPeriod }, paidBy, paidByName) {
    const tx = await PawnTransactionRepository.findById(transactionId);
    if (!tx) throw { status: 404, message: 'Transaction not found' };

    const outstanding = await this.getOutstandingBalance(transactionId, calculationPeriod);
    const amount = parseFloat(redemptionAmount);
    const chargesDue = round2(parseFloat(charges) || 0);
    const totalOutstanding = roundUpToNearest10(outstanding.principal + outstanding.accrualInterest + chargesDue);

    if (!amount || amount <= 0) throw { status: 400, message: 'Redemption amount must be positive' };
    if (amount > totalOutstanding) {
      throw { status: 400, message: `Redemption amount exceeds outstanding balance. Outstanding: ${totalOutstanding}` };
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
    if (remaining > 0 && chargesDue > 0) {
      chargesPaid = Math.min(remaining, chargesDue);
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