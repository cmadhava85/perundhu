#!/bin/bash

# Build script for SQL Auto-Stop Cloud Function
# This script packages the Cloud Function code into a zip file for deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FUNCTION_DIR="$SCRIPT_DIR/sql-autostop"
BUILD_DIR="$SCRIPT_DIR/build"
OUTPUT_FILE="$PROJECT_ROOT/infrastructure/cloud-functions/sql-autostop.zip"

# Create build directory
mkdir -p "$BUILD_DIR"

# Copy function files to build directory
cp "$FUNCTION_DIR/main.py" "$BUILD_DIR/"
cp "$FUNCTION_DIR/requirements.txt" "$BUILD_DIR/"

# Change to build directory and create zip
cd "$BUILD_DIR"
zip -r "$OUTPUT_FILE" main.py requirements.txt

# Clean up
rm -rf "$BUILD_DIR"

echo "✅ Cloud Function packaged: $OUTPUT_FILE"
echo "Size: $(du -h "$OUTPUT_FILE" | cut -f1)"
