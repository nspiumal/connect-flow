package com.connectflow.repository;

import com.connectflow.model.TransactionProfit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionProfitRepository extends JpaRepository<TransactionProfit, UUID> {
    Optional<TransactionProfit> findByTransactionId(UUID transactionId);
    List<TransactionProfit> findByProfitRecordedBy(UUID userId);
    List<TransactionProfit> findAllByOrderByProfitRecordedDateDesc();
}

