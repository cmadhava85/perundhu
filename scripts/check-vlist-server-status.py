#!/usr/bin/env python3

"""
vlist.in Server Status Checker
Monitors server availability and notifies when it's back online
"""

import requests
import time
from datetime import datetime
from pathlib import Path

class VlistServerChecker:
    def __init__(self, check_interval=300):  # 5 minutes default
        self.base_url = "https://vlist.in/state/33.html"
        self.check_interval = check_interval
        self.status_file = Path(__file__).parent.parent / 'data' / 'vlist_server_status.txt'
    
    def check_server(self):
        """Check if vlist.in is responding"""
        try:
            response = requests.head(self.base_url, timeout=5)
            is_up = response.status_code < 500
            return is_up, response.status_code
        except Exception as e:
            return False, str(e)[:50]
    
    def log_status(self, is_up, status):
        """Log status to file"""
        with open(self.status_file, 'a') as f:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            status_text = "🟢 UP" if is_up else "🔴 DOWN"
            f.write(f"{timestamp} | {status_text} | Status: {status}\n")
    
    def monitor_once(self):
        """Check status once"""
        is_up, status = self.check_server()
        self.log_status(is_up, status)
        return is_up, status
    
    def monitor_continuous(self):
        """Continuously monitor until server is back"""
        print("\n" + "=" * 60)
        print("🔍 VLIST.IN SERVER STATUS MONITOR")
        print("=" * 60)
        print(f"Checking every {self.check_interval} seconds...\n")
        
        attempt = 0
        while True:
            attempt += 1
            is_up, status = self.check_server()
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            if is_up:
                print(f"✅ [{timestamp}] Server is UP (Status: {status})")
                print("\n🚀 Server recovered! You can now run:")
                print("   python3 scripts/scrape-vlist-villages-detailed.py\n")
                self.log_status(True, status)
                return True
            else:
                print(f"❌ [{timestamp}] Attempt {attempt}: Server DOWN (Status: {status})")
                self.log_status(False, status)
                print(f"   Waiting {self.check_interval} seconds...", end="", flush=True)
                time.sleep(self.check_interval)
                print(" (checking...)")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Monitor vlist.in server status')
    parser.add_argument('--interval', type=int, default=300, 
                        help='Check interval in seconds (default: 300 = 5 min)')
    parser.add_argument('--once', action='store_true', 
                        help='Check only once instead of continuous')
    
    args = parser.parse_args()
    
    checker = VlistServerChecker(check_interval=args.interval)
    
    if args.once:
        is_up, status = checker.monitor_once()
        if is_up:
            print(f"✅ Server UP (Status: {status})")
        else:
            print(f"❌ Server DOWN (Status: {status})")
    else:
        checker.monitor_continuous()

if __name__ == '__main__':
    main()
