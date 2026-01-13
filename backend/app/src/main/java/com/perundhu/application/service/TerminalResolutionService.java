package com.perundhu.application.service;

import com.perundhu.domain.model.BusTerminal;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Service to resolve the correct bus terminal based on source, destination, and route information.
 * Chennai has multiple major terminals serving different routes.
 */
@Service
public class TerminalResolutionService {

    private final Map<String, BusTerminal> terminals;
    private final Map<String, Set<String>> destinationToTerminalMapping;

    public TerminalResolutionService() {
        this.terminals = initializeTerminals();
        this.destinationToTerminalMapping = initializeDestinationMapping();
    }

    /**
     * Resolve the correct terminal for a given source-destination pair
     */
    public TerminalResolutionResult resolveTerminal(String source, String destination) {
        String normalizedSource = normalizeLocation(source);
        String normalizedDestination = normalizeLocation(destination);

        // If source is Chennai (generic), resolve to specific terminal
        if (isChennaiGeneric(normalizedSource)) {
            BusTerminal terminal = findTerminalForDestination(normalizedDestination);
            if (terminal != null) {
                return TerminalResolutionResult.builder()
                        .terminal(terminal)
                        .resolvedSource(terminal.getName())
                        .originalSource(source)
                        .destination(destination)
                        .needsTerminalInfo(true)
                        .message(String.format("Buses to %s depart from %s", destination, terminal.getDisplayName()))
                        .build();
            }
        }

        return TerminalResolutionResult.builder()
                .originalSource(source)
                .destination(destination)
                .needsTerminalInfo(false)
                .build();
    }

    /**
     * Find the correct terminal for a specific destination
     */
    private BusTerminal findTerminalForDestination(String destination) {
        for (Map.Entry<String, Set<String>> entry : destinationToTerminalMapping.entrySet()) {
            if (entry.getValue().stream()
                    .anyMatch(dest -> dest.equalsIgnoreCase(destination) || destination.contains(dest))) {
                return terminals.get(entry.getKey());
            }
        }
        return null; // Default terminal or show all options
    }

    /**
     * Get all Chennai terminals
     */
    public List<BusTerminal> getChennaiTerminals() {
        return new ArrayList<>(terminals.values());
    }

    /**
     * Check if location refers to Chennai generically
     */
    private boolean isChennaiGeneric(String location) {
        return location.equalsIgnoreCase("chennai") 
                || location.equalsIgnoreCase("madras")
                || location.equalsIgnoreCase("chennai city");
    }

    private String normalizeLocation(String location) {
        return location.trim().toLowerCase()
                .replace(" bus stand", "")
                .replace(" terminus", "")
                .replace(" terminal", "");
    }

