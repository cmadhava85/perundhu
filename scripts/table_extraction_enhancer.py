"""
Table Extraction Enhancer for Bus Schedules
===========================================
Improves extraction of multi-row table data from bus schedule images.
Handles tabular layouts with multiple routes in a single image.

Features:
- Detect table structure and grid layout
- Extract all rows from multi-row tables
- Parse columns independently
- Handle merged cells and irregular layouts
- Improve route extraction from tabular data
"""

import re
import logging
from typing import List, Dict, Tuple, Optional, Any
from dataclasses import dataclass, asdict
import pytesseract
import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


@dataclass
class TableCell:
    """Represents a single cell in a table."""
    text: str
    row: int
    col: int
    confidence: float = 0.0
    x: int = 0
    y: int = 0
    width: int = 0
    height: int = 0


@dataclass
class TableRow:
    """Represents a single row in a table."""
    cells: List[TableCell]
    row_index: int
    y_position: int
    height: int
    
    def get_text_by_col(self, col_idx: int) -> str:
        """Get text from a specific column in this row."""
        for cell in self.cells:
            if cell.col == col_idx:
                return cell.text
        return ""
    
    def get_all_text(self) -> str:
        """Get all text in row concatenated."""
        return " ".join([cell.text for cell in sorted(self.cells, key=lambda c: c.col)])


class TableExtractor:
    """Extract and parse tabular data from bus schedule images."""
    
    def __init__(self, debug: bool = False):
        self.debug = debug
    
    def detect_table_structure(self, image: Image.Image) -> Optional[Dict[str, Any]]:
        """
        Detect table structure using OCR bounding boxes (more flexible).
        
        Returns:
            Dict with table grid information (rows, cols, lines)
        """
        try:
            # Get OCR data with bounding boxes
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            
            # Extract y-coordinates (row boundaries) and x-coordinates (column boundaries)
            y_coords = set()
            x_coords = set()
            
            for i, text in enumerate(data['text']):
                if text.strip():
                    y_coords.add(data['top'][i])
                    x_coords.add(data['left'][i])
            
            if len(y_coords) < 2 or len(x_coords) < 2:
                logger.warning(f"Insufficient coordinates: y={len(y_coords)}, x={len(x_coords)}")
                return None
            
            # Sort and cluster coordinates (group nearby ones)
            y_positions = sorted(y_coords)
            x_positions = sorted(x_coords)
            
            # Cluster positions that are close together (< 10 pixels)
            def cluster_positions(positions: List[int], threshold: int = 10) -> List[int]:
                if not positions:
                    return []
                
                clustered = [positions[0]]
                for pos in positions[1:]:
                    if pos - clustered[-1] > threshold:
                        clustered.append(pos)
                    else:
                        # Update last cluster center
                        clustered[-1] = (clustered[-1] + pos) // 2
                
                return clustered
            
            row_positions = cluster_positions(y_positions, threshold=15)
            col_positions = cluster_positions(x_positions, threshold=15)
            
            logger.info(f"Detected {len(row_positions)} row boundaries, {len(col_positions)} col boundaries")
            
            return {
                'row_positions': row_positions,
                'col_positions': col_positions,
                'num_rows': len(row_positions) - 1,
                'num_cols': len(col_positions) - 1,
                'image_height': image.height,
                'image_width': image.width
            }
        
        except Exception as e:
            logger.error(f"Error detecting table structure: {e}")
            return None
    
    def extract_table_cells_from_structure(self, image: Image.Image, 
                                          table_structure: Dict[str, Any]) -> List[TableCell]:
        """
        Extract individual cells from detected table structure.
        
        Uses pytesseract with detailed output to get bounding boxes.
        """
        try:
            cells = []
            
            row_positions = table_structure['row_positions']
            col_positions = table_structure['col_positions']
            
            # Get detailed OCR data with bounding boxes
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            
            # Map OCR results to table cells
            for i, text in enumerate(data['text']):
                if not text.strip():
                    continue
                
                x = data['left'][i]
                y = data['top'][i]
                w = data['width'][i]
                h = data['height'][i]
                conf = float(data['conf'][i]) / 100.0
                
                # Find which row and column this cell belongs to
                row_idx = None
                col_idx = None
                
                # Find row
                for r in range(len(row_positions) - 1):
                    if row_positions[r] <= y < row_positions[r + 1]:
                        row_idx = r
                        break
                
                # Find column
                for c in range(len(col_positions) - 1):
                    if col_positions[c] <= x < col_positions[c + 1]:
                        col_idx = c
                        break
                
                if row_idx is not None and col_idx is not None:
                    cell = TableCell(
                        text=text.strip(),
                        row=row_idx,
                        col=col_idx,
                        confidence=conf,
                        x=x,
                        y=y,
                        width=w,
                        height=h
                    )
                    cells.append(cell)
            
            return cells
        
        except Exception as e:
            logger.error(f"Error extracting table cells: {e}")
            return []
    
    def organize_cells_into_rows(self, cells: List[TableCell]) -> List[TableRow]:
        """Organize extracted cells into structured rows."""
        try:
            if not cells:
                return []
            
            # Group cells by row
            rows_dict: Dict[int, List[TableCell]] = {}
            row_y_positions: Dict[int, int] = {}
            
            for cell in cells:
                row_idx = cell.row
                if row_idx not in rows_dict:
                    rows_dict[row_idx] = []
                    row_y_positions[row_idx] = cell.y
                
                rows_dict[row_idx].append(cell)
            
            # Create TableRow objects
            table_rows = []
            for row_idx in sorted(rows_dict.keys()):
                cells_in_row = rows_dict[row_idx]
                y_position = row_y_positions[row_idx]
                height = max([cell.height for cell in cells_in_row]) if cells_in_row else 0
                
                table_row = TableRow(
                    cells=sorted(cells_in_row, key=lambda c: c.col),
                    row_index=row_idx,
                    y_position=y_position,
                    height=height
                )
                table_rows.append(table_row)
            
            return table_rows
        
        except Exception as e:
            logger.error(f"Error organizing cells into rows: {e}")
            return []
    
    def extract_table_from_image(self, image: Image.Image) -> Optional[List[TableRow]]:
        """
        Complete pipeline to extract table from image.
        
        Returns:
            List of TableRow objects representing the table
        """
        try:
            # Step 1: Detect table structure
            structure = self.detect_table_structure(image)
            if not structure:
                logger.warning("Could not detect table structure")
                return None
            
            logger.info(f"Detected table: {structure['num_rows']} rows x {structure['num_cols']} cols")
            
            # Step 2: Extract cells
            cells = self.extract_table_cells_from_structure(image, structure)
            if not cells:
                logger.warning("Could not extract cells from table")
                return None
            
            logger.info(f"Extracted {len(cells)} cells from table")
            
            # Step 3: Organize into rows
            rows = self.organize_cells_into_rows(cells)
            logger.info(f"Organized into {len(rows)} rows")
            
            return rows
        
        except Exception as e:
            logger.error(f"Error extracting table from image: {e}")
            return None
    
    @staticmethod
    def parse_bus_routes_from_table(rows: List[TableRow]) -> List[Dict[str, Any]]:
        """
        Parse bus routes from extracted table rows.
        
        Handles various table formats with columns like:
        - Route | Departure | Arrival | Via/Stops
        - Bus Type | Service | Origin-Destination | Time
        - Time | Via | Type | Fare
        """
        routes = []
        
        try:
            if not rows or len(rows) < 2:
                logger.warning("Insufficient rows for route parsing")
                return []
            
            # Skip header row (usually row 0 or contains "Route", "Time", "Via", etc.)
            header_row = rows[0]
            header_text = header_row.get_all_text().upper()
            
            # Determine if first row is header
            is_header = any(word in header_text for word in 
                          ['ROUTE', 'TIME', 'VIA', 'DEPARTURE', 'DESTINATION', 'SERVICE'])
            
            start_idx = 1 if is_header else 0
            
            # Parse data rows
            for row_idx in range(start_idx, len(rows)):
                row = rows[row_idx]
                
                # Extract time information
                times = re.findall(r'\b(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])\b', row.get_all_text())
                
                if not times:
                    continue  # Skip rows without time info
                
                # Extract cities/stops
                cities = []
                for cell in row.cells:
                    # Look for city names (usually in uppercase or known cities)
                    city_matches = re.findall(r'\b([A-Z][A-Z\s]{2,})\b', cell.text)
                    cities.extend(city_matches)
                
                # Create route entry
                if len(times) >= 1 and len(cities) >= 1:
                    dept_time = f"{times[0][0]}:{times[0][1]}"
                    arr_time = f"{times[1][0]}:{times[1][1]}" if len(times) > 1 else "00:00"
                    
                    route = {
                        'row_index': row_idx,
                        'departure_time': dept_time,
                        'arrival_time': arr_time,
                        'cities': list(set(cities)),  # Unique cities
                        'stops': [],
                        'raw_text': row.get_all_text(),
                        'cell_count': len(row.cells),
                        'confidence': np.mean([cell.confidence for cell in row.cells])
                    }
                    
                    routes.append(route)
            
            logger.info(f"Parsed {len(routes)} routes from table")
            return routes
        
        except Exception as e:
            logger.error(f"Error parsing routes from table: {e}")
            return []


