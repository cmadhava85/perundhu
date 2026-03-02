package com.perundhu.application.service;

import com.perundhu.domain.model.BusTerminal;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import static com.perundhu.infrastructure.config.CacheConfig.TERMINALS_CACHE;

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
     * Cached for 60 minutes - static terminal data
     */
    @Cacheable(value = TERMINALS_CACHE, key = "'resolve-' + #source.toLowerCase() + '-' + #destination.toLowerCase()")
    public TerminalResolutionResult resolveTerminal(String source, String destination) {
        String normalizedSource = normalizeLocation(source);
        String normalizedDestination = normalizeLocation(destination);

        // Try to resolve from any supported city
        BusTerminal terminal = resolveTerminalForAnyCity(normalizedSource, normalizedDestination);
        
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

        return TerminalResolutionResult.builder()
                .originalSource(source)
                .destination(destination)
                .needsTerminalInfo(false)
                .build();
    }

    /**
     * Resolve terminal for any city (Chennai, Coimbatore, Tirupati, Salem, etc.)
     */
    private BusTerminal resolveTerminalForAnyCity(String source, String destination) {
        // Check if source is generic for any major city
        if (isChennaiGeneric(source)) {
            return findTerminalForDestination(destination);
        }
        
        // Check for other cities
        if (isCoimbatoreGeneric(source)) {
            return findCoimbatoreTerminalForDestination(destination);
        }
        
        if (isTirupatiGeneric(source)) {
            return findTirupatiTerminalForDestination(destination);
        }
        
        if (isSalemGeneric(source)) {
            return findSalemTerminalForDestination(destination);
        }
        
        return null;
    }

    /**
     * Find the correct terminal for a specific destination (Chennai only)
     */
    private BusTerminal findTerminalForDestination(String destination) {
        // Only check Chennai terminals
        String[] chennaiTerminals = {"KILAMBAKKAM", "KOYEMBEDU", "MADHAVARAM", "POONAMALLEE"};
        
        for (String terminalId : chennaiTerminals) {
            Set<String> destinations = destinationToTerminalMapping.get(terminalId);
            if (destinations != null && destinations.stream()
                    .anyMatch(dest -> dest.equalsIgnoreCase(destination) || destination.contains(dest))) {
                return terminals.get(terminalId);
            }
        }
        return null; // Default terminal or show all options
    }

    /**
     * Find correct Coimbatore terminal based on destination
     */
    private BusTerminal findCoimbatoreTerminalForDestination(String destination) {
        String normalizedDest = destination.toLowerCase();
        
        // Northern routes (Bangalore, Mysore, Salem, etc.)
        if (normalizedDest.contains("bangalore") || normalizedDest.contains("bengaluru") ||
            normalizedDest.contains("mysore") || normalizedDest.contains("hyderabad") ||
            normalizedDest.contains("hosur") || normalizedDest.contains("tiruppur") ||
            normalizedDest.contains("erode") || normalizedDest.contains("salem") ||
            normalizedDest.contains("dharamapuri")) {
            return terminals.get("GANDHIPURAM");
        }
        
        // Southern routes (Madurai, Trichy, etc.)
        if (normalizedDest.contains("madurai") || normalizedDest.contains("trichy") ||
            normalizedDest.contains("thanjavur") || normalizedDest.contains("tirunelveli") ||
            normalizedDest.contains("karur") || normalizedDest.contains("namakkal")) {
            return terminals.get("SINGANALLUR");
        }
        
        // Western routes (Palakkad, Palani, etc.)
        if (normalizedDest.contains("palakkad") || normalizedDest.contains("palani") ||
            normalizedDest.contains("pollachi") || normalizedDest.contains("udumalpet")) {
            return terminals.get("UKKADAM");
        }
        
        // Default to Gandhipuram
        return terminals.get("GANDHIPURAM");
    }

    /**
     * Find correct Tirupati terminal based on destination
     */
    private BusTerminal findTirupatiTerminalForDestination(String destination) {
        String normalizedDest = destination.toLowerCase();
        
        // Inter-state and main route destinations
        if (normalizedDest.contains("hyderabad") || normalizedDest.contains("vijayawada") ||
            normalizedDest.contains("chennai") || normalizedDest.contains("madras") ||
            normalizedDest.contains("chittoor") || normalizedDest.contains("nellore")) {
            return terminals.get("TIRUPATI_CENTRAL");
        }
        
        // Local routes
        if (normalizedDest.contains("kalahasti") || normalizedDest.contains("udayagiri") ||
            normalizedDest.contains("chandragiri") || normalizedDest.contains("vellore")) {
            return terminals.get("TIRUPATI_MOFFUSIL");
        }
        
        // Default to central
        return terminals.get("TIRUPATI_CENTRAL");
    }

    /**
     * Find correct Salem terminal based on destination
     */
    private BusTerminal findSalemTerminalForDestination(String destination) {
        String normalizedDest = destination.toLowerCase();
        
        // Northern routes
        if (normalizedDest.contains("bangalore") || normalizedDest.contains("bengaluru") ||
            normalizedDest.contains("hosur") || normalizedDest.contains("dharamapuri") ||
            normalizedDest.contains("vellore") || normalizedDest.contains("erode") ||
            normalizedDest.contains("coimbatore") || normalizedDest.contains("chennai") ||
            normalizedDest.contains("krishnagiri")) {
            return terminals.get("SALEM_CENTRAL");
        }
        
        // Southern routes
        if (normalizedDest.contains("madurai") || normalizedDest.contains("trichy") ||
            normalizedDest.contains("tirunelveli") || normalizedDest.contains("thanjavur")) {
            return terminals.get("SALEM_MOFFUSIL");
        }
        
        // Default to central
        return terminals.get("SALEM_CENTRAL");
    }

    /**
     * Get all Chennai terminals
     * Cached for 60 minutes - static terminal list
     */
    @Cacheable(value = TERMINALS_CACHE, key = "'chennai-terminals'")
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

    /**
     * Check if location refers to Coimbatore
     */
    private boolean isCoimbatoreGeneric(String location) {
        return location.equalsIgnoreCase("coimbatore") 
                || location.equalsIgnoreCase("coimbatore city")
                || location.equalsIgnoreCase("cbe");
    }

    /**
     * Check if location refers to Tirupati
     */
    private boolean isTirupatiGeneric(String location) {
        return location.equalsIgnoreCase("tirupati")
                || location.equalsIgnoreCase("tirupati city")
                || location.equalsIgnoreCase("tirupathi");
    }

    /**
     * Check if location refers to Salem
     */
    private boolean isSalemGeneric(String location) {
        return location.equalsIgnoreCase("salem")
                || location.equalsIgnoreCase("salem city");
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

        // ===== COIMBATORE TERMINALS =====
        // Gandhipuram Central Bus Terminus - Main inter-state terminal
        terminalMap.put("GANDHIPURAM", BusTerminal.builder()
                .terminalId("GANDHIPURAM_CBS")
                .name("Gandhipuram")
                .city("Coimbatore")
                .displayName("Gandhipuram Central Bus Stand")
                .latitude(11.0036)
                .longitude(76.9462)
                .address("Gandhipuram, Coimbatore, Tamil Nadu 641012")
                .servesStates(Arrays.asList("Tamil Nadu", "Karnataka", "Andhra Pradesh"))
                .majorDestinations(Arrays.asList(
                        "Tiruppur", "Erode", "Dharamapuri", "Hosur", "Bangalore",
                        "Bengaluru", "Mysore", "Hyderabad", "Salem", "Coimbatore"
                ))
                .terminalType(BusTerminal.TerminalType.INTER_STATE)
                .operatedBy("TNSTC")
                .build());

        // Singanallur Bus Terminus - Southern destinations
        terminalMap.put("SINGANALLUR", BusTerminal.builder()
                .terminalId("SINGANALLUR_BS")
                .name("Singanallur")
                .city("Coimbatore")
                .displayName("Singanallur Bus Terminus")
                .latitude(10.9689)
                .longitude(76.9714)
                .address("Singanallur, Coimbatore")
                .servesStates(Arrays.asList("Tamil Nadu"))
                .majorDestinations(Arrays.asList(
                        "Madurai", "Trichy", "Thanjavur", "Tirunelveli", "Madurai",
                        "Karur", "Namakkal", "Trichy"
                ))
                .terminalType(BusTerminal.TerminalType.INTRA_STATE)
                .operatedBy("TNSTC")
                .build());

        // Ukkadam Bus Terminus - Local routes
        terminalMap.put("UKKADAM", BusTerminal.builder()
                .terminalId("UKKADAM_BS")
                .name("Ukkadam")
                .city("Coimbatore")
                .displayName("Ukkadam Bus Terminus")
                .latitude(10.9900)
                .longitude(76.9800)
                .address("Ukkadam, Coimbatore")
                .servesStates(Arrays.asList("Tamil Nadu"))
                .majorDestinations(Arrays.asList(
                        "Palakkad", "Palani", "Pollachi", "Udumalpet"
                ))
                .terminalType(BusTerminal.TerminalType.SUBURBAN)
                .operatedBy("TNSTC")
                .build());

        // ===== TIRUPATI TERMINALS =====
        // Sri Padmavati Bus Terminus - Main terminal
        terminalMap.put("TIRUPATI_CENTRAL", BusTerminal.builder()
                .terminalId("TIRUPATI_CENTRAL")
                .name("Central Bus Terminal")
                .city("Tirupati")
                .displayName("Sri Padmavati Bus Terminus")
                .latitude(13.1939)
                .longitude(79.8944)
                .address("Tiruchirappalli Road, Tirupati, Andhra Pradesh 517501")
                .servesStates(Arrays.asList("Andhra Pradesh", "Tamil Nadu", "Telangana"))
                .majorDestinations(Arrays.asList(
                        "Chennai", "Chittoor", "Nellore", "Vijayawada", "Hyderabad",
                        "Thirupati", "Udayagiri", "Kalahasti", "Madras"
                ))
                .terminalType(BusTerminal.TerminalType.INTER_STATE)
                .operatedBy("APSRTC")
                .build());

        // Tirupati Moffusil Bus Terminus
        terminalMap.put("TIRUPATI_MOFFUSIL", BusTerminal.builder()
                .terminalId("TIRUPATI_MOFFUSIL")
                .name("Moffusil Bus Stand")
                .city("Tirupati")
                .displayName("Tirupati Moffusil Bus Terminus")
                .latitude(13.2100)
                .longitude(79.8900)
                .address("Rajagiri Street, Tirupati")
                .servesStates(Arrays.asList("Andhra Pradesh"))
                .majorDestinations(Arrays.asList(
                        "Kalahasti", "Udayagiri", "Chandragiri", "Vellore"
                ))
                .terminalType(BusTerminal.TerminalType.SUBURBAN)
                .operatedBy("APSRTC")
                .build());

        // ===== SALEM TERMINALS =====
        // Salem Central Bus Terminus - Main terminal
        terminalMap.put("SALEM_CENTRAL", BusTerminal.builder()
                .terminalId("SALEM_CENTRAL")
                .name("Central Bus Terminus")
                .city("Salem")
                .displayName("Salem Central Bus Terminus")
                .latitude(11.4647)
                .longitude(78.1411)
                .address("Arignar Anna Road, Salem, Tamil Nadu 636001")
                .servesStates(Arrays.asList("Tamil Nadu", "Karnataka", "Andhra Pradesh"))
                .majorDestinations(Arrays.asList(
                        "Bangalore", "Bengaluru", "Hosur", "Dharamapuri", "Vellore",
                        "Erode", "Coimbatore", "Chennai", "Krishnagiri"
                ))
                .terminalType(BusTerminal.TerminalType.INTER_STATE)
                .operatedBy("TNSTC")
                .build());

        // Salem Moffusil Bus Terminus - Long-distance routes
        terminalMap.put("SALEM_MOFFUSIL", BusTerminal.builder()
                .terminalId("SALEM_MOFFUSIL")
                .name("Moffusil Bus Stand")
                .city("Salem")
                .displayName("Salem Moffusil Bus Terminus")
                .latitude(11.4600)
                .longitude(78.1500)
                .address("Salem")
                .servesStates(Arrays.asList("Tamil Nadu"))
                .majorDestinations(Arrays.asList(
                        "Madurai", "Trichy", "Tirunelveli", "Thanjavur", "Trichy"
                ))
                .terminalType(BusTerminal.TerminalType.INTRA_STATE)
                .operatedBy("TNSTC")
                .build());

        return terminalMap;
    }

    /**
     * Map destinations to terminals
     */
    private Map<String, Set<String>> initializeDestinationMapping() {
        Map<String, Set<String>> mapping = new HashMap<>();

        // ===== CHENNAI TERMINALS =====
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

        // ===== COIMBATORE TERMINALS =====
        // Gandhipuram destinations (Northern routes)
        mapping.put("GANDHIPURAM", new HashSet<>(Arrays.asList(
                "tiruppur", "erode", "dharamapuri", "hosur", "bangalore",
                "bengaluru", "mysore", "hyderabad", "salem", "coimbatore",
                "krishnagiri", "palladam", "udumalaipettai"
        )));

        // Singanallur destinations (Southern routes)
        mapping.put("SINGANALLUR", new HashSet<>(Arrays.asList(
                "madurai", "trichy", "tiruchirappalli", "thanjavur",
                "tirunelveli", "karur", "namakkal", "dindigul",
                "virudhunagar", "rajapalayam", "sivaganga", "pudukottai"
        )));

        // Ukkadam destinations (Western routes)
        mapping.put("UKKADAM", new HashSet<>(Arrays.asList(
                "palakkad", "palani", "pollachi", "udumalpet",
                "kodaikanal", "ooty", "coonoor"
        )));

        // ===== TIRUPATI TERMINALS =====
        // Tirupati Central destinations (Inter-state and main routes)
        mapping.put("TIRUPATI_CENTRAL", new HashSet<>(Arrays.asList(
                "hyderabad", "vijayawada", "visakhapatnam", "vizag",
                "chennai", "madras", "chittoor", "nellore",
                "thirupati", "udayagiri"
        )));

        // Tirupati Moffusil destinations (Local routes)
        mapping.put("TIRUPATI_MOFFUSIL", new HashSet<>(Arrays.asList(
                "kalahasti", "udayagiri", "chandragiri", "vellore"
        )));

        // ===== SALEM TERMINALS =====
        // Salem Central destinations (Northern routes)
        mapping.put("SALEM_CENTRAL", new HashSet<>(Arrays.asList(
                "bangalore", "bengaluru", "hosur", "dharamapuri",
                "vellore", "erode", "coimbatore", "chennai",
                "krishnagiri", "chikballapur"
        )));

        // Salem Moffusil destinations (Southern routes)
        mapping.put("SALEM_MOFFUSIL", new HashSet<>(Arrays.asList(
                "madurai", "trichy", "tiruchirappalli", "tirunelveli",
                "thanjavur", "karur", "namakkal"
        )));

        return mapping;
    }

    /**
     * Get suggestion for correcting user input
     */
    public TerminalSuggestion getSuggestionForCorrection(String source, String destination) {
        String normalizedSource = normalizeLocation(source);
        String normalizedDestination = normalizeLocation(destination);

        // Check if user provided wrong terminal
        BusTerminal correctTerminal = findTerminalForDestination(normalizedDestination);
        
        if (correctTerminal != null && !normalizedSource.equals(normalizedDestination)) {
            // Check if source matches a different terminal
            BusTerminal providedTerminal = terminals.values().stream()
                    .filter(t -> normalizeLocation(t.getName()).contains(normalizedSource))
                    .findFirst()
                    .orElse(null);

            if (providedTerminal != null && !providedTerminal.getTerminalId().equals(correctTerminal.getTerminalId())) {
                return TerminalSuggestion.builder()
                        .needsCorrection(true)
                        .providedSource(source)
                        .suggestedSource(correctTerminal.getName())
                        .destination(destination)
                        .message(String.format(
                            "Buses to %s depart from %s, not %s. Would you like to search from the correct terminal?",
                            destination, correctTerminal.getDisplayName(), providedTerminal.getDisplayName()
                        ))
                        .correctTerminal(correctTerminal)
                        .build();
            }
        }

        return TerminalSuggestion.builder().needsCorrection(false).build();
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

    /**
     * Terminal correction suggestion for user
     */
    @lombok.Data
    @lombok.Builder
    public static class TerminalSuggestion {
        private boolean needsCorrection;
        private String providedSource;
        private String suggestedSource;
        private String destination;
        private String message;
        private BusTerminal correctTerminal;
    }
}
