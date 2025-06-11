package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Service for managing image uploads to cloud storage
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CloudStorageService {

    // For demo purposes, we'll just store images locally
    // In production, this would use a cloud storage provider
    private final Path uploadDirectory = Paths.get(System.getProperty("user.home"), "perundhu_uploads");

    /**
     * Upload an image and return its URL
     * 
     * @param file The image file to upload
     * @return The URL (or path) of the uploaded image
     * @throws IOException If file operations fail
     */
    public String uploadImage(MultipartFile file) throws IOException {
        // Create upload directory if it doesn't exist
        if (!Files.exists(uploadDirectory)) {
            Files.createDirectories(uploadDirectory);
        }
        
        // Generate a unique name for the file
        String fileName = UUID.randomUUID().toString();
        if (file.getOriginalFilename() != null) {
            String extension = getFileExtension(file.getOriginalFilename());
            fileName += extension;
        }
        
        // Save the file
        Path targetPath = uploadDirectory.resolve(fileName);
        Files.copy(file.getInputStream(), targetPath);
        
        log.info("Saved image to: {}", targetPath.toString());
        
        // Return the file path (in a real app, this would be a URL)
        return targetPath.toString();
    }
    
    /**
     * Extract the file extension from a filename
     * 
     * @param fileName The original filename
     * @return The file extension (including the dot) or empty string
     */
    private String getFileExtension(String fileName) {
        int lastDotPos = fileName.lastIndexOf('.');
        if (lastDotPos > 0) {
            return fileName.substring(lastDotPos);
        }
        return "";
    }
}