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

        BigDecimal accrualInterest = calculateAccrualInterest(transaction);
        BigDecimal charges = BigDecimal.ZERO; // Placeholder for charges if needed
        BigDecimal total = principal.add(accrualInterest).add(charges);

        return OutstandingBalanceDTO.builder()
                .principal(principal)
                .accrualInterest(accrualInterest)
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
     * Calculate accrued interest from last redemption date (or pawn date if no redemptions) to today
     * Formula: remainingBalance * ratePercent% * (weeksCount / 52)
     * Weeks run Monday through Sunday; any payment day in a week charges the full week.
     */
    private BigDecimal calculateAccrualInterest(PawnTransaction transaction) {
        if (transaction.getPawnDate() == null) {
            return BigDecimal.ZERO;
        }

        // Use lastRedemptionDate if available, otherwise use pawnDate
        LocalDate startDate = transaction.getLastRedemptionDate() != null
            ? transaction.getLastRedemptionDate()
            : transaction.getPawnDate();

        LocalDate today = LocalDate.now();

        if (today.isBefore(startDate)) {
            return BigDecimal.ZERO;
        }

        // If redemption was made today, no new interest accrues
        if (today.equals(startDate)) {
            return BigDecimal.ZERO;
        }

        LocalDate startMonday = startDate.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        LocalDate endSunday = today.with(java.time.temporal.TemporalAdjusters.nextOrSame(java.time.DayOfWeek.SUNDAY));

        long daysInclusive = java.time.temporal.ChronoUnit.DAYS.between(startMonday, endSunday) + 1;
        long weeksCount = daysInclusive / 7;

        if (weeksCount <= 0) {
            return BigDecimal.ZERO;
        }

        // Use remainingBalance (updated after payments) instead of original loanAmount
        BigDecimal principalAmount = transaction.getRemainingBalance() != null
                ? transaction.getRemainingBalance()
                : transaction.getLoanAmount();

        BigDecimal ratePercent = transaction.getInterestRatePercent();
        BigDecimal weeksInYear = BigDecimal.valueOf(52);

        BigDecimal interest = principalAmount
                .multiply(ratePercent)
                .multiply(BigDecimal.valueOf(weeksCount))
                .divide(weeksInYear, 2, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        log.info("Interest calculation for transaction {}: startDate={}, weeksCount={}, principal={}, rate={}%, interest={}",
                transaction.getPawnId(), startDate, weeksCount, principalAmount, ratePercent, interest);

        return interest;
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
