package com.connectflow.scheduler;

import com.connectflow.model.PawnTransaction;
import com.connectflow.repository.PawnTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.scheduler.overdue-check.enabled", havingValue = "true", matchIfMissing = true)
public class OverdueScheduler {

    private final PawnTransactionRepository transactionRepository;

    @Scheduled(cron = "${app.scheduler.overdue-check.cron}")
    @Transactional
    public void markOverdueTransactions() {
        LocalDate today = LocalDate.now();
        List<PawnTransaction> overdue = transactionRepository.findActiveOverdue(today);

        if (overdue.isEmpty()) {
            log.debug("Overdue scheduler: no active transactions past maturity date for {}", today);
            return;
        }

        for (PawnTransaction transaction : overdue) {
            transaction.setStatus("Overdue");
        }

        transactionRepository.saveAll(overdue);
        log.info("Overdue scheduler: marked {} transactions as Overdue for {}", overdue.size(), today);
    }
}

