package com.connectflow.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageUploadService {

    @Value("${app.upload.dir:./uploads/pawn-transactions}")
    private String uploadDir;

    /**
     * Upload a single image file
     */
    public String uploadImage(MultipartFile file, String transactionId) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File must be an image");
        }

        // Create directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            log.info("Created upload directory: {}", uploadPath);
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = transactionId + "_" + UUID.randomUUID() + fileExtension;

        // Save file
        Path filePath = uploadPath.resolve(filename);
        Files.write(filePath, file.getBytes());
        log.info("Uploaded image: {} to {}", filename, filePath);

        // Return file path/URL
        return "/uploads/pawn-transactions/" + filename;
    }

    /**
     * Upload multiple images
     */
    public List<String> uploadImages(List<MultipartFile> files, String transactionId) throws IOException {
        List<String> uploadedUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            String url = uploadImage(file, transactionId);
            uploadedUrls.add(url);
        }
        return uploadedUrls;
    }

    /**
     * Delete an image file
     */
    public void deleteImage(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith("/uploads/")) {
            return;
        }

        try {
            String filename = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
            Path filePath = Paths.get(uploadDir).resolve(filename);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Deleted image: {}", filename);
            }
        } catch (IOException e) {
            log.error("Failed to delete image: {}", imageUrl, e);
        }
    }

    /**
     * Get upload directory
     */
    public String getUploadDir() {
        return uploadDir;
    }
}

