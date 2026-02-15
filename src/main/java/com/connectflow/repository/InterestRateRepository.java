package com.connectflow.repository;

import com.connectflow.model.InterestRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface InterestRateRepository extends JpaRepository<InterestRate, UUID> {
    List<InterestRate> findByIsActiveTrue();
    List<InterestRate> findByCustomerType(String customerType);
    List<InterestRate> findByCustomerTypeAndIsActiveTrue(String customerType);
    List<InterestRate> findByPeriodMonths(Integer periodMonths);
}

