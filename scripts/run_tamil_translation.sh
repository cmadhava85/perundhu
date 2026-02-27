#!/bin/bash

echo "Starting Tamil Translation Process..."
echo "Output will be saved to: tamil_translation_output.log"
echo ""

cd /Users/mchand69/Documents/project/perundhu/scripts

# Run the translation script with --confirm flag
python3 populate_tamil_translations_hybrid.py --confirm > tamil_translation_output.log 2>&1

echo ""
echo "✅ Translation complete! Check results:"
echo "   cat scripts/tamil_translation_output.log"
