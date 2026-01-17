#!/usr/bin/env python3
"""
MTC Chennai Bus Timing HTTP Client (no Selenium)
Calls the MTC AJAX endpoints with session + CSRF handling to retrieve:
- Routes (via initial page select options)
- Origins for a route
- Destinations for a route+origin
- Timings for a route+origin+destination

Usage examples:
    # Print timings for 5E from BESANT NAGAR to VADAPALANI B.S
    python scripts/mtc_bus_client.py --route 5E --origin "BESANT NAGAR" --destination "VADAPALANI B.S"

    # Save to JSON
    python scripts/mtc_bus_client.py --route 5E --origin "BESANT NAGAR" --destination "VADAPALANI B.S" \
        --output data/mtc_bus_timings_api.json

Notes:
- The site uses CodeIgniter CSRF: cookie `mtcwebcsrf_cookie_name` contains the token value;
  subsequent calls must include query param `csrf_test_name=<token>`.
- Endpoints often respond with HTML snippets (e.g., <option> tags for dropdowns, divs/spans for timings).
  This client parses HTML with robust fallbacks using regex.
- Please respect the site's rate limits; add `--delay` if needed.
"""

import argparse
import json
import re
import sys
import time
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import requests
try:
    from bs4 import BeautifulSoup  # type: ignore
except ImportError:
    BeautifulSoup = None  # Fallback to regex-only parsing if bs4 not available

BASE_URL = "https://mtcbus.tn.gov.in"
SEARCH_URL = f"{BASE_URL}/Home/bustimingsearch"
ORIGINS_URL = f"{BASE_URL}/Home/getoriginbyroute"
DESTINATIONS_URL = f"{BASE_URL}/Home/getdestinationrouteorigin"
TIMINGS_URL = f"{BASE_URL}/Home/ajaxbustimingsearch"

HEADERS = {
    "Accept": "*/*",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
}

@dataclass
class BusTiming:
    route_number: str
    route_name: str
    origin_value: str
    origin_name: str
    destination_value: str
    destination_name: str
    timing: str
    scraped_at: str

class MTCClient:
    def __init__(self, delay: float = 0.8, verify_ssl: bool = True):
        self.delay = delay
        self.verify_ssl = verify_ssl
        self.sess = requests.Session()
        self.csrf_token: Optional[str] = None

    def _init_session(self) -> None:
        """Load the search page to establish cookies and CSRF token."""
        resp = self.sess.get(SEARCH_URL, headers={"Accept": "text/html", **HEADERS}, timeout=30, verify=self.verify_ssl)
        resp.raise_for_status()
        # CSRF token is in cookie `mtcwebcsrf_cookie_name`
        token = self.sess.cookies.get("mtcwebcsrf_cookie_name")
        if not token and BeautifulSoup is not None:
            # Try to read hidden input value as fallback
            soup = BeautifulSoup(resp.text, "html.parser")
            hidden = soup.find("input", {"name": "csrf_test_name"})
            token = hidden["value"].strip() if hidden and hidden.has_attr("value") else None
        if not token:
            raise RuntimeError("Unable to retrieve CSRF token from MTC site")
        self.csrf_token = token

    def _params(self, extra: Dict[str, str]) -> Dict[str, str]:
        if not self.csrf_token:
            raise RuntimeError("CSRF token not initialized. Call get_routes() or explicitly initialize session.")
        return {"csrf_test_name": self.csrf_token, **extra}

    def get_routes(self) -> List[Dict[str, str]]:
        """Fetch available routes from the initial page's select options."""
        self._init_session()
        # Parse routes from the page
        resp = self.sess.get(SEARCH_URL, headers={"Accept": "text/html", **HEADERS}, timeout=30, verify=self.verify_ssl)
        resp.raise_for_status()
        routes: List[Dict[str, str]] = []
        if BeautifulSoup is not None:
            soup = BeautifulSoup(resp.text, "html.parser")
            sel = soup.find(id="selroute")
            if sel:
                for opt in sel.find_all("option"):
                    value = (opt.get("value") or "").strip()
                    text = opt.text.strip()
                    if value:
                        routes.append({"value": value, "text": text})
        if not routes:
            for m in re.finditer(r"<select[^>]*id=\"selroute\"[^>]*>(.*?)</select>", resp.text, flags=re.I|re.S):
                block = m.group(1)
                for om in re.finditer(r"<option[^>]*value=\"([^\"]+)\"[^>]*>([^<]+)</option>", block, flags=re.I):
                    value = om.group(1).strip()
                    text = om.group(2).strip()
                    if value:
                        routes.append({"value": value, "text": text})
        return routes

    def get_origins(self, route: str) -> List[Dict[str, str]]:
        """Fetch origin options for a given route value."""
        if not self.csrf_token:
            self._init_session()
        resp = self.sess.get(ORIGINS_URL, params=self._params({"selroute": route, "selfrom": "", "selto": ""}), headers=HEADERS, timeout=30, verify=self.verify_ssl)
        resp.raise_for_status()
        return self._parse_options(resp.text)

    def get_destinations(self, route: str, origin: str) -> List[Dict[str, str]]:
        """Fetch destination options for a given route and origin value."""
        if not self.csrf_token:
            self._init_session()
        resp = self.sess.get(DESTINATIONS_URL, params=self._params({"selroute": route, "selfrom": origin, "selto": ""}), headers=HEADERS, timeout=30, verify=self.verify_ssl)
        resp.raise_for_status()
        return self._parse_options(resp.text)

    def get_timings(self, route: str, origin: str, destination: str) -> List[str]:
        """Fetch timings for route+origin+destination; returns list of HH:MM strings."""
        if not self.csrf_token:
            self._init_session()
        resp = self.sess.get(TIMINGS_URL, params=self._params({"selroute": route, "selfrom": origin, "selto": destination}), headers=HEADERS, timeout=30, verify=self.verify_ssl)
        resp.raise_for_status()
        return self._parse_times(resp.text)

    @staticmethod
    def _parse_options(html: str) -> List[Dict[str, str]]:
        """Parse <option> list from HTML snippet into [{value,text}]."""
        options: List[Dict[str, str]] = []
        if BeautifulSoup is not None:
            soup = BeautifulSoup(html, "html.parser")
            for opt in soup.find_all("option"):
                value = (opt.get("value") or "").strip()
                text = opt.text.strip()
                if value and text and text not in {"--Origin--", "--Destination--", "--Select--"}:
                    options.append({"value": value, "text": text})
        # Fallback: regex extraction if markup is unusual
        if not options:
            for m in re.finditer(r"<option[^>]*value=\"([^\"]+)\"[^>]*>([^<]+)</option>", html, flags=re.I):
                value = m.group(1).strip()
                text = m.group(2).strip()
                options.append({"value": value, "text": text})
        return options

    @staticmethod
    def _parse_times(html: str) -> List[str]:
        """Extract HH:MM times from HTML/text reliably."""
        # Remove scripts/styles to reduce noise
        text = html
        if BeautifulSoup is not None:
            soup = BeautifulSoup(html, "html.parser")
            for tag in soup(["script", "style"]):
                tag.extract()
            text = soup.get_text(" ")
        times: List[str] = []
        found = set()
        pat = re.compile(r"\b(\d{1,2}):(\d{2})\b")
        for h, m in pat.findall(text):
            hh = int(h)
            mm = int(m)
            if 0 <= hh <= 23 and 0 <= mm <= 59:
                found.add(f"{hh:02d}:{mm:02d}")
        times = sorted(found)
        # Fallback: search raw HTML too
        if not times:
            for h, m in pat.findall(html):
                hh = int(h)
                mm = int(m)
                if 0 <= hh <= 23 and 0 <= mm <= 59:
                    found.add(f"{hh:02d}:{mm:02d}")
            times = sorted(found)
        return times


