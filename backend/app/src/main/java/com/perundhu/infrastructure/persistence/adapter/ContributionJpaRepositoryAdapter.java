package com.perundhu.infrastructure.persistence.adapter;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.ContributionRepository;
import com.perundhu.infrastructure.persistence.entity.ImageContributionJpaEntity;
import com.perundhu.infrastructure.persistence.entity.RouteContributionJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.ImageContributionJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.RouteContributionJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter implementation for the ContributionRepository interface
 */
@Component
@RequiredArgsConstructor
public class ContributionJpaRepositoryAdapter implements ContributionRepository {

    private final RouteContributionJpaRepository routeJpaRepository;
    private final ImageContributionJpaRepository imageJpaRepository;
    
    @Override
    public RouteContribution saveRouteContribution(RouteContribution contribution) {
        RouteContributionJpaEntity entity = mapToJpaEntity(contribution);
        RouteContributionJpaEntity savedEntity = routeJpaRepository.save(entity);
        return mapToDomainModel(savedEntity);
    }

    @Override
    public ImageContribution saveImageContribution(ImageContribution contribution) {
        ImageContributionJpaEntity entity = mapToJpaEntity(contribution);
        ImageContributionJpaEntity savedEntity = imageJpaRepository.save(entity);
        return mapToDomainModel(savedEntity);
    }
    
    @Override
    public Optional<RouteContribution> findRouteContributionById(String id) {
        return routeJpaRepository.findById(id)
                .map(this::mapToDomainModel);
    }

    @Override
    public Optional<ImageContribution> findImageContributionById(String id) {
        return imageJpaRepository.findById(id)
                .map(this::mapToDomainModel);
    }

    @Override
    public List<Map<String, Object>> getUserContributions(String userId) {
        List<Map<String, Object>> result = new ArrayList<>();
        
        // Get route contributions and convert to map
        List<RouteContributionJpaEntity> routeEntities = routeJpaRepository.findByUserId(userId);
        for (RouteContributionJpaEntity entity : routeEntities) {
            Map<String, Object> contributionMap = new HashMap<>();
            contributionMap.put("id", entity.getId());
            contributionMap.put("type", "ROUTE");
            contributionMap.put("status", entity.getStatus());
            contributionMap.put("submissionDate", entity.getSubmissionDate().toString());
            contributionMap.put("fromLocation", entity.getFromLocationName());
            contributionMap.put("toLocation", entity.getToLocationName());
            contributionMap.put("busNumber", entity.getBusNumber());
            result.add(contributionMap);
        }
        
        // Get image contributions and convert to map
        List<ImageContributionJpaEntity> imageEntities = imageJpaRepository.findByUserId(userId);
        for (ImageContributionJpaEntity entity : imageEntities) {
            Map<String, Object> contributionMap = new HashMap<>();
            contributionMap.put("id", entity.getId());
            contributionMap.put("type", "IMAGE");
            contributionMap.put("status", entity.getStatus());
            contributionMap.put("submissionDate", entity.getSubmissionDate().toString());
            contributionMap.put("description", entity.getDescription());
            contributionMap.put("location", entity.getLocation());
            contributionMap.put("imageUrl", entity.getImageUrl());
            result.add(contributionMap);
        }
        
        return result;
    }
    
    @Override
    public List<RouteContribution> findByStatus(String status) {
        List<RouteContributionJpaEntity> entities = routeJpaRepository.findByStatus(status);
        return entities.stream()
                .map(this::mapToDomainModel)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<Map<String, Object>> getAllContributions() {
        List<Map<String, Object>> result = new ArrayList<>();
        
        // Get all route contributions and convert to map
        List<RouteContributionJpaEntity> routeEntities = routeJpaRepository.findAll();
        for (RouteContributionJpaEntity entity : routeEntities) {
            Map<String, Object> contributionMap = new HashMap<>();
            contributionMap.put("id", entity.getId());
            contributionMap.put("userId", entity.getUserId());
            contributionMap.put("type", "ROUTE");
            contributionMap.put("status", entity.getStatus());
            contributionMap.put("submissionDate", entity.getSubmissionDate().toString());
            contributionMap.put("fromLocation", entity.getFromLocationName());
            contributionMap.put("toLocation", entity.getToLocationName());
            contributionMap.put("busNumber", entity.getBusNumber());
            result.add(contributionMap);
        }
        
        // Get all image contributions and convert to map
        List<ImageContributionJpaEntity> imageEntities = imageJpaRepository.findAll();
        for (ImageContributionJpaEntity entity : imageEntities) {
            Map<String, Object> contributionMap = new HashMap<>();
            contributionMap.put("id", entity.getId());
            contributionMap.put("userId", entity.getUserId());
            contributionMap.put("type", "IMAGE");
            contributionMap.put("status", entity.getStatus());
            contributionMap.put("submissionDate", entity.getSubmissionDate().toString());
            contributionMap.put("description", entity.getDescription());
            contributionMap.put("location", entity.getLocation());
            contributionMap.put("imageUrl", entity.getImageUrl());
            result.add(contributionMap);
        }
        
        return result;
    }
    
    // Mapping methods
    
    private RouteContributionJpaEntity mapToJpaEntity(RouteContribution contribution) {
        return RouteContributionJpaEntity.builder()
                .id(contribution.getId())
                .userId(contribution.getUserId())
                .busNumber(contribution.getBusNumber())
                .fromLocationName(contribution.getFromLocationName())
                .toLocationName(contribution.getToLocationName())
                .fromLatitude(contribution.getFromLatitude())
                .fromLongitude(contribution.getFromLongitude())
                .toLatitude(contribution.getToLatitude())
                .toLongitude(contribution.getToLongitude())
                .scheduleInfo(contribution.getScheduleInfo())
                .status(contribution.getStatus())
                .submissionDate(contribution.getSubmissionDate())
                .additionalNotes(contribution.getAdditionalNotes())
                .validationMessage(contribution.getValidationMessage())
                .build();
    }
    
    private RouteContribution mapToDomainModel(RouteContributionJpaEntity entity) {
        return RouteContribution.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .busNumber(entity.getBusNumber())
                .fromLocationName(entity.getFromLocationName())
                .toLocationName(entity.getToLocationName())
                .fromLatitude(entity.getFromLatitude())
                .fromLongitude(entity.getFromLongitude())
                .toLatitude(entity.getToLatitude())
                .toLongitude(entity.getToLongitude())
                .scheduleInfo(entity.getScheduleInfo())
                .status(entity.getStatus())
                .submissionDate(entity.getSubmissionDate())
                .additionalNotes(entity.getAdditionalNotes())
                .validationMessage(entity.getValidationMessage())
                .build();
    }
    
    private ImageContributionJpaEntity mapToJpaEntity(ImageContribution contribution) {
        return ImageContributionJpaEntity.builder()
                .id(contribution.getId())
                .userId(contribution.getUserId())
                .description(contribution.getDescription())
                .location(contribution.getLocation())
                .routeName(contribution.getRouteName())
                .imageUrl(contribution.getImageUrl())
                .status(contribution.getStatus())
                .submissionDate(contribution.getSubmissionDate())
                .additionalNotes(contribution.getAdditionalNotes())
                .build();
    }
    
    private ImageContribution mapToDomainModel(ImageContributionJpaEntity entity) {
        return ImageContribution.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .description(entity.getDescription())
                .location(entity.getLocation())
                .routeName(entity.getRouteName())
                .imageUrl(entity.getImageUrl())
                .status(entity.getStatus())
                .submissionDate(entity.getSubmissionDate())
                .additionalNotes(entity.getAdditionalNotes())
                .build();
    }
}