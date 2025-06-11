package com.perundhu.application.service;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.ContributionRepository;
import com.perundhu.domain.model.ImageContribution;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.io.IOException;
import java.util.function.Function;

/**
 * Service for handling user contributions
 */
@Service
public class ContributionService {

    private static final Logger logger = LoggerFactory.getLogger(ContributionService.class);
    
    // Record for file upload result
    private record FileUploadResult(String fileName, String url, long size) {}
    
    private final ContributionRepository contributionRepository;
    
    // Constructor injection
    public ContributionService(ContributionRepository contributionRepository) {
        this.contributionRepository = contributionRepository;
    }
    
    /**
     * Save a new route contribution
     */
    public RouteContribution saveRouteContribution(RouteContribution contribution) {
        // Generate ID if not provided using enhanced string method isBlank()
        var id = (contribution.getId() == null || contribution.getId().isBlank()) ?
                UUID.randomUUID().toString() : contribution.getId();
        
        contribution.setId(id);
        
        logger.info("Saving route contribution with id: {}", id);
        
        return contributionRepository.saveRouteContribution(contribution);
    }
    
    /**
     * Save an image contribution file
     */
    public String saveImageContribution(ImageContribution contribution, MultipartFile file) throws IOException {
        // Use the file processing helper with functional style
        var uploadResult = processUploadedFile(file, originalName -> 
            UUID.randomUUID().toString() + "_" + originalName);
        
        logger.info("Saving image contribution with file name: {}, size: {}", 
            uploadResult.fileName(), uploadResult.size());
        
        // In a real implementation, this would save the file to a storage service
        // and return a URL to access it
        
        return uploadResult.url();
    }
    
    /**
     * Process an uploaded file with functional transformation for the filename
     */
    private FileUploadResult processUploadedFile(MultipartFile file, Function<String, String> fileNameTransformer) {
        var originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed";
        var newFileName = fileNameTransformer.apply(originalName);
        
        // For demo purposes, create a dummy URL
        var url = "/uploads/" + newFileName;
        
        return new FileUploadResult(newFileName, url, file.getSize());
    }
    
    /**
     * Save image metadata
     */
    public ImageContribution saveImageMetadata(ImageContribution contribution) {
        // Using optional pattern with orElseGet for null-safe ID generation
        var id = Optional.ofNullable(contribution.getId())
            .filter(s -> !s.isBlank())
            .orElseGet(() -> UUID.randomUUID().toString());
        
        contribution.setId(id);
        
        logger.info("Saving image metadata with id: {}", id);
        
        return contributionRepository.saveImageContribution(contribution);
    }
    
    /**
     * Get contributions for a specific user
     */
    public List<Map<String, Object>> getUserContributions(String userId) {
        logger.info("Retrieving contributions for user: {}", userId);
        return contributionRepository.getUserContributions(userId);
    }
    
    /**
     * Get all contribution status data
     */
    public List<Map<String, Object>> getAllContributionStatus() {
        logger.info("Retrieving all contribution status");
        return contributionRepository.getAllContributions();
    }
    
    /**
     * Get contribution status data for a specific user
     */
    public List<Map<String, Object>> getContributionStatusByUser(String userId) {
        logger.info("Retrieving contribution status for user: {}", userId);
        return contributionRepository.getUserContributions(userId);
    }
}