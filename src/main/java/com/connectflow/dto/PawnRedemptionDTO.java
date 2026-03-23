package com.connectflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PawnRedemptionDTO {
    private UUID id;
    private UUID transactionId;
    private String pawnId;
    private BigDecimal redemptionAmount;
    private BigDecimal principalPaid;
    private BigDecimal interestPaid;
    private BigDecimal chargesPaid;
    private BigDecimal remainingPrincipal;
    private BigDecimal remainingInterest;
    private Boolean isFullRedemption;
    private String redemptionType;
    private UUID paidBy;
    private String paidByName;
    private String notes;
    private LocalDateTime createdAt;
}

