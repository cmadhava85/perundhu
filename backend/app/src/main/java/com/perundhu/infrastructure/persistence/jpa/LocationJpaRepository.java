package com.perundhu.infrastructure.persistence.jpa;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;

@Repository
public interface LocationJpaRepository extends JpaRepository<LocationJpaEntity, Long> {
    
    List<LocationJpaEntity> findByName(String name);
    
    List<LocationJpaEntity> findByIdNot(Long id);
}