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

# Install necessary packages and create app user in a single layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-tam \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy JAR from builder stage (only the main app jar with dependencies)
COPY --from=builder /app/build/libs/perundhu-backend.jar app.jar

# Copy health check script
COPY --from=builder /app/health-check.sh health-check.sh
RUN chmod +x health-check.sh \
    && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check using HTTP endpoint (faster than TCP probe)
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health/liveness || exit 1

# Environment variables
# Memory sizing optimized for 512Mi container (db-f1-micro budget):
# - Heap: 35% of 512Mi = ~180Mi (reduced to make room for metaspace)
# - Metaspace: 200Mi (increased from 128m due to OutOfMemoryError with Java 21 + JPA)
# - CodeCache: 40Mi (reduced from 64m, still sufficient for tiered compilation)
# - Native/threads/OS: ~92Mi remaining
# TieredStopAtLevel=1: Faster startup (C1 compiler only), lower memory, acceptable for scale-to-zero
ENV JAVA_OPTS="-XX:MaxRAMPercentage=35.0 -XX:InitialRAMPercentage=20.0 -XX:+UseG1GC -XX:+UseStringDeduplication -XX:MetaspaceSize=200m -XX:MaxMetaspaceSize=200m -XX:ReservedCodeCacheSize=40m -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -Dio.grpc.netty.shaded.io.netty.transport.noNative=true" \
    SPRING_PROFILES_ACTIVE=production \
    SERVER_PORT=8080

# Run application (using shell form for variable expansion)
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
