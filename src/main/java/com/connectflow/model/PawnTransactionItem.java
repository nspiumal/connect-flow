package com.connectflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "pawn_transaction_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PawnTransactionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "transaction_id", nullable = false, columnDefinition = "uuid")
    private UUID transactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", insertable = false, updatable = false)
    private PawnTransaction transaction;

    @Column(name = "item_description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "item_content")
    private String content; // Ring, Chain, Bracelet, etc.

    @Column(name = "item_condition")
    private String condition = "Good"; // Excellent, Good, Fair, Poor

    @Column(name = "weight_grams", precision = 10, scale = 2)
    private BigDecimal weightGrams;

    @Column(name = "karat")
    private Integer karat = 24;

    @Column(name = "appraised_value", precision = 18, scale = 2)
    private BigDecimal appraisedValue;

    @Column(name = "item_order")
    private Integer itemOrder = 0; // Order of item in the transaction

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PawnTransactionItemImage> images = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

