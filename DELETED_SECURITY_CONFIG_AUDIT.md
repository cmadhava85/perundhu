# Deleted SecurityConfig Files Audit
**Date:** January 17, 2026  
**Status:** Architecture Cleanup - Moved from `infrastructure/security/` to `infrastructure/config/`

## Summary
Two old SecurityConfig files were deleted due to architecture restructuring:
1. `infrastructure/security/SecurityConfig.java` (Legacy JWT-based config)
2. `infrastructure/security/JwtSecurityConfig.java` (Specialized JWT config)

These were replaced with the new unified `infrastructure/config/SecurityConfig.java`

---

## Deleted File 1: SecurityConfig.java (Old Location)
**Path:** `backend/app/src/main/java/com/perundhu/infrastructure/security/SecurityConfig.java`  
**Deleted in commit:** `2fbc267` ("UI improvements: compact forms, Quick Entry rename, bus card cleanup")  
**Last version reference:** `0dd0a45` ("production ready need testing")

### Old Configuration Details:
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Profile("legacy-custom-jwt") // Legacy profile - not used
public class SecurityConfig {
    
    // Dependencies on old JWT filters
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    
    // Security Chain:
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        return http
            .cors().configurationSource(corsConfigurationSource())
            .and()
            .csrf().disable()
            .authorizeHttpRequests()
            // Public endpoints (overly broad)
            .requestMatchers("/api/v1/public/**").permitAll()
            .requestMatchers("/api/v1/auth/**").permitAll()
            // Admin endpoints require ADMIN role
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            // Other authenticated endpoints
            .anyRequest().authenticated()
            .and()
            .exceptionHandling()
                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
            .and()
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .addFilterBefore(jwtAuthenticationFilter, 
                UsernamePasswordAuthenticationFilter.class)
            .build();
    }
    
    // CORS Configuration (Legacy)
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("*")); // ⚠️ Insecure - allows all origins
        configuration.setAllowedMethods(
            Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(
            Arrays.asList("Authorization", "Content-Type", "X-Auth-Token", "Accept-Language"));
        configuration.setExposedHeaders(Arrays.asList("X-Auth-Token"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

### Key Issues with Old Config:
1. **Overly Permissive CORS:** `setAllowedOrigins(Arrays.asList("*"))` - allows any origin
2. **Simple Authorization:** Only checks for ADMIN role, no granular permission control
3. **Single Filter Strategy:** Only JwtAuthenticationFilter, no rate limiting or origin validation
4. **Legacy Profile:** Marked with `@Profile("legacy-custom-jwt")` indicating it was deprecated
5. **Limited Endpoint Protection:** Broad `/api/v1/public/**` and `/api/v1/auth/**` patterns

---

## Deleted File 2: JwtSecurityConfig.java
**Path:** `backend/app/src/main/java/com/perundhu/infrastructure/security/JwtSecurityConfig.java`  
**Status:** Also deleted in the same cleanup

### Why These Files Were Deleted:
1. **Architecture Mismatch:** Old files used custom JWT filters, new architecture uses Spring Security OAuth2
2. **Security Improvements:** New config has:
   - Rate limiting filter (RateLimitingFilter)
   - Origin validation filter (OriginValidationFilter)
   - API key validation (ApiKeyValidationFilter)
   - Admin basic auth (AdminBasicAuthFilter)
3. **Better CORS Control:** Configurable allowed origins instead of wildcard
4. **Granular Authorization:** Use of `@PreAuthorize` annotations instead of role-based checks

---

## New Architecture: SecurityConfig.java
**Path:** `backend/app/src/main/java/com/perundhu/infrastructure/config/SecurityConfig.java`  
**Status:** ✅ Current, Active Configuration

### New Configuration Structure:
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@Profile("!prod") // Only active in non-production
public class SecurityConfig {
    
    // Filter Chain Order:
    1. RateLimitingFilter - Controls request rate
    2. OriginValidationFilter - Validates origin headers
    3. ApiKeyValidationFilter - Validates API keys
    4. AdminBasicAuthFilter - Basic auth for admin endpoints
    5. Spring Security's Authorization Filters
    
    // Security Rules:
    // Public endpoints - no authentication
    .requestMatchers("/api/v1/bus-schedules/**").permitAll()
    .requestMatchers("/api/v1/buses/**").permitAll()
    .requestMatchers("/api/v1/stops/**").permitAll()
    .requestMatchers("/api/v1/locations/**").permitAll()
    .requestMatchers("/api/images/**").permitAll()
    .requestMatchers("/actuator/health").permitAll()
    
    // Authenticated endpoints
    .requestMatchers("/api/v1/contributions/manage/**").authenticated()
    
    // Admin endpoints (public for login, protected for others)
    .requestMatchers("/api/admin/auth/**").permitAll()
    .requestMatchers("/api/admin/**").authenticated()
    
    // CORS Configuration (Secure)
    setAllowedOrigins(configurable) // Only specific origins allowed
    setAllowedMethods(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
    setAllowCredentials(true)
```

---

## Comparison: Old vs New Architecture

| Aspect | Old (Deleted) | New (Current) |
|--------|---------------|---------------|
| **Location** | `infrastructure/security/` | `infrastructure/config/` |
| **Profile** | `legacy-custom-jwt` | `!prod` (all non-production) |
| **Filter Count** | 1 (JwtAuthenticationFilter) | 5 (multi-layer defense) |
| **CORS Origins** | Wildcard `*` (insecure) | Configurable (secure) |
| **Rate Limiting** | None | Yes (RateLimitingFilter) |
| **Origin Validation** | None | Yes (OriginValidationFilter) |
| **API Key Support** | No | Yes (ApiKeyValidationFilter) |
| **Admin Auth** | Role-based only | Basic Auth + Role-based |
| **Authorization** | Simple roles | Granular @PreAuthorize |

---

## Verification Steps

### Check Current Config is Being Used:
```bash
# Verify SecurityConfig in use
find backend/app/src -name "SecurityConfig.java" -type f

# Should return only:
# backend/app/src/main/java/com/perundhu/infrastructure/config/SecurityConfig.java
```

### Check Deleted Files Don't Exist:
```bash
# These should NOT exist
ls backend/app/src/main/java/com/perundhu/infrastructure/security/SecurityConfig.java 2>/dev/null
ls backend/app/src/main/java/com/perundhu/infrastructure/security/JwtSecurityConfig.java 2>/dev/null

# Both should return: No such file or directory
```

### Verify Git History:
```bash
# Shows deletion commits
git log --diff-filter=D --summary | grep -i "securityconfig"

# Result:
# delete mode 100644 backend/app/src/main/java/com/perundhu/infrastructure/security/JwtSecurityConfig.java
# delete mode 100644 backend/app/src/main/java/com/perundhu/infrastructure/security/SecurityConfig.java
```

---

## Notes

✅ **Cleanup Complete:** Old security configs have been properly removed  
✅ **Architecture Updated:** New multi-filter approach is active  
⚠️ **OriginValidationFilter Issue:** Currently blocking `/api/v1/bus-schedules/locations` with 403 - needs investigation  

The deletion was intentional as part of the architecture modernization from simple JWT auth to a layered security approach with rate limiting, origin validation, and API key support.
