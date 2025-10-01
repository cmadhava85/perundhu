import React, { useState, useMemo } from 'react';
import type { Bus, Stop, Location as AppLocation } from '../types';
import { useTranslation } from 'react-i18next';

interface CompactMobileBusListProps {
  buses: Bus[];
  selectedBusId?: number | null;
  stopsMap?: Record<number, Stop[]>;
  stops?: Stop[];
  onSelectBus?: (bus: Bus) => void;
  showTitle?: boolean;
  fromLocation?: string;
  toLocation?: string;
  fromLocationObj?: AppLocation;
  toLocationObj?: AppLocation;
}

const CompactMobileBusList: React.FC<CompactMobileBusListProps> = ({
  buses,
  selectedBusId,
  stopsMap = {},
  stops = [],
  onSelectBus,
  showTitle = true,
  fromLocation,
  toLocation,
  fromLocationObj,
  toLocationObj
}) => {
  const { t } = useTranslation();
  const [expandedBusId, setExpandedBusId] = useState<number | null>(null);

  // Helper functions
  const formatTime = (time: string) => {
    if (!time || time === 'Unknown') return '--:--';
    return time.length > 5 ? time.substring(0, 5) : time;
  };

  const getDuration = (bus: Bus) => {
    try {
      if (!bus.departureTime || !bus.arrivalTime) return '';
      
      const [depHours, depMinutes] = bus.departureTime.split(':').map(Number);
      const [arrHours, arrMinutes] = bus.arrivalTime.split(':').map(Number);
      
      let durationHours = arrHours - depHours;
      let durationMinutes = arrMinutes - depMinutes;
      
      if (durationMinutes < 0) {
        durationHours -= 1;
        durationMinutes += 60;
      }
      
      if (durationHours < 0) {
        durationHours += 24;
      }
      
      if (durationHours === 0) {
        return `${durationMinutes}m`;
      }
      return `${durationHours}h${durationMinutes > 0 ? ` ${durationMinutes}m` : ''}`;
    } catch (e) {
      return '';
    }
  };

  const getStatusColor = (bus: Bus) => {
    const status = bus.status?.toLowerCase() || 'on-time';
    switch (status) {
      case 'on-time': return 'border-l-green-500 bg-green-50';
      case 'delayed': return 'border-l-yellow-500 bg-yellow-50';
      case 'cancelled': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getBusStops = (busId: number) => {
    return stopsMap && stopsMap[busId] ? stopsMap[busId] : stops.filter(stop => stop.busId === busId);
  };

  const handleBusClick = (bus: Bus) => {
    setExpandedBusId(expandedBusId === bus.id ? null : bus.id);
    if (onSelectBus) {
      onSelectBus(bus);
    }
  };

  const handleExpandClick = (e: React.MouseEvent, busId: number) => {
    e.stopPropagation();
    setExpandedBusId(expandedBusId === busId ? null : busId);
  };

  if (buses.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-6xl mb-4">🚌</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No buses found</h3>
        <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Flexible Header - Adapts to screen size */}
      {showTitle && (
        <div className="bg-white border-b border-gray-200 p-3 sticky top-0 z-10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {buses.length} {buses.length === 1 ? 'Bus' : 'Buses'}
              </h2>
              {fromLocation && toLocation && (
                <p className="text-sm text-gray-600 truncate">
                  {fromLocation} → {toLocation}
                </p>
              )}
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
              Responsive View
            </div>
          </div>
        </div>
      )}

      {/* Responsive Bus List - Adapts spacing based on screen size */}
      <div className="p-1 sm:p-2 md:p-3 lg:p-4 space-y-1 sm:space-y-2">
        {buses.map((bus) => {
          const isExpanded = expandedBusId === bus.id;
          const busStops = getBusStops(bus.id);
          const duration = getDuration(bus);
          const statusClass = getStatusColor(bus);

          return (
            <div 
              key={bus.id} 
              className={`bg-white border-l-4 ${statusClass} rounded-r-lg shadow-sm transition-all duration-200 w-full`}
            >
              {/* Main Bus Row - Ultra Compact */}
              <div 
                className="p-2 sm:p-3 md:p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                onClick={() => handleBusClick(bus)}
              >
                {/* First Row: Bus Name + Price */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {bus.busName || 'Bus Service'}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {bus.category || 'Regular'} {bus.busNumber ? `• #${bus.busNumber}` : ''}
                    </p>
                  </div>
                  {bus.fare && (
                    <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded ml-2">
                      ₹{bus.fare}
                    </div>
                  )}
                </div>

                {/* Second Row: Time Details */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3 flex-1">
                    {/* Departure */}
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {formatTime(bus.departureTime || '--:--')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {bus.from?.slice(0, 8) || 'Origin'}
                      </div>
                    </div>

                    {/* Journey Line */}
                    <div className="flex-1 flex items-center">
                      <div className="flex-1 h-px bg-gray-300 relative">
                        <div className="absolute left-0 top-0 w-2 h-2 bg-blue-500 rounded-full transform -translate-y-1/2"></div>
                        <div className="absolute right-0 top-0 w-2 h-2 bg-green-500 rounded-full transform -translate-y-1/2"></div>
                      </div>
                    </div>

                    {/* Arrival */}
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {formatTime(bus.arrivalTime || '--:--')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {bus.to?.slice(0, 8) || 'Destination'}
                      </div>
                    </div>
                  </div>

                  {/* Duration + Expand */}
                  <div className="ml-3 text-center">
                    <div className="text-xs font-medium text-gray-700">
                      {duration || '--'}
                    </div>
                    <div className={`text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </div>
                  </div>
                </div>

                {/* Third Row: Quick Info */}
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    {busStops.length > 0 && (
                      <span className="flex items-center">
                        <span className="w-3 h-3 mr-1">�</span>
                        {busStops.length} stops
                      </span>
                    )}
                    {bus.status && (
                      <span className="flex items-center">
                        <span className="w-3 h-3 mr-1">�</span>
                        {bus.status}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400">
                    {isExpanded ? 'Tap to collapse' : 'Tap for details'}
                  </span>
                </div>
              </div>

              {/* Expandable Details */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-3">
                  {/* Bus Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <span>�</span>
                      <span className="text-gray-700">{bus.category || 'Regular Service'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🛑</span>
                      <span className="text-gray-700">{busStops.length} stops</span>
                    </div>
                    {bus.fare && (
                      <div className="flex items-center space-x-2">
                        <span>�</span>
                        <span className="text-gray-700">₹{bus.fare}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <span>⏱️</span>
                      <span className="text-gray-700">{duration || 'Duration varies'}</span>
                    </div>
                  </div>

                  {/* Route Stops Preview */}
                  {busStops.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-2">
                        Route ({busStops.length} stops)
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {busStops.slice(0, 4).map((stop, index) => (
                          <span 
                            key={stop.id || index}
                            className="bg-white text-gray-600 text-xs px-2 py-1 rounded border"
                          >
                            {stop.name}
                          </span>
                        ))}
                        {busStops.length > 4 && (
                          <span className="bg-white text-gray-500 text-xs px-2 py-1 rounded border">
                            +{busStops.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded hover:bg-blue-700 transition-colors">
                      📍 View Route
                    </button>
                    <button className="flex-1 bg-green-600 text-white text-xs font-medium py-2 px-3 rounded hover:bg-green-700 transition-colors">
                      🎫 Book Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 bg-white border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          📋 Showing {buses.length} buses • Times are estimated • Book in advance
        </p>
      </div>
    </div>
  );
};

export default React.memo(CompactMobileBusList);