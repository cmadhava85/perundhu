# OCR Service Infrastructure Setup

This document describes the infrastructure configuration for the PaddleOCR service.

## Overview

The OCR service uses **PaddleOCR** for Tamil and English text extraction from bus timing board images. It runs as a separate Cloud Run service that the backend calls internally.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│  OCR Service    │
│   (Cloud Run)   │     │   (Cloud Run)   │     │  (Cloud Run)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                        │
                               ▼                        │
                        ┌─────────────────┐             │
                        │  Cloud Storage  │◀────────────┘
                        │   (Images)      │
                        └─────────────────┘
```

## Service Configuration

### Resource Requirements

PaddleOCR is a memory-intensive ML workload. The following resources are allocated:

| Setting | Pre-Production | Production | Notes |
|---------|---------------|------------|-------|
| Memory | 4 GiB | 4 GiB | PaddleOCR models require ~2GB |
| CPU | 2 vCPU | 2 vCPU | ML inference benefits from multi-core |
| Min Instances | 0 | 1 | Production keeps warm to avoid cold starts |
| Max Instances | 5 | 10 | Scales based on load |
| Concurrency | 10 | 10 | Limited due to ML workload intensity |
| Startup Probe | 60s | 60s | Model loading takes ~30-45 seconds |

### Security

- **No Public Access**: The OCR service is internal-only (`--no-allow-unauthenticated`)
- **IAM Binding**: Only the backend service account can invoke the OCR service
- **VPC Connector**: Optional - can be configured for private networking

## Terraform Configuration

### Module Location

```
infrastructure/terraform/modules/ocr_service/
├── main.tf       # Cloud Run service and IAM
├── variables.tf  # Configuration variables
└── outputs.tf    # Service URL and name outputs
```

### Environment Configuration

#### Pre-Production (`environments/preprod/main.tf`)

```hcl
module "ocr_service" {
  source = "../../modules/ocr_service"

  project_id                    = var.project_id
  region                        = var.region
  environment                   = var.environment
  app_name                      = var.app_name
  container_image               = var.ocr_service_image
  service_account_email         = module.iam.backend_service_account_email
  backend_service_account_email = module.iam.backend_service_account_email
  
  cpu_limit     = "2"
  memory_limit  = "4Gi"
  min_instances = 0   # Scale to zero when idle
  max_instances = 5
  concurrency   = 10
}
```

#### Production (`environments/production/main.tf`)

```hcl
module "ocr_service" {
  source = "../../modules/ocr_service"

  project_id                    = var.project_id
  region                        = var.region
  environment                   = var.environment
  app_name                      = var.app_name
  container_image               = var.ocr_service_image
  service_account_email         = module.iam.backend_service_account_email
  backend_service_account_email = module.iam.backend_service_account_email
  
  cpu_limit     = "2"
  memory_limit  = "4Gi"
  min_instances = 1   # Keep warm for production
  max_instances = 10
  concurrency   = 10
}
```

### Required Variables

Add to your `terraform.tfvars`:

```hcl
ocr_service_image = "gcr.io/YOUR_PROJECT_ID/perundhu-ocr-service:latest"
```

## Deployment

### 1. Build OCR Service Image

```bash
# Build and push the OCR service image
cd ocr-service
docker build -t gcr.io/YOUR_PROJECT_ID/perundhu-ocr-service:latest .
docker push gcr.io/YOUR_PROJECT_ID/perundhu-ocr-service:latest
```

### 2. Apply Terraform

```bash
cd infrastructure/terraform/environments/preprod  # or production
terraform init
terraform plan -var="ocr_service_image=gcr.io/YOUR_PROJECT_ID/perundhu-ocr-service:latest"
terraform apply
```

### 3. Verify Deployment

```bash
# Get the OCR service URL
terraform output ocr_service_url

# Test health endpoint (requires authentication)
gcloud run services proxy perundhu-ocr-preprod --port=8081
curl http://localhost:8081/health
```

## GitHub Actions Integration

The CI/CD pipeline automatically:

1. **Builds** the OCR service image on changes to `ocr-service/**`
2. **Pushes** to Google Container Registry
3. **Deploys** to Cloud Run
4. **Passes** the OCR service URL to the backend as `OCR_SERVICE_URL`

See `.github/workflows/cd-preprod-auto.yml` and `.github/workflows/cd-production.yml`.

## Monitoring

### Health Checks

The OCR service exposes `/health` endpoint that returns:

```json
{
  "status": "healthy",
  "service": "perundhu-ocr",
  "version": "1.0.0",
  "ocr_engine": "paddleocr",
  "languages": ["ta", "en"]
}
```

### Logs

View logs in Cloud Console or via CLI:

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=perundhu-ocr-production" --limit=50
```

### Common Issues

#### Cold Start Timeout

If the service times out on first request:
- Increase `min_instances` to 1 to keep service warm
- Ensure startup probe allows 60+ seconds

#### Memory Issues

If you see OOM errors:
- Current 4GiB should be sufficient
- If needed, increase `memory_limit` to "8Gi"

#### Tamil Text Not Recognized

If Tamil text accuracy is low:
- Verify image quality and resolution
- Check that `PP-OCRv5` models are loaded correctly
- Review preprocessing in the OCR service

## Cost Considerations

| Resource | Pre-Prod Cost/Month | Production Cost/Month |
|----------|--------------------|-----------------------|
| Cloud Run (min=0) | ~$5-15 | - |
| Cloud Run (min=1) | - | ~$50-100 |
| Model Storage | Included in image | Included in image |

**Note**: Production keeps 1 instance warm to avoid cold start latency for users.

## Related Files

- `/ocr-service/main.py` - FastAPI PaddleOCR service
- `/ocr-service/Dockerfile` - Container image definition
- `/ocr-service/requirements.txt` - Python dependencies
- `/backend/src/.../OcrServiceClient.java` - Backend HTTP client
- `/backend/src/.../OcrServiceAdapter.java` - OCR adapter with fallback
