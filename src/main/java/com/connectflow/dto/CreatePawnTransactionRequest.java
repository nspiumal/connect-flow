package com.connectflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePawnTransactionRequest {
    private String customerName;
    private String customerNic;
    private String customerAddress;
    private String customerPhone;
    private String customerType;
    private String itemDescription;
    private BigDecimal itemWeightGrams;
    private Integer itemKarat;
    private BigDecimal appraisedValue;
    private BigDecimal loanAmount;
    private UUID interestRateId;
    private BigDecimal interestRatePercent;
    private Integer periodMonths;
    private LocalDate pawnDate;
    private LocalDate maturityDate;
    private String remarks;
    private List<String> imageUrls; // Base64 or file URLs
}

