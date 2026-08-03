package com.connectflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transaction_profits")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionProfit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(columnDefinition = "CHAR(36)")
    private UUID id;

    @JdbcTypeCode(SqlTypes.CHAR)
    // Uniqueness (one profit per transaction) is enforced in TransactionProfitService,
    // matching backend/src/model/TransactionProfit.js — no DB-level unique constraint,
    // so ddl-auto=update won't try to add an index to the live shared schema.
    @Column(name = "transaction_id", nullable = false, columnDefinition = "CHAR(36)")
    private UUID transactionId;

    @Column(name = "pawn_id")
    private String pawnId;

    @Column(name = "profit_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal profitAmount;

    @Column(name = "profit_notes", columnDefinition = "TEXT")
    private String profitNotes;

    @Column(name = "profit_recorded_date", nullable = false)
    private LocalDateTime profitRecordedDate;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "profit_recorded_by", nullable = false, columnDefinition = "CHAR(36)")
    private UUID profitRecordedBy;

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
