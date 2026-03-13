package com.connectflow.controller;

import com.connectflow.dto.PageResponse;
import com.connectflow.model.ActivityLogEntry;
import com.connectflow.repository.ActivityLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/activity-logs")
@RequiredArgsConstructor
@Tag(name = "Activity Logs", description = "Activity Log APIs")
public class ActivityLogController {

    private final ActivityLogRepository activityLogRepository;

    @GetMapping
    @Operation(summary = "Get activity logs with optional filters (userName, action)")
    public ResponseEntity<PageResponse<ActivityLogEntry>> getActivityLogs(
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("GET /activity-logs - userName={}, action={}, page={}, size={}", userName, action, page, size);

        Page<ActivityLogEntry> result = activityLogRepository.search(
                (userName != null && !userName.isBlank()) ? userName : null,
                (action   != null && !action.isBlank())   ? action   : null,
                PageRequest.of(page, size)
        );

        PageResponse<ActivityLogEntry> response = new PageResponse<>(
                result.getContent(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isLast()
        );
        return ResponseEntity.ok(response);
    }
}

