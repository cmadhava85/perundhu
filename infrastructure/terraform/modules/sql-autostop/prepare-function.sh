#!/bin/bash

# Script to prepare Cloud Function source code for Terraform deployment
# This zips the function code and outputs the path for use in terraform.tfvars

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FUNCTION_SOURCE_DIR="$SCRIPT_DIR/../../cloud-functions/sql-autostop"
OUTPUT_DIR="/tmp"
ZIP_FILENAME="sql-autostop-$(date +%Y%m%d-%H%M%S).zip"
ZIP_PATH="$OUTPUT_DIR/$ZIP_FILENAME"

echo "Preparing Cloud Function source code for Terraform..."
echo "Source directory: $FUNCTION_SOURCE_DIR"

if [ ! -d "$FUNCTION_SOURCE_DIR" ]; then
    echo "Error: Function source directory not found at $FUNCTION_SOURCE_DIR"
    exit 1
fi

if [ ! -f "$FUNCTION_SOURCE_DIR/main.py" ]; then
    echo "Error: main.py not found in $FUNCTION_SOURCE_DIR"
    exit 1
fi

if [ ! -f "$FUNCTION_SOURCE_DIR/requirements.txt" ]; then
    echo "Error: requirements.txt not found in $FUNCTION_SOURCE_DIR"
    exit 1
fi

# Create the zip file
cd "$FUNCTION_SOURCE_DIR"
zip -q "$ZIP_PATH" main.py requirements.txt

echo "✓ Successfully created: $ZIP_PATH"
echo ""
echo "Add this to your terraform.tfvars for preprod environment:"
echo ""
echo "  sql_autostop_function_source_path = \"$ZIP_PATH\""
echo ""
echo "Then apply Terraform:"
echo "  cd infrastructure/terraform/environments/preprod"
echo "  terraform plan"
echo "  terraform apply"
