#!/usr/bin/env python3
"""
Transform flat bus timing data (MTC, TNSTC) to structured format with stops array
Converts format from individual timing entries to route-based structure
"""

import json
import logging
from pathlib import Path
from typing import Dict, List
from collections import defaultdict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BusDataTransformer:
    """Transform flat bus timing data to structured format"""
    
    def __init__(self, operator: str = 'MTC'):
        self.operator = operator.upper()
        logger.info(f"Initialized transformer for {operator}")
    
    def transform_flat_to_structured(self, flat_data: List[Dict]) -> List[Dict]:
        """
        Transform flat timing entries to structured routes with stops
        
        Input format (flat):
        {
            "route_number": "101",
            "origin_name": "LOCATION A",
            "destination_name": "LOCATION B",
            "timing": "10:30"
        }
        
        Output format (structured):
        {
            "route_number": "101",
            "origin": "LOCATION A",
            "destination": "LOCATION B",
            "stops": []  # Empty for now, can be populated later
        }
        """
        routes_dict = defaultdict(lambda: {
            'route_number': None,
            'origin': None,
            'destination': None,
            'stops': []
        })
        
        for entry in flat_data:
            route_key = (
                entry.get('route_number', ''),
                entry.get('origin_name', ''),
                entry.get('destination_name', '')
            )
            
            if route_key[0]:  # Only process if route_number exists
                if routes_dict[route_key]['route_number'] is None:
                    routes_dict[route_key]['route_number'] = entry.get('route_number', '')
                    routes_dict[route_key]['origin'] = entry.get('origin_name', '')
                    routes_dict[route_key]['destination'] = entry.get('destination_name', '')
        
        # Convert dict to list
        structured_data = list(routes_dict.values())
        logger.info(f"Transformed {len(flat_data)} flat entries into {len(structured_data)} structured routes")
        
        return structured_data
    
    def load_json(self, file_path: Path) -> List[Dict]:
        """Load JSON data from file"""
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        logger.info(f"Loading data from: {file_path}")
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        logger.info(f"Loaded {len(data)} entries")
        return data
    
    def save_json(self, data: List[Dict], output_path: Path):
        """Save JSON data to file"""
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(data)} structured routes to: {output_path}")
    
    def create_checkpoint(self, structured_data: List[Dict], operator: str, output_dir: Path = Path('data')):
        """Create checkpoint file in the format expected by upload_bus_data.py"""
        checkpoint = {
            'all_timings': structured_data,
            'operator': operator,
            'total_routes': len(structured_data),
            'created_at': json.dumps(None, default=str)  # Will be set by caller
        }
        
        checkpoint_file = output_dir / f'{operator.lower()}_bus_timings.checkpoint.json'
        
        with open(checkpoint_file, 'w', encoding='utf-8') as f:
            json.dump(checkpoint, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Created checkpoint file: {checkpoint_file}")
        logger.info(f"Checkpoint contains {len(structured_data)} routes ready for upload")
        
        return checkpoint_file
    
    def run(self, input_file: Path, output_dir: Path = Path('data')):
        """Main transformation flow"""
        try:
            # Load flat data
            flat_data = self.load_json(input_file)
            
            # Transform to structured format
            structured_data = self.transform_flat_to_structured(flat_data)
            
            # Save structured data
            output_file = output_dir / f'{self.operator.lower()}_structured.json'
            self.save_json(structured_data, output_file)
            
            # Create checkpoint
            checkpoint_file = self.create_checkpoint(structured_data, self.operator, output_dir)
            
            logger.info(f"✅ Transformation completed successfully")
            logger.info(f"   Structured data: {output_file}")
            logger.info(f"   Checkpoint file: {checkpoint_file}")
            
            return structured_data, checkpoint_file
        
        except Exception as e:
            logger.error(f"Transformation failed: {e}")
            raise


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Transform flat bus timing data to structured format',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/transform_flat_bus_data.py --input data/mtc_all_routes_complete.json --operator MTC
  python scripts/transform_flat_bus_data.py --input data/tnstc_data.json --operator TNSTC
        """
    )
    
    parser.add_argument(
        '--input',
        type=Path,
        required=True,
        help='Input JSON file with flat bus timing data'
    )
    
    parser.add_argument(
        '--operator',
        type=str,
        default='MTC',
        choices=['MTC', 'TNSTC'],
        help='Bus operator name (default: MTC)'
    )
    
    parser.add_argument(
        '--output-dir',
        type=Path,
        default=Path('data'),
        help='Output directory for structured data (default: data/)'
    )
    
    args = parser.parse_args()
    
    transformer = BusDataTransformer(operator=args.operator)
    transformer.run(args.input, args.output_dir)
