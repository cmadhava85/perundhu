package com.perundhu.infrastructure.adapter.service.impl;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.perundhu.domain.model.FileResource;
import com.perundhu.domain.model.FileUpload;
import com.perundhu.domain.port.FileStorageService;

/**
 * GCS-backed file storage service.
 * Stores compressed images in Cloud Storage instead of local disk or DB blobs.
 * Replaces FileStorageServiceImpl for production use.
 */
@Primary
@Service
public class GcsFileStorageServiceImpl implements FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(GcsFileStorageServiceImpl.class);

    private final Storage gcsStorage;
    private final ImageCompressionService imageCompressionService;

    @Value("${app.gcs.bucket-name:${STORAGE_BUCKET_IMAGES:}}")
    private String bucketName;

    @Value("${app.file.max-size:10485760}")
    private long maxFileSize;

    private static final List<String> SUPPORTED_FORMATS = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/bmp");

    public GcsFileStorageServiceImpl(Storage gcsStorage, ImageCompressionService imageCompressionService) {
        this.gcsStorage = gcsStorage;
        this.imageCompressionService = imageCompressionService;
    }

    @Override
    public String storeImageFile(FileUpload imageFile, String userId) throws IOException {
        return storeImageFile(imageFile, userId, generateSecureFilename(imageFile.getOriginalFilename(), userId));
    }

    @Override
    public String storeImageFile(FileUpload imageFile, String userId, String customFilename) throws IOException {
        if (!isValidImageFile(imageFile)) {
            throw new IllegalArgumentException("Invalid image file format or size");
        }

        String objectName = "contributions/" + userId + "/" + customFilename;

        byte[] compressedBytes = imageCompressionService.compressImage(
                imageFile.getInputStream(), imageFile.getContentType());

        BlobId blobId = BlobId.of(bucketName, objectName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType("image/jpeg")
                .setCacheControl("public, max-age=31536000")
                .build();

        gcsStorage.create(blobInfo, compressedBytes);

        String gcsUrl = "https://storage.googleapis.com/" + bucketName + "/" + objectName;
        log.info("Stored image to GCS: {} ({} bytes original -> {} bytes compressed)",
                gcsUrl, imageFile.getSize(), compressedBytes.length);
        return gcsUrl;
    }

    @Override
    public boolean deleteImageFile(String imageUrl) {
        try {
            String objectName = extractObjectName(imageUrl);
            if (objectName == null) {
                return false;
            }
            return gcsStorage.delete(BlobId.of(bucketName, objectName));
        } catch (Exception e) {
            log.error("Failed to delete GCS object for URL {}: {}", imageUrl, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean imageExists(String imageUrl) {
        try {
            String objectName = extractObjectName(imageUrl);
            if (objectName == null) {
                return false;
            }
            return gcsStorage.get(BlobId.of(bucketName, objectName)) != null;
        } catch (Exception e) {
            log.error("Failed to check GCS object existence for URL {}: {}", imageUrl, e.getMessage());
            return false;
        }
    }

    @Override
    public byte[] getImageBytes(String imageUrl) {
        try {
            String objectName = extractObjectName(imageUrl);
            if (objectName == null) {
                return null;
            }
            var blob = gcsStorage.get(BlobId.of(bucketName, objectName));
            return blob != null ? blob.getContent() : null;
        } catch (Exception e) {
            log.error("Failed to read GCS object for URL {}: {}", imageUrl, e.getMessage());
            return null;
        }
    }

    @Override
    public long getFileSize(String imageUrl) {
        try {
            String objectName = extractObjectName(imageUrl);
            if (objectName == null) {
                return 0;
            }
            var blob = gcsStorage.get(BlobId.of(bucketName, objectName));
            return blob != null ? blob.getSize() : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    @Override
    public String getImageContentType(String imageUrl) {
        try {
            String objectName = extractObjectName(imageUrl);
            if (objectName == null) {
                return "image/jpeg";
            }
            var blob = gcsStorage.get(BlobId.of(bucketName, objectName));
            return blob != null && blob.getContentType() != null ? blob.getContentType() : "image/jpeg";
        } catch (Exception e) {
            return "image/jpeg";
        }
    }

    @Override
    public FileResource loadAsResource(String userId, String filename) {
        byte[] bytes = getImageBytes(
                "https://storage.googleapis.com/" + bucketName + "/contributions/" + userId + "/" + filename);
        if (bytes == null) {
            return null;
        }
        return new FileResource(new ByteArrayInputStream(bytes), filename, "image/jpeg", bytes.length);
    }

    @Override
    public String getImagePath(String imageUrl) {
        return null;
    }

    @Override
    public boolean isValidImageFile(FileUpload file) {
        if (file == null || file.isEmpty()) {
            return false;
        }
        if (file.getSize() > maxFileSize) {
            log.warn("File too large: {} bytes (max {})", file.getSize(), maxFileSize);
            return false;
        }
        String contentType = file.getContentType();
        if (contentType == null || !SUPPORTED_FORMATS.contains(contentType.toLowerCase())) {
            log.warn("Unsupported content type: {}", contentType);
            return false;
        }
        return true;
    }

    @Override
    public long getMaxFileSize() {
        return maxFileSize;
    }

    @Override
    public List<String> getSupportedFormats() {
        return SUPPORTED_FORMATS;
    }

    @Override
    public String generateSecureFilename(String originalFilename, String userId) {
        return UUID.randomUUID() + ".jpg";
    }

    @Override
    public String getBaseUrl() {
        return "https://storage.googleapis.com/" + bucketName;
    }

    private String extractObjectName(String imageUrl) {
        if (imageUrl == null) {
            return null;
        }
        String prefix = "https://storage.googleapis.com/" + bucketName + "/";
        if (imageUrl.startsWith(prefix)) {
            return imageUrl.substring(prefix.length());
        }
        String gsPrefix = "gs://" + bucketName + "/";
        if (imageUrl.startsWith(gsPrefix)) {
            return imageUrl.substring(gsPrefix.length());
        }
        log.warn("Cannot extract GCS object name from URL: {}", imageUrl);
        return null;
    }
}
