/**
 * Utility functions for date and time formatting
 */

/**
 * Format a time string to a standardized display format
 * Handles both 12-hour (e.g., "06:00 AM") and 24-hour (e.g., "06:00") formats
 * 
 * @param timeString The time string to format
 * @returns Formatted time string
 */
export const formatTime = (timeString: string): string => {
  if (!timeString) return '';
  
  // If already in 12-hour format (contains AM/PM), return as is
  if (timeString.includes('AM') || timeString.includes('PM')) {
    return timeString;
  }
  
  // Try to parse as 24-hour format
  try {
    const [hourStr, minuteStr] = timeString.split(':');
    const hour = parseInt(hourStr, 10);
    
    if (isNaN(hour) || hour < 0 || hour > 23) {
      return timeString; // Return original if invalid
    }
    
    const amPm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    return `${hour12.toString().padStart(2, '0')}:${minuteStr} ${amPm}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString; // Return original on error
  }
};

/**
 * Format a duration string for display
 * Accepts various formats (HH:MM, X hours Y minutes, etc.)
 * 
 * @param durationString The duration string to format
 * @returns Formatted duration string
 */
export const formatDuration = (durationString: string): string => {
  if (!durationString) return '';
  
  // If already contains 'h' or 'hour', assume already formatted
  if (durationString.includes('h') || durationString.toLowerCase().includes('hour')) {
    return durationString;
  }
  
  // Try to parse as HH:MM format
  if (durationString.includes(':')) {
    try {
      const [hoursStr, minutesStr] = durationString.split(':');
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      
      if (isNaN(hours) || isNaN(minutes)) {
        return durationString; // Return original if invalid
      }
      
      if (hours === 0) {
        return `${minutes}m`;
      }
      
      return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
    } catch (error) {
      console.error('Error formatting duration:', error);
      return durationString; // Return original on error
    }
  }
  
  return durationString; // Return original if format not recognized
};

/**
 * Calculate and format the journey duration from departure and arrival times
 * 
 * @param departureTime Departure time string
 * @param arrivalTime Arrival time string
 * @returns Formatted duration string
 */
export const calculateJourneyDuration = (
  departureTime: string,
  arrivalTime: string
): string => {
  if (!departureTime || !arrivalTime) return '';
  
  try {
    // Extract hours and minutes from time strings
    const getTimeComponents = (timeStr: string): { hours: number; minutes: number } => {
      // Handle 12-hour format
      let hours = 0;
      let minutes = 0;
      
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        const [time, period] = timeStr.split(' ');
        const [hoursStr, minutesStr] = time.split(':');
        
        hours = parseInt(hoursStr, 10);
        minutes = parseInt(minutesStr, 10);
        
        // Convert to 24-hour format
        if (period === 'PM' && hours < 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
      } else {
        // Handle 24-hour format
        const [hoursStr, minutesStr] = timeStr.split(':');
        hours = parseInt(hoursStr, 10);
        minutes = parseInt(minutesStr, 10);
      }
      
      return { hours, minutes };
    };
    
    const departure = getTimeComponents(departureTime);
    const arrival = getTimeComponents(arrivalTime);
    
    // Calculate duration in minutes
    let durationMinutes = (arrival.hours * 60 + arrival.minutes) - 
                          (departure.hours * 60 + departure.minutes);
    
    // Handle overnight journeys
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60; // Add 24 hours
    }
    
    const durationHours = Math.floor(durationMinutes / 60);
    const remainingMinutes = durationMinutes % 60;
    
    if (durationHours === 0) {
      return `${remainingMinutes}m`;
    }
    
    return remainingMinutes === 0 ? 
      `${durationHours}h` : 
      `${durationHours}h ${remainingMinutes}m`;
  } catch (error) {
    console.error('Error calculating journey duration:', error);
    return '';
  }
};