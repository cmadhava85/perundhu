#!/usr/bin/env python3
import json
import argparse
from pathlib import Path


def load_json_array(path: Path):
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError(f"Expected a JSON array in {path}")
    return data


def save_json_array(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def key_for(item):
    return (
        item.get("route_number"),
        item.get("origin_value"),
        item.get("destination_value"),
        item.get("timing"),
    )


def merge_arrays(base, incoming):
    seen = {key_for(item) for item in base}
    merged = list(base)
    added = 0
    for item in incoming:
        k = key_for(item)
        if k not in seen:
            merged.append(item)
            seen.add(k)
            added += 1
    return merged, added


def main():
    p = argparse.ArgumentParser(description="Merge MTC timing JSON arrays with deduping")
    p.add_argument("--source", required=True, help="New scrape JSON file to merge")
    p.add_argument("--target", required=True, help="Existing main JSON file")
    p.add_argument(
        "--output",
        required=False,
        help="Output merged JSON file (defaults to target path)"
    )
    args = p.parse_args()

    source = Path(args.source)
    target = Path(args.target)
    output = Path(args.output) if args.output else target

    base = load_json_array(target)
    incoming = load_json_array(source)

    merged, added = merge_arrays(base, incoming)
    save_json_array(output, merged)

    print(f"Merged {len(incoming)} records into {target}")
    print(f"Added {added} new unique records; merged total: {len(merged)}")
    print(f"Saved to {output}")


if __name__ == "__main__":
    main()
