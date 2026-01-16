# Anti-Scraping Strategy for Perundhu

## Overview
This document outlines multiple layers of defense to prevent scrapers from fetching data from your bus transit application.

---

## 1. BACKEND PROTECTION (Java/Spring Boot)

### 1.1 Rate Limiting
```java
// Add to pom.xml or build.gradle
implementation 'io.github.bucket4j:bucket4j-core:7.6.0'
```

**Spring Boot Configuration**:
```java
// RateLimitingConfig.java
@Configuration
public class RateLimitingConfig {
    
    @Bean
    public RateLimitingInterceptor rateLimitingInterceptor() {
        return new RateLimitingInterceptor();
    }
}

// RateLimitingInterceptor.java
@Component
public class RateLimitingInterceptor implements HandlerInterceptor {
    
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response, 
                            Object handler) throws Exception {
        String ip = getClientIp(request);
        Bucket bucket = cache.computeIfAbsent(ip, k -> createNewBucket());
        
        if (bucket.tryConsume(1)) {
            return true;
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Rate limit exceeded");
            return false;
        }
    }
    
    private Bucket createNewBucket() {
        Bandwidth limit = Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1)));
        return Bucket4j.builder()
            .addLimit(limit)
            .build();
    }
    
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0];
        }
        return request.getRemoteAddr();
    }
}
```

### 1.2 User-Agent Detection
```java
// UserAgentFilter.java
@Component
public class UserAgentFilter implements Filter {
    
    private static final List<String> SCRAPER_AGENTS = Arrays.asList(
        "bot", "crawler", "spider", "scraper", "python",
        "curl", "wget", "libwww", "httplib", "scrapy"
    );
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, 
                        FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String userAgent = httpRequest.getHeader("User-Agent");
        
        if (userAgent == null || isSuspiciousUserAgent(userAgent)) {
            httpResponse.setStatus(HttpStatus.FORBIDDEN.value());
            return;
        }
        
        chain.doFilter(request, response);
    }
    
    private boolean isSuspiciousUserAgent(String userAgent) {
        return SCRAPER_AGENTS.stream()
            .anyMatch(agent -> userAgent.toLowerCase().contains(agent));
    }
}
```

### 1.3 API Key Authentication
```java
// ApiKeyAuthenticationFilter.java
@Component
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {
    
    private final ApiKeyRepository apiKeyRepository;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {
        
        String apiKey = request.getHeader("X-API-Key");
        
        if (apiKey == null || !isValidApiKey(apiKey)) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.getWriter().write("Invalid API Key");
            return;
        }
        
        filterChain.doFilter(request, response);
    }
    
    private boolean isValidApiKey(String apiKey) {
        return apiKeyRepository.existsByKeyAndActiveTrue(apiKey);
    }
}
```

### 1.4 IP Whitelisting/Blacklisting
```java
// IpSecurityConfig.java
@Component
public class IpSecurityFilter implements Filter {
    
    @Value("${app.security.ip.whitelist:}")
    private String whitelist;
    
    @Value("${app.security.ip.blacklist:}")
    private String blacklist;
    
    private List<String> allowedIps;
    private List<String> deniedIps;
    
    @PostConstruct
    public void init() {
        allowedIps = Arrays.asList(whitelist.split(","));
        deniedIps = Arrays.asList(blacklist.split(","));
    }
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                        FilterChain chain) throws IOException, ServletException {
        String ip = getClientIp((HttpServletRequest) request);
        
        if (!deniedIps.isEmpty() && deniedIps.contains(ip)) {
            ((HttpServletResponse) response).setStatus(HttpStatus.FORBIDDEN.value());
            return;
        }
        
        if (!allowedIps.isEmpty() && !allowedIps.contains(ip)) {
            ((HttpServletResponse) response).setStatus(HttpStatus.FORBIDDEN.value());
            return;
        }
        
        chain.doFilter(request, response);
    }
    
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0];
        }
        return request.getRemoteAddr();
    }
}
```

### 1.5 Response Data Obfuscation
```java
// DataObfuscationUtil.java
@Service
public class DataObfuscationUtil {
    
    /**
     * Return limited data to prevent bulk scraping
     */
    public Page<BusDTO> limitedResponseData(Page<BusDTO> fullData) {
        List<BusDTO> limited = fullData.getContent().stream()
            .limit(10) // Limit results
            .map(this::obfuscateSensitiveFields)
            .collect(Collectors.toList());
        
        return new PageImpl<>(limited, fullData.getPageable(), fullData.getTotalElements());
    }
    
    private BusDTO obfuscateSensitiveFields(BusDTO bus) {
        // Remove sensitive data
        bus.setDriverPhone(maskPhone(bus.getDriverPhone()));
        bus.setOperatorDetails(null); // Don't expose details
        return bus;
    }
    
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "***";
        return phone.substring(0, 2) + "****" + phone.substring(phone.length() - 2);
    }
}
```

