package com.connectflow.repository;

import com.connectflow.model.TransactionEditHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionEditHistoryRepository extends JpaRepository<TransactionEditHistory, UUID> {

    List<TransactionEditHistory> findByTransactionIdOrderByCreatedAtDesc(UUID transactionId);

    Page<TransactionEditHistory> findByTransactionIdOrderByCreatedAtDesc(UUID transactionId, Pageable pageable);

    List<TransactionEditHistory> findByEditedByOrderByCreatedAtDesc(UUID editedBy);
}

