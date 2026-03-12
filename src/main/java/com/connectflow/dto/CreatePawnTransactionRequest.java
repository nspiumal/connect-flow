package com.connectflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePawnTransactionRequest {
    private String customerName;
    private String customerNic;
    private String idType;
    private String gender;
    private String customerAddress;
    private String customerPhone;
    private String customerType;
    private String patternMode;
    private BigDecimal loanAmount;
    private UUID interestRateId;
    private BigDecimal interestRatePercent;
    private BigDecimal firstMonthInterestRatePercent;
    private Integer periodMonths;
    private LocalDate pawnDate;
    private LocalDate maturityDate;
    private String remarks;

    @Builder.Default
    private List<ItemDetailDTO> items = new ArrayList<>(); // Multiple items with their details and images
}
