package com.connectflow.controller;

import com.connectflow.dto.OutstandingBalanceDTO;
import com.connectflow.dto.PawnRedemptionDTO;
import com.connectflow.dto.RedemptionRequest;
import com.connectflow.dto.UserDTO;
import com.connectflow.service.PawnRedemptionService;
import com.connectflow.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/pawn-redemptions")
@RequiredArgsConstructor
@Tag(name = "Pawn Redemptions", description = "Pawn Redemption & Payment APIs")
public class PawnRedemptionController {

    private final PawnRedemptionService redemptionService;
    private final UserService userService;

    @GetMapping("/outstanding-balance/{transactionId}")
    @Operation(summary = "Get outstanding balance for a transaction")
    public ResponseEntity<OutstandingBalanceDTO> getOutstandingBalance(@PathVariable UUID transactionId) {
        log.info("GET /pawn-redemptions/outstanding-balance/{}", transactionId);
        return ResponseEntity.ok(redemptionService.getOutstandingBalance(transactionId));
    }

    @PostMapping("/{transactionId}/redeem")
    @Operation(summary = "Process redemption (full or partial)")
    public ResponseEntity<PawnRedemptionDTO> processRedemption(
            @PathVariable UUID transactionId,
            @RequestBody RedemptionRequest request) {
        log.info("POST /pawn-redemptions/{}/redeem - amount: {}", transactionId, request.getRedemptionAmount());

        // Get authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            log.error("No authentication found");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getPrincipal().toString();
        Optional<UserDTO> currentUser = userService.getUserByEmail(email);
        if (currentUser.isEmpty()) {
            log.error("User not found for email: {}", email);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            UserDTO user = currentUser.get();
            PawnRedemptionDTO redemption = redemptionService.processRedemption(
                    transactionId, request, user.getId(), user.getFullName());
            return ResponseEntity.ok(redemption);
        } catch (IllegalArgumentException e) {
            log.error("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error processing redemption: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{transactionId}/history")
    @Operation(summary = "Get redemption history for a transaction")
    public ResponseEntity<List<PawnRedemptionDTO>> getRedemptionHistory(@PathVariable UUID transactionId) {
        log.info("GET /pawn-redemptions/{}/history", transactionId);
        return ResponseEntity.ok(redemptionService.getRedemptionHistory(transactionId));
    }
}

