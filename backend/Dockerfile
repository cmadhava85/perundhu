# Multi-stage Dockerfile for Perundhu Backend

# Build stage
FROM gradle:7-jdk17 AS builder

WORKDIR /app

# Copy gradle files
COPY build.gradle settings.gradle gradle.properties ./
COPY gradle/ gradle/

# Copy all source modules
COPY app/ app/
COPY infrastructure/ infrastructure/
COPY src/ src/

# Build application
RUN gradle clean build -x test --no-daemon

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

# Install necessary packages
RUN apk add --no-cache \
    curl \
    netcat-openbsd

# Create app user (alpine uses addgroup/adduser)
RUN addgroup -S appuser && adduser -S -G appuser appuser

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
ENV JAVA_OPTS="-Xmx1536m -Xms512m -XX:+UseG1GC -XX:+UseStringDeduplication" \
    SPRING_PROFILES_ACTIVE=preprod \
    SERVER_PORT=8080

# Run application
CMD java $JAVA_OPTS -jar app.jar
