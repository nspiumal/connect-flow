package com.connectflow.controller;

import com.connectflow.dto.PageResponse;
import com.connectflow.dto.TransactionProfitDTO;
import com.connectflow.dto.UserDTO;
import com.connectflow.model.UserRole;
import com.connectflow.service.TransactionProfitService;
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
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/profited-transactions")
@RequiredArgsConstructor
@Tag(name = "Profited Transactions", description = "Profited Transaction Management APIs")
public class ProfitedTransactionController {

    private final TransactionProfitService transactionProfitService;
    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get all profited transactions")
    public ResponseEntity<?> getAllProfitedTransactions() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getPrincipal() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String email = authentication.getPrincipal().toString();
            Optional<UserDTO> currentUser = userService.getUserByEmail(email);
            if (currentUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            UserDTO user = currentUser.get();

            if (user.getRole() != UserRole.Role.ADMIN
                    && user.getRole() != UserRole.Role.SUPERADMIN
                    && user.getRole() != UserRole.Role.MANAGER) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only Admin and Manager can view profited transactions"));
            }

            List<TransactionProfitDTO> profits = transactionProfitService.getAllProfitedTransactions();
            return ResponseEntity.ok(profits);
        } catch (Exception e) {
            log.error("Error fetching profited transactions", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/paginated")
    @Operation(summary = "Get profited transactions with pagination")
    public ResponseEntity<?> getProfitedTransactionsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "profitRecordedDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getPrincipal() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String email = authentication.getPrincipal().toString();
            Optional<UserDTO> currentUser = userService.getUserByEmail(email);
            if (currentUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            UserDTO user = currentUser.get();

            if (user.getRole() != UserRole.Role.ADMIN
                    && user.getRole() != UserRole.Role.SUPERADMIN
                    && user.getRole() != UserRole.Role.MANAGER) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only Admin and Manager can view profited transactions"));
            }

            PageResponse<TransactionProfitDTO> response = transactionProfitService.getAllProfitedTransactionsPaginated(
                    page, size, sortBy, sortDir);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching paginated profited transactions", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/search")
    @Operation(summary = "Search profited transactions")
    public ResponseEntity<?> searchProfitedTransactions(
            @RequestParam(required = false) String pawnId,
            @RequestParam(required = false) String customerNic,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "profitRecordedDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getPrincipal() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String email = authentication.getPrincipal().toString();
            Optional<UserDTO> currentUser = userService.getUserByEmail(email);
            if (currentUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            UserDTO user = currentUser.get();

            if (user.getRole() != UserRole.Role.ADMIN
                    && user.getRole() != UserRole.Role.SUPERADMIN
                    && user.getRole() != UserRole.Role.MANAGER) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only Admin and Manager can search profited transactions"));
            }

            PageResponse<TransactionProfitDTO> response = transactionProfitService.searchProfitedTransactions(
                    pawnId, customerNic, page, size, sortBy, sortDir);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error searching profited transactions", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }
}

