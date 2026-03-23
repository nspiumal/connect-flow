package com.connectflow.aop;

import com.connectflow.model.ActivityLogEntry;
import com.connectflow.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Thin async writer — not a service layer bean.
 * Called from ActivityLogAspect to persist log entries without blocking the HTTP response.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ActivityLogWriter {

    private final ActivityLogRepository activityLogRepository;

    @Async
    public void save(ActivityLogEntry entry) {
        try {
            activityLogRepository.save(entry);
        } catch (Exception e) {
            log.error("Failed to persist activity log: action={}, user={}, error={}",
                    entry.getAction(), entry.getUserEmail(), e.getMessage());
        }
    }
}

