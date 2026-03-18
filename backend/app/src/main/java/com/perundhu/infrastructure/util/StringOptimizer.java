package com.perundhu.infrastructure.util;

/**
 * String optimization utilities for Java 21.
 * Production-ready alternatives to String Templates (preview feature).
 * 
 * Provides efficient string building patterns optimized for:
 * - Lower GC pressure
 * - Better JIT optimization
 * - Budget-conscious Cloud Run deployments
 */
public final class StringOptimizer {

    private StringOptimizer() {
        // Utility class
    }

    /**
     * Efficient string concatenation for 2-5 parts.
     * Faster than String.format() for simple cases.
     * Alternative to String Templates (preview).
     * 
     * @param parts String parts to concatenate
     * @return Concatenated string
     */
    public static String concat(Object... parts) {
        if (parts == null || parts.length == 0) {
            return "";
        }
        if (parts.length == 1) {
            return String.valueOf(parts[0]);
        }
        
        // Pre-calculate capacity to avoid StringBuilder resizing
        int capacity = 0;
        for (Object part : parts) {
            if (part != null) {
                capacity += String.valueOf(part).length();
            }
        }
        
        StringBuilder sb = new StringBuilder(capacity);
        for (Object part : parts) {
            if (part != null) {
                sb.append(part);
            }
        }
        return sb.toString();
    }

    /**
     * Format with positional arguments (stable alternative to String Templates).
     * More efficient than String.format for repeated usage.
     * 
     * Example: formatMsg("User {} performed {} at {}", userId, action, timestamp)
     * 
     * @param template Template with {} placeholders
     * @param args Arguments to substitute
     * @return Formatted string
     */
    public static String formatMsg(String template, Object... args) {
        if (args == null || args.length == 0) {
            return template;
        }

        StringBuilder result = new StringBuilder(template.length() + (args.length * 10));
        int argIndex = 0;
        int i = 0;

        while (i < template.length()) {
            if (i < template.length() - 1 && template.charAt(i) == '{' && template.charAt(i + 1) == '}') {
                // Found placeholder {}
                if (argIndex < args.length) {
                    result.append(args[argIndex]);
                    argIndex++;
                }
                i += 2; // Skip {}
            } else {
                result.append(template.charAt(i));
                i++;
            }
        }

        return result.toString();
    }

    /**
     * Build log messages efficiently (common pattern in StructuredLogger).
     * Optimized for minimal allocations.
     * 
     * @param module Module name
     * @param message Log message
     * @param traceId Optional trace ID
     * @param operation Optional operation name
     * @return Formatted log message
     */
    public static String buildLogMessage(String module, String message, String traceId, String operation) {
        int capacity = module.length() + message.length() + 10;
        if (traceId != null) capacity += traceId.length() + 11; // [traceId=]
        if (operation != null) capacity += operation.length() + 6; // [op=]

        StringBuilder sb = new StringBuilder(capacity);
        sb.append('[').append(module).append(']');
        
        if (traceId != null) {
            sb.append("[traceId=").append(traceId).append(']');
        }
        if (operation != null) {
            sb.append("[op=").append(operation).append(']');
        }
        
        sb.append(' ').append(message);
        return sb.toString();
    }

    /**
     * Quote-aware string joining (alternative to String.join with formatting).
     * Useful for building JSON-like strings or quoted lists.
     * 
     * @param delimiter Delimiter between elements
     * @param quoteStrings Whether to quote string values
     * @param elements Elements to join
     * @return Joined string
     */
    public static String joinFormatted(String delimiter, boolean quoteStrings, Object... elements) {
        if (elements == null || elements.length == 0) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < elements.length; i++) {
            if (i > 0) {
                sb.append(delimiter);
            }
            
            Object elem = elements[i];
            if (elem == null) {
                sb.append("null");
            } else if (quoteStrings && elem instanceof String) {
                sb.append('"').append(elem).append('"');
            } else {
                sb.append(elem);
            }
        }
        return sb.toString();
    }
}
