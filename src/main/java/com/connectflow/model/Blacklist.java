package com.connectflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "blacklist")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Blacklist {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "customer_nic", nullable = false)
    private String customerNic;

    @Column(nullable = false)
    private String reason;

    @Column(name = "police_report_number")
    private String policeReportNumber;

    @Column(name = "police_report_date")
    private LocalDate policeReportDate;

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    @Column(name = "added_by", nullable = false)
    private UUID addedBy;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isActive == null) {
            isActive = true;
        }
    }
}