### 1.6 CAPTCHA Integration
```java
// RecaptchaValidation.java (you already have this!)
@Service
public class RecaptchaService {
    
    @Value("${recaptcha.secret}")
    private String recaptchaSecret;
    
    public boolean verifyRecaptcha(String token) {
        // Use your existing RecaptchaService
        // Add additional checks for suspicious patterns
        return true;
    }
}
```

---

## 2. DATABASE PROTECTION

### 2.1 Query Rate Limiting
```sql
-- Add to your Flyway migrations
-- V99__add_api_rate_limiting_table.sql

CREATE TABLE IF NOT EXISTS api_rate_limit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    client_ip VARCHAR(45) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_count INT DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_request TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_ip_endpoint (client_ip, endpoint),
    INDEX idx_window_start (window_start)
);

-- Clean up old rate limit records (add to maintenance job)
DELETE FROM api_rate_limit 
WHERE window_start < DATE_SUB(NOW(), INTERVAL 1 HOUR);
```

### 2.2 Database Access Control
```sql
-- Create read-only user for public APIs
CREATE USER 'app_readonly'@'%' IDENTIFIED BY 'secure_password';
GRANT SELECT ON perundhu.* TO 'app_readonly'@'%';

-- Restrict sensitive tables
REVOKE SELECT ON perundhu.admin_users FROM 'app_readonly'@'%';
REVOKE SELECT ON perundhu.user_sessions FROM 'app_readonly'@'%';
REVOKE SELECT ON perundhu.api_keys FROM 'app_readonly'@'%';
```

---

## 3. FRONTEND PROTECTION (React/TypeScript)

### 3.1 JavaScript Obfuscation
```bash
# Add to package.json
"scripts": {
  "build": "vite build && npm run obfuscate",
  "obfuscate": "javascript-obfuscator src/main.tsx --output dist/"
}

npm install --save-dev javascript-obfuscator
```

### 3.2 Content Security Policy
```typescript
// vite.config.ts
export default {
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    }
  }
}
```

### 3.3 Right-Click Protection
```typescript
// DisableRightClick.tsx
export const DisableRightClick: React.FC<{children: React.ReactNode}> = ({children}) => {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };
  
  return (
    <div onContextMenu={handleContextMenu}>
      {children}
    </div>
  );
};
```

### 3.4 API Endpoint Obfuscation
```typescript
// api.ts - Don't expose actual endpoint patterns
const API_ENDPOINTS = {
  buses: '/api/buses', // Hide actual structure
  routes: '/api/routes',
  schedules: '/api/schedules'
};

// Add random delays to requests
const randomDelay = () => Math.random() * 1000 + 500;

export const fetchBuses = async () => {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  const response = await fetch(API_ENDPOINTS.buses);
  return response.json();
};
```

---

## 4. INFRASTRUCTURE PROTECTION (GCP)

### 4.1 Cloud Armor Rules (Terraform)
```hcl
# infrastructure/modules/cloud-armor.tf

resource "google_compute_security_policy" "scraper_protection" {
  name   = "scraper-protection-policy"
  
  # Block common scraper user agents
  rule {
    action   = "deny(403)"
    priority = "100"
    match {
      expr {
        expression = "origin.region_code == 'CN' || origin.region_code == 'RU'"
      }
    }
    description = "Deny from high-scraping regions"
  }
  
  # Rate limiting rule
  rule {
    action   = "rate_based_ban"
    priority = "200"
    match {
      versioned_expr = "SOL_2_1"
      expr {
        expression = "true"
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
      ban_duration_sec = 600
    }
  }
  
  # Allow legitimate traffic
  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SOL_2_1"
      expr {
        expression = "true"
      }
    }
  }
}
```

### 4.2 Cloud CDN with Cache Rules
```hcl
# infrastructure/modules/cdn.tf

resource "google_compute_backend_service" "scraper_protected" {
  name            = "bus-api-backend"
  protocol        = "HTTP"
  timeout_sec     = 30
  
  backend {
    group = google_compute_instance_group.app_servers.id
  }
  
  # Cache public endpoints only
  cdn_policy {
    cache_mode = "CACHE_ALL_STATIC"
    
    # Don't cache sensitive endpoints
    negative_caching = true
    negative_caching_ttl = 60
    
    client_ttl = 3600
    default_ttl = 1800
    max_ttl = 3600
  }
  
  log_config {
    enable      = true
    sample_rate = 1.0
  }
  
  security_policy = google_compute_security_policy.scraper_protection.id
}
```

