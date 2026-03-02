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
     * Advanced search customers by NIC and/or phone with pagination
     */
    public PageResponse<Customer> searchAdvanced(String nic, String phone, int page, int size, String sortBy, String sortDir) {
        log.info("Advanced search customers - nic: {}, phone: {}, page: {}, size: {}", nic, phone, page, size);

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Customer> customerPage;

        if (nic != null && !nic.isEmpty() && phone != null && !phone.isEmpty()) {
            // Search by both NIC and phone (AND condition)
            log.info("Searching by both NIC and phone");
            customerPage = customerRepository.findByNicContainingIgnoreCaseAndPhoneContainingIgnoreCase(nic, phone, pageable);
        } else if (nic != null && !nic.isEmpty()) {
            // Search by NIC only
            log.info("Searching by NIC");
            customerPage = customerRepository.findByNicContainingIgnoreCase(nic, pageable);
        } else if (phone != null && !phone.isEmpty()) {
            // Search by phone only
            log.info("Searching by phone");
            customerPage = customerRepository.findByPhoneContainingIgnoreCase(phone, pageable);
        } else {
            // Get all if both are empty (fallback)
            log.info("No filters provided, returning all customers");
            customerPage = customerRepository.findByIsActiveTrue(pageable);
        }

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

