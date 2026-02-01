#!/usr/bin/env python3
"""
Single-command bulk upload for locations + buses + stops.
Defaults to the primary data files and strict mode (fail fast on unresolved locations).
"""

import argparse
from types import SimpleNamespace

from unified_data_loader import UnifiedDataLoader


DEFAULT_LOCATIONS = "data/tamil_nadu_locations_enhanced.json"
DEFAULT_BUSES = "data/consolidated_buses.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Full bulk upload (locations + buses + stops) using unified loader"
    )
    parser.add_argument(
        "--environment",
        choices=["local", "preprod", "prod", "production"],
        default="preprod",
        help="Target environment (default: preprod)",
    )
    parser.add_argument(
        "--locations",
        default=DEFAULT_LOCATIONS,
        help=f"Locations file (default: {DEFAULT_LOCATIONS})",
    )
    parser.add_argument(
        "--buses",
        default=DEFAULT_BUSES,
        help=f"Buses file (default: {DEFAULT_BUSES})",
    )
    parser.add_argument(
        "--operator",
        choices=["MTC", "TNSTC", "KRTC", "KSRTC", "APSRTC", "OTHER"],
        default="TNSTC",
        help="Bus operator name (default: TNSTC)",
    )
    parser.add_argument(
        "--force-overwrite",
        action="store_true",
        help="Force overwrite existing data",
    )
    parser.add_argument(
        "--permissive",
        action="store_true",
        help="Allow unresolved locations (disables strict mode)",
    )
    parser.add_argument(
        "--enable-translation",
        action="store_true",
        help="Enable Tamil translation for locations and buses",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    strict_mode = not args.permissive

    unified_args = SimpleNamespace(
        mode="full",
        environment=args.environment,
        data_file=None,
        locations=args.locations,
        buses=args.buses,
        operator=args.operator,
        checkpoint=None,
        force_overwrite=args.force_overwrite,
        batch_size=1000,
        dry_run=False,
        verbose=False,
        strict=strict_mode,
        enable_translation=args.enable_translation,
    )

    loader = UnifiedDataLoader(args.environment)
    success = loader.run(unified_args)
    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())
