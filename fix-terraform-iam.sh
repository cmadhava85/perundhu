#!/bin/bash

# Grant Terraform Service Account Required IAM Roles for astute-strategy-406601 (preprod)

SERVICE_ACCOUNT="perundhu@astute-strategy-406601.iam.gserviceaccount.com"
PROJECT="astute-strategy-406601"

echo "🔐 Granting IAM roles to $SERVICE_ACCOUNT in project $PROJECT"
echo ""

# Individual role assignments
echo "1. Granting roles/cloudsql.admin..."
gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SERVICE_ACCOUNT" --role="roles/cloudsql.admin" --quiet

echo "2. Granting roles/storage.admin..."
gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SERVICE_ACCOUNT" --role="roles/storage.admin" --quiet

echo "3. Granting roles/secretmanager.admin..."
gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SERVICE_ACCOUNT" --role="roles/secretmanager.admin" --quiet

echo "4. Granting roles/vpcaccess.admin..."
gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SERVICE_ACCOUNT" --role="roles/vpcaccess.admin" --quiet

echo "5. Granting roles/iam.serviceAccountAdmin..."
gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SERVICE_ACCOUNT" --role="roles/iam.serviceAccountAdmin" --quiet

echo "6. Granting roles/iam.serviceAccountUser..."
gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SERVICE_ACCOUNT" --role="roles/iam.serviceAccountUser" --quiet

echo ""
echo "✅ All IAM roles have been granted to $SERVICE_ACCOUNT"
echo ""
echo "Next steps:"
echo "1. Push any changes to trigger the Terraform workflow"
echo "2. Or run manually: cd infrastructure/terraform/environments/preprod && terraform apply"
