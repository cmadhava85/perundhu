import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop } from '../../types';
import { formatTime, calculateDuration, getBusStatusColor } from './busUtils';

interface BusItemProps {
  bus: Bus;
  isSelected: boolean;
  stops: Stop[];
  onSelect: () => void;
  onBook?: () => void;
  isCompact?: boolean;
}

const BusItem: React.FC<BusItemProps> = ({ 
  bus, 
  isSelected, 
  stops, 
  onSelect, 
  onBook,
  isCompact = false 
}) => {
  const { t } = useTranslation();
  const [showStops, setShowStops] = useState(false);

  return (
    <div
      className={`
        card transition-all duration-200 cursor-pointer
        ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-md'}
        ${isCompact ? 'mb-3' : 'mb-4'}
      `}
      onClick={onSelect}
    >
      <div className={`card-body ${isCompact ? 'p-4' : 'p-6'}`}>
        {/* Bus Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚌</span>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{bus.busName || bus.busNumber}</h3>
                  <p className="text-sm text-gray-600">{bus.busNumber}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getBusStatusColor(bus.departureTime)}`}>
                {t('bus.onTime', 'On Time')}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <span className="text-green-600">🟢</span>
                {bus.from}
              </span>
              <span className="text-gray-400">→</span>
              <span className="flex items-center gap-1">
                <span className="text-red-600">🔴</span>
                {bus.to}
              </span>
            </div>
          </div>

          {/* Timing */}
          <div className="text-right">
            <div className="font-bold text-lg text-gray-900">
              {formatTime(bus.departureTime)}
            </div>
            <div className="text-sm text-gray-600">
              {formatTime(bus.arrivalTime)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {calculateDuration(bus.departureTime, bus.arrivalTime)}
            </div>
          </div>
        </div>

        {/* Bus Features */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-gray-600">
              <span>💺</span>
              {bus.capacity || '40'} {t('bus.seats', 'seats')}
            </span>
            <span className="flex items-center gap-1 text-gray-600">
              <span>❄️</span>
              {bus.category || 'AC'}
            </span>
            {stops.length > 0 && (
              <span className="flex items-center gap-1 text-gray-600">
                <span>🚏</span>
                {stops.length} {t('bus.stops', 'stops')}
              </span>
            )}
          </div>

          {onBook && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBook();
              }}
              className="btn btn-sm btn-primary"
            >
              {t('bus.book', 'Book Now')}
            </button>
          )}
        </div>

        {/* Expandable Stops Section */}
        {stops.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStops(!showStops);
              }}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                {t('bus.viewStops', 'View Stops')} ({stops.length})
              </span>
              <span className={`transform transition-transform ${showStops ? 'rotate-180' : ''}`}>
                ⌄
              </span>
            </button>

            {showStops && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {[...stops]
                  .sort((a, b) => {
                    const timeA = a.departureTime || a.arrivalTime || '00:00';
                    const timeB = b.departureTime || b.arrivalTime || '00:00';
                    return timeA.localeCompare(timeB);
                  })
                  .map((stop, index) => (
                  <div
                    key={stop.id || index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-sm text-gray-900">{stop.name}</div>
                        {stop.arrivalTime && (
                          <div className="text-xs text-gray-500">
                            {formatTime(stop.arrivalTime)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusItem;