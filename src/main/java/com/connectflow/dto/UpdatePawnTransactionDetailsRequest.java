package com.connectflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePawnTransactionDetailsRequest {
    private String customerAddress;
    private String customerPhone;
    private BigDecimal loanAmount;
    private BigDecimal interestRatePercent;
    private Integer periodMonths;
    private LocalDate maturityDate;
}
