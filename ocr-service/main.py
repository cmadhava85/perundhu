"""
PaddleOCR Microservice for Perundhu Bus Schedule App
Provides better Tamil text recognition than Tesseract
"""

import os
import io
import logging
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from paddleocr import PaddleOCR
from PIL import Image
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Perundhu OCR Service",
    description="PaddleOCR-based text extraction for Tamil bus schedules",
    version="1.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize PaddleOCR with Tamil and English support
# PaddleOCR supports multiple languages including Tamil
logger.info("Initializing PaddleOCR with Tamil language support...")
# Use 'ta' for Tamil, PaddleOCR will auto-download models
ocr = PaddleOCR(
    lang='ta',                        # Tamil - also recognizes English numerals
    use_textline_orientation=True     # Detect text direction
)
logger.info("PaddleOCR initialized successfully")

# Tamil OCR correction dictionary for common misrecognitions
# Maps incorrect OCR output -> correct Tamil text
TAMIL_CORRECTIONS = {
    # City names
    'தம்ழ்நாடு': 'தமிழ்நாடு',
    'தம்ழ்': 'தமிழ்',
    'கருச்சி': 'திருச்சி',
    'தஇிறுச்சி': 'திருச்சி',
    'தஇருச்சி': 'திருச்சி',
    'திருச்ச': 'திருச்சி',
    'பெங்களுூரு': 'பெங்களூரு',
    'பெங்களூ®ரு': 'பெங்களூரு',
    'மஙுரை': 'மதுரை',
    'மாதுரை': 'மதுரை',
    'Lமரை': 'மதுரை',
    'Lமகரை': 'மதுரை',
    'சலம்': 'சேலம்',
    'ும்பகொணம்': 'கும்பகோணம்',
    'கும்பகொணம்': 'கும்பகோணம்',
    'ஃம்பகொணம்': 'கும்பகோணம்',
    'காயம்புத்கூார்': 'கோயம்புத்தூர்',
    'காயம்புத்கூர்': 'கோயம்புத்தூர்',
    'கிகசசெந்கார்': 'திருச்செந்தூர்',
    'கிறுச்செந்கூர்': 'திருச்செந்தூர்',
    'திருநெல்வெலி': 'திருநெல்வேலி',
    'கன்னியாகுமரி': 'கன்னியாகுமரி',  # already correct but ensure
    'Bறபரம': 'தாராபுரம்',
    'Bாறாபுரம்': 'தாராபுரம்',
    'ாறாபுரம்': 'தாராபுரம்',
    'கககுக்குiட': 'தூத்துக்குடி',
    'BBகக19': 'தூத்துக்குடி',
    'ஒent': 'ஒசூர்',
    'இராமேஸ்வேம்': 'இராமேஸ்வரம்',
    'பேதுந்து': 'பேருந்து',
    'பேதற்துகள்': 'பேருந்துகள்',
    'பேதுந்துகள்': 'பேருந்துகள்',
    'நலையைம்': 'நிலையம்',
    'தெொலைதூமர்': 'தொலைதூரம்',
    'போக்குவரத்துக்': 'போக்குவரத்துக்',  # keep as is
    'கழகம்': 'கழகம்',  # keep as is
    'அரசப்': 'அரசு',
    # Common OCR noise patterns
    '@tristcl': '',
    '@tnstcl': '',
    '@tr': '',
    '@tnetohlaoin': '',
    '@bstcbloelim': '',
    'tcblog.in': '',
    'stcblog': '',
    'tnstcbl': '',
    'bg-in': '',
    'log.in': '',
    'astcbloLin': '',
    'ccblog.in': '',
    'gOhgah': '',
    'Lin': '',
    'LDCU': '',
    'LC': '',
    'கa்': 'கரூர்',
    'கCt': 'கரூர்',
    'Lர': 'மதுரை',
}


def correct_tamil_text(text: str) -> str:
    """Apply Tamil OCR corrections to fix common misrecognitions"""
    if not text:
        return text
    
    corrected = text
    for wrong, correct in TAMIL_CORRECTIONS.items():
        if wrong in corrected:
            corrected = corrected.replace(wrong, correct)
    
    return corrected


