package com.connectflow.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@RestController
@RequestMapping("/images")
public class ImageServeController {

    /**
     * Serve image files from uploads directory
     * URL: /images/pawn-transactions/filename.jpg
     */
    @GetMapping("/**")
    public ResponseEntity<Resource> serveImage(
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            // Extract the path after /images/
            String requestPath = request.getRequestURI();
            String imagePath = requestPath.replaceFirst(".*/images", "").replaceFirst("^/", "");

            log.info("Serving image request: {}", imagePath);

            // Security: prevent directory traversal
            if (imagePath.contains("..") || imagePath.startsWith("/")) {
                log.warn("Blocked suspicious path: {}", imagePath);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // Construct full file path
            String projectRoot = System.getProperty("user.dir");
            Path filePath = Paths.get(projectRoot, "uploads", imagePath);

            log.debug("Looking for file at: {}", filePath);

            File file = filePath.toFile();
            if (!file.exists()) {
                log.warn("File not found: {}", filePath);
                return ResponseEntity.notFound().build();
            }

            if (!file.isFile()) {
                log.warn("Path is not a file: {}", filePath);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            // Determine media type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = MediaType.IMAGE_JPEG_VALUE; // Default to JPEG
            }

            log.info("✅ Serving file: {} (type: {}, size: {})", filePath, contentType, file.length());

            Resource resource = new FileSystemResource(file);
            return ResponseEntity
                    .ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .contentLength(file.length())
                    .body(resource);

        } catch (Exception e) {
            log.error("Error serving image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}



