package com.perundhu.domain.port;

/**
 * Port interface for reCAPTCHA token validation.
 *
 * <p>Decouples controllers from the concrete reCAPTCHA implementation so the
 * underlying API (v3 REST vs Enterprise SDK) can be swapped without touching
 * callers.
 */
public interface RecaptchaPort {

    /**
     * Returns {@code true} if reCAPTCHA validation is active and configured.
     * When {@code false}, callers should skip token checks entirely.
     */
    boolean isEnabled();

    /**
     * Validates a reCAPTCHA token for the given action.
     *
     * @param token  the token received from the frontend
     * @param action the expected action name (e.g. "manual_contribution")
     * @return {@code true} if the token is valid and meets the score threshold
     */
    boolean validateToken(String token, String action);
}
