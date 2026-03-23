package com.connectflow.repository;

import com.connectflow.model.Customer;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * Specification class for dynamic filtering of customers
 * Uses JPA Specification for flexible, reusable LIKE queries
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class CustomerSpecification {

    /**
     * Build specification for filtering customers by NIC, phone, and/or status
     * Uses LIKE queries for partial matching and AND logic for combined filters
     */
    public static Specification<Customer> filterCustomers(String nic, String phone, Boolean isActive) {
        return (root, query, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.conjunction(); // Start with AND (true condition)

            // Filter by NIC (partial match, case-insensitive)
            if (nic != null && !nic.isEmpty()) {
                predicate = criteriaBuilder.and(
                    predicate,
                    criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("nic")),
                        "%" + nic.toLowerCase() + "%"
                    )
                );
            }

            // Filter by phone (partial match, case-insensitive)
            if (phone != null && !phone.isEmpty()) {
                predicate = criteriaBuilder.and(
                    predicate,
                    criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("phone")),
                        "%" + phone.toLowerCase() + "%"
                    )
                );
            }

            // Filter by status (exact match)
            if (isActive != null) {
                predicate = criteriaBuilder.and(
                    predicate,
                    criteriaBuilder.equal(root.get("isActive"), isActive)
                );
            } else {
                // If no status filter, default to active customers
                predicate = criteriaBuilder.and(
                    predicate,
                    criteriaBuilder.equal(root.get("isActive"), true)
                );
            }

            return predicate;
        };
    }

    /**
     * Advanced search specification for customers with optional filters
     * Similar to PawnTransactionService.searchTransactionsAdvanced() pattern
     * Supports filtering by: NIC, phone, name, customerType, and status
     */
    public static Specification<Customer> searchAdvanced(String nic,
                                                         String phone,
                                                         String name,
                                                         String customerType,
                                                         Boolean isActive) {
        return (root, query, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.conjunction(); // Start with AND (true condition)

            // Filter by NIC (partial match, case-insensitive)
            if (nic != null && !nic.isEmpty()) {
                predicate = criteriaBuilder.and(
                    predicate,
                    criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("nic")),
                        "%" + nic.toLowerCase() + "%"
                    )
                );
            }

            // Filter by phone (partial match, case-insensitive)
            if (phone != null && !phone.isEmpty()) {
                predicate = criteriaBuilder.and(
                    predicate,
                    criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("phone")),
                        "%" + phone.toLowerCase() + "%"
                    )
                );
            }

            // Filter by name (partial match, case-insensitive)
            if (name != null && !name.isEmpty()) {
                predicate = criteriaBuilder.and(
                    predicate,
                    criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("fullName")),
                        "%" + name.toLowerCase() + "%"
                    )
                );
            }

            // Filter by customer type (exact match, case-insensitive)
            if (customerType != null && !customerType.isEmpty()) {
                predicate = criteriaBuilder.and(
                    predicate,
                    criteriaBuilder.equal(
                        criteriaBuilder.lower(root.get("customerType")),
                        customerType.toLowerCase()
                    )
                );
            }

            // Filter by status (exact match)
            if (isActive != null) {
                predicate = criteriaBuilder.and(
                    predicate,
                    criteriaBuilder.equal(root.get("isActive"), isActive)
                );
            } else {
                // If no status filter, default to active customers
                predicate = criteriaBuilder.and(
                    predicate,
                    criteriaBuilder.equal(root.get("isActive"), true)
                );
            }

            return predicate;
        };
    }
}

