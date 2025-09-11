package com.perundhu.application.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service for encrypting/decrypting sensitive route data
 * Protects route details, schedules, and user data from unauthorized access
 */
@Service
public class DataEncryptionService {

  private static final Logger logger = LoggerFactory.getLogger(DataEncryptionService.class);

  private static final String ALGORITHM = "AES";
  private static final String TRANSFORMATION = "AES/CBC/PKCS5Padding";
  private static final int KEY_LENGTH = 256;
  private static final int IV_LENGTH = 16;

  private final SecretKey masterKey;
  private final boolean encryptionEnabled;
  private final ConcurrentHashMap<String, String> encryptionCache = new ConcurrentHashMap<>();

  public DataEncryptionService(
      @Value("${security.data.encryption.enabled:true}") boolean encryptionEnabled,
      @Value("${security.data.encryption.key:}") String masterKeyString) {

    this.encryptionEnabled = encryptionEnabled;

    if (encryptionEnabled) {
      this.masterKey = initializeMasterKey(masterKeyString);
      logger.info("Data encryption service initialized with encryption enabled");
    } else {
      this.masterKey = null;
      logger.warn("Data encryption service initialized with encryption DISABLED - NOT for production!");
    }
  }

  /**
   * Encrypt sensitive route data
   */
  public String encryptRouteData(String routeData) {
    if (!encryptionEnabled || routeData == null || routeData.isEmpty()) {
      return routeData;
    }

    try {
      // Check cache first
      String cacheKey = generateCacheKey(routeData);
      String cached = encryptionCache.get(cacheKey);
      if (cached != null) {
        return cached;
      }

      // Generate random IV for each encryption
      byte[] iv = generateRandomIV();

      Cipher cipher = Cipher.getInstance(TRANSFORMATION);
      cipher.init(Cipher.ENCRYPT_MODE, masterKey, new IvParameterSpec(iv));

      byte[] encryptedData = cipher.doFinal(routeData.getBytes());

      // Combine IV and encrypted data
      byte[] combined = new byte[IV_LENGTH + encryptedData.length];
      System.arraycopy(iv, 0, combined, 0, IV_LENGTH);
      System.arraycopy(encryptedData, 0, combined, IV_LENGTH, encryptedData.length);

      String encrypted = Base64.getEncoder().encodeToString(combined);

      // Cache the result (with size limit)
      if (encryptionCache.size() < 1000) {
        encryptionCache.put(cacheKey, encrypted);
      }

      return encrypted;

    } catch (Exception e) {
      logger.error("Failed to encrypt route data", e);
      throw new SecurityException("Data encryption failed", e);
    }
  }

  /**
   * Decrypt sensitive route data
   */
  public String decryptRouteData(String encryptedData) {
    if (!encryptionEnabled || encryptedData == null || encryptedData.isEmpty()) {
      return encryptedData;
    }

    try {
      byte[] combined = Base64.getDecoder().decode(encryptedData);

      if (combined.length < IV_LENGTH) {
        throw new IllegalArgumentException("Invalid encrypted data format");
      }

      // Extract IV and encrypted data
      byte[] iv = new byte[IV_LENGTH];
      byte[] encrypted = new byte[combined.length - IV_LENGTH];
      System.arraycopy(combined, 0, iv, 0, IV_LENGTH);
      System.arraycopy(combined, IV_LENGTH, encrypted, 0, encrypted.length);

      Cipher cipher = Cipher.getInstance(TRANSFORMATION);
      cipher.init(Cipher.DECRYPT_MODE, masterKey, new IvParameterSpec(iv));

      byte[] decryptedData = cipher.doFinal(encrypted);
      return new String(decryptedData);

    } catch (Exception e) {
      logger.error("Failed to decrypt route data", e);
      throw new SecurityException("Data decryption failed", e);
    }
  }

  /**
   * Encrypt sensitive user data (PII)
   */
  public String encryptUserData(String userData) {
    if (!encryptionEnabled) {
      return userData;
    }

    // Add timestamp and user context for additional security
    String enrichedData = addSecurityContext(userData);
    return encryptRouteData(enrichedData);
  }

  /**
   * Decrypt sensitive user data (PII)
   */
  public String decryptUserData(String encryptedData) {
    if (!encryptionEnabled) {
      return encryptedData;
    }

    String decrypted = decryptRouteData(encryptedData);
    return extractOriginalData(decrypted);
  }

  /**
   * Generate secure hash for data integrity verification
   */
  public String generateDataHash(String data) {
    try {
      java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(data.getBytes());
      return Base64.getEncoder().encodeToString(hash);
    } catch (Exception e) {
      logger.error("Failed to generate data hash", e);
      throw new SecurityException("Hash generation failed", e);
    }
  }

  /**
   * Verify data integrity using hash
   */
  public boolean verifyDataIntegrity(String data, String expectedHash) {
    String actualHash = generateDataHash(data);
    return actualHash.equals(expectedHash);
  }

  /**
   * Clear encryption cache (for security)
   */
  public void clearCache() {
    encryptionCache.clear();
    logger.info("Encryption cache cleared");
  }

  private SecretKey initializeMasterKey(String masterKeyString) {
    try {
      if (masterKeyString != null && !masterKeyString.isEmpty()) {
        // Use provided key (base64 encoded)
        byte[] keyBytes = Base64.getDecoder().decode(masterKeyString);
        return new SecretKeySpec(keyBytes, ALGORITHM);
      } else {
        // Generate a new key (for development only)
        logger.warn("No master key provided, generating temporary key - NOT for production!");
        KeyGenerator keyGenerator = KeyGenerator.getInstance(ALGORITHM);
        keyGenerator.init(KEY_LENGTH);
        return keyGenerator.generateKey();
      }
    } catch (Exception e) {
      logger.error("Failed to initialize master key", e);
      throw new SecurityException("Key initialization failed", e);
    }
  }

  private byte[] generateRandomIV() {
    byte[] iv = new byte[IV_LENGTH];
    new SecureRandom().nextBytes(iv);
    return iv;
  }

  private String generateCacheKey(String data) {
    return Integer.toString(data.hashCode());
  }

  private String addSecurityContext(String userData) {
    String timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    return timestamp + "|" + userData;
  }

  private String extractOriginalData(String enrichedData) {
    if (enrichedData == null || !enrichedData.contains("|")) {
      return enrichedData;
    }

    int separatorIndex = enrichedData.indexOf("|");
    return enrichedData.substring(separatorIndex + 1);
  }

  /**
   * Securely wipe sensitive data from memory
   */
  public void secureWipe(char[] sensitiveData) {
    if (sensitiveData != null) {
      java.util.Arrays.fill(sensitiveData, '\0');
    }
  }
}