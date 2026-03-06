package com.connectflow.service;

import com.connectflow.model.Customer;
import com.connectflow.repository.CustomerRepository;
import com.connectflow.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;

    /**
     * Get all active customers with pagination
     */
    public PageResponse<Customer> getAllActiveCustomers(int page, int size, String sortBy, String sortDir) {
        log.info("Fetching active customers - page: {}, size: {}, sortBy: {}, sortDir: {}", page, size, sortBy, sortDir);

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Customer> customerPage = customerRepository.findByIsActiveTrue(pageable);

        List<Customer> content = customerPage.getContent();

        return new PageResponse<>(
                content,
                customerPage.getNumber(),
                customerPage.getSize(),
                customerPage.getTotalElements(),
                customerPage.getTotalPages(),
                customerPage.isLast()
        );
    }

    /**
     * Search customers by NIC or name with pagination
     */
    public PageResponse<Customer> searchCustomers(String query, int page, int size, String sortBy, String sortDir) {
        log.info("Searching customers - query: {}, page: {}, size: {}", query, page, size);

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        // Try NIC first (exact match)
        Optional<Customer> byNic = customerRepository.findByNic(query);
        if (byNic.isPresent()) {
            List<Customer> content = List.of(byNic.get());
            return new PageResponse<>(
                    content,
                    0,
                    1,
                    1,
                    1,
                    true
            );
        }

        // Then search by name (partial match)
        Page<Customer> customerPage = customerRepository.findByFullNameContainingIgnoreCase(query, pageable);

        List<Customer> content = customerPage.getContent();

        return new PageResponse<>(
                content,
                customerPage.getNumber(),
                customerPage.getSize(),
                customerPage.getTotalElements(),
                customerPage.getTotalPages(),
                customerPage.isLast()
        );
    }


    /**
     * Filter customers by NIC, phone, and/or status with pagination
     * Uses native @Query with optional parameters
     */
    public PageResponse<Customer> filterCustomers(String nic, String phone, String status, int page, int size, String sortBy, String sortDir) {
        log.info("Filtering customers - nic: {}, phone: {}, status: {}, page: {}, size: {}", nic, phone, status, page, size);

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        // Determine isActive status
        Boolean isActive = null;
        if (status != null && !status.isEmpty()) {
            if ("active".equalsIgnoreCase(status)) {
                isActive = true;
            } else if ("inactive".equalsIgnoreCase(status)) {
                isActive = false;
            }
        }

        log.info("Executing filter query with parameters - nic: {}, phone: {}, isActive: {}", nic, phone, isActive);
        Page<Customer> customerPage = customerRepository.filterCustomers(nic, phone, isActive, pageable);

        List<Customer> content = customerPage.getContent();

        return new PageResponse<>(
                content,
                customerPage.getNumber(),
                customerPage.getSize(),
                customerPage.getTotalElements(),
                customerPage.getTotalPages(),
                customerPage.isLast()
        );
    }

    /**
     * Advanced search for customers with optional filters
     * Uses native @Query with optional parameters
     * Follows the same pattern as PawnTransactionService.searchTransactionsAdvanced()
     */
    public PageResponse<Customer> searchCustomersAdvanced(String nic,
                                                          String phone,
                                                          String name,
                                                          String customerType,
                                                          String status,
                                                          int page,
                                                          int size,
                                                          String sortBy,
                                                          String sortDir) {
        // Normalize inputs - trim and convert null/empty to null for cleaner logic
        String normalizedNic = nic != null && !nic.trim().isEmpty() ? nic.trim() : null;
        String normalizedPhone = phone != null && !phone.trim().isEmpty() ? phone.trim() : null;
        String normalizedName = name != null && !name.trim().isEmpty() ? name.trim() : null;
        String normalizedCustomerType = customerType != null && !customerType.trim().isEmpty() ? customerType.trim() : null;
        String normalizedStatus = status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status)
                ? status.trim()
                : null;

        log.info("Advanced search for customers - nic: {}, phone: {}, name: {}, type: {}, status: {}, page: {}, size: {}",
                normalizedNic, normalizedPhone, normalizedName, normalizedCustomerType, normalizedStatus, page, size);

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        // Convert status to boolean
        Boolean isActive = null;
        if (normalizedStatus != null) {
            if ("active".equalsIgnoreCase(normalizedStatus)) {
                isActive = true;
            } else if ("inactive".equalsIgnoreCase(normalizedStatus)) {
                isActive = false;
            }
        }

        log.info("Executing advanced search query - normalized values: nic: {}, phone: {}, name: {}, type: {}, isActive: {}",
                normalizedNic, normalizedPhone, normalizedName, normalizedCustomerType, isActive);

        Page<Customer> customerPage = customerRepository.searchAdvanced(
                normalizedNic,
                normalizedPhone,
                normalizedName,
                normalizedCustomerType,
                isActive,
                pageable
        );

        List<Customer> content = customerPage.getContent();

        log.info("Advanced search completed - found {} customers", customerPage.getTotalElements());

        return new PageResponse<>(
                content,
                customerPage.getNumber(),
                customerPage.getSize(),
                customerPage.getTotalElements(),
                customerPage.getTotalPages(),
                customerPage.isLast()
        );
    }

    /**
     * Get customers by type with pagination
     */
    public PageResponse<Customer> getByCustomerType(String customerType, int page, int size, String sortBy, String sortDir) {
        log.info("Fetching customers by type - type: {}, page: {}, size: {}", customerType, page, size);

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Customer> customerPage = customerRepository.findByCustomerType(customerType, pageable);

        List<Customer> content = customerPage.getContent();

        return new PageResponse<>(
                content,
                customerPage.getNumber(),
                customerPage.getSize(),
                customerPage.getTotalElements(),
                customerPage.getTotalPages(),
                customerPage.isLast()
        );
    }

    /**
     * Get customer by ID
     */
    public Optional<Customer> getById(UUID id) {
        log.info("Fetching customer by ID: {}", id);
        return customerRepository.findById(id);
    }

    /**
     * Check if customer exists by NIC
     */
    public boolean existsByNic(String nic) {
        log.info("Checking if customer exists with NIC: {}", nic);
        return customerRepository.existsByNic(nic);
    }

    /**
     * Find by NIC (non-paginated)
     */
    public Optional<Customer> findByNic(String nic) {
        log.info("Searching customer by NIC: {}", nic);
        return customerRepository.findByNic(nic);
    }
}

