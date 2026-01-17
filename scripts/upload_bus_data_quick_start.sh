#!/bin/bash
# Quick Start: Transform and Upload MTC Bus Data with Tamil Translation

set -e

echo "=========================================="
echo "Bus Data Upload with Tamil Translation"
echo "=========================================="
echo ""

# Configuration
OPERATOR="${1:-MTC}"
ENVIRONMENT="${2:-local}"
ENABLE_TRANSLATION="${3:-true}"

INPUT_FILE="data/${OPERATOR,,}_all_routes_complete.json"
OUTPUT_DIR="data"

echo "Configuration:"
echo "  Operator: $OPERATOR"
echo "  Environment: $ENVIRONMENT"
echo "  Enable Translation: $ENABLE_TRANSLATION"
echo "  Input: $INPUT_FILE"
echo ""

# Step 1: Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ ERROR: Input file not found: $INPUT_FILE"
    exit 1
fi
echo "✅ Input file found"

# Step 2: Transform data
echo ""
echo "Step 1: Transforming data to structured format..."
python scripts/transform_flat_bus_data.py \
    --input "$INPUT_FILE" \
    --operator "$OPERATOR" \
    --output-dir "$OUTPUT_DIR"

CHECKPOINT_FILE="$OUTPUT_DIR/${OPERATOR,,}_bus_timings.checkpoint.json"
if [ ! -f "$CHECKPOINT_FILE" ]; then
    echo "❌ ERROR: Checkpoint file not created"
    exit 1
fi
echo "✅ Data transformation complete"

# Step 3: Validate data
echo ""
echo "Step 2: Validating transformed data..."
python scripts/validate_bus_data.py \
    --checkpoint "$CHECKPOINT_FILE" \
    --summarize "$OUTPUT_DIR/${OPERATOR,,}_structured.json"
echo "✅ Data validation complete"

# Step 4: Upload to database
echo ""
echo "Step 3: Uploading to database..."
TRANSLATION_FLAG=""
if [ "$ENABLE_TRANSLATION" = "true" ]; then
    TRANSLATION_FLAG="--enable-translation"
    echo "  (with Tamil translation enabled)"
fi

python scripts/upload_bus_data.py \
    --operator "$OPERATOR" \
    --environment "$ENVIRONMENT" \
    $TRANSLATION_FLAG

echo ""
echo "=========================================="
echo "✅ All steps completed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Verify data in database"
echo "  2. Check translations: SELECT COUNT(*) FROM translations WHERE language_code = 'ta';"
echo "  3. View sample: SELECT l.name, t.translated_value FROM locations l"
echo "     JOIN translations t ON l.id = t.entity_id WHERE t.language_code = 'ta' LIMIT 10;"
