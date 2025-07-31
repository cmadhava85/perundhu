/**
 * Format date for display in charts and stats
 * @param date Date string to format
 * @returns Formatted date string
 */
export const formatDate = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Format time for display in charts and stats
 * @param time Time string to format
 * @returns Formatted time string
 */
export const formatTime = (time: string): string => {
  const t = new Date(`1970-01-01T${time}`);
  return t.toLocaleTimeString(undefined, { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};