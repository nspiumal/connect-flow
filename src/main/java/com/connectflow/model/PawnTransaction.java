package com.connectflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "pawn_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PawnTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "pawn_id", nullable = false, unique = true)
    private String pawnId;

    @Column(name = "branch_id", nullable = false, columnDefinition = "uuid")
    private UUID branchId;

    @Column(name = "customer_id", nullable = false, columnDefinition = "uuid")
    private UUID customerId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", insertable = false, updatable = false)
    private Customer customer;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "customer_nic", nullable = false)
    private String customerNic;

    @Column(name = "id_type")
    private String idType = "NIC";

    @Column(name = "gender")
    private String gender;

    @Column(name = "customer_address", nullable = false)
    private String customerAddress;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "customer_type", nullable = false)
    private String customerType = "Regular";

    @Column(name = "loan_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal loanAmount;

    @Column(name = "interest_rate_id", columnDefinition = "uuid")
    private UUID interestRateId;

    @Column(name = "interest_rate_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal interestRatePercent;

    @Column(name = "period_months", nullable = false)
    private Integer periodMonths = 6;

    @Column(name = "pawn_date", nullable = false)
    private LocalDate pawnDate;

    @Column(name = "maturity_date", nullable = false)
    private LocalDate maturityDate;

    @Column(nullable = false)
    private String status = "Active";

    @Column(columnDefinition = "TEXT")
    private String remarks;

    // Multiple items relationship (stores all item details)
    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PawnTransactionItem> items = new ArrayList<>();

    @Column(name = "created_by", nullable = false, columnDefinition = "uuid")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (pawnDate == null) {
            pawnDate = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

