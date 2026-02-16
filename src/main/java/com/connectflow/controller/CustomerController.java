package com.connectflow.controller;

import com.connectflow.dto.CustomerDTO;
import com.connectflow.dto.PageResponse;
import com.connectflow.model.Customer;
import com.connectflow.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
@Tag(name = "Customers", description = "Customer Management APIs")
public class CustomerController {

    private final CustomerService customerService;

    /**
     * Get all active customers with pagination
     */
    @GetMapping
    @Operation(summary = "Get all active customers with pagination")
    public ResponseEntity<PageResponse<CustomerDTO>> getAllCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fullName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        log.info("GET /customers - page: {}, size: {}", page, size);
        PageResponse<Customer> response = customerService.getAllActiveCustomers(page, size, sortBy, sortDir);
        PageResponse<CustomerDTO> dtoResponse = convertPageToDTO(response);
        return ResponseEntity.ok(dtoResponse);
    }

    /**
     * Search customers by NIC or name with pagination
     */
    @GetMapping("/search")
    @Operation(summary = "Search customers by NIC or name with pagination")
    public ResponseEntity<PageResponse<CustomerDTO>> searchCustomers(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fullName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        log.info("GET /customers/search - query: {}, page: {}, size: {}", query, page, size);
        
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        PageResponse<Customer> response = customerService.searchCustomers(query.trim(), page, size, sortBy, sortDir);
        PageResponse<CustomerDTO> dtoResponse = convertPageToDTO(response);
        
        log.info("Found {} customers matching query: {}", response.getTotalElements(), query);
        return ResponseEntity.ok(dtoResponse);
    }

    /**
     * Get customer by NIC
     */
    @GetMapping("/nic/{nic}")
    @Operation(summary = "Get customer by NIC")
    public ResponseEntity<CustomerDTO> getByNic(@PathVariable String nic) {
        log.info("GET /customers/nic/{} - Fetching customer by NIC", nic);
        Optional<Customer> customer = customerService.findByNic(nic);
        return customer.map(c -> ResponseEntity.ok(convertToDTO(c)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Get customer by ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get customer by ID")
    public ResponseEntity<CustomerDTO> getById(@PathVariable UUID id) {
        log.info("GET /customers/{} - Fetching customer by ID", id);
        Optional<Customer> customer = customerService.getById(id);
        return customer.map(c -> ResponseEntity.ok(convertToDTO(c)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Get customers by type with pagination
     */
    @GetMapping("/type/{type}")
    @Operation(summary = "Get customers by type (Regular, VIP, Loyal) with pagination")
    public ResponseEntity<PageResponse<CustomerDTO>> getByType(
            @PathVariable String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fullName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        log.info("GET /customers/type/{} - page: {}, size: {}", type, page, size);
        PageResponse<Customer> response = customerService.getByCustomerType(type, page, size, sortBy, sortDir);
        PageResponse<CustomerDTO> dtoResponse = convertPageToDTO(response);
        return ResponseEntity.ok(dtoResponse);
    }

    /**
     * Check if NIC exists
     */
    @GetMapping("/check-nic/{nic}")
    @Operation(summary = "Check if NIC exists")
    public ResponseEntity<Boolean> checkNicExists(@PathVariable String nic) {
        log.info("GET /customers/check-nic/{} - Checking if NIC exists", nic);
        boolean exists = customerService.existsByNic(nic);
        return ResponseEntity.ok(exists);
    }

    /**
     * Convert Customer to CustomerDTO
     */
    private CustomerDTO convertToDTO(Customer customer) {
        return CustomerDTO.builder()
                .id(customer.getId())
                .fullName(customer.getFullName())
                .nic(customer.getNic())
                .phone(customer.getPhone())
                .address(customer.getAddress())
                .customerType(customer.getCustomerType())
                .isActive(customer.getIsActive())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }

    /**
     * Convert PageResponse<Customer> to PageResponse<CustomerDTO>
     */
    private PageResponse<CustomerDTO> convertPageToDTO(PageResponse<Customer> page) {
        List<CustomerDTO> dtos = page.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return new PageResponse<>(
                dtos,
                page.getPageNumber(),
                page.getPageSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }
}

