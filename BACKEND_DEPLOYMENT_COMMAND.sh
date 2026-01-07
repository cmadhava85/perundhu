# Complete gcloud deployment command for Perundhu Backend (Preprod)

gcloud run deploy perundhu-backend-preprod \
  --image=asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest \
  --platform=managed \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --allow-unauthenticated \
  --set-env-vars="SPRING_PROFILES_ACTIVE=preprod,GCP_INSTANCE_CONNECTION_NAME=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia,DB_USERNAME=perundhu_user,MYSQL_USERNAME=perundhu_user,GEMINI_API_ENABLED=true,CORS_ALLOWED_ORIGINS=https://perundhu-frontend-preprod-1032721240281.asia-south1.run.app" \
  --set-secrets="DB_PASSWORD=preprod-db-password:latest,MYSQL_PASSWORD=preprod-db-password:latest,JWT_SECRET=JWT_SECRET_PREPROD:latest,DATA_ENCRYPTION_KEY=DATA_ENCRYPTION_KEY_PREPROD:latest,GEMINI_API_KEY=gemini-api-key:latest,PUBLIC_API_KEY=PUBLIC_API_KEY:latest" \
  --add-cloudsql-instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql-asia \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --timeout=1200s \
  --cpu-throttling \
  --no-gen2 \
  --labels="env=preprod"

# After deployment, verify the service:
gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601

# Get the service URL:
gcloud run services describe perundhu-backend-preprod \
  --region=asia-south1 \
  --project=astute-strategy-406601 \
  --format='value(status.url)'

# Check health:
# curl https://<SERVICE_URL>/actuator/health
