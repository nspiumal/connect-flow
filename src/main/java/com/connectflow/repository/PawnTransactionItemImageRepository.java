package com.connectflow.repository;

import com.connectflow.model.PawnTransactionItemImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface PawnTransactionItemImageRepository extends JpaRepository<PawnTransactionItemImage, UUID> {
    List<PawnTransactionItemImage> findByItemIdOrderByImageOrderAsc(UUID itemId);
    List<PawnTransactionItemImage> findByTransactionId(UUID transactionId);
    void deleteByItemId(UUID itemId);
    void deleteByTransactionId(UUID transactionId);
}

