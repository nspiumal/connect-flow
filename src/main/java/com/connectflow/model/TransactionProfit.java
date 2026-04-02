package com.connectflow.model;

import jakarta.persistence.*;
import lombok.*;
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
    @Column(name = "transaction_id", nullable = false, unique = true, columnDefinition = "CHAR(36)")
    private UUID transactionId;

    @Column(name = "profit_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal profitAmount;

    @Column(name = "profit_notes", length = 1000)
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
