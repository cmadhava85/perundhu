#!/bin/bash
# Quick Start Guide - Copy & Paste Commands
# Make this file executable: chmod +x QUICK_START.sh

# ================================================================
# UNIFIED DATA LOADER - QUICK START
# ================================================================

# Setup (Run once)
# ================================================================
echo "1️⃣  SETUP (First time only)"
echo "   bash setup_unified_loader.sh"
echo ""

# After setup, activate:
# source .venv/bin/activate

# ================================================================
# COMMON COMMANDS
# ================================================================

echo "2️⃣  VALIDATE DATA"
echo "   python3 scripts/unified_data_loader.py --mode validate --data-file data/tamil_nadu_locations_enhanced.json"
echo ""

echo "3️⃣  LOAD LOCATIONS (LOCAL)"
echo "   python3 scripts/unified_data_loader.py --mode locations --environment local --data-file data/tamil_nadu_locations_enhanced.json"
echo ""

echo "4️⃣  LOAD BUSES (LOCAL)"
echo "   python3 scripts/unified_data_loader.py --mode buses --environment local --data-file data/mtc_consolidated.json --operator MTC"
echo ""

echo "5️⃣  FULL MIGRATION (LOCAL)"
echo "   python3 scripts/unified_data_loader.py --mode full --environment local \\"
echo "     --locations data/tamil_nadu_locations_enhanced.json \\"
echo "     --buses data/mtc_consolidated.json --operator MTC"
echo ""

echo "6️⃣  LOAD TO PREPROD"
echo "   python3 scripts/unified_data_loader.py --mode full --environment preprod \\"
echo "     --locations data/tamil_nadu_locations_enhanced.json \\"
echo "     --buses data/tnstc_consolidated.json --operator TNSTC"
echo ""

echo "7️⃣  LOAD TO PRODUCTION"
echo "   python3 scripts/unified_data_loader.py --mode full --environment prod \\"
echo "     --locations data/tamil_nadu_locations_enhanced.json \\"
echo "     --buses data/mtc_consolidated.json --operator MTC"
echo ""

echo "8️⃣  RESUME IF INTERRUPTED"
echo "   python3 scripts/unified_data_loader.py --mode buses --environment local \\"
echo "     --checkpoint logs/checkpoints/buses_local_*.json"
echo ""

echo "9️⃣  VERIFY IN DATABASE"
echo "   mysql -h localhost -P 3307 -u perundhu_user -p -e \\"
echo "     \"SELECT 'Locations' as type, COUNT(*) as count FROM locations \\"
echo "      UNION ALL SELECT 'Buses', COUNT(*) FROM buses \""
echo ""

echo "🔟  VIEW LOGS"
echo "   tail -50 logs/unified_data_loader.log"
echo ""

echo "🔗 Full guide: cat UNIFIED_DATA_LOADER_GUIDE.md"
echo "📋 Quick ref:  cat UNIFIED_DATA_LOADER_QUICK_REFERENCE.md"
