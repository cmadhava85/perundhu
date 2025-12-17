package com.perundhu.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filter for JWT authentication
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtTokenProvider tokenProvider;

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    try {
      String jwt = getJwtFromRequest(request);

      // Only process if it looks like a valid JWT (has 2 dots for
      // header.payload.signature)
      if (StringUtils.hasText(jwt) && isValidJwtFormat(jwt) && tokenProvider.validateToken(jwt)) {
        String username = tokenProvider.getUsernameFromToken(jwt);
        List<SimpleGrantedAuthority> authorities = tokenProvider.getAuthoritiesFromToken(jwt);

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
            username, null, authorities);

        SecurityContextHolder.getContext().setAuthentication(authentication);
      }
    } catch (Exception ex) {
      log.debug("Could not set user authentication in security context: {}", ex.getMessage());
    }

    filterChain.doFilter(request, response);
  }

  /**
   * Check if the token has valid JWT format (header.payload.signature)
   * This prevents trying to parse Basic Auth credentials or other non-JWT tokens
   */
  private boolean isValidJwtFormat(String token) {
    if (token == null || token.isEmpty()) {
      return false;
    }
    // JWT tokens must have exactly 2 period characters (3 parts)
    long periodCount = token.chars().filter(ch -> ch == '.').count();
    return periodCount == 2;
  }

  private String getJwtFromRequest(HttpServletRequest request) {
    String bearerToken = request.getHeader("Authorization");
    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
      return bearerToken.substring(7);
    }
    return null;
  }
}