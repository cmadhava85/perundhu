package com.perundhu.infrastructure.persistence.adapter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.perundhu.infrastructure.persistence.repository.ImageContributionJpaRepository;
import org.springframework.stereotype.Component;

import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.ContributionRepository;
import com.perundhu.infrastructure.persistence.entity.ImageContributionJpaEntity;
import com.perundhu.infrastructure.persistence.entity.RouteContributionJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.RouteContributionJpaRepository;

/**
 * Adapter implementation for the ContributionRepository interface using Java 17 features
 */
@Component
public class ContributionJpaRepositoryAdapter implements ContributionRepository {

    // Constants to avoid duplicate literals
    private static final String STATUS_KEY = "status";
    private static final String SUBMISSION_DATE_KEY = "submissionDate";
    private static final String USER_ID_KEY = "userId";
    private static final String ID_KEY = "id";
    private static final String TYPE_KEY = "type";
    private static final String ROUTE_TYPE = "ROUTE";
    private static final String IMAGE_TYPE = "IMAGE";

    private final RouteContributionJpaRepository routeJpaRepository;
    private final ImageContributionJpaRepository imageJpaRepository;

    // Manual constructor replacing @RequiredArgsConstructor
    public ContributionJpaRepositoryAdapter(RouteContributionJpaRepository routeJpaRepository,
                                           ImageContributionJpaRepository imageJpaRepository) {
        this.routeJpaRepository = routeJpaRepository;
        this.imageJpaRepository = imageJpaRepository;
    }

    @Override
    public RouteContribution saveRouteContribution(RouteContribution contribution) {
        var entity = mapToJpaEntity(contribution);
        var savedEntity = routeJpaRepository.save(entity);
        return mapToDomainModel(savedEntity);
    }

    @Override
    public ImageContribution saveImageContribution(ImageContribution contribution) {
        var entity = mapToJpaEntity(contribution);
        var savedEntity = imageJpaRepository.save(entity);
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
        var result = new ArrayList<Map<String, Object>>();

        // Get route contributions and convert to map
        var routeEntities = routeJpaRepository.findByUserId(userId);
        for (var entity : routeEntities) {
            var contributionMap = new HashMap<String, Object>();
            contributionMap.put(ID_KEY, entity.getId());
            contributionMap.put(TYPE_KEY, ROUTE_TYPE);
            contributionMap.put(STATUS_KEY, entity.getStatus());
            // Use createdAt instead of getSubmissionDate (which doesn't exist)
            contributionMap.put(SUBMISSION_DATE_KEY, entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : "");
            contributionMap.put("fromLocation", entity.getFromLocationName());
            contributionMap.put("toLocation", entity.getToLocationName());
            contributionMap.put("busNumber", entity.getBusNumber());
            result.add(contributionMap);
        }

        // Get image contributions and convert to map
        var imageEntities = imageJpaRepository.findByUserId(userId);
        for (var entity : imageEntities) {
            var contributionMap = new HashMap<String, Object>();
            contributionMap.put(ID_KEY, entity.getId());
            contributionMap.put(TYPE_KEY, IMAGE_TYPE);
            contributionMap.put(STATUS_KEY, entity.getStatus());
            contributionMap.put(SUBMISSION_DATE_KEY, entity.getSubmissionDate() != null ? entity.getSubmissionDate().toString() : "");
            contributionMap.put("description", entity.getDescription());
            contributionMap.put("location", entity.getLocation());
            contributionMap.put("imageUrl", entity.getImageUrl());
            result.add(contributionMap);
        }

        return result;
    }

