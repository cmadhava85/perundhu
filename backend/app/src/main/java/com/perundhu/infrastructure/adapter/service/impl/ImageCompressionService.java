package com.perundhu.infrastructure.adapter.service.impl;

import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

/**
 * Service for compressing and resizing images to reduce storage and improve upload speed
 * while maintaining OCR quality for Gemini Vision API
 */
@Service
@Slf4j
public class ImageCompressionService {

  private static final int MAX_IMAGE_WIDTH = 1920;
  private static final float JPEG_QUALITY = 0.80f; // 80% quality
  private static final int MAX_DIMENSION = 2560; // Max height or width
  
  /**
   * Compress and resize image to reduce file size while maintaining OCR quality
   * 
   * @param inputStream Original image input stream
   * @param contentType Original image content type (e.g., "image/jpeg")
   * @return Compressed image bytes
   * @throws IOException If image processing fails
   */
  public byte[] compressImage(InputStream inputStream, String contentType) throws IOException {
    try {
      // Read original image
      BufferedImage originalImage = ImageIO.read(inputStream);
      
      if (originalImage == null) {
        log.warn("Could not read image, returning original stream");
        return inputStream.readAllBytes();
      }
      
      // Calculate new dimensions (resize if too large)
      int[] newDimensions = calculateNewDimensions(originalImage.getWidth(), originalImage.getHeight());
      int newWidth = newDimensions[0];
      int newHeight = newDimensions[1];
      
      // Resize if necessary
      BufferedImage processedImage = originalImage;
      if (newWidth != originalImage.getWidth() || newHeight != originalImage.getHeight()) {
        processedImage = resizeImage(originalImage, newWidth, newHeight);
        log.debug("Resized image from {}x{} to {}x{}", 
            originalImage.getWidth(), originalImage.getHeight(), newWidth, newHeight);
      }
      
      // Compress as JPEG with quality setting
      return compressToJpeg(processedImage);
      
    } catch (Exception e) {
      log.error("Error compressing image: {}", e.getMessage());
      throw new IOException("Failed to compress image: " + e.getMessage(), e);
    }
  }
  
  /**
   * Calculate new dimensions while maintaining aspect ratio
   * 
   * @param originalWidth Original image width
   * @param originalHeight Original image height
   * @return Array with [newWidth, newHeight]
   */
  private int[] calculateNewDimensions(int originalWidth, int originalHeight) {
    // If image is within size limits, return original dimensions
    if (originalWidth <= MAX_IMAGE_WIDTH && originalHeight <= MAX_DIMENSION) {
      return new int[]{originalWidth, originalHeight};
    }
    
    // Calculate scaling factor
    float widthRatio = (float) MAX_IMAGE_WIDTH / originalWidth;
    float heightRatio = (float) MAX_DIMENSION / originalHeight;
    float scaleFactor = Math.min(widthRatio, heightRatio);
    
    // Calculate new dimensions maintaining aspect ratio
    int newWidth = Math.round(originalWidth * scaleFactor);
    int newHeight = Math.round(originalHeight * scaleFactor);
    
    // Ensure dimensions are at least 1
    newWidth = Math.max(1, newWidth);
    newHeight = Math.max(1, newHeight);
    
    log.debug("Calculated new dimensions: {}x{} (scale factor: {}, original: {}x{})", 
        newWidth, newHeight, scaleFactor, originalWidth, originalHeight);
    
    return new int[]{newWidth, newHeight};
  }
  
  /**
   * Resize image using high-quality resampling
   * 
   * @param originalImage Original buffered image
   * @param targetWidth Target width
   * @param targetHeight Target height
   * @return Resized buffered image
   */
  private BufferedImage resizeImage(BufferedImage originalImage, int targetWidth, int targetHeight) {
    BufferedImage resizedImage = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
    
    Graphics2D graphics2D = resizedImage.createGraphics();
    graphics2D.drawImage(originalImage, 0, 0, targetWidth, targetHeight, null);
    graphics2D.dispose();
    
    return resizedImage;
  }
  
  /**
   * Compress image to JPEG format with quality setting
   * 
   * @param image Buffered image to compress
   * @return Compressed JPEG bytes
   * @throws IOException If compression fails
   */
  private byte[] compressToJpeg(BufferedImage image) throws IOException {
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    
    // Get JPEG writer
    ImageWriter jpegWriter = ImageIO.getImageWritersByFormatName("jpg").next();
    ImageOutputStream ios = ImageIO.createImageOutputStream(outputStream);
    jpegWriter.setOutput(ios);
    
    // Set compression quality
    ImageWriteParam writeParam = jpegWriter.getDefaultWriteParam();
    writeParam.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
    writeParam.setCompressionType("JPEG");
    writeParam.setCompressionQuality(JPEG_QUALITY);
    
    // Write compressed image
    jpegWriter.write(null, new IIOImage(image, null, null), writeParam);
    jpegWriter.dispose();
    ios.close();
    
    byte[] compressedBytes = outputStream.toByteArray();
    log.debug("Compressed image to {} bytes (quality: {}%)", compressedBytes.length, (int)(JPEG_QUALITY * 100));
    
    return compressedBytes;
  }
  
  /**
   * Get compression statistics for logging
   * 
   * @param originalSize Original file size
   * @param compressedSize Compressed file size
   * @return Compression ratio percentage
   */
  public static float getCompressionRatio(long originalSize, long compressedSize) {
    if (originalSize == 0) return 0;
    return ((originalSize - compressedSize) / (float) originalSize) * 100;
  }
}
