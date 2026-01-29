#!/bin/bash
# Monitor consolidated buses upload progress

echo "🔍 Upload Monitoring Dashboard"
echo "================================"
echo ""

# Check if process is running
if ps aux | grep "python.*unified_data_loader" | grep -v grep > /dev/null; then
    echo "✅ Process Status: RUNNING"
    ps aux | grep "python.*unified_data_loader" | grep -v grep | awk '{print "   CPU: "$3"%  |  Memory: "$4"%  |  Runtime: "$10}'
else
    echo "❌ Process Status: NOT RUNNING"
fi

echo ""
echo "📊 Log Statistics:"
echo "   Total lines: $(wc -l < logs/consolidated_buses_upload.log)"
echo "   Processed batches: $(grep -c "Processed.*buses" logs/consolidated_buses_upload.log || echo 0)"
echo "   Buses inserted: $(grep "Buses inserted" logs/consolidated_buses_upload.log | tail -1 | grep -oE '[0-9]+' | head -1 || echo "Processing...")"
echo "   Stops inserted: $(grep "Stops inserted" logs/consolidated_buses_upload.log | tail -1 | grep -oE '[0-9]+' | head -1 || echo "Processing...")"
echo "   Errors: $(grep -c "⚠️\|ERROR" logs/consolidated_buses_upload.log || echo 0)"

echo ""
echo "📝 Latest Log Entries:"
tail -10 logs/consolidated_buses_upload.log | grep -E "(Processed|inserted|Created|ERROR|FAILED|COMPLETE)" || echo "   Still processing initial batch..."

echo ""
echo "💡 To watch live: tail -f logs/consolidated_buses_upload.log"
