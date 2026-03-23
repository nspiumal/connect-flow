package com.connectflow.service;

import com.connectflow.dto.OutstandingBalanceDTO;
import com.connectflow.dto.PawnRedemptionDTO;
import com.connectflow.dto.RedemptionRequest;
import com.connectflow.model.PawnRedemption;
import com.connectflow.model.PawnTransaction;
import com.connectflow.model.TransactionEditHistory;
import com.connectflow.repository.PawnRedemptionRepository;
import com.connectflow.repository.PawnTransactionRepository;
import com.connectflow.repository.TransactionEditHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PawnRedemptionService {

    private final PawnRedemptionRepository redemptionRepository;
    private final PawnTransactionRepository transactionRepository;
    private final TransactionEditHistoryRepository editHistoryRepository;

    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");
    private static final BigDecimal TWELVE = new BigDecimal("12");
    private static final BigDecimal FIFTY_TWO = new BigDecimal("52");

    /**
     * Calculate outstanding balance (principal + accrued interest)
     */
    public OutstandingBalanceDTO getOutstandingBalance(UUID transactionId) {
        PawnTransaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + transactionId));

        // Use remainingBalance from DB (which gets updated after each redemption)
        // If remainingBalance is null, fallback to loanAmount
        BigDecimal principal = transaction.getRemainingBalance() != null
                ? transaction.getRemainingBalance()
                : transaction.getLoanAmount();

        InterestAccrualBreakdown breakdown = calculateAccrualInterest(transaction);
        BigDecimal accrualInterest = breakdown.totalInterest();
        BigDecimal charges = BigDecimal.ZERO; // Placeholder for charges if needed
        BigDecimal total = principal.add(accrualInterest).add(charges);

        return OutstandingBalanceDTO.builder()
                .principal(principal)
                .accrualInterest(accrualInterest)
                .monthlyInterest(breakdown.monthlyInterest())
                .weeklyInterest(breakdown.weeklyInterest())
                .weeklyPeriodsCharged(breakdown.weeklyPeriodsCharged())
                .charges(charges)
                .total(total)
                .loanStatus(transaction.getStatus())
                .ratePercent(transaction.getInterestRatePercent())
                .rateName(transaction.getInterestRateId() != null ? "Interest Rate" : "N/A")
                .pawnDate(transaction.getPawnDate())
                .maturityDate(transaction.getMaturityDate())
                .build();
    }

    /**
     * Unified interest logic:
     * - First month always charges full monthly interest once.
     *   - If still within first-month window, apply first-month rate.
     *   - If first month has already passed, apply normal rate for that first month.
     * - Weekly charging starts on (pawnDate + 1 month + 2 days) based on business rule,
     *   and each week is charged at week start date.
     * - Partial payments do not reset the original timeline anchor (pawnDate).
     */
    private InterestAccrualBreakdown calculateAccrualInterest(PawnTransaction transaction) {
        if (transaction.getPawnDate() == null) {
            return InterestAccrualBreakdown.zero();
        }

        LocalDate pawnDate = transaction.getPawnDate();
        LocalDate today = LocalDate.now();

        if (today.isBefore(pawnDate)) {
            return InterestAccrualBreakdown.zero();
        }

        // Use remainingBalance (updated after payments) instead of original loanAmount
        BigDecimal principalAmount = transaction.getRemainingBalance() != null
                ? transaction.getRemainingBalance()
                : transaction.getLoanAmount();

        if (principalAmount == null || principalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return InterestAccrualBreakdown.zero();
        }

        BigDecimal normalRatePercent = transaction.getInterestRatePercent() != null
                ? transaction.getInterestRatePercent()
                : BigDecimal.ZERO;
        BigDecimal firstMonthRatePercent = transaction.getFirstMonthInterestRatePercent() != null
                ? transaction.getFirstMonthInterestRatePercent()
                : normalRatePercent;
        BigDecimal weeklyRatePercent = normalRatePercent
                .divide(FIFTY_TWO, 8, RoundingMode.HALF_UP)
                .setScale(4, RoundingMode.HALF_UP);

        // Example: pawnDate=2026-03-12 => firstMonthEndInclusive=2026-04-13, weeklyStart=2026-04-14
        LocalDate firstMonthEndInclusive = pawnDate.plusMonths(1).plusDays(1);
        LocalDate weeklyStart = firstMonthEndInclusive.plusDays(1);
        LocalDate accrualStart = transaction.getLastRedemptionDate() != null
                ? transaction.getLastRedemptionDate().plusDays(1)
                : pawnDate;

        if (accrualStart.isAfter(today)) {
            return InterestAccrualBreakdown.zero();
        }

        BigDecimal monthlyInterest = BigDecimal.ZERO;
        BigDecimal appliedFirstMonthRatePercent = firstMonthRatePercent;
        BigDecimal appliedFirstMonthMonthlyRatePercent = BigDecimal.ZERO;
        if (transaction.getLastRedemptionDate() == null) {
            // If first month has already ended, use normal rate for the initial month.
            appliedFirstMonthRatePercent = today.isAfter(firstMonthEndInclusive)
                    ? normalRatePercent
                    : firstMonthRatePercent;
            appliedFirstMonthMonthlyRatePercent = appliedFirstMonthRatePercent
                    .divide(TWELVE, 8, RoundingMode.HALF_UP)
                    .setScale(4, RoundingMode.HALF_UP);
            monthlyInterest = principalAmount
                    .multiply(appliedFirstMonthMonthlyRatePercent)
                    .divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP);
        }

        int weeklyPeriodsCharged = countWeeklyPeriodsToCharge(accrualStart, today, weeklyStart);
        BigDecimal weeklyInterest = principalAmount
                .multiply(weeklyRatePercent)
                .multiply(BigDecimal.valueOf(weeklyPeriodsCharged))
                .divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP);

        BigDecimal totalInterest = monthlyInterest.add(weeklyInterest);

        log.info(
                "Interest calculation for transaction {}: pawnDate={}, accrualStart={}, firstMonthEndInclusive={}, weeklyStart={}, normalRate={}%, configuredFirstMonthRate={}%, appliedFirstMonthAnnualRate={}%, appliedFirstMonthMonthlyRate={}%, weeklyRate={}%, weeklyPeriods={}, principal={}, monthlyInterest={}, weeklyInterest={}, totalInterest={}",
                transaction.getPawnId(),
                pawnDate,
                accrualStart,
                firstMonthEndInclusive,
                weeklyStart,
                normalRatePercent,
                firstMonthRatePercent,
                appliedFirstMonthRatePercent,
                appliedFirstMonthMonthlyRatePercent,
                weeklyRatePercent,
                weeklyPeriodsCharged,
                principalAmount,
                monthlyInterest,
                weeklyInterest,
                totalInterest
        );

        return new InterestAccrualBreakdown(monthlyInterest, weeklyInterest, weeklyPeriodsCharged, totalInterest);
    }

    private int countWeeklyPeriodsToCharge(LocalDate accrualStart, LocalDate today, LocalDate weeklyAnchorStart) {
        if (today.isBefore(weeklyAnchorStart)) {
            return 0;
        }

        LocalDate effectiveStart = accrualStart.isAfter(weeklyAnchorStart) ? accrualStart : weeklyAnchorStart;

        long daysFromAnchorToStart = ChronoUnit.DAYS.between(weeklyAnchorStart, effectiveStart);
        long weeksOffset = (long) Math.ceil(daysFromAnchorToStart / 7.0);
        LocalDate firstChargeDate = weeklyAnchorStart.plusDays(weeksOffset * 7L);

        if (firstChargeDate.isAfter(today)) {
            return 0;
        }

        long daysBetween = ChronoUnit.DAYS.between(firstChargeDate, today);
        return (int) (daysBetween / 7) + 1;
    }

    private record InterestAccrualBreakdown(
            BigDecimal monthlyInterest,
            BigDecimal weeklyInterest,
            int weeklyPeriodsCharged,
            BigDecimal totalInterest
    ) {
        private static InterestAccrualBreakdown zero() {
            return new InterestAccrualBreakdown(BigDecimal.ZERO, BigDecimal.ZERO, 0, BigDecimal.ZERO);
        }
    }

    /**
     * Process redemption (full or partial)
     * PAYMENT ALLOCATION ORDER: Interest → Charges → Principal
     * NO MINIMUM PAYMENT: Customer can pay any amount
     * MATURITY DATE EXTENSION: After partial redemption, extend maturity date by period_months from today
     */
    public PawnRedemptionDTO processRedemption(UUID transactionId, RedemptionRequest request,
                                               UUID paidBy, String paidByName) {
        PawnTransaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + transactionId));

        OutstandingBalanceDTO outstanding = getOutstandingBalance(transactionId);
        BigDecimal redemptionAmount = request.getRedemptionAmount();

        // Validation: Amount must be positive
        if (redemptionAmount == null || redemptionAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Redemption amount must be positive");
        }

        // Cannot exceed total outstanding (Principal + Interest + Charges)
        if (redemptionAmount.compareTo(outstanding.getTotal()) > 0) {
            throw new IllegalArgumentException(
                    "Redemption amount exceeds outstanding balance. Outstanding: " + outstanding.getTotal()
            );
        }

        BigDecimal principalPaid = BigDecimal.ZERO;
        BigDecimal interestPaid = BigDecimal.ZERO;
        BigDecimal chargesPaid = BigDecimal.ZERO;
        BigDecimal remainingAmount = redemptionAmount;
        boolean isFullRedemption = false;
        String redemptionType;

        // NEW ALLOCATION ORDER: Interest → Charges → Principal
        // Step 1: Pay interest (FIRST)
        if (remainingAmount.compareTo(BigDecimal.ZERO) > 0 && outstanding.getAccrualInterest().compareTo(BigDecimal.ZERO) > 0) {
            if (remainingAmount.compareTo(outstanding.getAccrualInterest()) >= 0) {
                interestPaid = outstanding.getAccrualInterest();
                remainingAmount = remainingAmount.subtract(interestPaid);
                log.info("Interest paid: Rs. {}", interestPaid);
            } else {
                interestPaid = remainingAmount;
                remainingAmount = BigDecimal.ZERO;
                log.info("Partial interest paid: Rs. {}", interestPaid);
            }
        }

        // Step 2: Pay charges
        if (remainingAmount.compareTo(BigDecimal.ZERO) > 0 && outstanding.getCharges().compareTo(BigDecimal.ZERO) > 0) {
            if (remainingAmount.compareTo(outstanding.getCharges()) >= 0) {
                chargesPaid = outstanding.getCharges();
                remainingAmount = remainingAmount.subtract(chargesPaid);
                log.info("Charges paid: Rs. {}", chargesPaid);
            } else {
                chargesPaid = remainingAmount;
                remainingAmount = BigDecimal.ZERO;
                log.info("Partial charges paid: Rs. {}", chargesPaid);
            }
        }

        // Step 3: Pay principal (LAST - optional)
        if (remainingAmount.compareTo(BigDecimal.ZERO) > 0) {
            principalPaid = remainingAmount;
            remainingAmount = BigDecimal.ZERO;
            log.info("Principal paid: Rs. {}", principalPaid);
        }

        // Calculate remaining balances
        BigDecimal remainingPrincipal = outstanding.getPrincipal().subtract(principalPaid);
        BigDecimal remainingInterest = outstanding.getAccrualInterest().subtract(interestPaid);

        // Determine if full or partial redemption
        if (remainingPrincipal.compareTo(BigDecimal.ZERO) <= 0 && remainingInterest.compareTo(BigDecimal.ZERO) <= 0) {
            isFullRedemption = true;
            redemptionType = "FULL";
            transaction.setStatus("Completed");
            transaction.setRemainingBalance(BigDecimal.ZERO); // Fully settled
            log.info("Transaction {} marked as COMPLETED (full redemption)", transactionId);
        } else {
            redemptionType = "PARTIAL";
            // Update remaining balance: store only remaining principal (interest is calculated dynamically)
            transaction.setRemainingBalance(remainingPrincipal);

            // MATURITY DATE EXTENSION: Extend maturity date by period_months from today
            LocalDate today = LocalDate.now();
            LocalDate newMaturityDate = today.plusMonths(transaction.getPeriodMonths());
            transaction.setMaturityDate(newMaturityDate);
            log.info("Transaction {} remains ACTIVE (partial redemption). New remaining balance: {} | New maturity date: {}",
                    transactionId, remainingPrincipal, newMaturityDate);
        }

        // Save transaction with updated status, remaining balance, maturity date, and last redemption date
        transaction.setLastRedemptionDate(LocalDate.now());
        transactionRepository.save(transaction);

        log.info("Transaction {} updated: remainingBalance={}, lastRedemptionDate={}, status={}",
                transaction.getPawnId(), transaction.getRemainingBalance(),
                transaction.getLastRedemptionDate(), transaction.getStatus());

        // Create and save redemption record
        PawnRedemption redemption = PawnRedemption.builder()
                .transactionId(transactionId)
                .pawnId(transaction.getPawnId())
                .redemptionAmount(redemptionAmount)
                .principalPaid(principalPaid)
                .interestPaid(interestPaid)
                .chargesPaid(chargesPaid)
                .remainingPrincipal(remainingPrincipal)
                .remainingInterest(remainingInterest)
                .isFullRedemption(isFullRedemption)
                .redemptionType(redemptionType)
                .paidBy(paidBy)
                .paidByName(paidByName)
                .notes(request.getNotes())
                .build();

        PawnRedemption saved = redemptionRepository.save(redemption);
        log.info("Redemption {} saved for transaction {}", saved.getId(), transactionId);

        // Log redemption to transaction edit history
        logRedemptionToHistory(transaction, redemptionAmount, principalPaid, interestPaid, chargesPaid,
                              remainingPrincipal, isFullRedemption, paidBy, paidByName);

        return toDTO(saved);
    }

    /**
     * Log redemption to transaction edit history with charges breakdown
     */
    private void logRedemptionToHistory(PawnTransaction transaction, BigDecimal redemptionAmount,
                                       BigDecimal principalPaid, BigDecimal interestPaid, BigDecimal chargesPaid,
                                       BigDecimal remainingBalance, boolean isFullRedemption,
                                       UUID paidBy, String paidByName) {
        String previousStatus = transaction.getStatus();
        String newStatus = isFullRedemption ? "Completed" : "Active";

        // Build redemption summary with all components
        String redemptionSummary = String.format(
            "Redemption: Rs. %.2f | Interest: Rs. %.2f | Charges: Rs. %.2f | Principal: Rs. %.2f | Remaining: Rs. %.2f | Maturity: %s",
            redemptionAmount, interestPaid, chargesPaid, principalPaid, remainingBalance, transaction.getMaturityDate()
        );

        TransactionEditHistory history = TransactionEditHistory.builder()
                .transactionId(transaction.getId())
                .pawnId(transaction.getPawnId())
                .editedBy(paidBy)
                .editedByName(paidByName)
                .editType("REDEMPTION")
                .previousStatus(previousStatus)
                .newStatus(newStatus)
                .previousLoanAmount(transaction.getLoanAmount())
                .newLoanAmount(remainingBalance)
                .previousRemarks(transaction.getRemarks())
                .newRemarks(redemptionSummary)
                .build();

        editHistoryRepository.save(history);
        log.info("Redemption logged to edit history for transaction {}", transaction.getId());
    }

    /**
     * Get redemption history for a transaction
     */
    public List<PawnRedemptionDTO> getRedemptionHistory(UUID transactionId) {
        return redemptionRepository.findByTransactionIdOrderByCreatedAtDesc(transactionId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private PawnRedemptionDTO toDTO(PawnRedemption redemption) {
        return PawnRedemptionDTO.builder()
                .id(redemption.getId())
                .transactionId(redemption.getTransactionId())
                .pawnId(redemption.getPawnId())
                .redemptionAmount(redemption.getRedemptionAmount())
                .principalPaid(redemption.getPrincipalPaid())
                .interestPaid(redemption.getInterestPaid())
                .chargesPaid(redemption.getChargesPaid())
                .remainingPrincipal(redemption.getRemainingPrincipal())
                .remainingInterest(redemption.getRemainingInterest())
                .isFullRedemption(redemption.getIsFullRedemption())
                .redemptionType(redemption.getRedemptionType())
                .paidBy(redemption.getPaidBy())
                .paidByName(redemption.getPaidByName())
                .notes(redemption.getNotes())
                .createdAt(redemption.getCreatedAt())
                .build();
    }
}
