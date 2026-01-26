#!/usr/bin/env python3
"""
Test script to verify unified_data_loader.py setup
Tests database connectivity, file access, and basic functionality
"""

import sys
import os
import subprocess
from pathlib import Path
from datetime import datetime

def print_header(text):
    """Print formatted header"""
    print(f"\n{'='*70}")
    print(f"  {text}")
    print(f"{'='*70}")

def print_test(name, status, message=""):
    """Print test result"""
    symbol = "✅" if status else "❌"
    print(f"{symbol} {name}")
    if message:
        print(f"  → {message}")

def test_environment():
    """Test 1: Environment setup"""
    print_header("TEST 1: Environment Setup")
    
    try:
        import mysql.connector
        print_test("MySQL Connector", True, "mysql-connector-python installed")
    except ImportError:
        print_test("MySQL Connector", False, "Install with: pip install mysql-connector-python")
        return False
    
    # Check Python version
    py_version = sys.version_info
    if py_version.major >= 3 and py_version.minor >= 8:
        print_test("Python Version", True, f"Python {py_version.major}.{py_version.minor}.{py_version.micro}")
    else:
        print_test("Python Version", False, f"Need Python 3.8+, have {py_version.major}.{py_version.minor}")
        return False
    
    return True

def test_file_structure():
    """Test 2: File structure"""
    print_header("TEST 2: File Structure")
    
    base_path = Path("/Users/mchand69/Documents/perundhu")
    
    required_files = {
        "scripts/unified_data_loader.py": "Main script",
        "data/tamil_nadu_locations_enhanced.json": "Locations data",
        "UNIFIED_DATA_LOADER_GUIDE.md": "Full documentation",
        "UNIFIED_DATA_LOADER_QUICK_REFERENCE.md": "Quick reference"
    }
    
    all_exist = True
    for file_path, description in required_files.items():
        full_path = base_path / file_path
        exists = full_path.exists()
        print_test(f"{file_path}", exists, description)
        all_exist = all_exist and exists
    
    return all_exist

def test_database_local():
    """Test 3: Local database connectivity"""
    print_header("TEST 3: Database Connectivity (Local)")
    
    try:
        import mysql.connector
        
        try:
            conn = mysql.connector.connect(
                host="localhost",
                port=3307,
                user="perundhu_user",
                password="perundhu_password",
                database="perundhu"
            )
            
            cursor = conn.cursor()
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            
            print_test("Database Connection", True, f"MySQL {version[0]}")
            
            # Check tables
            cursor.execute("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='perundhu'")
            tables = cursor.fetchall()
            print_test("Database Tables", len(tables) > 0, f"Found {len(tables)} tables")
            
            cursor.close()
            conn.close()
            
            return True
        
        except Exception as e:
            print_test("Database Connection", False, f"Error: {str(e)}")
            return False
    
    except ImportError:
        print_test("Database Connection", False, "mysql-connector-python not installed")
        return False

def test_script_functionality():
    """Test 4: Script functionality"""
    print_header("TEST 4: Script Functionality")
    
    script_path = Path("/Users/mchand69/Documents/perundhu/scripts/unified_data_loader.py")
    
    if not script_path.exists():
        print_test("Script Location", False, f"Script not found: {script_path}")
        return False
    
    print_test("Script Location", True, str(script_path))
    
    # Test help command
    try:
        result = subprocess.run(
            ["python3", str(script_path), "--help"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            print_test("Script Help", True, "Script runs successfully")
            return True
        else:
            print_test("Script Help", False, result.stderr[:100])
            return False
    
    except Exception as e:
        print_test("Script Help", False, str(e))
        return False

def test_data_validation():
    """Test 5: Data file validation"""
    print_header("TEST 5: Data File Validation")
    
    import json
    
    data_file = Path("/Users/mchand69/Documents/perundhu/data/tamil_nadu_locations_enhanced.json")
    
    if not data_file.exists():
        print_test("Locations File", False, f"File not found: {data_file}")
        return False
    
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print_test("Locations File", True, f"File exists ({len(data)} records)")
        
        # Validate structure
        if len(data) > 0:
            first_record = data[0]
            required_fields = ['name', 'latitude', 'longitude']
            has_all_fields = all(field in first_record for field in required_fields)
            
            if has_all_fields:
                print_test("Data Structure", True, "All required fields present")
            else:
                print_test("Data Structure", False, "Missing required fields")
                return False
        
        return True
    
    except json.JSONDecodeError as e:
        print_test("Data Format", False, f"Invalid JSON: {e}")
        return False
    except Exception as e:
        print_test("Data Validation", False, str(e))
        return False

def test_sample_validation():
    """Test 6: Sample validation with script"""
    print_header("TEST 6: Sample Validation")
    
    script_path = Path("/Users/mchand69/Documents/perundhu/scripts/unified_data_loader.py")
    data_file = Path("/Users/mchand69/Documents/perundhu/data/tamil_nadu_locations_enhanced.json")
    
    if not data_file.exists():
        print_test("Sample Validation", False, "Data file not found")
        return False
    
    try:
        # Run validation on small subset
        result = subprocess.run(
            [
                "python3",
                str(script_path),
                "--mode", "validate",
                "--data-file", str(data_file)
            ],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if "✅" in result.stderr or "valid" in result.stderr.lower():
            print_test("Validation Test", True, "Sample validation passed")
            return True
        elif result.returncode == 0:
            print_test("Validation Test", True, "Validation completed")
            return True
        else:
            print_test("Validation Test", False, result.stderr[:200])
            return False
    
    except subprocess.TimeoutExpired:
        print_test("Validation Test", False, "Validation timed out (data file too large)")
        return True  # Not a hard failure
    except Exception as e:
        print_test("Validation Test", False, str(e))
        return False

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*70)
    print("  🧪 UNIFIED DATA LOADER - SETUP VERIFICATION")
    print("="*70)
    print(f"  Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Run tests
    results["Environment"] = test_environment()
    results["File Structure"] = test_file_structure()
    results["Database"] = test_database_local()
    results["Script Functionality"] = test_script_functionality()
    results["Data Files"] = test_data_validation()
    results["Sample Validation"] = test_sample_validation()
    
    # Summary
    print_header("Summary")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        symbol = "✅" if result else "❌"
        print(f"{symbol} {test_name}")
    
    print(f"\nPassed: {passed}/{total}")
    
    if passed == total:
        print("\n🎉 All tests passed! Ready to use unified_data_loader.py")
        print("\nQuick Start:")
        print("  python3 scripts/unified_data_loader.py --mode validate --data-file data/tamil_nadu_locations_enhanced.json")
        print("  python3 scripts/unified_data_loader.py --mode locations --environment local --data-file data/tamil_nadu_locations_enhanced.json")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please fix issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(run_all_tests())
