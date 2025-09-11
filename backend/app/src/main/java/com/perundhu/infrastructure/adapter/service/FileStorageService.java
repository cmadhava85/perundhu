package com.perundhu.infrastructure.adapter.service;

import java.io.InputStream;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service interface for file storage operations
 * Handles secure storage and retrieval of uploaded files
 */
public interface FileStorageService {

  /**
   * Store an uploaded image file
   * 
   * @param imageFile The image file to store
   * @param userId    The ID of the user uploading the file
   * @return The URL or path to the stored file
   */
  String storeImageFile(MultipartFile imageFile, String userId);

  /**
   * Retrieve a stored file as an input stream
   * 
   * @param filePath The path to the stored file
   * @return InputStream for reading the file
   */
  InputStream retrieveFile(String filePath);

  /**
   * Delete a stored file
   * 
   * @param filePath The path to the file to delete
   * @return true if deletion was successful, false otherwise
   */
  boolean deleteFile(String filePath);

  /**
   * Get the full URL for accessing a stored file
   * 
   * @param filePath The relative path to the file
   * @return The full URL for accessing the file
   */
  String getFileUrl(String filePath);

  /**
   * Validate if the uploaded file is a valid image
   * 
   * @param imageFile The file to validate
   * @return true if the file is a valid image, false otherwise
   */
  boolean isValidImageFile(MultipartFile imageFile);

  /**
   * Load file as Resource for serving
   * 
   * @param userId   The user ID who owns the file
   * @param filename The filename to load
   * @return Resource for the file
   */
  Resource loadAsResource(String userId, String filename);
}