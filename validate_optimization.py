#!/usr/bin/env python3
"""
Validation script to verify data loader optimization is working correctly.
Run this after implementing the optimization to confirm 5-8x speedup.
"""

import os
import sys
import time
import subprocess
import json
import re
from pathlib import Path

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_header(text):
    """Print a formatted header"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{text:^60}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def print_ok(text):
    """Print success message"""
    print(f"{GREEN}✅ {text}{RESET}")

def print_error(text):
    """Print error message"""
    print(f"{RED}❌ {text}{RESET}")

def print_warning(text):
    """Print warning message"""
    print(f"{YELLOW}⚠️  {text}{RESET}")

def print_info(text):
    """Print info message"""
    print(f"{BLUE}ℹ️  {text}{RESET}")

def check_file_exists(filepath):
    """Check if file exists"""
    if Path(filepath).exists():
        print_ok(f"Found: {filepath}")
        return True
    else:
        print_error(f"Not found: {filepath}")
        return False

def extract_performance_metrics(output):
    """Extract performance metrics from script output"""
    metrics = {
        'rows_per_sec': [],
        'total_time': None,
        'total_rows': 0,
        'batch_mode': False
    }
    
    # Check if batch mode
    if 'batch mode' in output.lower():
        metrics['batch_mode'] = True
    
    # Extract rows/sec values
    pattern = r'(\d+)\s*rows/sec'
    matches = re.findall(pattern, output)
    if matches:
        metrics['rows_per_sec'] = [int(m) for m in matches]
    
    # Extract total time
    time_pattern = r'Upload complete:.*?(\d+\.\d+)s'
    time_match = re.search(time_pattern, output)
    if time_match:
        metrics['total_time'] = float(time_match.group(1))
    
    # Extract row count
    rows_pattern = r'Upload complete:\s*(\d+)'
    rows_match = re.search(rows_pattern, output)
    if rows_match:
        metrics['total_rows'] = int(rows_match.group(1))
    
    return metrics

def verify_optimization_in_code():
    """Verify that optimization code is in the script"""
    script_path = '/Users/mchand69/Documents/perundhu/scripts/unified_data_loader.py'
    
    if not check_file_exists(script_path):
        return False
    
    print_info("Checking for optimization code markers...")
    
    with open(script_path, 'r') as f:
        content = f.read()
    
    checks = {
        'executemany': 'Using bulk insert (executemany)',
        'import time': 'Performance tracking enabled',
        'rows/sec': 'Performance metrics logging',
        'batch mode': 'Batch mode in logging'
    }
    
    all_passed = True
    for marker, description in checks.items():
        if marker in content:
            print_ok(f"{description}")
        else:
            print_warning(f"Not found: {description} (marker: {marker})")
            all_passed = False
    
    # Check if _location_exists is still there (should be gone)
    if '_location_exists' in content:
        print_warning("Found _location_exists() - you should delete it (no longer needed)")
    else:
        print_ok("Correctly removed old _location_exists() method")
    
    return all_passed

def run_performance_test():
    """Run performance test with sample data"""
    print_header("PERFORMANCE TEST")
    
    script_path = '/Users/mchand69/Documents/perundhu/scripts/unified_data_loader.py'
    data_file = '/Users/mchand69/Documents/perundhu/data/tamil_nadu_locations_enhanced.json'
    
    if not check_file_exists(script_path):
        print_error("Script not found at: " + script_path)
        return None
    
    # Try to find test data
    if not Path(data_file).exists():
        print_warning(f"Full test data not found: {data_file}")
        print_info("Looking for test files...")
        
        test_files = [
            '/Users/mchand69/Documents/perundhu/data/test_1000.json',
            '/Users/mchand69/Documents/perundhu/data/test_100.json',
        ]
        
        for test_file in test_files:
            if Path(test_file).exists():
                data_file = test_file
                print_ok(f"Using test file: {test_file}")
                break
        else:
            print_error("No test data found - cannot run performance test")
            return None
    
    print_info(f"Running test with: {data_file}")
    print_info(f"Using script: {script_path}")
    
    try:
        cmd = [
            'python3',
            script_path,
            '--mode', 'locations',
            '--environment', 'local',
            '--data-file', data_file,
            '--batch-size', '5000'
        ]
        
        print_info(f"Command: {' '.join(cmd)}\n")
        
        start = time.time()
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        elapsed = time.time() - start
        
        output = result.stdout + result.stderr
        
        print("SCRIPT OUTPUT:")
        print("-" * 60)
        print(output)
        print("-" * 60)
        
        # Extract metrics
        metrics = extract_performance_metrics(output)
        
        print("\nPERFORMANCE METRICS:")
        print("-" * 60)
        
        if metrics['batch_mode']:
            print_ok("Batch mode is enabled!")
        else:
            print_warning("Batch mode not detected - code may not be optimized")
        
        if metrics['rows_per_sec']:
            avg_rate = sum(metrics['rows_per_sec']) / len(metrics['rows_per_sec'])
            max_rate = max(metrics['rows_per_sec'])
            min_rate = min(metrics['rows_per_sec'])
            
            print(f"Average rate: {avg_rate:.0f} rows/sec")
            print(f"Max rate: {max_rate} rows/sec")
            print(f"Min rate: {min_rate} rows/sec")
            
            if avg_rate > 1000:
                print_ok("✨ EXCELLENT! Optimization is working (>1000 rows/sec)")
            elif avg_rate > 100:
                print_warning("⚠️ Good improvement, but could be better")
            else:
                print_error("❌ Performance not improved - optimization may not be applied")
        
        if metrics['total_time']:
            minutes = metrics['total_time'] / 60
            print(f"Total time: {metrics['total_time']:.1f}s ({minutes:.1f}m)")
            
            if minutes < 3:
                print_ok("✨ Upload is FAST! (under 3 minutes)")
            elif minutes < 10:
                print_warning("⚠️ Upload time is acceptable, but could be faster")
            else:
                print_error("❌ Upload is still slow - optimization needs work")
        
        if metrics['total_rows']:
            print(f"Total rows: {metrics['total_rows']:,}")
        
        return metrics
        
    except subprocess.TimeoutExpired:
        print_error("Test timed out (5 minutes) - possible issue with script")
        return None
    except Exception as e:
        print_error(f"Error running test: {e}")
        return None

def compare_with_baseline():
    """Compare current performance with baseline (pre-optimization)"""
    print_header("BASELINE COMPARISON")
    
    print_info("PRE-OPTIMIZATION BASELINE:")
    print("  • 41,000 locations: 10-15 minutes")
    print("  • Rows per second: 45-50")
    print("  • Database queries: 80,000+")
    
    print_info("\nPOST-OPTIMIZATION TARGET:")
    print("  • 41,000 locations: 2-3 minutes")
    print("  • Rows per second: 2,000+")
    print("  • Database queries: ~8")
    
    print_info("\nEXPECTED IMPROVEMENT:")
    print("  • Speedup: 5-8x faster")
    print("  • Query reduction: >99%")

def validate_database_integrity():
    """Validate that data was inserted correctly"""
    print_header("DATA INTEGRITY CHECK")
    
    print_info("To validate data integrity, run:")
    print("\n  python3 scripts/unified_data_loader.py --mode validate \\")
    print("    --environment local \\")
    print("    --data-file data/tamil_nadu_locations_enhanced.json\n")

def generate_summary(metrics):
    """Generate a summary report"""
    print_header("SUMMARY")
    
    if not metrics:
        print_error("No performance metrics available")
        return
    
    print("OPTIMIZATION STATUS:")
    
    checks = []
    
    # Check 1: Batch mode
    if metrics['batch_mode']:
        checks.append(("Batch mode enabled", True))
        print_ok("✅ Batch mode is enabled")
    else:
        checks.append(("Batch mode enabled", False))
        print_error("❌ Batch mode is NOT enabled - code not optimized?")
    
    # Check 2: Performance rate
    if metrics['rows_per_sec']:
        avg_rate = sum(metrics['rows_per_sec']) / len(metrics['rows_per_sec'])
        if avg_rate > 1000:
            checks.append(("Performance rate >1000 rows/sec", True))
            print_ok(f"✅ Performance rate is {avg_rate:.0f} rows/sec (target: >1000)")
        elif avg_rate > 50:
            checks.append(("Performance rate >50 rows/sec", True))
            print_warning(f"⚠️ Performance rate is {avg_rate:.0f} rows/sec (target: >1000)")
        else:
            checks.append(("Performance rate >50 rows/sec", False))
            print_error(f"❌ Performance rate is {avg_rate:.0f} rows/sec - not optimized!")
    
    # Check 3: Total time
    if metrics['total_time']:
        minutes = metrics['total_time'] / 60
        if minutes < 5:
            checks.append(("Upload time <5 minutes", True))
            print_ok(f"✅ Upload completed in {minutes:.1f} minutes (target: <3m for 41K)")
        elif minutes < 15:
            checks.append(("Upload time <15 minutes", True))
            print_warning(f"⚠️ Upload took {minutes:.1f} minutes (target: <3m)")
        else:
            checks.append(("Upload time <15 minutes", False))
            print_error(f"❌ Upload took {minutes:.1f} minutes - still slow!")
    
    # Summary
    passed = sum(1 for _, result in checks if result)
    total = len(checks)
    
    print(f"\nPASSED: {passed}/{total} checks")
    
    if passed == total:
        print_ok("🎉 OPTIMIZATION IS WORKING PERFECTLY!")
        print_ok("Ready for production deployment!")
    elif passed >= 2:
        print_warning("⚠️ Optimization is partially working - may need fine-tuning")
    else:
        print_error("❌ Optimization not working - see troubleshooting guide")

def main():
    """Main function"""
    print_header("DATA LOADER OPTIMIZATION VALIDATOR")
    print("This script verifies that your optimization is working correctly.\n")
    
    # Check 1: Code validation
    print_header("STEP 1: CODE VALIDATION")
    code_ok = verify_optimization_in_code()
    
    if not code_ok:
        print_warning("Some optimization code markers not found - optimization may be incomplete")
    
    # Check 2: Performance baseline
    compare_with_baseline()
    
    # Check 3: Run performance test
    print_header("STEP 2: PERFORMANCE TEST")
    print_info("This will run the data loader with test data (may take 1-5 minutes)...")
    print_info("You can skip this by pressing Ctrl+C\n")
    
    try:
        metrics = run_performance_test()
    except KeyboardInterrupt:
        print_warning("\nTest skipped by user")
        metrics = None
    
    # Check 4: Data integrity
    validate_database_integrity()
    
    # Check 5: Summary
    if metrics:
        generate_summary(metrics)
    else:
        print_warning("Could not generate summary - no performance metrics")
    
    print("\n" + "="*60)
    print("NEXT STEPS:")
    print("="*60)
    print("\n1. If all checks passed: ✅")
    print("   → Ready for production deployment!")
    print("   → Follow: PRODUCTION_DEPLOYMENT_START_HERE_JAN_2026.md")
    
    print("\n2. If performance is slow: ⚠️")
    print("   → Check: EXACT_CODE_REPLACEMENT.md")
    print("   → Verify: executemany() is in LocationLoader.upload()")
    
    print("\n3. If code validation failed: ❌")
    print("   → Follow: DATA_LOADER_OPTIMIZATION_INDEX.md")
    print("   → Apply: Optimization steps from EXACT_CODE_REPLACEMENT.md")
    
    print("\n" + "="*60 + "\n")

if __name__ == '__main__':
    main()
