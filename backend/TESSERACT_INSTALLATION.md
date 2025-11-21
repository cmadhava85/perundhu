# Tesseract OCR Installation Guide

## Overview
This guide explains how to install Tesseract OCR with Tamil language support for the Bus Timing Image extraction system.

## macOS Installation

### Using Homebrew (Recommended)

```bash
# Install Tesseract OCR
brew install tesseract

# Install Tamil language data
brew install tesseract-lang

# Verify installation
tesseract --version
tesseract --list-langs
```

Expected output should include `tam` (Tamil) and `eng` (English).

### Manual Download (Alternative)

1. Download Tesseract from: https://github.com/tesseract-ocr/tesseract
2. Download Tamil trained data from: https://github.com/tesseract-ocr/tessdata
3. Place files in: `/opt/homebrew/share/tessdata` (Apple Silicon) or `/usr/local/share/tessdata` (Intel)

## Linux Installation (Ubuntu/Debian)

```bash
# Update package list
sudo apt-get update

# Install Tesseract OCR
sudo apt-get install tesseract-ocr

# Install Tamil language pack
sudo apt-get install tesseract-ocr-tam

# Install English language pack (usually included)
sudo apt-get install tesseract-ocr-eng

# Verify installation
tesseract --version
tesseract --list-langs
```

## Linux Installation (CentOS/RHEL)

```bash
# Install EPEL repository
sudo yum install epel-release

# Install Tesseract
sudo yum install tesseract

# Download Tamil language data manually
cd /usr/share/tesseract-ocr/4.00/tessdata/
sudo wget https://github.com/tesseract-ocr/tessdata/raw/main/tam.traineddata

# Verify
tesseract --list-langs
```

## Windows Installation

1. Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. During installation, select "Tamil" language in the components
3. Add Tesseract to PATH:
   - Default path: `C:\Program Files\Tesseract-OCR`
   - Add to System Environment Variables
4. Set TESSDATA_PREFIX environment variable:
   ```
   TESSDATA_PREFIX=C:\Program Files\Tesseract-OCR\tessdata
   ```

## Docker Installation

```dockerfile
FROM openjdk:17-jdk-slim

# Install Tesseract
RUN apt-get update && \
    apt-get install -y tesseract-ocr tesseract-ocr-tam tesseract-ocr-eng && \
    rm -rf /var/lib/apt/lists/*

# Verify installation
RUN tesseract --list-langs

# Set tessdata path
ENV TESSDATA_PREFIX=/usr/share/tesseract-ocr/4.00/tessdata
```

## Environment Variable Setup

### macOS/Linux

Add to `~/.zshrc` or `~/.bashrc`:

```bash
# For Homebrew installation (Apple Silicon)
export TESSDATA_PREFIX=/opt/homebrew/share/tessdata

# For Homebrew installation (Intel)
export TESSDATA_PREFIX=/usr/local/share/tessdata

# For Linux
export TESSDATA_PREFIX=/usr/share/tesseract-ocr/4.00/tessdata
```

Apply changes:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

### Windows

1. Open System Properties → Environment Variables
2. Add new System Variable:
   - Name: `TESSDATA_PREFIX`
   - Value: `C:\Program Files\Tesseract-OCR\tessdata`

## Verify Tamil Language Support

```bash
# Check if Tamil is available
tesseract --list-langs | grep tam

# Test with an image
tesseract sample_tamil.jpg output -l tam+eng

# View extracted text
cat output.txt
```

## Testing the Integration

### 1. Create a test image with Tamil and English text

Save this as `test_bus_timing.jpg` (or use an actual bus timing board photo).

### 2. Run a test extraction

```bash
# Go to backend directory
cd /Users/mchand69/Documents/perundhu/backend

# Run a simple test
tesseract test_bus_timing.jpg output -l tam+eng --psm 1

# Check output
cat output.txt
```

## Troubleshooting

### Issue: "Error opening data file"
**Solution**: Set TESSDATA_PREFIX environment variable correctly

```bash
# Find tessdata location
find /usr -name "tessdata" 2>/dev/null
find /opt -name "tessdata" 2>/dev/null

# Set the variable
export TESSDATA_PREFIX=/path/to/tessdata
```

### Issue: "tam" language not found
**Solution**: Download Tamil trained data manually

```bash
# macOS Homebrew
cd /opt/homebrew/share/tessdata
sudo curl -L -O https://github.com/tesseract-ocr/tessdata/raw/main/tam.traineddata

# Linux
cd /usr/share/tesseract-ocr/4.00/tessdata
sudo wget https://github.com/tesseract-ocr/tessdata/raw/main/tam.traineddata
```

### Issue: Poor OCR accuracy
**Solutions**:
1. Increase image resolution (minimum 300 DPI recommended)
2. Ensure good lighting in photos
3. Crop image to focus on timing board only
4. Use preprocessing (already implemented in `TesseractOcrService`)

### Issue: Java can't find Tesseract library
**Solution**: Install tess4j native dependencies

```bash
# macOS
brew install leptonica

# Linux
sudo apt-get install libleptonica-dev
```

## Application Configuration

### Option 1: Set in application.properties

```properties
# Tesseract configuration
tesseract.datapath=/opt/homebrew/share/tessdata
tesseract.language=tam+eng
```

### Option 2: Set as environment variable (already implemented)

The `TesseractOcrService` automatically detects the `TESSDATA_PREFIX` environment variable.

## Performance Optimization

### Use Faster Model (Less Accurate)

Download "fast" trained data for quicker processing:

```bash
cd $TESSDATA_PREFIX
sudo wget https://github.com/tesseract-ocr/tessdata_fast/raw/main/tam.traineddata
```

### Use Best Model (More Accurate)

Download "best" trained data for higher accuracy:

```bash
cd $TESSDATA_PREFIX
sudo wget https://github.com/tesseract-ocr/tessdata_best/raw/main/tam.traineddata
```

## Production Deployment

### Cloud Deployment (GCP Cloud Run / AWS ECS)

Update Dockerfile:

```dockerfile
FROM openjdk:17-jdk-slim

# Install Tesseract with Tamil support
RUN apt-get update && \
    apt-get install -y \
        tesseract-ocr \
        tesseract-ocr-tam \
        tesseract-ocr-eng \
        libleptonica-dev && \
    rm -rf /var/lib/apt/lists/*

# Set environment variable
ENV TESSDATA_PREFIX=/usr/share/tesseract-ocr/4.00/tessdata

# Copy application
COPY build/libs/*.jar app.jar

ENTRYPOINT ["java", "-jar", "/app.jar"]
```

## Next Steps

1. ✅ Install Tesseract OCR
2. ✅ Verify Tamil language support
3. ⏭️ Test with sample bus timing board images
4. ⏭️ Implement file storage service
5. ⏭️ Create REST API endpoints
6. ⏭️ Test end-to-end workflow

## Resources

- Tesseract Documentation: https://tesseract-ocr.github.io/
- Tamil Language Data: https://github.com/tesseract-ocr/tessdata
- tess4j (Java wrapper): http://tess4j.sourceforge.net/
- Tesseract Best Practices: https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html
