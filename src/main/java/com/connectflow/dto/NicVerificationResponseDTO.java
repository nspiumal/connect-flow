package com.connectflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for NIC Verification Response
 * Combines blocklist check and customer data lookup
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NicVerificationResponseDTO {
    private Boolean isBlocked;
    private String blocklistReason;
    private CustomerDTO customer; // null if customer doesn't exist
    private String message;
}
