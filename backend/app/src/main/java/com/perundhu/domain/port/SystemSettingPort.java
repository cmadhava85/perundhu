package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.SystemSetting;

/**
 * Output port interface for system settings persistence operations.
 * Following hexagonal architecture, this defines the contract for
 * accessing system settings storage from the domain layer.
 */
public interface SystemSettingPort {

  /**
   * Find all settings ordered by category and key
   * 
   * @return List of all settings
   */
  List<SystemSetting> findAllOrderedByCategoryAndKey();

  /**
   * Find all settings
   * 
   * @return List of all settings
   */
  List<SystemSetting> findAll();

  /**
   * Find a setting by its key
   * 
   * @param settingKey The setting key
   * @return Optional containing the setting if found
   */
  Optional<SystemSetting> findBySettingKey(String settingKey);

  /**
   * Find all settings in a category
   * 
   * @param category The category name
   * @return List of settings in the category
   */
  List<SystemSetting> findByCategory(String category);

  /**
   * Find settings by key prefix
   * 
   * @param keyPrefix The key prefix
   * @return List of matching settings
   */
  List<SystemSetting> findBySettingKeyStartingWith(String keyPrefix);

  /**
   * Check if a setting exists by key
   * 
   * @param settingKey The setting key
   * @return true if the setting exists
   */
  boolean existsBySettingKey(String settingKey);

  /**
   * Save a setting
   * 
   * @param setting The setting to save
   * @return The saved setting
   */
  SystemSetting save(SystemSetting setting);

  /**
   * Delete a setting by key
   * 
   * @param settingKey The setting key
   */
  void deleteBySettingKey(String settingKey);

  /**
   * Count settings by category
   * 
   * @param category The category name
   * @return Count of settings in the category
   */
  long countByCategory(String category);
}
