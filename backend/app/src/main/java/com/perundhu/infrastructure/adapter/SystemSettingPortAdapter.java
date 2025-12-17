package com.perundhu.infrastructure.adapter;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.perundhu.domain.model.SystemSetting;
import com.perundhu.domain.port.SystemSettingPort;
import com.perundhu.infrastructure.persistence.entity.SystemSettingJpaEntity;
import com.perundhu.infrastructure.persistence.repository.SystemSettingJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter implementation for SystemSettingPort that delegates to
 * SystemSettingJpaRepository. This follows hexagonal architecture
 * by implementing the domain port and adapting to the JPA repository.
 */
@Component
@RequiredArgsConstructor
public class SystemSettingPortAdapter implements SystemSettingPort {

  private final SystemSettingJpaRepository jpaRepository;

  @Override
  public List<SystemSetting> findAllOrderedByCategoryAndKey() {
    return jpaRepository.findAllOrderedByCategoryAndKey()
        .stream()
        .map(SystemSettingJpaEntity::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public List<SystemSetting> findAll() {
    return jpaRepository.findAll()
        .stream()
        .map(SystemSettingJpaEntity::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public Optional<SystemSetting> findBySettingKey(String settingKey) {
    return jpaRepository.findBySettingKey(settingKey)
        .map(SystemSettingJpaEntity::toDomain);
  }

  @Override
  public List<SystemSetting> findByCategory(String category) {
    return jpaRepository.findByCategory(category)
        .stream()
        .map(SystemSettingJpaEntity::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public List<SystemSetting> findBySettingKeyStartingWith(String keyPrefix) {
    return jpaRepository.findBySettingKeyStartingWith(keyPrefix)
        .stream()
        .map(SystemSettingJpaEntity::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public boolean existsBySettingKey(String settingKey) {
    return jpaRepository.existsBySettingKey(settingKey);
  }

  @Override
  public SystemSetting save(SystemSetting setting) {
    SystemSettingJpaEntity entity;

    // If updating existing setting, preserve the ID
    if (setting.getId() != null) {
      entity = jpaRepository.findById(setting.getId())
          .orElse(new SystemSettingJpaEntity());
      entity.setSettingKey(setting.getSettingKey());
      entity.setSettingValue(setting.getSettingValue());
      entity.setCategory(setting.getCategory());
      entity.setDescription(setting.getDescription());
    } else if (setting.getSettingKey() != null) {
      // Try to find existing by key
      entity = jpaRepository.findBySettingKey(setting.getSettingKey())
          .orElse(SystemSettingJpaEntity.fromDomain(setting));
      entity.setSettingValue(setting.getSettingValue());
      if (setting.getCategory() != null) {
        entity.setCategory(setting.getCategory());
      }
      if (setting.getDescription() != null) {
        entity.setDescription(setting.getDescription());
      }
    } else {
      entity = SystemSettingJpaEntity.fromDomain(setting);
    }

    return jpaRepository.save(entity).toDomain();
  }

  @Override
  public void deleteBySettingKey(String settingKey) {
    jpaRepository.deleteBySettingKey(settingKey);
  }

  @Override
  public long countByCategory(String category) {
    return jpaRepository.countByCategory(category);
  }
}