def run_cli(route: str, origin_text: Optional[str], destination_text: Optional[str], output: Optional[str], delay: float, insecure: bool) -> int:
    client = MTCClient(delay=delay, verify_ssl=not insecure)
    # Get routes
    routes = client.get_routes()
    route_entry = next((r for r in routes if r["value"].strip().upper() == route.strip().upper()), None)
    if not route_entry:
        print(f"Route '{route}' not found. Available examples: {', '.join(r['value'] for r in routes[:10])}")
        return 1

    # Fetch origins
    time.sleep(delay)
    origins = client.get_origins(route_entry["value"])
    if not origins:
        print("No origins returned for route.")
        return 1

    origin_entry: Optional[Dict[str, str]] = None
    if origin_text:
        origin_entry = next((o for o in origins if o["text"].strip().upper() == origin_text.strip().upper()), None)
        if not origin_entry:
            print(f"Origin '{origin_text}' not found. Sample origins: {', '.join(o['text'] for o in origins[:10])}")
            return 1
    else:
        origin_entry = origins[0]

    # Fetch destinations
    time.sleep(delay)
    dests = client.get_destinations(route_entry["value"], origin_entry["value"])
    if not dests:
        print("No destinations returned for origin.")
        return 1

    dest_entry: Optional[Dict[str, str]] = None
    if destination_text:
        dest_entry = next((d for d in dests if d["text"].strip().upper() == destination_text.strip().upper()), None)
        if not dest_entry:
            print(f"Destination '{destination_text}' not found. Sample destinations: {', '.join(d['text'] for d in dests[:10])}")
            return 1
    else:
        dest_entry = dests[0]

    # Timings
    time.sleep(delay)
    times = client.get_timings(route_entry["value"], origin_entry["value"], dest_entry["value"]) 
    scraped_at = datetime.now().isoformat()

    # Prepare results
    results: List[BusTiming] = [
        BusTiming(
            route_number=route_entry["value"],
            route_name=route_entry["text"],
            origin_value=origin_entry["value"],
            origin_name=origin_entry["text"],
            destination_value=dest_entry["value"],
            destination_name=dest_entry["text"],
            timing=t,
            scraped_at=scraped_at,
        )
        for t in times
    ]

    # Print summary
    print(f"Route {route_entry['text']} | {origin_entry['text']} → {dest_entry['text']} | {len(results)} timings")
    if results:
        print("Timings:", ", ".join(timing.timing for timing in results[:20]))

    # Save if requested
    if output:
        path = Path(output)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump([asdict(r) for r in results], f, indent=2, ensure_ascii=False)
        print(f"Saved {len(results)} records to {path}")

    return 0

