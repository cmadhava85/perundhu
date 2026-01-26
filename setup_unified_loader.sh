#!/bin/bash
# Setup script for unified_data_loader.py
# Installs dependencies and verifies setup

set -e

echo "================================================"
echo "  🚀 Unified Data Loader - Setup & Install"
echo "================================================"

# Get project root
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_ROOT"

# Check Python version
echo ""
echo "1️⃣  Checking Python version..."
python_version=$(python3 --version 2>&1 | grep -oP '3\.\d+' || echo "0.0")
if [[ $(echo "$python_version >= 3.8" | bc) -eq 1 ]]; then
    echo "   ✅ Python $python_version found"
else
    echo "   ❌ Python 3.8+ required"
    exit 1
fi

# Create virtual environment if needed
echo ""
echo "2️⃣  Checking virtual environment..."
if [ ! -d ".venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv .venv
    echo "   ✅ Virtual environment created"
else
    echo "   ✅ Virtual environment exists"
fi

# Activate virtual environment
echo ""
echo "3️⃣  Activating virtual environment..."
source .venv/bin/activate
echo "   ✅ Virtual environment activated"

# Install dependencies
echo ""
echo "4️⃣  Installing dependencies..."
pip install -q mysql-connector-python 2>/dev/null || {
    echo "   Installing mysql-connector-python..."
    pip install mysql-connector-python
}
echo "   ✅ Dependencies installed"

# Create required directories
echo ""
echo "5️⃣  Creating required directories..."
mkdir -p logs/checkpoints
mkdir -p data
mkdir -p scripts
echo "   ✅ Directories created"

# Make script executable
echo ""
echo "6️⃣  Making script executable..."
chmod +x scripts/unified_data_loader.py
chmod +x test_unified_data_loader.py
echo "   ✅ Scripts made executable"

# Run tests
echo ""
echo "7️⃣  Running setup verification..."
python3 test_unified_data_loader.py

echo ""
echo "================================================"
echo "  ✅ Setup Complete!"
echo "================================================"
echo ""
echo "Quick Start:"
echo "  source .venv/bin/activate"
echo "  python3 scripts/unified_data_loader.py --help"
echo ""
echo "Examples:"
echo "  # Validate data"
echo "  python3 scripts/unified_data_loader.py --mode validate --data-file data/tamil_nadu_locations_enhanced.json"
echo ""
echo "  # Load locations"
echo "  python3 scripts/unified_data_loader.py --mode locations --environment local --data-file data/tamil_nadu_locations_enhanced.json"
echo ""
echo "For more information, see: UNIFIED_DATA_LOADER_GUIDE.md"