def test_table_extraction(image_path: str, debug: bool = False):
    """Test table extraction on an image file."""
    try:
        logger.info(f"Testing table extraction on: {image_path}")
        
        image = Image.open(image_path)
        extractor = TableExtractor(debug=debug)
        
        # Extract table
        rows = extractor.extract_table_from_image(image)
        
        if not rows:
            logger.warning("No table extracted")
            return
        
        # Parse routes
        routes = extractor.parse_bus_routes_from_table(rows)
        
        # Print results
        logger.info("\n" + "="*60)
        logger.info("TABLE EXTRACTION RESULTS")
        logger.info("="*60)
        logger.info(f"Total rows: {len(rows)}")
        logger.info(f"Total routes parsed: {len(routes)}\n")
        
        for i, route in enumerate(routes, 1):
            logger.info(f"Route {i}:")
            logger.info(f"  Departure: {route['departure_time']}")
            logger.info(f"  Arrival: {route['arrival_time']}")
            logger.info(f"  Cities: {', '.join(route['cities'])}")
            logger.info(f"  Confidence: {route['confidence']:.2%}")
            logger.info(f"  Raw: {route['raw_text'][:100]}...\n")
        
        logger.info("="*60)
    
    except Exception as e:
        logger.error(f"Test failed: {e}")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Example usage
    import sys
    if len(sys.argv) > 1:
        test_table_extraction(sys.argv[1], debug=True)
    else:
        print("Usage: python table_extraction_enhancer.py <image_path>")