---

## 5. MONITORING & LOGGING

### 5.1 Scraper Detection Logging
```java
// ScraperDetectionService.java
@Service
@Slf4j
public class ScraperDetectionService {
    
    @Async
    public void logSuspiciousActivity(HttpServletRequest request, String reason) {
        String ip = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");
        String endpoint = request.getRequestURI();
        
        log.warn("SUSPICIOUS_ACTIVITY | IP: {} | Reason: {} | Endpoint: {} | UA: {}",
                ip, reason, endpoint, userAgent);
        
        // Store in database for analysis
        suspiciousActivityRepository.save(SuspiciousActivity.builder()
            .clientIp(ip)
            .userAgent(userAgent)
            .endpoint(endpoint)
            .reason(reason)
            .timestamp(LocalDateTime.now())
            .build());
    }
}
```

### 5.2 Alerts for Scraper Activity
```yaml
# application.properties

# Email alerts for suspicious activity
app.alerts.email.enabled=true
app.alerts.email.recipients=admin@perundhu.in
app.alerts.rate-limit-threshold=1000 # Alert if 1000+ requests from single IP

# Metrics
spring.jpa.show-sql=false
logging.level.com.perundhu=INFO
logging.level.com.perundhu.security=DEBUG
```

---

## 6. ROBOTS.TXT & META TAGS

### 6.1 Robots.txt
```
# public/robots.txt
User-agent: *
Disallow: /api/
Disallow: /admin/
Disallow: /private/
Disallow: /uploads/

# Specific scraper blocking
User-agent: MJ12bot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /
```

### 6.2 Meta Tags
```html
<!-- index.html -->
<meta name="robots" content="index, follow, noarchive, nosnippet">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="description" content="Perundhu - Bus Tracking System">
```

---

## 7. IMPLEMENTATION PRIORITY

| Priority | Layer | Implementation |
|----------|-------|-----------------|
| 🔴 **HIGH** | Rate Limiting | 1-2 hours |
| 🔴 **HIGH** | User-Agent Filtering | 30 minutes |
| 🔴 **HIGH** | API Key Authentication | 2 hours |
| 🟠 **MEDIUM** | IP Whitelisting | 1 hour |
| 🟠 **MEDIUM** | Cloud Armor (GCP) | 2 hours |
| 🟠 **MEDIUM** | Logging & Monitoring | 2 hours |
| 🟡 **LOW** | JS Obfuscation | 1 hour |
| 🟡 **LOW** | Right-Click Protection | 30 minutes |

---

## 8. MONITORING DASHBOARD

Monitor these metrics:
- **Request Rate**: Requests per IP per minute
- **Failed Auth Attempts**: API key validation failures
- **Suspicious User Agents**: Bot/scraper detection
- **Geographic Patterns**: Unusual IP locations
- **API Response Times**: Detect brute force attempts

---

## 9. LEGAL CONSIDERATIONS

Add to your Terms of Service:
```
6. PROHIBITED ACTIVITIES
Users may not:
- Scrape, screen-scrape, or collect data from our services
- Use automated tools to extract information
- Violate rate limits or attempt DoS attacks
- Reverse-engineer our APIs or systems
- Use our data commercially without permission

Violators will be:
- IP-blocked permanently
- Reported to relevant authorities
- Pursued legally for damages
```

---

## Configuration Template

Create `application-security.properties`:

```properties
# Rate Limiting
app.ratelimit.enabled=true
app.ratelimit.requests-per-minute=100
app.ratelimit.burst-capacity=200

# IP Security
app.security.ip.whitelist=
app.security.ip.blacklist=

# API Key
app.api.key.enabled=true
app.api.key.header-name=X-API-Key

# User-Agent
app.security.useragent.block-bots=true

# Monitoring
app.monitoring.suspicious-activity.enabled=true
app.monitoring.alert-threshold=50
```

---

## Testing Your Defenses

```bash
# Test rate limiting
for i in {1..150}; do curl http://localhost:8080/api/buses; done

# Test user-agent blocking
curl -H "User-Agent: Python-Scraper" http://localhost:8080/api/buses

# Test API key requirement
curl -H "X-API-Key: invalid" http://localhost:8080/api/buses
```

---

## References

- OWASP API Security: https://owasp.org/www-project-api-security/
- Spring Security Rate Limiting: https://github.com/bucket4j/bucket4j
- GCP Cloud Armor: https://cloud.google.com/armor
