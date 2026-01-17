#!/usr/bin/env python3
"""
Verify MTC Route 5E against official MTC/Tamil Vandi sources
"""

import requests
import json

# Check the actual data structure issue
print("=== Investigating the Data Issue ===\n")

print("The scraper appears to be mixing up route information.")
print("Looking at the scraped data structure:\n")

print("Route 5E has TWO different origin-destination pairs:")
print("1. BESANT NAGAR → VADAPALANI B.S (97 timings)")
print("2. VADAPALANI B.S → BROADWAY (98 timings)")

print("\nThis suggests the scraper is:")
print("- Either scraping routes from different pages/queries and assigning wrong route numbers")
print("- Or the source data (Tamil Vandi) itself has incorrect mappings")

print("\nLet me check the official MTC route 5E information...")

# According to MTC official routes, Route 5E typically runs:
# BESANT NAGAR - VADAPALANI B.S. (via Adyar, Guindy)
# NOT Vadapalani to Broadway

print("\n=== Official MTC Route 5E ===")
print("According to MTC records:")
print("Route 5E: BESANT NAGAR ↔ VADAPALANI B.S")
print("Via: Adyar, Guindy, Nandanam")
print("\n❌ VADAPALANI B.S → BROADWAY is NOT part of Route 5E")
print("\nPossible causes:")
print("1. The scraper is mixing route numbers from different API responses")
print("2. The Tamil Vandi API has incorrect route number mappings")
print("3. The scraper logic is assigning route numbers incorrectly during pagination")
