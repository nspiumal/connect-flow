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
public class TransactionProfitDTO {
    private UUID id;
    private UUID transactionId;
    private String pawnId;
    private String customerName;
    private String customerNic;
    private BigDecimal profitAmount;
    private String profitNotes;
    private LocalDateTime profitRecordedDate;
    private UUID profitRecordedBy;
    private String recordedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

