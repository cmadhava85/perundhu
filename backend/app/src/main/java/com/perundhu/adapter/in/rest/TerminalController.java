package com.perundhu.adapter.in.rest;

import com.perundhu.application.dto.TerminalInfoDTO;
import com.perundhu.application.service.TerminalResolutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller for bus terminal resolution
 */
@RestController
@RequestMapping("/api/v1/terminals")
@RequiredArgsConstructor
@Slf4j
public class TerminalController {

    private final TerminalResolutionService terminalResolutionService;

    /**
     * Resolve the correct terminal for a route
     * GET /api/v1/terminals/resolve?source=Chennai&destination=Madurai
     */
    @GetMapping("/resolve")
    public ResponseEntity<Map<String, Object>> resolveTerminal(
            @RequestParam String source,
            @RequestParam String destination) {
        
        log.info("Resolving terminal for route: {} -> {}", source, destination);

        TerminalResolutionService.TerminalResolutionResult result = 
                terminalResolutionService.resolveTerminal(source, destination);

        Map<String, Object> response = new HashMap<>();
        response.put("originalSource", result.getOriginalSource());
        response.put("destination", result.getDestination());
        response.put("needsTerminalInfo", result.isNeedsTerminalInfo());

        if (result.isNeedsTerminalInfo() && result.getTerminal() != null) {
            response.put("terminal", TerminalInfoDTO.fromBusTerminal(
                    result.getTerminal(), result.getMessage()));
            response.put("resolvedSource", result.getResolvedSource());
            response.put("message", result.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Get all Chennai terminals
     * GET /api/v1/terminals/chennai
     */
    @GetMapping("/chennai")
    public ResponseEntity<List<TerminalInfoDTO>> getChennaiTerminals() {
        List<TerminalInfoDTO> terminals = terminalResolutionService.getChennaiTerminals()
                .stream()
                .map(terminal -> TerminalInfoDTO.fromBusTerminal(terminal, null))
                .collect(Collectors.toList());

        return ResponseEntity.ok(terminals);
    }
}