    /**
     * Initialize Chennai bus terminals
     */
    private Map<String, BusTerminal> initializeTerminals() {
        Map<String, BusTerminal> terminalMap = new HashMap<>();

        // CMBT Koyembedu - Inter-state (Karnataka, Kerala, Puducherry)
        terminalMap.put("KOYEMBEDU", BusTerminal.builder()
                .terminalId("CMBT_KOYEMBEDU")
                .name("Koyembedu")
                .city("Chennai")
                .displayName("CMBT Koyembedu Bus Terminus")
                .latitude(13.06745)
                .longitude(80.20566)
                .address("Jawaharlal Nehru Salai, Koyambedu, Chennai - 600092")
                .servesStates(Arrays.asList("Tamil Nadu", "Karnataka", "Kerala", "Puducherry"))
                .majorDestinations(Arrays.asList(
                        "Bangalore", "Bengaluru", "Mysore", "Coimbatore",
                        "Kochi", "Trivandrum", "Puducherry", "Pondicherry"
                ))
                .terminalType(BusTerminal.TerminalType.INTER_STATE)
                .operatedBy("CMDA")
                .build());

        // Kilambakkam - Long-distance Tamil Nadu routes
        terminalMap.put("KILAMBAKKAM", BusTerminal.builder()
                .terminalId("KILAMBAKKAM")
                .name("Kilambakkam")
                .city("Chennai")
                .displayName("Kilambakkam Bus Terminus")
                .latitude(12.8451)
                .longitude(80.0893)
                .address("Vandalur - Kelambakkam Road, Chennai - 600127")
                .servesStates(Arrays.asList("Tamil Nadu"))
                .servesDistricts(Arrays.asList(
                        "Madurai", "Trichy", "Thanjavur", "Tirunelveli",
                        "Thoothukudi", "Kanyakumari", "Ramanathapuram"
                ))
                .majorDestinations(Arrays.asList(
                        "Madurai", "Trichy", "Tiruchirappalli", "Thanjavur",
                        "Tirunelveli", "Thoothukudi", "Tuticorin", "Kanyakumari",
                        "Rameshwaram", "Ramanathapuram"
                ))
                .terminalType(BusTerminal.TerminalType.INTRA_STATE)
                .operatedBy("CMDA")
                .build());

        // Madhavaram CMBT - Andhra Pradesh & Telangana
        terminalMap.put("MADHAVARAM", BusTerminal.builder()
                .terminalId("MADHAVARAM_CMBT")
                .name("Madhavaram")
                .city("Chennai")
                .displayName("Madhavaram Mofussil Bus Terminus")
                .latitude(13.1485)
                .longitude(80.2165)
                .address("Chennai Bypass Road, Madhavaram, Chennai - 600060")
                .servesStates(Arrays.asList("Andhra Pradesh", "Telangana"))
                .majorDestinations(Arrays.asList(
                        "Hyderabad", "Vijayawada", "Visakhapatnam", "Vizag",
                        "Tirupati", "Nellore", "Chittoor", "Kurnool",
                        "Puttaparthi", "Visakhapatnam", "Bhadrachalam"
                ))
                .terminalType(BusTerminal.TerminalType.INTER_STATE)
                .operatedBy("CMDA")
                .build());

        // Poonamallee - Suburban routes
        terminalMap.put("POONAMALLEE", BusTerminal.builder()
                .terminalId("POONAMALLEE")
                .name("Poonamallee")
                .city("Chennai")
                .displayName("Poonamallee Bus Terminus")
                .latitude(13.0480)
                .longitude(80.0976)
                .address("Poonamallee High Road, Chennai")
                .servesStates(Arrays.asList("Tamil Nadu"))
                .majorDestinations(Arrays.asList(
                        "Avadi", "Thiruporur", "Mogappair", "Kancheepuram"
                ))
                .terminalType(BusTerminal.TerminalType.SUBURBAN)
                .operatedBy("CMDA")
                .build());

        return terminalMap;
    }

    /**
     * Map destinations to terminals
     */
    private Map<String, Set<String>> initializeDestinationMapping() {
        Map<String, Set<String>> mapping = new HashMap<>();

        // Kilambakkam destinations
        mapping.put("KILAMBAKKAM", new HashSet<>(Arrays.asList(
                "madurai", "trichy", "tiruchirappalli", "thanjavur",
                "tirunelveli", "thoothukudi", "tuticorin", "kanyakumari",
                "rameshwaram", "ramanathapuram", "sivaganga", "dindigul",
                "karur", "pudukottai", "virudhunagar"
        )));

        // CMBT Koyembedu destinations
        mapping.put("KOYEMBEDU", new HashSet<>(Arrays.asList(
                "bangalore", "bengaluru", "mysore", "coimbatore",
                "kochi", "trivandrum", "thiruvananthapuram", "puducherry",
                "pondicherry", "salem", "erode", "tiruppur", "pollachi"
        )));

        // Madhavaram destinations
        mapping.put("MADHAVARAM", new HashSet<>(Arrays.asList(
                "hyderabad", "vijayawada", "visakhapatnam", "vizag",
                "tirupati", "nellore", "chittoor", "kurnool",
                "puttaparthi", "bhadrachalam", "warangal"
        )));

        // Poonamallee destinations
        mapping.put("POONAMALLEE", new HashSet<>(Arrays.asList(
                "avadi", "thiruporur", "mogappair", "kancheepuram",
                "poonamallee", "tambaram"
        )));

        return mapping;
    }

    /**
     * Result of terminal resolution
     */
    @lombok.Data
    @lombok.Builder
    public static class TerminalResolutionResult {
        private BusTerminal terminal;
        private String resolvedSource;
        private String originalSource;
        private String destination;
        private boolean needsTerminalInfo;
        private String message;
        private List<BusTerminal> alternativeTerminals;
    }
}
