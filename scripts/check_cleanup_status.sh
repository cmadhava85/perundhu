#!/bin/bash
# Check status of location cleanup

echo "=== Location Cleanup Status ==="
echo ""

# Check if processes are running
echo "Running Processes:"
ps aux | grep -E "cleanup_unused_locations.py|cloud-sql-proxy" | grep -v grep | while read line; do
    echo "  ✓ $line" | cut -d' ' -f1-15
done

echo ""
echo "Log File Status:"
if [ -f cleanup_all.log ]; then
    lines=$(wc -l < cleanup_all.log)
    echo "  Lines in log: $lines"
    echo ""
    echo "Latest output:"
    tail -20 cleanup_all.log | sed 's/^/  /'
else
    echo "  Log file not found"
fi

echo ""
echo "To monitor in real-time: tail -f cleanup_all.log"
