// Enhanced className utility function (no external dependencies)
type ClassValue = 
  | string 
  | number 
  | boolean 
  | undefined 
  | null 
  | ClassValue[] 
  | Record<string, boolean | undefined | null>;

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string') {
      // Split multiple classes and add them
      classes.push(...input.split(' ').filter(Boolean));
    } else if (typeof input === 'number') {
      classes.push(String(input));
    } else if (typeof input === 'object' && input !== null) {
      if (Array.isArray(input)) {
        // Recursively process array
        const nestedResult = cn(...input);
        if (nestedResult) {
          classes.push(nestedResult);
        }
      } else {
        // Process conditional classes object
        for (const [key, value] of Object.entries(input)) {
          if (value) {
            classes.push(key);
          }
        }
      }
    }
  }
  
  // Remove duplicates and return
  return [...new Set(classes)].join(' ');
}