    @Override
    public List<RouteContribution> findByStatus(String status) {
        var entities = routeJpaRepository.findByStatus(status);
        return entities.stream()
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public List<Map<String, Object>> getAllContributions() {
        var result = new ArrayList<Map<String, Object>>();

        // Get all route contributions and convert to map
        var routeEntities = routeJpaRepository.findAll();
        for (var entity : routeEntities) {
            var contributionMap = new HashMap<String, Object>();
            contributionMap.put(ID_KEY, entity.getId());
            contributionMap.put(USER_ID_KEY, entity.getUserId());
            contributionMap.put(TYPE_KEY, ROUTE_TYPE);
            contributionMap.put(STATUS_KEY, entity.getStatus());
            // Use createdAt instead of getSubmissionDate
            contributionMap.put(SUBMISSION_DATE_KEY, entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : "");
            contributionMap.put("fromLocation", entity.getFromLocationName());
            contributionMap.put("toLocation", entity.getToLocationName());
            contributionMap.put("busNumber", entity.getBusNumber());
            result.add(contributionMap);
        }

        // Get all image contributions and convert to map
        var imageEntities = imageJpaRepository.findAll();
        for (var entity : imageEntities) {
            var contributionMap = new HashMap<String, Object>();
            contributionMap.put(ID_KEY, entity.getId());
            contributionMap.put(USER_ID_KEY, entity.getUserId());
            contributionMap.put(TYPE_KEY, IMAGE_TYPE);
            contributionMap.put(STATUS_KEY, entity.getStatus());
            contributionMap.put(SUBMISSION_DATE_KEY, entity.getSubmissionDate() != null ? entity.getSubmissionDate().toString() : "");
            contributionMap.put("description", entity.getDescription());
            contributionMap.put("location", entity.getLocation());
            contributionMap.put("imageUrl", entity.getImageUrl());
            result.add(contributionMap);
        }

        return result;
    }

    // Mapping methods using Java 17 features and manual entity creation

    private RouteContributionJpaEntity mapToJpaEntity(RouteContribution contribution) {
        // Use constructor and setters instead of builder pattern
        var entity = new RouteContributionJpaEntity();

        // Set fields that exist in simplified entity
        if (contribution.id() != null) {
            entity.setId(contribution.id().value());
        }

        entity.setUserId(contribution.userId());
        entity.setBusNumber(contribution.busNumber());
        entity.setBusName(contribution.busName());
        entity.setFromLocationName(contribution.fromLocationName());
        entity.setToLocationName(contribution.toLocationName());
        entity.setFromLatitude(contribution.fromLatitude());
        entity.setFromLongitude(contribution.fromLongitude());
        entity.setToLatitude(contribution.toLatitude());
        entity.setToLongitude(contribution.toLongitude());

        // Convert LocalTime to LocalDateTime for entity
        var today = LocalDateTime.now().toLocalDate();
        if (contribution.departureTime() != null) {
            entity.setDepartureTime(contribution.departureTime().atDate(today));
        }
        if (contribution.arrivalTime() != null) {
            entity.setArrivalTime(contribution.arrivalTime().atDate(today));
        }

        entity.setScheduleInfo(contribution.scheduleInfo());
        entity.setStatus(contribution.status() != null ? contribution.status().name() : null);

        // Map timestamps to available fields
        var now = LocalDateTime.now();
        entity.setCreatedAt(contribution.submissionDate() != null ? contribution.submissionDate() : now);
        entity.setUpdatedAt(contribution.processedDate() != null ? contribution.processedDate() : now);

        return entity;
    }

    private RouteContribution mapToDomainModel(RouteContributionJpaEntity entity) {
        var contributionId = entity.getId() != null ?
            new RouteContribution.RouteContributionId(entity.getId()) : null;

        var status = entity.getStatus() != null ?
            RouteContribution.ContributionStatus.valueOf(entity.getStatus()) : null;

        return new RouteContribution(
                contributionId,
                entity.getUserId(),
                entity.getBusNumber(),
                entity.getBusName(),
                entity.getFromLocationName(),
                entity.getToLocationName(),
                null, // busNameSecondary - not available in simplified entity
                null, // fromLocationNameSecondary - not available
                null, // toLocationNameSecondary - not available
                null, // sourceLanguage - not available (removed from simplified entity)
                entity.getFromLatitude(),
                entity.getFromLongitude(),
                entity.getToLatitude(),
                entity.getToLongitude(),
                // Convert LocalDateTime back to LocalTime for domain model
                entity.getDepartureTime() != null ? entity.getDepartureTime().toLocalTime() : null,
                entity.getArrivalTime() != null ? entity.getArrivalTime().toLocalTime() : null,
                entity.getScheduleInfo(),
                status,
                entity.getCreatedAt(),  // submissionDate mapped to createdAt
                entity.getUpdatedAt(),  // processedDate mapped to updatedAt
                null, // additionalNotes - not available
                null, // validationMessage - not available
                List.of() // Empty stops list
        );
    }

    private ImageContributionJpaEntity mapToJpaEntity(ImageContribution contribution) {
        // Use constructor and setters instead of builder pattern
        var entity = new ImageContributionJpaEntity();

        if (contribution.id() != null) {
            entity.setId(contribution.id().value());
        }

        entity.setUserId(contribution.userId());
        entity.setDescription(contribution.description());
        entity.setLocation(contribution.location());
        entity.setRouteName(contribution.routeName());
        entity.setImageUrl(contribution.imageUrl());
        entity.setStatus(contribution.status() != null ? contribution.status().name() : null);
        entity.setSubmissionDate(contribution.submissionDate());
        entity.setCreatedAt(contribution.submissionDate());
        entity.setUpdatedAt(contribution.processedDate());
        entity.setAdditionalNotes(contribution.additionalNotes());

        return entity;
    }

    private ImageContribution mapToDomainModel(ImageContributionJpaEntity entity) {
        var contributionId = entity.getId() != null ?
            new ImageContribution.ImageContributionId(entity.getId()) : null;

        var status = entity.getStatus() != null ?
            ImageContribution.ContributionStatus.valueOf(entity.getStatus()) : null;

        return new ImageContribution(
                contributionId,
                entity.getUserId(),
                entity.getDescription(),
                entity.getLocation(),
                entity.getRouteName(),
                entity.getImageUrl(),
                status,
                entity.getSubmissionDate(),
                entity.getUpdatedAt(), // Map updatedAt to processedDate
                entity.getAdditionalNotes(),
                null, // validationMessage - not available in JPA entity
                null, // busNumber - not available in JPA entity
                null, // imageDescription - not available in JPA entity
                null, // locationName - not available in JPA entity
                null  // extractedData - not available in JPA entity
        );
    }
}
