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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.perundhu.application.service.UserTrackingService;
import com.perundhu.domain.model.UserTrackingSession;
import com.perundhu.infrastructure.dto.UserTrackingSessionDTO;

/**
 * REST API Controller for user tracking sessions
 */
@RestController
@RequestMapping("/api/v1/user-tracking-sessions")
public class UserTrackingSessionController {

    private static final Logger log = LoggerFactory.getLogger(UserTrackingSessionController.class);

    private final UserTrackingService userTrackingService;

    /**
     * Constructor for dependency injection
     * Replaces Lombok's @RequiredArgsConstructor
     */
    public UserTrackingSessionController(UserTrackingService userTrackingService) {
        this.userTrackingService = userTrackingService;
    }

    private record SessionEndRequest(Long sessionId, Long endLocationId) {
    }

    private record SessionResponse(String message, UserTrackingSessionDTO session) {
    }

    private record ErrorResponse(String message) {
    }

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
                sessionDTO.userId(), sessionDTO.busId());

        // Create a new session using the static factory method with the DTO values
        var session = UserTrackingSession.create(
                sessionDTO.userId(),
                sessionDTO.busId(),
                sessionDTO.startLocationId(),
                sessionDTO.deviceInfo(),
                sessionDTO.ipAddress(),
                sessionDTO.userAgent());

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
                    new ErrorResponse("Cannot find session with ID: " + request.sessionId()));
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
                .id(session.id())
                .sessionId(session.sessionId())
                .userId(session.userId())
                .busId(session.busId())
                .startLocationId(session.startLocationId())
                .endLocationId(session.endLocationId())
                .deviceInfo(session.deviceInfo())
                .ipAddress(session.ipAddress())
                .startTime(session.startTime())
                .endTime(session.endTime())
                .userAgent(session.userAgent())
                .build();
    }
}