def parse_ocr_result(result):
    """Parse PaddleOCR 3.3+ result format into lines, details, and confidence"""
    lines = []
    details = []
    total_confidence = 0
    count = 0
    
    if result and len(result) > 0:
        page_result = result[0]
        rec_texts = page_result.get('rec_texts', [])
        rec_scores = page_result.get('rec_scores', [])
        rec_polys = page_result.get('rec_polys', [])
        
        for i, text in enumerate(rec_texts):
            confidence = rec_scores[i] if i < len(rec_scores) else 0.0
            bbox = rec_polys[i].tolist() if i < len(rec_polys) else []
            
            # Apply Tamil text corrections
            corrected_text = correct_tamil_text(text)
            
            # Skip empty lines after correction (noise removal)
            if corrected_text.strip():
                lines.append(corrected_text)
                details.append({
                    "text": corrected_text,
                    "original_text": text if text != corrected_text else None,
                    "confidence": round(confidence, 4),
                    "bbox": [[int(coord) for coord in point] for point in bbox] if bbox else []
                })
                total_confidence += confidence
                count += 1
    
    avg_confidence = total_confidence / count if count > 0 else 0
    extracted_text = "\n".join(lines)
    
    return extracted_text, lines, avg_confidence, details


class OCRResult(BaseModel):
    """OCR extraction result"""
    success: bool
    extracted_text: str
    lines: List[str]
    confidence: float
    details: List[dict]
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    languages: List[str]


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="paddleocr",
        languages=["ta", "en"]
    )


@app.post("/extract", response_model=OCRResult)
async def extract_text(file: UploadFile = File(...)):
    """
    Extract text from an uploaded image using PaddleOCR
    
    Args:
        file: Image file (JPEG, PNG, etc.)
    
    Returns:
        OCRResult with extracted text, lines, and confidence
    """
    try:
        logger.info(f"Received file: {file.filename}, content_type: {file.content_type}")
        
        # Read the uploaded file
        contents = await file.read()
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        image_np = np.array(image)
        
        logger.info(f"Image size: {image.size}, mode: {image.mode}")
        
        # Run PaddleOCR
        logger.info("Running PaddleOCR extraction...")
        result = ocr.predict(image_np)
        
        # Parse results using helper
        extracted_text, lines, avg_confidence, details = parse_ocr_result(result)
        
        logger.info(f"Extracted {len(lines)} lines with avg confidence {avg_confidence:.2f}")
        
        return OCRResult(
            success=True,
            extracted_text=extracted_text,
            lines=lines,
            confidence=round(avg_confidence, 4),
            details=details
        )
        
    except Exception as e:
        logger.error(f"OCR extraction failed: {str(e)}", exc_info=True)
        return OCRResult(
            success=False,
            extracted_text="",
            lines=[],
            confidence=0,
            details=[],
            error=str(e)
        )


class ExtractUrlRequest(BaseModel):
    """Request body for URL-based extraction"""
    url: str


@app.post("/extract-url", response_model=OCRResult)
async def extract_from_url(request: ExtractUrlRequest):
    """
    Extract text from an image URL
    
    Args:
        request: JSON body with 'url' field
    
    Returns:
        OCRResult with extracted text
    """
    try:
        import httpx
        
        url = request.url
        logger.info(f"Fetching image from URL: {url}")
        
        # Download the image with timeout
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            contents = response.content
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        image_np = np.array(image)
        
        # Run PaddleOCR
        result = ocr.predict(image_np)
        
        # Parse results using helper
        extracted_text, lines, avg_confidence, details = parse_ocr_result(result)
        
        return OCRResult(
            success=True,
            extracted_text=extracted_text,
            lines=lines,
            confidence=round(avg_confidence, 4),
            details=details
        )
        
    except Exception as e:
        logger.error(f"OCR extraction from URL failed: {str(e)}", exc_info=True)
        return OCRResult(
            success=False,
            extracted_text="",
            lines=[],
            confidence=0,
            details=[],
            error=str(e)
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("OCR_SERVICE_PORT", 8081))
    uvicorn.run(app, host="0.0.0.0", port=port)
