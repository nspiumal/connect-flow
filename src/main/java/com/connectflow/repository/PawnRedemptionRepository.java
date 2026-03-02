package com.connectflow.repository;

import com.connectflow.model.PawnRedemption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PawnRedemptionRepository extends JpaRepository<PawnRedemption, UUID> {

    List<PawnRedemption> findByTransactionIdOrderByCreatedAtDesc(UUID transactionId);

    List<PawnRedemption> findByPawnIdOrderByCreatedAtDesc(String pawnId);
}

