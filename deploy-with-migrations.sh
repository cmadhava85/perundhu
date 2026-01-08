#!/bin/bash
# Deploy with Flyway enabled to run migrations

gcloud run deploy perundhu-backend-preprod \
  --image=asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest \
  --platform=managed \
  --region=asia-south1 \
  --allow-unauthenticated \
  --set-env-vars="SPRING_PROFILES_ACTIVE=preprod,FLYWAY_ENABLED=true" \
  --update-secrets="DB_PASSWORD=db-password:latest,SPRING_DATASOURCE_PASSWORD=db-password:latest" \
  --add-cloudsql-instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql \
  --memory=2Gi \
  --cpu=2 \
  --timeout=600s

echo "Deployed with Flyway enabled. Waiting 60 seconds for migrations to run..."
sleep 60

# Now redeploy with Flyway disabled
echo "Redeploying with Flyway disabled..."
gcloud run deploy perundhu-backend-preprod \
  --image=asia-south1-docker.pkg.dev/astute-strategy-406601/perundhu/backend:preprod-latest \
  --platform=managed \
  --region=asia-south1 \
  --allow-unauthenticated \
  --set-env-vars="SPRING_PROFILES_ACTIVE=preprod,FLYWAY_ENABLED=false" \
  --update-secrets="DB_PASSWORD=db-password:latest,SPRING_DATASOURCE_PASSWORD=db-password:latest" \
  --add-cloudsql-instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql \
  --memory=2Gi \
  --cpu=2

echo "Done!"
