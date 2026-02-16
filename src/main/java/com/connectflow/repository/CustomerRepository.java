package com.connectflow.repository;

import com.connectflow.model.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Optional<Customer> findByNic(String nic);
    boolean existsByNic(String nic);
    List<Customer> findByIsActiveTrue();
    Page<Customer> findByIsActiveTrue(Pageable pageable);
    List<Customer> findByCustomerType(String customerType);
    Page<Customer> findByCustomerType(String customerType, Pageable pageable);
    List<Customer> findByFullNameContainingIgnoreCase(String name);
    Page<Customer> findByFullNameContainingIgnoreCase(String name, Pageable pageable);
}

