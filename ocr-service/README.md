# PaddleOCR Microservice

This is a Python-based OCR microservice using PaddleOCR for text extraction from images.
It provides much better Tamil text recognition than Tesseract.

## Features

- **Tamil Text Recognition**: PaddleOCR uses deep learning models trained on Tamil script (PP-OCRv5)
- **English Text Recognition**: Also supports English text
- **REST API**: FastAPI-based REST endpoints
- **Bounding Boxes**: Returns text with position information

## Quick Start

### Option 1: Run directly with Python

```bash
cd ocr-service
./start.sh
```

This will:
1. Create a Python virtual environment
2. Install dependencies
3. Start the service on port 8081

### Option 2: Run with Docker

```bash
cd ocr-service
docker build -t perundhu-ocr-service .
docker run -p 8081:8081 perundhu-ocr-service
```

## API Endpoints

### Health Check
```
GET /health
```
Returns service status.

### Extract Text from File
```
POST /extract
Content-Type: multipart/form-data

file: <image file>
```

Response:
```json
{
  "success": true,
  "extracted_text": "Full text...",
  "lines": ["Line 1", "Line 2", ...],
  "confidence": 0.85,
  "details": [
    {
      "text": "Word",
      "confidence": 0.95,
      "bounding_box": [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
    }
  ]
}
```

### Extract Text from URL
```
POST /extract-url
Content-Type: application/json

{
  "url": "https://example.com/image.jpg"
}
```

## Configuration

Environment variables:
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8081)

## Integration with Java Backend

The Java backend automatically uses this service when available.

Configure in `application.properties`:
```properties
ocr.service.url=http://localhost:8081
ocr.service.timeout=60
```

The `OcrServiceAdapter` will:
1. Check if OCR service is available
2. Use PaddleOCR for OCR extraction
3. Fall back to Tesseract if OCR service is unavailable

## Requirements

- Python 3.11+
- ~2GB disk space (for PaddleOCR models)
- ~4GB RAM (for loading models)

## Troubleshooting

### Models downloading slowly
PaddleOCR downloads models on first run (~500MB). This is a one-time download.

### Out of memory
Reduce the number of languages or use a smaller GPU/CPU.

### Service not starting
Check if port 8081 is available:
```bash
lsof -i :8081
```
