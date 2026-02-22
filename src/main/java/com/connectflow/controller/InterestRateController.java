package com.connectflow.controller;

import com.connectflow.dto.InterestRateDTO;
import com.connectflow.service.InterestRateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/interest-rates")
@RequiredArgsConstructor
@Tag(name = "Interest Rates", description = "Interest Rate Management APIs")
public class InterestRateController {

    private final InterestRateService interestRateService;

    @GetMapping
    @Operation(summary = "Get all interest rates")
    public ResponseEntity<List<InterestRateDTO>> getAllRates() {
        log.info("GET /interest-rates - Fetching all interest rates");
        List<InterestRateDTO> rates = interestRateService.getAllRates();
        log.info("Returning {} interest rates", rates.size());
        return ResponseEntity.ok(rates);
    }

    @GetMapping("/active")
    @Operation(summary = "Get all active interest rates")
    public ResponseEntity<List<InterestRateDTO>> getActiveRates() {
        log.info("GET /interest-rates/active - Fetching active interest rates");
        List<InterestRateDTO> rates = interestRateService.getActiveRates();
        log.info("Returning {} active interest rates", rates.size());
        return ResponseEntity.ok(rates);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get interest rate by ID")
    public ResponseEntity<InterestRateDTO> getRateById(@PathVariable UUID id) {
        log.info("GET /interest-rates/{} - Fetching interest rate", id);
        Optional<InterestRateDTO> rate = interestRateService.getRateById(id);
        return rate.map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }


    @PostMapping
    @Operation(summary = "Create a new interest rate")
    public ResponseEntity<InterestRateDTO> createRate(@RequestBody InterestRateDTO dto) {
        log.info("POST /interest-rates - Creating new interest rate: {}", dto.getName());
        InterestRateDTO created = interestRateService.createRate(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing interest rate")
    public ResponseEntity<InterestRateDTO> updateRate(
            @PathVariable UUID id,
            @RequestBody InterestRateDTO dto) {
        log.info("PUT /interest-rates/{} - Updating interest rate", id);
        try {
            InterestRateDTO updated = interestRateService.updateRate(id, dto);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error updating interest rate: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Toggle active status of an interest rate")
    public ResponseEntity<Void> toggleActive(@PathVariable UUID id) {
        log.info("PATCH /interest-rates/{}/toggle-active - Toggling status", id);
        try {
            interestRateService.toggleActive(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Error toggling interest rate status: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an interest rate")
    public ResponseEntity<Void> deleteRate(@PathVariable UUID id) {
        log.info("DELETE /interest-rates/{} - Deleting interest rate", id);
        interestRateService.deleteRate(id);
        return ResponseEntity.noContent().build();
    }
}

