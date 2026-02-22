package com.connectflow.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transaction_edit_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionEditHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "transaction_id", nullable = false)
    private UUID transactionId;

    @Column(name = "pawn_id")
    private String pawnId;

    @Column(name = "edited_by", nullable = false)
    private UUID editedBy;

    @Column(name = "edited_by_name")
    private String editedByName;

    @Column(name = "edit_type", nullable = false)
    private String editType; // "STATUS", "DETAILS", "BLOCK", "REMARKS"

    // Previous values
    @Column(name = "previous_status")
    private String previousStatus;

    @Column(name = "previous_address", length = 500)
    private String previousAddress;

    @Column(name = "previous_loan_amount", precision = 12, scale = 2)
    private BigDecimal previousLoanAmount;

    @Column(name = "previous_interest_rate_id")
    private UUID previousInterestRateId;

    @Column(name = "previous_period_months")
    private Integer previousPeriodMonths;

    @Column(name = "previous_maturity_date")
    private LocalDate previousMaturityDate;

    @Column(name = "previous_remarks", length = 1000)
    private String previousRemarks;

    // New values
    @Column(name = "new_status")
    private String newStatus;

    @Column(name = "new_address", length = 500)
    private String newAddress;

    @Column(name = "new_loan_amount", precision = 12, scale = 2)
    private BigDecimal newLoanAmount;

    @Column(name = "new_interest_rate_id")
    private UUID newInterestRateId;

    @Column(name = "new_period_months")
    private Integer newPeriodMonths;

    @Column(name = "new_maturity_date")
    private LocalDate newMaturityDate;

    @Column(name = "new_remarks", length = 1000)
    private String newRemarks;

    @Column(name = "block_reason", length = 1000)
    private String blockReason;

    @Column(name = "police_report_number")
    private String policeReportNumber;

    @Column(name = "police_report_date")
    private LocalDate policeReportDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

