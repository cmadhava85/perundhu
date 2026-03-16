# Multi-stage Dockerfile for Perundhu Backend

# Build stage
FROM gradle:8-jdk21 AS builder

WORKDIR /app

# Copy gradle files
COPY build.gradle settings.gradle gradle.properties ./
COPY gradle/ gradle/

# Copy all source modules
COPY app/ app/
COPY infrastructure/ infrastructure/

# Copy health check script
COPY health-check.sh ./

# Build application (skip tests and SpotBugs for Docker build)
RUN gradle clean build -x test -x spotbugsMain -x spotbugsTest --no-daemon

# Runtime stage - Use standard JRE (not alpine) for glibc compatibility with native libraries
FROM eclipse-temurin:21-jre-jammy

# Install necessary packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy JAR from builder stage (only the main app jar with dependencies)
COPY --from=builder /app/build/libs/perundhu-backend.jar app.jar

# Copy health check script
COPY --from=builder /app/health-check.sh health-check.sh
RUN chmod +x health-check.sh

# Change ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check using HTTP endpoint (faster than TCP probe)
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health/liveness || exit 1

# Environment variables
# Memory sizing: container-aware. Works for ALL environments automatically:
# - Preprod (512Mi):   50% heap = ~256m + 128m metaspace + 64m code cache = ~448m, leaving ~64m for JVM native/OS
# - Production (1024Mi): 50% heap = ~512m + 128m metaspace + 64m code cache = ~704m, leaving ~320m for JVM native/OS
# MaxRAMPercentage=50: reduced from 75 to prevent Linux OOM (exit 137). Metaspace stays at 128m
# because Cloud SQL socket factory class loading needs it (96m caused Metaspace OutOfMemoryError).
ENV JAVA_OPTS="-XX:MaxRAMPercentage=50.0 -XX:InitialRAMPercentage=25.0 -XX:+UseG1GC -XX:+UseStringDeduplication -XX:MaxMetaspaceSize=128m -XX:ReservedCodeCacheSize=64m -Dio.grpc.netty.shaded.io.netty.transport.noNative=true" \
    SPRING_PROFILES_ACTIVE=production \
    SERVER_PORT=8080

# Run application (using shell form for variable expansion)
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
