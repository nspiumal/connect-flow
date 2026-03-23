package com.connectflow.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
@RequiredArgsConstructor
@Tag(name = "Health", description = "Application Health Check")
public class HealthController {

    @Value("${spring.application.name}")
    private String appName;

    @Value("${app.version}")
    private String appVersion;

    @GetMapping
    @Operation(summary = "Health check endpoint")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("application", appName);
        response.put("version", appVersion);
        response.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/info")
    @Operation(summary = "Get application info")
    public ResponseEntity<Map<String, String>> getInfo() {
        Map<String, String> info = new HashMap<>();
        info.put("name", appName);
        info.put("version", appVersion);
        info.put("description", "Gold Pawn Management System - REST API");

        return ResponseEntity.ok(info);
    }
}

