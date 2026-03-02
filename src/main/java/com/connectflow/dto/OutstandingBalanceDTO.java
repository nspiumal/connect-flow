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
public class OutstandingBalanceDTO {
    private BigDecimal principal;
    private BigDecimal accrualInterest;
    private BigDecimal charges;
    private BigDecimal total;
    private String loanStatus;
    private BigDecimal ratePercent;
    private String rateName;
    private LocalDate pawnDate;
    private LocalDate maturityDate;
}

