package com.connectflow.controller;

import com.connectflow.dto.CreatePawnTransactionRequest;
import com.connectflow.dto.PageResponse;
import com.connectflow.dto.PawnTransactionDTO;
import com.connectflow.dto.UserDTO;
import com.connectflow.service.PawnTransactionService;
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
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/pawn-transactions")
@RequiredArgsConstructor
@Tag(name = "Pawn Transactions", description = "Pawn Transaction Management APIs")
public class PawnTransactionController {

    private final PawnTransactionService pawnTransactionService;
    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get all pawn transactions")
    public ResponseEntity<List<PawnTransactionDTO>> getAllTransactions() {
        log.info("GET /pawn-transactions - Fetching all transactions");
        List<PawnTransactionDTO> transactions = pawnTransactionService.getAllTransactions();
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/paginated")
    @Operation(summary = "Get pawn transactions with pagination")
    public ResponseEntity<PageResponse<PawnTransactionDTO>> getTransactionsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "pawnDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        log.info("GET /pawn-transactions/paginated - page: {}, size: {}", page, size);
        PageResponse<PawnTransactionDTO> response = pawnTransactionService.getAllTransactionsPaginated(page, size, sortBy, sortDir);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get transaction by ID")
    public ResponseEntity<PawnTransactionDTO> getTransactionById(@PathVariable UUID id) {
        log.info("GET /pawn-transactions/{}", id);
        Optional<PawnTransactionDTO> transaction = pawnTransactionService.getTransactionById(id);
        return transaction.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/pawn-id/{pawnId}")
    @Operation(summary = "Get transaction by pawn ID")
    public ResponseEntity<PawnTransactionDTO> getTransactionByPawnId(@PathVariable String pawnId) {
        log.info("GET /pawn-transactions/pawn-id/{}", pawnId);
        Optional<PawnTransactionDTO> transaction = pawnTransactionService.getTransactionByPawnId(pawnId);
        return transaction.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/branch/{branchId}")
    @Operation(summary = "Get transactions by branch")
    public ResponseEntity<List<PawnTransactionDTO>> getTransactionsByBranch(@PathVariable UUID branchId) {
        log.info("GET /pawn-transactions/branch/{}", branchId);
        List<PawnTransactionDTO> transactions = pawnTransactionService.getTransactionsByBranch(branchId);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/branch/{branchId}/paginated")
    @Operation(summary = "Get transactions by branch with pagination")
    public ResponseEntity<PageResponse<PawnTransactionDTO>> getTransactionsByBranchPaginated(
            @PathVariable UUID branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "pawnDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        log.info("GET /pawn-transactions/branch/{}/paginated", branchId);
        PageResponse<PawnTransactionDTO> response = pawnTransactionService.getTransactionsByBranchPaginated(
                branchId, page, size, sortBy, sortDir);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get transactions by status")
    public ResponseEntity<PageResponse<PawnTransactionDTO>> getTransactionsByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "pawnDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        log.info("GET /pawn-transactions/status/{}", status);
        PageResponse<PawnTransactionDTO> response = pawnTransactionService.getTransactionsByStatus(
                status, page, size, sortBy, sortDir);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    @Operation(summary = "Search transactions")
    public ResponseEntity<PageResponse<PawnTransactionDTO>> searchTransactions(
            @RequestParam String query,
            @RequestParam(required = false) UUID branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "pawnDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        log.info("GET /pawn-transactions/search - query: {}", query);
        PageResponse<PawnTransactionDTO> response = pawnTransactionService.searchTransactions(
                query, branchId, page, size, sortBy, sortDir);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Operation(summary = "Create new pawn transaction")
    public ResponseEntity<PawnTransactionDTO> createTransaction(@RequestBody CreatePawnTransactionRequest request) {
        log.info("POST /pawn-transactions - Creating new transaction for customer: {}", request.getCustomerName());

        // Get authenticated user from SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            log.error("No authentication found");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getPrincipal().toString();
        log.info("Authenticated user email: {}", email);

        // Get user details including branch_id
        Optional<UserDTO> currentUser = userService.getUserByEmail(email);
        if (currentUser.isEmpty()) {
            log.error("User not found for email: {}", email);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserDTO user = currentUser.get();
        if (user.getBranchId() == null) {
            log.error("User {} does not have a branch assigned", email);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        try {
            PawnTransactionDTO created = pawnTransactionService.createTransaction(
                    request, user.getBranchId(), user.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            log.error("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update transaction status")
    public ResponseEntity<PawnTransactionDTO> updateTransactionStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        log.info("PATCH /pawn-transactions/{}/status", id);
        String status = body.get("status");
        if (status == null) {
            return ResponseEntity.badRequest().build();
        }

        try {
            PawnTransactionDTO updated = pawnTransactionService.updateTransactionStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error updating transaction status: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/remarks")
    @Operation(summary = "Update transaction remarks")
    public ResponseEntity<PawnTransactionDTO> updateTransactionRemarks(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        log.info("PATCH /pawn-transactions/{}/remarks", id);
        String remarks = body.get("remarks");

        try {
            PawnTransactionDTO updated = pawnTransactionService.updateTransactionRemarks(id, remarks);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error updating transaction remarks: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/block-reason")
    @Operation(summary = "Update transaction block reason and add customer to blacklist with optional police report")
    public ResponseEntity<PawnTransactionDTO> updateBlockReason(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        log.info("PATCH /pawn-transactions/{}/block-reason", id);
        String blockReason = (String) body.get("blockReason");
        String policeReportNumber = (String) body.get("policeReportNumber");
        String policeReportDate = (String) body.get("policeReportDate");

        if (blockReason == null || blockReason.trim().isEmpty()) {
            log.error("Block reason is required");
            return ResponseEntity.badRequest().build();
        }

        // Get authenticated user from SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            log.error("No authentication found");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getPrincipal().toString();
        log.info("Authenticated user email: {}", email);

        // Get user details including branch_id
        Optional<UserDTO> currentUser = userService.getUserByEmail(email);
        if (currentUser.isEmpty()) {
            log.error("User not found for email: {}", email);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserDTO user = currentUser.get();
        if (user.getBranchId() == null) {
            log.error("User {} does not have a branch assigned", email);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        try {
            PawnTransactionDTO updated = pawnTransactionService.updateBlockReason(
                    id, blockReason, policeReportNumber, policeReportDate, user.getBranchId(), user.getId());
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error updating transaction block reason: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}

