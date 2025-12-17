package com.perundhu.infrastructure.persistence.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.SystemSettingJpaEntity;

/**
 * JPA Repository for SystemSetting persistence operations.
 */
@Repository
public interface SystemSettingJpaRepository extends JpaRepository<SystemSettingJpaEntity, Long> {

  /**
   * Find a setting by its key
   * 
   * @param settingKey The setting key
   * @return Optional containing the setting if found
   */
  Optional<SystemSettingJpaEntity> findBySettingKey(String settingKey);

  /**
   * Find all settings in a category
   * 
   * @param category The category name
   * @return List of settings in the category
   */
  List<SystemSettingJpaEntity> findByCategory(String category);

  /**
   * Find all settings ordered by category and key
   * 
   * @return List of all settings
   */
  @Query("SELECT s FROM SystemSettingJpaEntity s ORDER BY s.category, s.settingKey")
  List<SystemSettingJpaEntity> findAllOrderedByCategoryAndKey();

  /**
   * Check if a setting exists by key
   * 
   * @param settingKey The setting key
   * @return true if the setting exists
   */
  boolean existsBySettingKey(String settingKey);

  /**
   * Delete a setting by key
   * 
   * @param settingKey The setting key
   */
  void deleteBySettingKey(String settingKey);

  /**
   * Find settings by key prefix (for feature flags, etc.)
   * 
   * @param keyPrefix The key prefix
   * @return List of matching settings
   */
  @Query("SELECT s FROM SystemSettingJpaEntity s WHERE s.settingKey LIKE :prefix% ORDER BY s.settingKey")
  List<SystemSettingJpaEntity> findBySettingKeyStartingWith(@Param("prefix") String keyPrefix);

  /**
   * Count settings by category
   * 
   * @param category The category name
   * @return Count of settings in the category
   */
  long countByCategory(String category);
}
