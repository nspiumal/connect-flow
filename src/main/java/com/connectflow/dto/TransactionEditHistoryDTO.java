package com.connectflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionEditHistoryDTO {
    private UUID id;
    private UUID transactionId;
    private String pawnId;
    private UUID editedBy;
    private String editedByName;
    private String editType;

    private String previousStatus;
    private String previousAddress;
    private String previousPhone;
    private BigDecimal previousLoanAmount;
    private UUID previousInterestRateId;
    private Integer previousPeriodMonths;
    private LocalDate previousMaturityDate;
    private String previousRemarks;

    private String newStatus;
    private String newAddress;
    private String newPhone;
    private BigDecimal newLoanAmount;
    private UUID newInterestRateId;
    private Integer newPeriodMonths;
    private LocalDate newMaturityDate;
    private String newRemarks;

    private String blockReason;
    private String policeReportNumber;
    private LocalDate policeReportDate;

    private LocalDateTime createdAt;
}
