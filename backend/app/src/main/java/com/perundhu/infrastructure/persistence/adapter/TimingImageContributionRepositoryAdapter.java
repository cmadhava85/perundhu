package com.perundhu.infrastructure.persistence.adapter;

import com.perundhu.domain.model.TimingImageContribution;
import com.perundhu.domain.model.TimingImageContribution.BoardType;
import com.perundhu.domain.model.TimingImageContribution.DuplicateCheckStatus;
import com.perundhu.domain.model.TimingImageContribution.TimingImageStatus;
import com.perundhu.domain.port.TimingImageContributionRepository;
import com.perundhu.infrastructure.persistence.entity.TimingImageContributionEntity;
import com.perundhu.infrastructure.persistence.repository.TimingImageContributionJpaRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * JPA Repository Adapter for TimingImageContribution
 * Implements the domain repository interface using Spring Data JPA
 */
@Transactional
public class TimingImageContributionRepositoryAdapter implements TimingImageContributionRepository {

  private final TimingImageContributionJpaRepository jpaRepository;

  public TimingImageContributionRepositoryAdapter(
      @Qualifier("repositoryPackageTimingImageContributionJpaRepository") TimingImageContributionJpaRepository jpaRepository) {
    this.jpaRepository = jpaRepository;
  }

  @Override
  public TimingImageContribution save(TimingImageContribution contribution) {
    TimingImageContributionEntity entity = mapToEntity(contribution);
    TimingImageContributionEntity saved = jpaRepository.save(entity);
    return mapToDomain(saved);
  }

  @Override
  public Optional<TimingImageContribution> findById(Long id) {
    return jpaRepository.findById(id).map(this::mapToDomain);
  }

  @Override
  public List<TimingImageContribution> findByUserId(String userId) {
    return jpaRepository.findByUserId(userId).stream()
        .map(this::mapToDomain)
        .toList();
  }

  @Override
  public List<TimingImageContribution> findByStatus(TimingImageStatus status) {
    TimingImageContributionEntity.TimingImageStatus entityStatus = mapStatusToEntity(status);
    return jpaRepository.findByStatus(entityStatus).stream()
        .map(this::mapToDomain)
        .toList();
  }

  @Override
  public List<TimingImageContribution> findPendingContributions() {
    return jpaRepository.findPendingContributions().stream()
        .map(this::mapToDomain)
        .toList();
  }

  @Override
  public List<TimingImageContribution> findBySubmittedBy(String submittedBy) {
    return jpaRepository.findBySubmittedBy(submittedBy).stream()
        .map(this::mapToDomain)
        .toList();
  }

  @Override
  public List<TimingImageContribution> findByOriginLocation(String originLocation) {
    return jpaRepository.findByOriginLocation(originLocation).stream()
        .map(this::mapToDomain)
        .toList();
  }

  @Override
  public void deleteById(Long id) {
    jpaRepository.deleteById(id);
  }

  @Override
  public List<TimingImageContribution> findAll() {
    return jpaRepository.findAll().stream()
        .map(this::mapToDomain)
        .toList();
  }

  // ============ Mapping Methods ============

  private TimingImageContribution mapToDomain(TimingImageContributionEntity entity) {
    TimingImageContribution contribution = TimingImageContribution.builder()
        .id(entity.getId())
        .userId(entity.getUserId())
        .imageUrl(entity.getImageUrl())
        .thumbnailUrl(entity.getThumbnailUrl())
        .originLocation(entity.getOriginLocation())
        .originLocationTamil(entity.getOriginLocationTamil())
        .description(entity.getDescription())
        .status(mapStatusToDomain(entity.getStatus()))
        .submittedBy(entity.getSubmittedBy())
        .build();

    // Set additional fields not in builder
    contribution.setOriginLatitude(entity.getOriginLatitude());
    contribution.setOriginLongitude(entity.getOriginLongitude());
    contribution.setBoardType(mapBoardTypeToDomain(entity.getBoardType()));
    contribution.setSubmissionDate(entity.getSubmissionDate());
    contribution.setValidationMessage(entity.getValidationMessage());
    contribution.setProcessedDate(entity.getProcessedDate());
    contribution.setProcessedBy(entity.getProcessedBy());
    contribution.setOcrConfidence(entity.getOcrConfidence());
    contribution.setRequiresManualReview(entity.getRequiresManualReview());
    contribution.setDuplicateCheckStatus(mapDuplicateStatusToDomain(entity.getDuplicateCheckStatus()));
    contribution.setMergedRecords(entity.getMergedRecords());
    contribution.setCreatedRecords(entity.getCreatedRecords());
    contribution.setDetectedLanguage(entity.getDetectedLanguage());
    contribution.setDetectedLanguages(entity.getDetectedLanguages());
    contribution.setOcrTextOriginal(entity.getOcrTextOriginal());
    contribution.setOcrTextEnglish(entity.getOcrTextEnglish());
    contribution.setExtractedTimings(new ArrayList<>()); // Initialize empty list

    return contribution;
  }

