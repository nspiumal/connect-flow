package com.connectflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "pawn_transaction_item_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PawnTransactionItemImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "item_id", nullable = false, columnDefinition = "uuid")
    private UUID itemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", insertable = false, updatable = false)
    private PawnTransactionItem item;

    @Column(name = "transaction_id", nullable = false, columnDefinition = "uuid")
    private UUID transactionId;

    @Column(name = "image_url", nullable = false, columnDefinition = "TEXT")
    private String imageUrl; // Base64 encoded image or file path

    @Column(name = "image_order")
    private Integer imageOrder = 0; // Order of image for this item

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

