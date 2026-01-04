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
 * @returns Formatted time string (HH:MM without seconds)
 */
export const formatTime = (time: string): string => {
  if (!time) return '--:--';
  try {
    const parts = time.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return time;
  } catch {
    return time;
  }
};