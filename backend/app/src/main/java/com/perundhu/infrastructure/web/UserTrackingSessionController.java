package com.perundhu.infrastructure.web;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.domain.model.UserTrackingSession;
import com.perundhu.domain.repository.UserTrackingSessionRepository;
import com.perundhu.infrastructure.dto.UserTrackingSessionDTO;

@RestController
@RequestMapping("/api/v1/user-tracking-sessions")
public class UserTrackingSessionController {

    @Autowired
    private UserTrackingSessionRepository userTrackingSessionRepository;

    // Get user sessions by userId
    @GetMapping
    public ResponseEntity<List<UserTrackingSessionDTO>> getUserSessions(
            @RequestParam("userId") String userId) {
        
        List<UserTrackingSession> sessions = userTrackingSessionRepository.findByUserId(userId);
        List<UserTrackingSessionDTO> sessionDTOs = sessions.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(sessionDTOs);
    }

    // Start a new user session
    @PostMapping
    public ResponseEntity<UserTrackingSessionDTO> startUserSession(
            @RequestBody UserTrackingSessionDTO sessionDTO) {
        
        UserTrackingSession session = new UserTrackingSession();
        session.setUserId(sessionDTO.getUserId());
        session.setBusId(sessionDTO.getBusId());
        session.setStartLocationId(sessionDTO.getStartLocationId());
        
        // Parse ISO string to LocalDateTime if provided, otherwise use current time
        LocalDateTime startTime = sessionDTO.getStartTime() != null ? 
                sessionDTO.getStartTime() : 
                LocalDateTime.now();
        session.setStartTime(startTime);
        
        UserTrackingSession savedSession = userTrackingSessionRepository.save(session);
        return ResponseEntity.ok(convertToDTO(savedSession));
    }

    // End a user session
    @PatchMapping("/{sessionId}/end")
    public ResponseEntity<UserTrackingSessionDTO> endUserSession(
            @PathVariable Long sessionId,
            @RequestBody UserTrackingSessionDTO sessionDTO) {
        
        Optional<UserTrackingSession> optionalSession = userTrackingSessionRepository.findById(sessionId);
        
        if (optionalSession.isPresent()) {
            UserTrackingSession session = optionalSession.get();
            session.setEndLocationId(sessionDTO.getEndLocationId());
            
            // Parse ISO string to LocalDateTime if provided, otherwise use current time
            LocalDateTime endTime = sessionDTO.getEndTime() != null ? 
                    sessionDTO.getEndTime() : 
                    LocalDateTime.now();
            session.setEndTime(endTime);
            
            UserTrackingSession updatedSession = userTrackingSessionRepository.save(session);
            return ResponseEntity.ok(convertToDTO(updatedSession));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // Helper method to convert Entity to DTO
    private UserTrackingSessionDTO convertToDTO(UserTrackingSession session) {
        UserTrackingSessionDTO dto = new UserTrackingSessionDTO();
        dto.setId(session.getId());
        dto.setUserId(session.getUserId());
        dto.setBusId(session.getBusId());
        dto.setStartLocationId(session.getStartLocationId());
        dto.setEndLocationId(session.getEndLocationId());
        dto.setStartTime(session.getStartTime());
        dto.setEndTime(session.getEndTime());
        return dto;
    }
}