/**
 * Location Name Normalizer
 * Handles normalization of location names to match with database entries
 * 
 * Supports variations like:
 * - "Besant Nagar" vs "Besant Nagar MTC Terminus"
 * - "Vadapalani" vs "Vadapalani Bus Stand"
 * - "Chennai - CMBT" vs "CMBT"
 */

/**
 * Normalize location name by removing bus terminus/stand variations
 * This allows "Besant Nagar MTC Terminus" to match "Besant Nagar" in database
 * 
 * Examples:
 * - "Besant Nagar MTC Terminus" -> "Besant Nagar"
 * - "Vadapalani Bus Stand" -> "Vadapalani"
 * - "Chennai - CMBT (Koyambedu)" -> "Chennai"
 * - "Besant Nagar" -> "Besant Nagar" (no change)
 * 
 * @param locationName The location name to normalize
 * @returns Normalized location name with terminus/stand info removed
 */
export const normalizeLocationName = (locationName: string): string => {
  if (!locationName || typeof locationName !== 'string') {
    return '';
  }

  let normalized = locationName.trim();

  // Remove common bus terminus/stand suffixes (case-insensitive)
  // Pattern 1: " - <Bus Stand/Terminus Name>" e.g., " - MTC Terminus"
  normalized = normalized.replace(/\s*-\s*(MTC|TNSTC|CMBT|DTC|SETC|KSRTC|KSDC|BMTC)\s+(Terminus|Terminal|Stand|Station|Bus Stand|Bus Terminus|Bus Terminal|Bus Station)?/gi, '');

  // Pattern 2: " MTC Terminus", " Bus Stand", " Bus Stop", etc. at the end
  normalized = normalized.replace(/\s+(MTC|TNSTC|BMTC)\s+(Terminus|Terminal|Stand|Station)?$/gi, '');
  normalized = normalized.replace(/\s+(Bus\s+(Stand|Stop|Station|Terminus|Terminal))$/gi, '');

  // Pattern 3: Remove abbreviations like "(Koyambedu)" that are often added to clarify location
  // But keep the main location name
  normalized = normalized.replace(/\s*\([^)]*\)$/g, '');

  // Pattern 4: For locations with " - " format, take the first part
  // E.g., "Chennai - CMBT" -> "Chennai"
  // But only if what follows looks like a bus stand code (all caps, short)
  const parts = normalized.split(/\s*-\s*/);
  if (parts.length > 1) {
    const secondPart = parts[1].trim();
    // If second part looks like a bus code (short, usually all caps), use first part
    if (secondPart.length <= 20 && /^[A-Z\s()]+$/.test(secondPart.substring(0, Math.min(10, secondPart.length)))) {
      normalized = parts[0].trim();
    }
  }

  // Clean up excess whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
};

/**
 * Extract base location name from a full location reference
 * Useful for matching locations even if they have different details appended
 * 
 * @param locationName The location name to extract base from
 * @returns Base location name without any suffixes
 */
export const extractBaseLocationName = (locationName: string): string => {
  const normalized = normalizeLocationName(locationName);
  
  // For compound names with " - ", take the first meaningful part
  const parts = normalized.split(/\s*-\s*/);
  if (parts.length > 0) {
    return parts[0].trim();
  }
  
  return normalized;
};

/**
 * Check if two location names are semantically equivalent
 * Handles variations and normalizations
 * 
 * @param name1 First location name
 * @param name2 Second location name
 * @returns true if locations are equivalent
 */
export const areLocationsEquivalent = (name1: string, name2: string): boolean => {
  if (!name1 || !name2) return false;
  
  const normalized1 = normalizeLocationName(name1).toLowerCase().trim();
  const normalized2 = normalizeLocationName(name2).toLowerCase().trim();
  
  // Exact match after normalization
  if (normalized1 === normalized2) return true;
  
  // Check if one is contained in the other (for partial matches)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return true;
  }
  
  return false;
};

/**
 * Find matching location ID from a list of locations by normalized name
 * Useful when user enters "Besant Nagar MTC Terminus" but database has "Besant Nagar"
 * 
 * @param inputName The location name entered by user (may include terminus/stand info)
 * @param locationsList List of available locations from database
 * @returns Location ID if found, null otherwise
 */
export const findLocationByNormalizedName = (
  inputName: string,
  locationsList: Array<{ id: number; name: string }>
): number | null => {
  if (!inputName || !locationsList || locationsList.length === 0) {
    return null;
  }

  const normalizedInput = normalizeLocationName(inputName).toLowerCase().trim();
  const baseName = extractBaseLocationName(inputName).toLowerCase().trim();

  for (const location of locationsList) {
    const normalizedDbName = normalizeLocationName(location.name).toLowerCase().trim();
    const dbBaseName = extractBaseLocationName(location.name).toLowerCase().trim();

    // Try exact match first
    if (normalizedInput === normalizedDbName || baseName === dbBaseName) {
      return location.id;
    }

    // Try partial match (if one contains the other)
    if (normalizedInput.includes(normalizedDbName) || normalizedDbName.includes(normalizedInput)) {
      return location.id;
    }

    if (baseName.includes(dbBaseName) || dbBaseName.includes(baseName)) {
      return location.id;
    }
  }

  return null;
};
