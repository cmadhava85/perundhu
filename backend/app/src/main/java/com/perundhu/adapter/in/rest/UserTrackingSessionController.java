package com.perundhu.adapter.in.rest;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.application.service.UserTrackingService;
import com.perundhu.domain.model.UserTrackingSession;
import com.perundhu.infrastructure.dto.UserTrackingSessionDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST API Controller for user tracking sessions
 */
@RestController
@RequestMapping("/api/v1/user-tracking-sessions")
@RequiredArgsConstructor
@Slf4j
public class UserTrackingSessionController {

    private final UserTrackingService userTrackingService;

    private record SessionEndRequest(Long sessionId, Long endLocationId) {}
    private record SessionResponse(String message, UserTrackingSessionDTO session) {}
    private record ErrorResponse(String message) {}

    @GetMapping
    public ResponseEntity<List<UserTrackingSessionDTO>> getUserSessions(@RequestParam("userId") String userId) {
        log.info("Fetching sessions for user: {}", userId);
        
        var sessions = userTrackingService.getUserSessions(userId);
        var sessionDTOs = sessions.stream()
                .map(this::convertToDTO)
                .toList(); // Using toList() from Java 16+

        return ResponseEntity.ok(sessionDTOs);
    }

    @PostMapping
    public ResponseEntity<UserTrackingSessionDTO> startUserSession(@RequestBody UserTrackingSessionDTO sessionDTO) {
        log.info("Starting new session for user: {} on bus: {}", 
            sessionDTO.getUserId(), sessionDTO.getBusId());

        // Using var and method chaining
        var session = new UserTrackingSession();
        session.setUserId(sessionDTO.getUserId());
        session.setBusId(sessionDTO.getBusId());
        session.setStartLocationId(sessionDTO.getStartLocationId());
        session.setStartTime(LocalDateTime.now());

        var savedSession = userTrackingService.startSession(session);
        return ResponseEntity.ok(convertToDTO(savedSession));
    }

    @PatchMapping("/{sessionId}/end")
    public ResponseEntity<?> endUserSession(
            @PathVariable Long sessionId,
            @RequestParam("endLocationId") Long endLocationId) {

        var request = new SessionEndRequest(sessionId, endLocationId);
        log.info("Ending session: {} at location: {}", 
            request.sessionId(), request.endLocationId());

        var sessionOpt = userTrackingService.endSession(request.sessionId(), request.endLocationId());
        if (sessionOpt.isPresent()) {
            var dto = convertToDTO(sessionOpt.get());
            return ResponseEntity.ok(new SessionResponse("Session ended successfully", dto));
        } else {
            return ResponseEntity.badRequest().body(
                new ErrorResponse("Cannot find session with ID: " + request.sessionId())
            );
        }
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<UserTrackingSessionDTO> getSessionById(@PathVariable Long sessionId) {
        log.info("Fetching session: {}", sessionId);
        
        return userTrackingService.getSessionById(sessionId)
                .map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private UserTrackingSessionDTO convertToDTO(UserTrackingSession session) {
        return UserTrackingSessionDTO.builder()
            .id(session.getId())
            .userId(session.getUserId())
            .busId(session.getBusId())
            .startLocationId(session.getStartLocationId())
            .endLocationId(session.getEndLocationId())
            .startTime(session.getStartTime())
            .endTime(session.getEndTime())
            .build();
    }
}
