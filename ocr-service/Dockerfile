# =============================================================================
# Multi-stage Docker build for PaddleOCR service
# Reduces final image size by ~40% (from ~3GB to ~1.8GB)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder - Install dependencies and download models
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build dependencies
RUN rm -rf /var/lib/apt/lists/* && \
    apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment for cleaner dependency management
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Download PaddleOCR models at build time (Tamil + English)
# Models are cached in /root/.paddleocr/
RUN python -c "from paddleocr import PaddleOCR; PaddleOCR(lang='ta')"

# -----------------------------------------------------------------------------
# Stage 2: Runtime - Minimal image with only runtime dependencies
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install only runtime system dependencies (no build tools)
# Use retry logic for apt-get to handle transient network failures
# libgl1 (formerly libgl1-mesa-glx) needed for OpenCV
# libglib2.0-0 needed for GLib, libgomp1 for OpenMP
RUN rm -rf /var/lib/apt/lists/* && \
    apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
    curl \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create non-root user for security BEFORE copying models
RUN useradd --create-home --shell /bin/bash appuser

# Copy pre-downloaded PaddleOCR models to appuser's home directory
# PaddleOCR looks for models in ~/.paddleocr/
COPY --from=builder /root/.paddleocr /home/appuser/.paddleocr

# Copy application code
COPY main.py .

# Set ownership of all app files
RUN chown -R appuser:appuser /app /home/appuser/.paddleocr

USER appuser

# Set HOME explicitly for PaddleOCR to find models
ENV HOME=/home/appuser

# Expose port
EXPOSE 8081

# Health check with longer start period for model loading
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8081/health || exit 1

# Run the service
CMD ["python", "main.py"]
