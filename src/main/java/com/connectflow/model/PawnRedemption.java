package com.connectflow.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "pawn_redemptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PawnRedemption {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(columnDefinition = "CHAR(36)")
    private UUID id;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "transaction_id", nullable = false, columnDefinition = "CHAR(36)")
    private UUID transactionId;

    @Column(name = "pawn_id", nullable = false)
    private String pawnId;

    @Column(name = "redemption_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal redemptionAmount;

    @Column(name = "principal_paid", precision = 12, scale = 2)
    private BigDecimal principalPaid;

    @Column(name = "interest_paid", precision = 12, scale = 2)
    private BigDecimal interestPaid;

    @Column(name = "charges_paid", precision = 12, scale = 2)
    private BigDecimal chargesPaid;

    @Column(name = "remaining_principal", precision = 12, scale = 2)
    private BigDecimal remainingPrincipal;

    @Column(name = "remaining_interest", precision = 12, scale = 2)
    private BigDecimal remainingInterest;

    @Column(name = "is_full_redemption", nullable = false)
    private Boolean isFullRedemption;

    @Column(name = "redemption_type")
    private String redemptionType; // FULL, PARTIAL

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "paid_by", nullable = false, columnDefinition = "CHAR(36)")
    private UUID paidBy;

    @Column(name = "paid_by_name")
    private String paidByName;

    @Column(name = "notes", length = 1000)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
