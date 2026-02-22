package com.connectflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PawnTransactionDTO {
    private UUID id;
    private String pawnId;
    private UUID branchId;
    private String branchName;
    private String customerName;
    private String customerNic;
    private String idType;
    private String gender;
    private String customerAddress;
    private String customerPhone;
    private String customerType;
    private BigDecimal loanAmount;
    private UUID interestRateId;
    private String interestRateName;
    private BigDecimal interestRatePercent;
    private Integer periodMonths;
    private LocalDate pawnDate;
    private LocalDate maturityDate;
    private String status;
    private String remarks;
    private List<ItemDetailDTO> itemDetails; // Item details from PawnTransactionItem
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

