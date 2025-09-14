/**
 * Utility functions for bus list components
 */

export const formatTime = (time: string) => {
  try {
    const date = new Date(`2000-01-01T${time}`);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return time;
  }
};

export const calculateDuration = (departure: string, arrival: string) => {
  try {
    const dep = new Date(`2000-01-01T${departure}`);
    const arr = new Date(`2000-01-01T${arrival}`);
    let diff = arr.getTime() - dep.getTime();
    
    if (diff < 0) diff += 24 * 60 * 60 * 1000; // Next day
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  } catch {
    return 'N/A';
  }
};

export const getBusStatusColor = (departureTime: string) => {
  const now = new Date();
  const depTime = new Date(`2000-01-01T${departureTime}`);
  const currentTime = new Date(`2000-01-01T${now.getHours()}:${now.getMinutes()}`);
  
  if (currentTime < depTime) return 'text-green-600 bg-green-50';
  if (currentTime.getTime() - depTime.getTime() < 30 * 60 * 1000) return 'text-yellow-600 bg-yellow-50';
  return 'text-gray-600 bg-gray-50';
};

export const sortBuses = (buses: any[], sortBy: 'time' | 'duration' | 'price') => {
  return [...buses].sort((a, b) => {
    switch (sortBy) {
      case 'time':
        return a.departureTime.localeCompare(b.departureTime);
      case 'duration':
        const getDuration = (dep: string, arr: string) => {
          try {
            const depTime = new Date(`2000-01-01T${dep}`);
            const arrTime = new Date(`2000-01-01T${arr}`);
            return arrTime.getTime() - depTime.getTime();
          } catch {
            return 0;
          }
        };
        return getDuration(a.departureTime, a.arrivalTime) - getDuration(b.departureTime, b.arrivalTime);
      case 'price':
        return (a.fare || 0) - (b.fare || 0);
      default:
        return 0;
    }
  });
};

export const filterBuses = (buses: any[], filterBy: 'all' | 'ac' | 'non-ac') => {
  if (filterBy === 'all') return buses;
  
  return buses.filter(bus => 
    filterBy === 'ac' 
      ? bus.category?.toLowerCase().includes('ac') 
      : !bus.category?.toLowerCase().includes('ac')
  );
};