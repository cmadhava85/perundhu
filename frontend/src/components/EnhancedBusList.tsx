import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop } from '../types';
import '../styles/mobile-first.css';

interface EnhancedBusListProps {
  buses: Bus[];
  selectedBusId: number | null;
  stops?: Record<number, Stop[]>;
  onSelectBus: (busId: number) => void;
  onBookBus?: (busId: number) => void;
  isCompact?: boolean;
  showFilters?: boolean;
  className?: string;
}

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

  const formatTime = (time: string) => {
    try {
      const date = new Date(`2000-01-01T${time}`);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return time;
    }
  };

  const calculateDuration = (departure: string, arrival: string) => {
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

  const getBusStatusColor = () => {
    const now = new Date();
    const depTime = new Date(`2000-01-01T${bus.departureTime}`);
    const currentTime = new Date(`2000-01-01T${now.getHours()}:${now.getMinutes()}`);
    
    if (currentTime < depTime) return 'text-green-600 bg-green-50';
    if (currentTime.getTime() - depTime.getTime() < 30 * 60 * 1000) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

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
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getBusStatusColor()}`}>
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
                {stops.map((stop, index) => (
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

const EnhancedBusList: React.FC<EnhancedBusListProps> = ({
  buses,
  selectedBusId,
  stops = {},
  onSelectBus,
  onBookBus,
  isCompact = false,
  showFilters = true,
  className = ''
}) => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<'time' | 'duration' | 'price'>('time');
  const [filterBy, setFilterBy] = useState<'all' | 'ac' | 'non-ac'>('all');

  // Sort and filter buses
  const processedBuses = useMemo(() => {
    let filtered = [...buses];

    // Apply filters
    if (filterBy !== 'all') {
      filtered = filtered.filter(bus => 
        filterBy === 'ac' ? bus.category?.toLowerCase().includes('ac') : !bus.category?.toLowerCase().includes('ac')
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return a.departureTime.localeCompare(b.departureTime);
        case 'duration':
          // Calculate duration for sorting
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

    return filtered;
  }, [buses, sortBy, filterBy]);

  if (buses.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-body text-center py-12">
          <div className="text-6xl mb-4">🚌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t('busList.noBuses', 'No buses found')}
          </h3>
          <p className="text-gray-600 mb-6">
            {t('busList.noBusesDesc', 'Try adjusting your search criteria or search for a different route.')}
          </p>
          <button className="btn btn-primary">
            {t('busList.searchAgain', 'Search Again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Filters and Sort */}
      {showFilters && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="flex flex-wrap items-center gap-4">
              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  {t('busList.sortBy', 'Sort by')}:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="form-control text-sm py-1 px-2 w-auto"
                >
                  <option value="time">{t('busList.sortTime', 'Departure Time')}</option>
                  <option value="duration">{t('busList.sortDuration', 'Duration')}</option>
                  <option value="price">{t('busList.sortPrice', 'Price')}</option>
                </select>
              </div>

              {/* Filter Options */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  {t('busList.filter', 'Filter')}:
                </label>
                <div className="flex gap-1">
                  {['all', 'ac', 'non-ac'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFilterBy(filter as any)}
                      className={`
                        px-3 py-1 text-sm rounded-full transition-colors
                        ${filterBy === filter
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {filter === 'all' && t('busList.all', 'All')}
                      {filter === 'ac' && t('busList.ac', 'AC')}
                      {filter === 'non-ac' && t('busList.nonAc', 'Non-AC')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('busList.showing', 'Showing')} {processedBuses.length} {t('busList.buses', 'buses')}
        </h2>
        {processedBuses.length !== buses.length && (
          <span className="text-sm text-gray-600">
            ({buses.length - processedBuses.length} {t('busList.filtered', 'filtered')})
          </span>
        )}
      </div>

      {/* Bus List */}
      <div className="space-y-4">
        {processedBuses.map((bus) => (
          <BusItem
            key={bus.id}
            bus={bus}
            isSelected={selectedBusId === bus.id}
            stops={stops[bus.id] || []}
            onSelect={() => onSelectBus(bus.id)}
            onBook={onBookBus ? () => onBookBus(bus.id) : undefined}
            isCompact={isCompact}
          />
        ))}
      </div>

      {/* Load More Button (for pagination) */}
      {processedBuses.length > 0 && (
        <div className="mt-6 text-center">
          <button className="btn btn-secondary">
            {t('busList.loadMore', 'Load More Routes')}
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedBusList;