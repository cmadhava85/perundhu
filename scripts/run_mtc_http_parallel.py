#!/usr/bin/env python3
"""
Parallel MTC HTTP Scraper (non-Selenium)
- Discovers origins and destinations for routes via AJAX endpoints
- Executes timing fetches for origin→destination pairs in parallel (threaded)
- Supports dry-run to preview planned tasks without hitting network

Examples:
  # Dry run for a single route
  python scripts/run_mtc_http_parallel.py --route 5E --dry-run

  # Run small parallel scrape for 5E
  python scripts/run_mtc_http_parallel.py --route 5E --workers 4 --limit-origins 2 --limit-destinations 1 \
      --delay 1.0 --insecure --output data/mtc_parallel_http_5E.json

  # Multiple routes (comma-separated)
  python scripts/run_mtc_http_parallel.py --routes 5E,5,17E --workers 6 --insecure --output data/mtc_parallel_http.json
"""

import argparse
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import warnings

# Suppress SSL warnings
warnings.filterwarnings('ignore', message='Unverified HTTPS request')

# Reuse client without importing to avoid path issues
# Minimal inline client copy (uses same endpoints/logic as mtc_bus_client.py)
import re
import requests
requests.packages.urllib3.disable_warnings(requests.packages.urllib3.exceptions.InsecureRequestWarning)
try:
    from bs4 import BeautifulSoup  # type: ignore
except ImportError:
    BeautifulSoup = None

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
    _shared_session = None  # Class-level shared session
    _shared_csrf = None
    
    def __init__(self, delay: float = 0.8, verify_ssl: bool = True):
        self.delay = delay
        self.verify_ssl = verify_ssl
        # Use shared session if available, otherwise create new one
        if MTCClient._shared_session is None:
            MTCClient._shared_session = requests.Session()
        self.sess = MTCClient._shared_session
        self.csrf_token: Optional[str] = None
    
    def _init_session(self) -> None:
        # Use cached CSRF token if available
        if MTCClient._shared_csrf is not None:
            self.csrf_token = MTCClient._shared_csrf
            return
            
        resp = self.sess.get(SEARCH_URL, headers={"Accept": "text/html", **HEADERS}, timeout=60, verify=self.verify_ssl)
        resp.raise_for_status()
        token = self.sess.cookies.get("mtcwebcsrf_cookie_name")
        if not token and BeautifulSoup is not None:
            soup = BeautifulSoup(resp.text, "html.parser")
            hidden = soup.find("input", {"name": "csrf_test_name"})
            token = hidden["value"].strip() if hidden and hidden.has_attr("value") else None
        if not token:
            raise RuntimeError("Unable to retrieve CSRF token from MTC site")
        self.csrf_token = token
        MTCClient._shared_csrf = token  # Cache for reuse
    def _params(self, extra: Dict[str, str]) -> Dict[str, str]:
        if not self.csrf_token:
            raise RuntimeError("CSRF token not initialized. Call get_routes().")
        return {"csrf_test_name": self.csrf_token, **extra}
    def get_routes(self) -> List[Dict[str, str]]:
        self._init_session()
        resp = self.sess.get(SEARCH_URL, headers={"Accept": "text/html", **HEADERS}, timeout=60, verify=self.verify_ssl)
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
        if not self.csrf_token:
            self._init_session()
        resp = self.sess.get(ORIGINS_URL, params=self._params({"selroute": route, "selfrom": "", "selto": ""}), headers=HEADERS, timeout=60, verify=self.verify_ssl)
        resp.raise_for_status()
        return self._parse_options(resp.text)
    def get_destinations(self, route: str, origin: str) -> List[Dict[str, str]]:
        if not self.csrf_token:
            self._init_session()
        resp = self.sess.get(DESTINATIONS_URL, params=self._params({"selroute": route, "selfrom": origin, "selto": ""}), headers=HEADERS, timeout=60, verify=self.verify_ssl)
        resp.raise_for_status()
        return self._parse_options(resp.text)
    def get_timings(self, route: str, origin: str, destination: str) -> List[str]:
        if not self.csrf_token:
            self._init_session()
        resp = self.sess.get(TIMINGS_URL, params=self._params({"selroute": route, "selfrom": origin, "selto": destination}), headers=HEADERS, timeout=60, verify=self.verify_ssl)
        resp.raise_for_status()
        return self._parse_times(resp.text)
    @staticmethod
    def _parse_options(html: str) -> List[Dict[str, str]]:
        options: List[Dict[str, str]] = []
        if BeautifulSoup is not None:
            soup = BeautifulSoup(html, "html.parser")
            for opt in soup.find_all("option"):
                value = (opt.get("value") or "").strip()
                text = opt.text.strip()
                if value and text and text not in {"--Origin--", "--Destination--", "--Select--"}:
                    options.append({"value": value, "text": text})
        if not options:
            for m in re.finditer(r"<option[^>]*value=\"([^\"]+)\"[^>]*>([^<]+)</option>", html, flags=re.I):
                value = m.group(1).strip()
                text = m.group(2).strip()
                options.append({"value": value, "text": text})
        return options
    @staticmethod
    def _parse_times(html: str) -> List[str]:
        text = html
        if BeautifulSoup is not None:
            soup = BeautifulSoup(html, "html.parser")
            for tag in soup(["script", "style"]):
                tag.extract()
            text = soup.get_text(" ")
        found = set()
        pat = re.compile(r"\b(\d{1,2}):(\d{2})\b")
        for h, m in pat.findall(text):
            hh = int(h); mm = int(m)
            if 0 <= hh <= 23 and 0 <= mm <= 59:
                found.add(f"{hh:02d}:{mm:02d}")
        times = sorted(found)
        if not times:
            for h, m in pat.findall(html):
                hh = int(h); mm = int(m)
                if 0 <= hh <= 23 and 0 <= mm <= 59:
                    found.add(f"{hh:02d}:{mm:02d}")
            times = sorted(found)
        return times

@dataclass
class Task:
    route_value: str
    route_text: str
    origin_value: str
    origin_text: str
    dest_value: str
    dest_text: str


def build_tasks(client: MTCClient, route_values: List[str], limit_origins: Optional[int], limit_destinations: Optional[int]) -> Tuple[List[Task], Dict[str, int]]:
    tasks: List[Task] = []
    meta = {"routes": 0, "origins": 0, "pairs": 0}
    # Discover full route list once
    print("Fetching route list from MTC website...")
    try:
        all_routes = client.get_routes()
    except Exception as e:
        print(f"ERROR: Failed to fetch route list: {e}")
        return tasks, meta
    
    route_map = {r["value"].strip().upper(): r for r in all_routes}
    print(f"Found {len(route_values)} routes to process")
    
    for idx, rv in enumerate(route_values, 1):
        key = rv.strip().upper()
        if key not in route_map:
            print(f"[{idx}/{len(route_values)}] Route {rv} not found, skipping")
            continue
        route = route_map[key]
        print(f"[{idx}/{len(route_values)}] Discovering route {rv} ({route['text']})...")
        meta["routes"] += 1
        time.sleep(client.delay)
        
        try:
            origins = client.get_origins(route["value"])[:limit_origins or None]
        except Exception as e:
            print(f"  ERROR getting origins for {rv}: {e}, skipping")
            continue
            
        meta["origins"] += len(origins)
        print(f"  Found {len(origins)} origins, discovering destinations...")
        
        for o in origins:
            time.sleep(client.delay)
            try:
                dests = client.get_destinations(route["value"], o["value"])[:limit_destinations or None]
                for d in dests:
                    tasks.append(Task(
                        route_value=route["value"], route_text=route["text"],
                        origin_value=o["value"], origin_text=o["text"],
                        dest_value=d["value"], dest_text=d["text"],
                    ))
            except Exception as e:
                print(f"    ERROR getting destinations for {o['text']}: {e}, skipping")
                continue
    
    meta["pairs"] = len(tasks)
    return tasks, meta


def fetch_task(task: Task, delay: float, insecure: bool) -> List[BusTiming]:
    try:
        client = MTCClient(delay=delay, verify_ssl=not insecure)
        # Small delay to be polite
        time.sleep(delay)
        times = client.get_timings(task.route_value, task.origin_value, task.dest_value)
        scraped_at = datetime.now().isoformat()
        return [BusTiming(
            route_number=task.route_value,
            route_name=task.route_text,
            origin_value=task.origin_value,
            origin_name=task.origin_text,
            destination_value=task.dest_value,
            destination_name=task.dest_text,
            timing=t,
            scraped_at=scraped_at,
        ) for t in times]
    except Exception as e:
        print(f"    Warning: Failed to fetch {task.route_text} {task.origin_text}→{task.dest_text}: {e}")
        return []


def main():
    parser = argparse.ArgumentParser(description="Run parallel MTC HTTP scraping for route timings")
    parser.add_argument("--route", help="Single route value (e.g., 5E)")
    parser.add_argument("--routes", help="Comma-separated route values (e.g., 5E,5,17E)")
    parser.add_argument("--workers", type=int, default=5, help="Number of parallel workers")
    parser.add_argument("--limit-origins", type=int, help="Limit number of origins per route")
    parser.add_argument("--limit-destinations", type=int, help="Limit number of destinations per origin")
    parser.add_argument("--delay", type=float, default=0.8, help="Delay between discovery/fetch calls")
    parser.add_argument("--insecure", action="store_true", help="Disable SSL verification")
    parser.add_argument("--dry-run", action="store_true", help="Show planned tasks only")
    parser.add_argument("--output", default="data/mtc_parallel_http.json", help="Output JSON file path")
    args = parser.parse_args()

    route_values: List[str] = []
    if args.route:
        route_values.append(args.route)
    if args.routes:
        route_values.extend([r.strip() for r in args.routes.split(',') if r.strip()])
    if not route_values:
        print("Provide --route or --routes")
        sys.exit(2)

    # Discovery phase (sequential) to build tasks
    try:
        discovery_client = MTCClient(delay=args.delay, verify_ssl=not args.insecure)
        tasks, meta = build_tasks(discovery_client, route_values, args.limit_origins, args.limit_destinations)
    except Exception as e:
        print(f"Discovery error: {e}")
        sys.exit(2)

    print(f"Planned: {meta['routes']} routes, {meta['origins']} origins, {meta['pairs']} origin→destination pairs")
    if args.dry_run:
        for t in tasks[:20]:
            print(f"- {t.route_text}: {t.origin_text} → {t.dest_text}")
        if len(tasks) > 20:
            print(f"... and {len(tasks) - 20} more pairs")
        sys.exit(0)

    # Execute phase (parallel)
    results: List[BusTiming] = []
    errors: int = 0
    completed: int = 0
    print(f"Starting parallel execution with {args.workers} workers...")
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = [executor.submit(fetch_task, t, args.delay, args.insecure) for t in tasks]
        for f in as_completed(futures, timeout=120):  # 2-minute timeout per batch
            try:
                timings = f.result()
                results.extend(timings)
                completed += 1
                # Progress every 5 tasks or show all for small jobs
                if completed % 5 == 0 or len(tasks) <= 20:
                    print(f"Progress: {completed}/{len(tasks)} pairs completed, {len(results)} timings found, {errors} errors")
            except Exception as e:
                errors += 1
                completed += 1
                # Keep it brief
                if errors <= 5:
                    print(f"Worker error (task {completed}/{len(tasks)}): {e}")
    print(f"\nCompleted: {completed}/{len(tasks)} pairs processed, {len(results)} timings found, {errors} errors")

    # Save
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump([asdict(r) for r in results], f, indent=2, ensure_ascii=False)
    print(f"Saved {len(results)} records to {out_path}")


if __name__ == "__main__":
    main()
