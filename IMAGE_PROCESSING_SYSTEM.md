# Image Processing System for Bus Time Contributions

## Overview
This implementation provides a complete AI/OCR-powered image processing system for extracting bus schedule data from user-uploaded images. The system follows hexagonal architecture principles and includes comprehensive security, validation, and processing capabilities.

## System Architecture

### Backend Components

#### Domain Models
- **RouteContribution**: Represents user-submitted route information
- **ImageContribution**: Represents uploaded bus schedule images with processing metadata

#### Services
- **ImageContributionProcessingService**: Orchestrates the entire image processing workflow
- **OCRService**: Handles AI/OCR text extraction from images
- **FileStorageService**: Manages secure file storage and retrieval
- **AuthenticationService**: Handles user authentication (placeholder implementation)

#### Ports (Hexagonal Architecture)
- **ContributionInputPort**: Use case interface for contribution operations
- **ImageContributionOutputPort**: Data persistence interface for image contributions
- **RouteContributionOutputPort**: Data persistence interface for route contributions
- **InputValidationPort**: Security validation and sanitization interface
- **SecurityMonitoringPort**: Security monitoring and threat detection interface

#### Controllers
- **ContributionController**: REST API endpoints for contribution submission and management
- **ImageController**: Serves uploaded image files securely

### Frontend Components

#### React Components
- **ImageContributionUpload**: Main upload interface with drag-and-drop functionality
- **ImageContributionAdminDashboard**: Admin interface for reviewing AI-processed contributions

#### API Services
- Enhanced API client with functions for image upload, status checking, and retry mechanisms

## Key Features

### AI/OCR Processing Pipeline
1. **Image Upload**: Users upload bus schedule images via drag-and-drop interface
2. **Security Validation**: Files are validated for type, size, and malicious content
3. **OCR Processing**: AI extracts text from images with confidence scoring
4. **Data Parsing**: Extracted text is parsed into structured bus route data
5. **Confidence-Based Routing**:
   - High confidence (>80%): Automatic processing and route creation
   - Medium confidence (50-80%): Manual review required
   - Low confidence (<50%): Flagged for human review

### Security Features
- **Input Validation**: Comprehensive sanitization of all user inputs
- **Rate Limiting**: Prevents abuse with configurable limits
- **IP Blocking**: Automatic blocking of suspicious IP addresses
- **Content Validation**: Validates image file signatures and content
- **Security Monitoring**: Logs all security events for analysis

### Processing States
- **PENDING**: Initial upload state
- **PROCESSING**: AI/OCR extraction in progress
- **PROCESSED**: Successfully processed with high confidence
- **MANUAL_REVIEW_NEEDED**: Requires human review (medium confidence)
- **LOW_CONFIDENCE_OCR**: Low confidence extraction needs review
- **PROCESSING_FAILED**: Technical failure during processing
- **APPROVED**: Admin-approved contribution
- **REJECTED**: Admin-rejected contribution

### Admin Features
- **Dashboard**: Real-time statistics on processing success rates
- **Review Interface**: View extracted data and approve/reject contributions
- **Retry Mechanism**: Retry failed processing attempts
- **Statistics**: Comprehensive metrics on system performance

## API Endpoints

### Public Endpoints
- `POST /api/v1/contributions/images` - Upload image contribution
- `GET /api/v1/contributions/images/{id}/status` - Get processing status
- `POST /api/v1/contributions/images/{id}/retry` - Retry failed processing
- `GET /api/images/{userId}/{filename}` - Serve uploaded images

### Admin Endpoints
- `GET /api/v1/contributions/images/admin/stats` - Processing statistics
- `GET /api/admin/contributions/images/pending` - Pending image contributions
- `POST /api/admin/contributions/images/{id}/approve` - Approve contribution
- `POST /api/admin/contributions/images/{id}/reject` - Reject contribution

## Implementation Status

### ✅ Completed Components
- Complete backend domain model and service layer
- AI/OCR service interface and processing pipeline
- Secure file storage and image serving
- Comprehensive security validation and monitoring
- REST API with full CRUD operations
- React upload component with real-time status updates
- Admin dashboard for contribution review
- Enhanced API client with error handling

### 🔄 Next Steps for Production
1. **OCR Service Implementation**: Integrate with actual OCR providers (Tesseract, Google Vision API, AWS Textract)
2. **Database Adapters**: Implement JPA entities and repositories for the output ports
3. **Authentication System**: Replace placeholder authentication with proper JWT/OAuth
4. **File Storage**: Implement cloud storage adapter (AWS S3, Google Cloud Storage)
5. **Monitoring**: Add comprehensive logging and metrics collection
6. **Testing**: Unit tests, integration tests, and end-to-end testing

## Configuration Requirements

### Environment Variables
```properties
# File storage
perundhu.file.storage.base-path=/var/uploads/perundhu
perundhu.file.storage.max-file-size=10MB

# OCR service
perundhu.ocr.provider=tesseract|google-vision|aws-textract
perundhu.ocr.confidence-threshold.high=0.8
perundhu.ocr.confidence-threshold.medium=0.5

# Security
perundhu.security.rate-limit.contributions=5
perundhu.security.rate-limit.window=3600000
```

### Dependencies to Add
```gradle
// OCR libraries
implementation 'net.sourceforge.tess4j:tess4j:5.8.0'
implementation 'com.google.cloud:google-cloud-vision:3.20.1'

// File processing
implementation 'org.apache.tika:tika-core:2.8.0'
implementation 'org.springframework.boot:spring-boot-starter-validation'
```

## Usage Examples

### Frontend Integration
```typescript
import ImageContributionUpload from './components/ImageContributionUpload';

function ContributePage() {
  return (
    <ImageContributionUpload
      onSuccess={(contributionId) => {
        console.log('Upload successful:', contributionId);
      }}
      onError={(error) => {
        console.error('Upload failed:', error);
      }}
    />
  );
}
```

### API Usage
```typescript
// Upload image
const formData = new FormData();
formData.append('image', file);
formData.append('description', 'Bus schedule at Kochi');
formData.append('location', 'Kochi, Kerala');

const response = await submitImageContribution(formData);

// Check status
const status = await getImageProcessingStatus(response.contributionId);

// Retry if failed
if (status.status === 'PROCESSING_FAILED') {
  await retryImageProcessing(response.contributionId);
}
```

This implementation provides a robust, scalable foundation for AI-powered bus schedule data extraction from user-contributed images, with comprehensive security, monitoring, and admin capabilities.