def list_origins_cli(route: str, delay: float, insecure: bool) -> int:
    client = MTCClient(delay=delay, verify_ssl=not insecure)
    routes = client.get_routes()
    route_entry = next((r for r in routes if r["value"].strip().upper() == route.strip().upper()), None)
    if not route_entry:
        print(f"Route '{route}' not found.")
        return 1
    time.sleep(delay)
    origins = client.get_origins(route_entry["value"])
    if not origins:
        print("No origins found.")
        return 1
    print(f"Origins for route {route_entry['text']} ({len(origins)}):")
    for o in origins:
        print(f"- {o['text']}")
    return 0

def list_destinations_cli(route: str, origin_text: str, delay: float, insecure: bool) -> int:
    client = MTCClient(delay=delay, verify_ssl=not insecure)
    routes = client.get_routes()
    route_entry = next((r for r in routes if r["value"].strip().upper() == route.strip().upper()), None)
    if not route_entry:
        print(f"Route '{route}' not found.")
        return 1
    time.sleep(delay)
    origins = client.get_origins(route_entry["value"])
    origin_entry = next((o for o in origins if o["text"].strip().upper() == origin_text.strip().upper()), None)
    if not origin_entry:
        print(f"Origin '{origin_text}' not found. Sample origins: {', '.join(o['text'] for o in origins[:10])}")
        return 1
    time.sleep(delay)
    dests = client.get_destinations(route_entry["value"], origin_entry["value"])
    if not dests:
        print("No destinations found.")
        return 1
    print(f"Destinations for {route_entry['text']} → {origin_entry['text']} ({len(dests)}):")
    for d in dests:
        print(f"- {d['text']}")
    return 0

def bulk_scrape_cli(route: str, output: Optional[str], delay: float, insecure: bool) -> int:
    client = MTCClient(delay=delay, verify_ssl=not insecure)
    routes = client.get_routes()
    route_entry = next((r for r in routes if r["value"].strip().upper() == route.strip().upper()), None)
    if not route_entry:
        print(f"Route '{route}' not found.")
        return 1
    time.sleep(delay)
    origins = client.get_origins(route_entry["value"])
    if not origins:
        print("No origins returned for route.")
        return 1
    scraped_at = datetime.now().isoformat()
    results: List[BusTiming] = []
    for origin_entry in origins:
        time.sleep(delay)
        dests = client.get_destinations(route_entry["value"], origin_entry["value"])
        for dest_entry in dests:
            time.sleep(delay)
            times = client.get_timings(route_entry["value"], origin_entry["value"], dest_entry["value"]) 
            for t in times:
                results.append(BusTiming(
                    route_number=route_entry["value"],
                    route_name=route_entry["text"],
                    origin_value=origin_entry["value"],
                    origin_name=origin_entry["text"],
                    destination_value=dest_entry["value"],
                    destination_name=dest_entry["text"],
                    timing=t,
                    scraped_at=scraped_at,
                ))
    print(f"Collected {len(results)} timings across {len(origins)} origins for route {route_entry['text']}")
    if output:
        path = Path(output)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump([asdict(r) for r in results], f, indent=2, ensure_ascii=False)
        print(f"Saved {len(results)} records to {path}")
    return 0


def main():
    parser = argparse.ArgumentParser(description="Fetch MTC timings via AJAX endpoints")
    parser.add_argument("--route", required=True, help="Route number value (e.g., 5E)")
    parser.add_argument("--origin", help="Origin stop text (e.g., BESANT NAGAR)")
    parser.add_argument("--destination", help="Destination stop text (e.g., VADAPALANI B.S)")
    parser.add_argument("--output", help="Optional output JSON file path")
    parser.add_argument("--delay", type=float, default=0.8, help="Delay between calls")
    parser.add_argument("--insecure", action="store_true", help="Disable SSL certificate verification (use if site cert errors)")
    parser.add_argument("--list-origins", action="store_true", help="List origins for the given route")
    parser.add_argument("--list-destinations", action="store_true", help="List destinations for the given route+origin")
    parser.add_argument("--bulk", action="store_true", help="Scrape all origin-destination timings for the route")
    args = parser.parse_args()

    try:
        if args.list_origins:
            sys.exit(list_origins_cli(args.route, args.delay, args.insecure))
        if args.list_destinations:
            if not args.origin:
                print("--origin required with --list-destinations")
                sys.exit(2)
            sys.exit(list_destinations_cli(args.route, args.origin, args.delay, args.insecure))
        if args.bulk:
            out = args.output or f"data/mtc_bus_timings_api_{args.route}.json"
            sys.exit(bulk_scrape_cli(args.route, out, args.delay, args.insecure))

        sys.exit(run_cli(args.route, args.origin, args.destination, args.output, args.delay, args.insecure))
    except requests.HTTPError as e:
        print(f"HTTP error: {e}")
        sys.exit(2)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(2)


if __name__ == "__main__":
    main()
