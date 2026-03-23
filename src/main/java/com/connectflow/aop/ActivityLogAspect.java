package com.connectflow.aop;

import com.connectflow.model.ActivityLogEntry;
import com.connectflow.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Intercepts controller methods annotated with @ActivityLog and persists
 * an activity record asynchronously via ActivityLogWriter.
 *
 * Security context and HTTP request data are captured on the request thread
 * before delegating the save to an async thread — safe with Spring's default
 * MODE_THREADLOCAL.
 */
@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class ActivityLogAspect {

    private final UserRepository userRepository;
    private final ActivityLogWriter activityLogWriter;

    @Around("@annotation(activityLog)")
    public Object logActivity(ProceedingJoinPoint joinPoint, ActivityLog activityLog) throws Throwable {

        // ── Capture security context (request thread) ──────────────────────────
        String userEmail = null;
        String userName  = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            userEmail = auth.getName();
            final String email = userEmail;
            userName = userRepository.findByEmail(email)
                    .map(u -> u.getFullName())
                    .orElse(email);
        }

        // ── Capture HTTP context (request thread) ──────────────────────────────
        String httpMethod = null;
        String endpoint   = null;
        String ipAddress  = null;
        ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest req = attrs.getRequest();
            httpMethod = req.getMethod();
            endpoint   = req.getRequestURI();
            ipAddress  = resolveClientIp(req);
        }

        // ── Proceed ────────────────────────────────────────────────────────────
        String status       = "SUCCESS";
        String errorMessage = null;
        try {
            return joinPoint.proceed();
        } catch (Throwable t) {
            status       = "FAILURE";
            errorMessage = t.getMessage();
            throw t;
        } finally {
            // Build and async-save — does not block response
            ActivityLogEntry entry = ActivityLogEntry.builder()
                    .userName(userName)
                    .userEmail(userEmail)
                    .action(activityLog.action())
                    .description(activityLog.description())
                    .httpMethod(httpMethod)
                    .endpoint(endpoint)
                    .ipAddress(ipAddress)
                    .status(status)
                    .errorMessage(errorMessage)
                    .build();
            activityLogWriter.save(entry);
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // X-Forwarded-For can be a comma-separated list; take the first
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}

