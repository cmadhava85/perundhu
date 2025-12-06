package com.perundhu.infrastructure.adapter.geocoding;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.perundhu.domain.port.FuzzyMatcherPort;

import lombok.extern.slf4j.Slf4j;

/**
 * Fuzzy string matcher using Levenshtein distance for OCR error correction.
 * Useful for matching misspelled city names from OCR output.
 */
@Component
@Slf4j
public class FuzzyMatcher implements FuzzyMatcherPort {

    /**
     * Find the best matching string from candidates
     * 
     * @param query       The string to match
     * @param candidates  List of possible matches
     * @param maxDistance Maximum edit distance to consider a match
     * @return The best match, or null if none found within threshold
     */
    public String findBestMatch(String query, List<String> candidates, int maxDistance) {
        if (query == null || candidates == null || candidates.isEmpty()) {
            return null;
        }

        String normalizedQuery = normalize(query);

        return candidates.stream()
                .map(c -> new MatchResult(c, levenshteinDistance(normalizedQuery, normalize(c))))
                .filter(m -> m.distance <= maxDistance)
                .min(Comparator.comparingInt(m -> m.distance))
                .map(m -> m.candidate)
                .orElse(null);
    }

    /**
     * Find all matches within the distance threshold, sorted by similarity
     */
    public List<String> findMatches(String query, List<String> candidates, int maxDistance) {
        if (query == null || candidates == null || candidates.isEmpty()) {
            return List.of();
        }

        String normalizedQuery = normalize(query);

        return candidates.stream()
                .map(c -> new MatchResult(c, levenshteinDistance(normalizedQuery, normalize(c))))
                .filter(m -> m.distance <= maxDistance)
                .sorted(Comparator.comparingInt(m -> m.distance))
                .map(m -> m.candidate)
                .collect(Collectors.toList());
    }

    /**
     * Check if two strings are similar (within threshold)
     */
    public boolean isSimilar(String s1, String s2, int maxDistance) {
        if (s1 == null || s2 == null)
            return false;
        return levenshteinDistance(normalize(s1), normalize(s2)) <= maxDistance;
    }

    /**
     * Calculate similarity score (0.0 to 1.0)
     */
    public double similarity(String s1, String s2) {
        if (s1 == null || s2 == null)
            return 0.0;

        String n1 = normalize(s1);
        String n2 = normalize(s2);

        int maxLen = Math.max(n1.length(), n2.length());
        if (maxLen == 0)
            return 1.0;

        int distance = levenshteinDistance(n1, n2);
        return 1.0 - ((double) distance / maxLen);
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    public int levenshteinDistance(String s1, String s2) {
        if (s1 == null || s2 == null) {
            return s1 == null && s2 == null ? 0 : Integer.MAX_VALUE;
        }

        int len1 = s1.length();
        int len2 = s2.length();

        // Optimization: if one string is empty
        if (len1 == 0)
            return len2;
        if (len2 == 0)
            return len1;

        // Create distance matrix
        int[][] dp = new int[len1 + 1][len2 + 1];

        // Initialize first row and column
        for (int i = 0; i <= len1; i++)
            dp[i][0] = i;
        for (int j = 0; j <= len2; j++)
            dp[0][j] = j;

        // Fill in the rest of the matrix
        for (int i = 1; i <= len1; i++) {
            for (int j = 1; j <= len2; j++) {
                int cost = s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost);
            }
        }

        return dp[len1][len2];
    }

    /**
     * Normalize string for comparison (uppercase, remove non-letters)
     */
    private String normalize(String s) {
        if (s == null)
            return "";
        return s.toUpperCase().replaceAll("[^A-Z]", "");
    }

    /**
     * Match common OCR errors in Tamil city names
     * Returns corrected name if a known error pattern is detected
     */
    public String correctCommonOCRErrors(String text) {
        if (text == null)
            return null;

        String upper = text.toUpperCase().trim();

        // Common OCR errors for Tamil Nadu cities
        // Pattern: wrong -> correct
        String[][] corrections = {
                { "CHENNAL", "CHENNAI" },
                { "CHENNA1", "CHENNAI" },
                { "MADURAJ", "MADURAI" },
                { "MADURAJI", "MADURAI" },
                { "COIMBAT0RE", "COIMBATORE" },
                { "COINBATORE", "COIMBATORE" },
                { "RAMESHWARAN", "RAMESHWARAM" },
                { "RAMESWARAN", "RAMESHWARAM" },
                { "KANYAKUMAR1", "KANYAKUMARI" },
                { "KANYKUMARI", "KANYAKUMARI" },
                { "THOOTHUKUD1", "THOOTHUKUDI" },
                { "TIRUNELVEL1", "TIRUNELVELI" },
                { "THANJAVOOR", "THANJAVUR" },
                { "TANJORE", "THANJAVUR" },
                { "BANGALORE", "BENGALURU" },
                { "BANGALURU", "BENGALURU" },
                { "TNCHY", "TRICHY" },
                { "TRICNY", "TRICHY" },
                { "TRICHL", "TRICHY" },
                { "TUTICORIN", "THOOTHUKUDI" },
                { "NAGERCO1L", "NAGERCOIL" },
                { "NAGERCOJL", "NAGERCOIL" },
        };

        for (String[] pair : corrections) {
            if (upper.equals(pair[0])) {
                log.debug("OCR correction: {} -> {}", text, pair[1]);
                return pair[1];
            }
        }

        return text;
    }

    private static class MatchResult {
        final String candidate;
        final int distance;

        MatchResult(String candidate, int distance) {
            this.candidate = candidate;
            this.distance = distance;
        }
    }
}
