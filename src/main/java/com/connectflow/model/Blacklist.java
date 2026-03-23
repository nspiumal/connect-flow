package com.connectflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "blacklist")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Blacklist {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(columnDefinition = "CHAR(36)")
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

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "branch_id", nullable = false, columnDefinition = "CHAR(36)")
    private UUID branchId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "added_by", nullable = false, columnDefinition = "CHAR(36)")
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
