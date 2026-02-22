package com.connectflow.repository;

import com.connectflow.model.PawnTransactionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface PawnTransactionItemRepository extends JpaRepository<PawnTransactionItem, UUID> {
    List<PawnTransactionItem> findByTransactionIdOrderByItemOrderAsc(UUID transactionId);
    void deleteByTransactionId(UUID transactionId);
}

