package com.perundhu.domain.port;

import java.io.IOException;
import java.util.List;

import com.perundhu.domain.model.FileResource;
import com.perundhu.domain.model.FileUpload;

/**
 * File storage service interface for handling image uploads and storage
 */
public interface FileStorageService {

    /**
     * Store an image file and return its URL
     */
    String storeImageFile(FileUpload file, String userId) throws IOException;

    /**
     * Store an image file with custom filename and return its URL
     */
    String storeImageFile(FileUpload file, String userId, String customFilename) throws IOException;

    /**
     * Get the file system path for an image URL
     */
    String getImagePath(String imageUrl);

    /**
     * Delete an image file
     */
    boolean deleteImageFile(String imageUrl);

    /**
     * Check if an image file is valid
     */
    boolean isValidImageFile(FileUpload file);

    /**
     * Get maximum allowed file size
     */
    long getMaxFileSize();

    /**
     * Get list of supported image formats
     */
    List<String> getSupportedFormats();

    /**
     * Generate a secure filename for uploaded files
     */
    String generateSecureFilename(String originalFilename, String userId);

    /**
     * Check if an image exists
     */
    boolean imageExists(String imageUrl);

    /**
     * Get file size of an image
     */
    long getFileSize(String imageUrl);

    /**
     * Load file as FileResource for serving
     * 
     * @param userId   The user ID who owns the file
     * @param filename The filename to load
     * @return FileResource for the file
     */
    FileResource loadAsResource(String userId, String filename);
}