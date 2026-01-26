package com.perundhu.infrastructure.persistence.repository;

import com.perundhu.infrastructure.persistence.entity.LocationAliasJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for location aliases
 * Provides database access for alternative location names
 */
@Repository
public interface LocationAliasJpaRepository extends JpaRepository<LocationAliasJpaEntity, Long> {

    /**
     * Find location ID by exact alias name (case-insensitive)
     * 
     * @param aliasName The alias name to search for
     * @return Optional containing the location ID if found
     */
    @Query("SELECT la.locationId FROM LocationAliasJpaEntity la WHERE LOWER(la.aliasName) = LOWER(:aliasName)")
    Optional<Long> findLocationIdByAliasName(@Param("aliasName") String aliasName);

    /**
     * Find all location IDs matching alias pattern (autocomplete)
     * 
     * @param aliasPattern The partial alias name to search for
     * @return List of unique location IDs
     */
    @Query("SELECT DISTINCT la.locationId FROM LocationAliasJpaEntity la WHERE LOWER(la.aliasName) LIKE LOWER(CONCAT('%', :pattern, '%'))")
    List<Long> findLocationIdsByAliasContaining(@Param("pattern") String aliasPattern);

    /**
     * Find all aliases for a specific location
     * 
     * @param locationId The location ID
     * @return List of all aliases for the location
     */
    List<LocationAliasJpaEntity> findByLocationId(Long locationId);

    /**
     * Find primary alias for a location
     * 
     * @param locationId The location ID
     * @return Optional containing the primary alias if found
     */
    Optional<LocationAliasJpaEntity> findByLocationIdAndIsPrimaryTrue(Long locationId);

    /**
     * Check if an alias exists
     * 
     * @param aliasName The alias name to check
     * @return true if the alias exists
     */
    boolean existsByAliasName(String aliasName);
}
