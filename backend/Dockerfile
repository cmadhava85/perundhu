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

# Build application
RUN gradle clean build -x test --no-daemon

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

# Copy JAR from builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Copy health check script
COPY --from=builder /app/health-check.sh health-check.sh
RUN chmod +x health-check.sh

# Change ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD ./health-check.sh || exit 1

# Environment variables
# -Dio.grpc.netty.shaded.io.netty.transport.noNative=true disables native transport
# -Dio.netty.noPreferDirect=true avoids direct buffer issues
ENV JAVA_OPTS="-Xmx1536m -Xms512m -XX:+UseG1GC -XX:+UseStringDeduplication -Dio.grpc.netty.shaded.io.netty.transport.noNative=true" \
    SPRING_PROFILES_ACTIVE=preprod \
    SERVER_PORT=8080

# Run application (using shell form for variable expansion)
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
