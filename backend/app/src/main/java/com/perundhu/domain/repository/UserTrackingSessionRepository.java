package com.perundhu.domain.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.perundhu.domain.model.UserTrackingSession;

@Repository
public interface UserTrackingSessionRepository extends JpaRepository<UserTrackingSession, Long> {
    
    List<UserTrackingSession> findByUserId(String userId);
    
}