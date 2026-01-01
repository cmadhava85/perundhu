package com.perundhu.adapter.in.rest.mapper;

import com.perundhu.adapter.in.rest.dto.AnnouncementDTO;
import com.perundhu.infrastructure.persistence.entity.AnnouncementJpaEntity;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for converting between AnnouncementJpaEntity and AnnouncementDTO
 * This is a simple utility class (not a Spring component) used by the REST adapter
 * to convert entities to DTOs. It's part of the adapter layer, not infrastructure.
 */
public class AnnouncementMapper {

    /**
     * Convert JPA entity to DTO
     */
    public AnnouncementDTO toDTO(AnnouncementJpaEntity entity) {
        if (entity == null) {
            return null;
        }

        return AnnouncementDTO.builder()
                .id(entity.getId())
                .uniqueId(entity.getUniqueId())
                .type(entity.getType() != null ? entity.getType().name() : null)
                .titleKey(entity.getTitleKey())
                .titleFallback(entity.getTitleFallback())
                .messageKey(entity.getMessageKey())
                .messageFallback(entity.getMessageFallback())
                .link(entity.getLink())
                .linkTextKey(entity.getLinkTextKey())
                .linkTextFallback(entity.getLinkTextFallback())
                .isActive(entity.getIsActive())
                .isDismissible(entity.getIsDismissible())
                .priority(entity.getPriority())
                .announcementCategory(entity.getAnnouncementCategory())
                .targetUsers(entity.getTargetUsers() != null ? entity.getTargetUsers().name() : null)
                .displayBanner(entity.getDisplayBanner())
                .displayModal(entity.getDisplayModal())
                .startsAt(entity.getStartsAt())
                .expiresAt(entity.getExpiresAt())
                .viewCount(entity.getViewCount())
                .dismissCount(entity.getDismissCount())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .createdBy(entity.getCreatedBy())
                .updatedBy(entity.getUpdatedBy())
                .status(entity.getStatus())
                .build();
    }

    /**
     * Convert DTO to JPA entity
     */
    public AnnouncementJpaEntity toEntity(AnnouncementDTO dto) {
        if (dto == null) {
            return null;
        }

        return AnnouncementJpaEntity.builder()
                .id(dto.getId())
                .uniqueId(dto.getUniqueId())
                .type(dto.getType() != null ? AnnouncementJpaEntity.AnnouncementType.valueOf(dto.getType()) : null)
                .titleKey(dto.getTitleKey())
                .titleFallback(dto.getTitleFallback())
                .messageKey(dto.getMessageKey())
                .messageFallback(dto.getMessageFallback())
                .link(dto.getLink())
                .linkTextKey(dto.getLinkTextKey())
                .linkTextFallback(dto.getLinkTextFallback())
                .isActive(dto.getIsActive())
                .isDismissible(dto.getIsDismissible())
                .priority(dto.getPriority())
                .announcementCategory(dto.getAnnouncementCategory())
                .targetUsers(dto.getTargetUsers() != null ? AnnouncementJpaEntity.TargetAudience.valueOf(dto.getTargetUsers()) : null)
                .displayBanner(dto.getDisplayBanner())
                .displayModal(dto.getDisplayModal())
                .startsAt(dto.getStartsAt())
                .expiresAt(dto.getExpiresAt())
                .viewCount(dto.getViewCount())
                .dismissCount(dto.getDismissCount())
                .createdBy(dto.getCreatedBy())
                .updatedBy(dto.getUpdatedBy())
                .status(dto.getStatus())
                .build();
    }

    /**
     * Convert list of entities to list of DTOs
     */
    public List<AnnouncementDTO> toDTOList(List<AnnouncementJpaEntity> entities) {
        if (entities == null) {
            return null;
        }
        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Convert list of DTOs to list of entities
     */
    public List<AnnouncementJpaEntity> toEntityList(List<AnnouncementDTO> dtos) {
        if (dtos == null) {
            return null;
        }
        return dtos.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
    }
}
