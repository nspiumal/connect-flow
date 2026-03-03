package com.connectflow.controller;

import com.connectflow.dto.BlacklistDTO;
import com.connectflow.dto.NicVerificationResponseDTO;
import com.connectflow.dto.PageResponse;
import com.connectflow.dto.UserDTO;
import com.connectflow.service.BlacklistService;
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
@RequestMapping("/blacklist")
@RequiredArgsConstructor
@Tag(name = "Blacklist", description = "Blacklist Management APIs")
public class BlacklistController {

    private final BlacklistService blacklistService;
    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get all blacklisted customers")
    public ResponseEntity<List<BlacklistDTO>> getAllBlacklisted() {
        log.info("GET /blacklist - Fetching all blacklisted customers");
        List<BlacklistDTO> blacklist = blacklistService.getAllBlacklisted();
        log.info("Returning {} blacklisted customers", blacklist.size());
        return ResponseEntity.ok(blacklist);
    }

    @GetMapping("/paginated")
    @Operation(summary = "Get all blacklisted customers with pagination")
    public ResponseEntity<PageResponse<BlacklistDTO>> getAllBlacklistedPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        log.info("GET /blacklist/paginated - page: {}, size: {}, sortBy: {}, sortDir: {}", page, size, sortBy, sortDir);
        PageResponse<BlacklistDTO> response = blacklistService.getAllBlacklistedPaginated(page, size, sortBy, sortDir);
        log.info("Returning {} blacklisted customers (page {} of {})", response.getContent().size(), page + 1, response.getTotalPages());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/active")
    @Operation(summary = "Get all active blacklisted customers")
    public ResponseEntity<List<BlacklistDTO>> getActiveBlacklisted() {
        log.info("GET /blacklist/active - Fetching active blacklisted customers");
        List<BlacklistDTO> blacklist = blacklistService.getActiveBlacklisted();
        log.info("Returning {} active blacklisted customers", blacklist.size());
        return ResponseEntity.ok(blacklist);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get blacklist entry by ID")
    public ResponseEntity<BlacklistDTO> getById(@PathVariable UUID id) {
        log.info("GET /blacklist/{} - Fetching blacklist entry", id);
        Optional<BlacklistDTO> blacklist = blacklistService.getById(id);
        return blacklist.map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/branch/{branchId}")
    @Operation(summary = "Get blacklisted customers by branch")
    public ResponseEntity<List<BlacklistDTO>> getByBranch(@PathVariable UUID branchId) {
        log.info("GET /blacklist/branch/{} - Fetching blacklisted customers", branchId);
        List<BlacklistDTO> blacklist = blacklistService.getByBranch(branchId);
        return ResponseEntity.ok(blacklist);
    }

    @GetMapping("/check/{nic}")
    @Operation(summary = "Check if NIC is blacklisted")
    public ResponseEntity<List<BlacklistDTO>> checkByNic(@PathVariable String nic) {
        log.info("GET /blacklist/check/{} - Checking NIC", nic);
        List<BlacklistDTO> blacklist = blacklistService.checkByNic(nic);
        return ResponseEntity.ok(blacklist);
    }

    @GetMapping("/verify/{nic}")
    @Operation(summary = "Verify NIC - Check blocklist and fetch customer data in one call")
    public ResponseEntity<NicVerificationResponseDTO> verifyNic(@PathVariable String nic) {
        log.info("GET /blacklist/verify/{} - Verifying NIC and checking blocklist", nic);

        if (nic == null || nic.trim().isEmpty()) {
            log.warn("Empty NIC provided for verification");
            return ResponseEntity.badRequest().build();
        }

        try {
            NicVerificationResponseDTO response = blacklistService.verifyNic(nic.trim());
            log.info("NIC verification result - Blocked: {}, Customer exists: {}",
                response.getIsBlocked(), response.getCustomer() != null);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error verifying NIC: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    @Operation(summary = "Search blacklisted customers by NIC with pagination")
    public ResponseEntity<PageResponse<BlacklistDTO>> searchByNic(
            @RequestParam String nic,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        log.info("GET /blacklist/search - nic: {}, page: {}, size: {}, sortBy: {}, sortDir: {}", nic, page, size, sortBy, sortDir);

        if (nic == null || nic.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        PageResponse<BlacklistDTO> response = blacklistService.searchByNic(nic.trim(), page, size, sortBy, sortDir);
        log.info("Found {} blacklist entries matching NIC: {}", response.getTotalElements(), nic);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Operation(summary = "Add customer to blacklist")
    public ResponseEntity<BlacklistDTO> addToBlacklist(@RequestBody BlacklistDTO dto) {
        log.info("POST /blacklist - Adding customer to blacklist: {}", dto.getCustomerName());

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

        // Set branch_id and addedBy from authenticated user
        dto.setBranchId(user.getBranchId());
        dto.setAddedBy(user.getId());

        log.info("Adding to blacklist - Branch: {}, Added by: {}", user.getBranchId(), user.getId());
        BlacklistDTO created = blacklistService.addToBlacklist(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update blacklist entry")
    public ResponseEntity<BlacklistDTO> updateBlacklist(
            @PathVariable UUID id,
            @RequestBody BlacklistDTO dto) {
        log.info("PUT /blacklist/{} - Updating blacklist entry", id);
        try {
            BlacklistDTO updated = blacklistService.updateBlacklist(id, dto);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error updating blacklist entry: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Toggle active status of blacklist entry")
    public ResponseEntity<Void> toggleActive(@PathVariable UUID id) {
        log.info("PATCH /blacklist/{}/toggle-active - Toggling status", id);
        try {
            blacklistService.toggleActive(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Error toggling blacklist status: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete blacklist entry")
    public ResponseEntity<Void> deleteBlacklist(@PathVariable UUID id) {
        log.info("DELETE /blacklist/{} - Deleting blacklist entry", id);
        blacklistService.deleteBlacklist(id);
        return ResponseEntity.noContent().build();
    }
}

