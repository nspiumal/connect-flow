package com.connectflow.repository;

import com.connectflow.model.Blacklist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface BlacklistRepository extends JpaRepository<Blacklist, UUID> {
    List<Blacklist> findByIsActiveTrue();
    List<Blacklist> findByBranchId(UUID branchId);
    List<Blacklist> findByCustomerNic(String customerNic);
    List<Blacklist> findByCustomerNicAndIsActiveTrue(String customerNic);

    // Advanced search method
    Page<Blacklist> findByCustomerNicContainingIgnoreCase(String nic, Pageable pageable);
}