  private TimingImageContributionEntity mapToEntity(TimingImageContribution domain) {
    return TimingImageContributionEntity.builder()
        .id(domain.getId())
        .userId(domain.getUserId())
        .imageUrl(domain.getImageUrl())
        .thumbnailUrl(domain.getThumbnailUrl())
        .originLocation(domain.getOriginLocation())
        .originLocationTamil(domain.getOriginLocationTamil())
        .originLatitude(domain.getOriginLatitude())
        .originLongitude(domain.getOriginLongitude())
        .boardType(mapBoardTypeToEntity(domain.getBoardType()))
        .description(domain.getDescription())
        .submissionDate(domain.getSubmissionDate())
        .status(mapStatusToEntity(domain.getStatus()))
        .validationMessage(domain.getValidationMessage())
        .processedDate(domain.getProcessedDate())
        .processedBy(domain.getProcessedBy())
        .submittedBy(domain.getSubmittedBy())
        .ocrConfidence(domain.getOcrConfidence())
        .requiresManualReview(domain.getRequiresManualReview())
        .duplicateCheckStatus(mapDuplicateStatusToEntity(domain.getDuplicateCheckStatus()))
        .mergedRecords(domain.getMergedRecords())
        .createdRecords(domain.getCreatedRecords())
        .detectedLanguage(domain.getDetectedLanguage())
        .detectedLanguages(domain.getDetectedLanguages())
        .ocrTextOriginal(domain.getOcrTextOriginal())
        .ocrTextEnglish(domain.getOcrTextEnglish())
        .extractedTimings(new ArrayList<>()) // Initialize empty list
        .build();
  }

  // ============ Enum Mapping Methods ============

  private TimingImageStatus mapStatusToDomain(TimingImageContributionEntity.TimingImageStatus entityStatus) {
    if (entityStatus == null)
      return null;
    return TimingImageStatus.valueOf(entityStatus.name());
  }

  private TimingImageContributionEntity.TimingImageStatus mapStatusToEntity(TimingImageStatus domainStatus) {
    if (domainStatus == null)
      return null;
    return TimingImageContributionEntity.TimingImageStatus.valueOf(domainStatus.name());
  }

  private BoardType mapBoardTypeToDomain(TimingImageContributionEntity.BoardType entityType) {
    if (entityType == null)
      return null;
    return BoardType.valueOf(entityType.name());
  }

  private TimingImageContributionEntity.BoardType mapBoardTypeToEntity(BoardType domainType) {
    if (domainType == null)
      return null;
    return TimingImageContributionEntity.BoardType.valueOf(domainType.name());
  }

  private DuplicateCheckStatus mapDuplicateStatusToDomain(
      TimingImageContributionEntity.DuplicateCheckStatus entityStatus) {
    if (entityStatus == null)
      return null;
    return DuplicateCheckStatus.valueOf(entityStatus.name());
  }

  private TimingImageContributionEntity.DuplicateCheckStatus mapDuplicateStatusToEntity(
      DuplicateCheckStatus domainStatus) {
    if (domainStatus == null)
      return null;
    return TimingImageContributionEntity.DuplicateCheckStatus.valueOf(domainStatus.name());
  }
}
