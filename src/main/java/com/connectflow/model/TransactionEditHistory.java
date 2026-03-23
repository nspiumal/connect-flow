package com.connectflow.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(columnDefinition = "CHAR(36)")
    private UUID id;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "transaction_id", nullable = false, columnDefinition = "CHAR(36)")
    private UUID transactionId;

    @Column(name = "pawn_id")
    private String pawnId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "edited_by", nullable = false, columnDefinition = "CHAR(36)")
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

    @Column(name = "previous_phone")
    private String previousPhone;

    @Column(name = "previous_loan_amount", precision = 12, scale = 2)
    private BigDecimal previousLoanAmount;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "previous_interest_rate_id", columnDefinition = "CHAR(36)")
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

    @Column(name = "new_phone")
    private String newPhone;

    @Column(name = "new_loan_amount", precision = 12, scale = 2)
    private BigDecimal newLoanAmount;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "new_interest_rate_id", columnDefinition = "CHAR(36)")
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
