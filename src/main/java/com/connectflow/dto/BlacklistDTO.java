package com.connectflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlacklistDTO {
    private UUID id;
    private String customerName;
    private String customerNic;
    private String reason;
    private String policeReportNumber;
    private LocalDate policeReportDate;
    private UUID branchId;
    private String branchName;
    private UUID addedBy;
    private String addedByName;
    private Boolean isActive;
    private LocalDateTime createdAt;
}

