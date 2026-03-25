import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop } from '../../types';
import { formatTime, calculateDuration } from './busUtils';
import { triggerHaptic } from '../../utils/haptic';

interface BusItemProps {
  bus: Bus;
  isSelected: boolean;
  stops: Stop[];
  onSelect: () => void;
  onBook?: () => void;
  isCompact?: boolean;
}

/**
 * Premium Bus Schedule Card Component
 * Features: Glassmorphism, High-contrast hierarchy, Micro-interactions
 * Responsive: Mobile (1 col) → Tablet (2 col) → Desktop (3-4 col)
 */
const BusItem: React.FC<BusItemProps> = ({ 
  bus, 
  isSelected, 
  stops, 
  onSelect, 
  onBook
}) => {
  const { t } = useTranslation();
  const [showStops, setShowStops] = useState(false);
  
  // Determine status color: Emerald for on-time, Amber for delays
  const isDelayed = bus.departureTime > new Date().toLocaleTimeString('en-US', { hour12: false });
  // const statusColor = isDelayed ? 'amber' : 'emerald';
  const statusBg = isDelayed ? 'bg-amber-400/20 border-amber-400/50 text-amber-600' : 'bg-emerald-400/20 border-emerald-400/50 text-emerald-600';

  return (
    <div
      className={`
        group relative min-h-[160px] sm:min-h-[180px] md:min-h-[200px]
        bg-white/80 backdrop-blur-md border border-white/20
        rounded-xl sm:rounded-2xl
        shadow-lg hover:shadow-2xl
        transition-all duration-300 ease-out cursor-pointer
        p-3 sm:p-4 md:p-5
        ${isSelected 
          ? 'ring-2 ring-emerald-400/60 bg-white/90 backdrop-blur-xl border-emerald-400/30 shadow-emerald-400/20' 
          : 'hover:bg-white/90 hover:border-emerald-400/40 hover:scale-[1.02] hover:backdrop-blur-xl'
        }
        active:scale-[0.98] sm:active:scale-100
      `}
      onClick={() => {
        triggerHaptic('selection');
        onSelect();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect();
        }
      }}
      aria-label={`Bus ${bus.busNumber} from ${bus.from} to ${bus.to}, departs ${formatTime(bus.departureTime)}`}
    >
      <div className={`h-full flex flex-col justify-between`}>
        {/* SECTION 1: Bus Header - Bus Number + Status Badge (Top Priority) */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl sm:text-2xl flex-shrink-0">🚌</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 truncate">
                {bus.busName || bus.busNumber}
              </h3>
              <p className="text-xs text-slate-500">{bus.busNumber}</p>
            </div>
          </div>
          
          {/* Status Badge - Top Right (Most Visible) */}
          <div className={`
            px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0
            border transition-all duration-300
            ${statusBg}
            group-hover:scale-105
          `}>
            {isDelayed ? '⏱️ Late' : '✓ On Time'}
          </div>
        </div>

        {/* SECTION 2: Route + Departure Time (Second Priority) */}
        <div className="mb-2">
          {/* Route: From → To */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-700 font-medium mb-1.5">
            <span className="truncate">📍 {bus.from}</span>
            <span className="text-slate-400 flex-shrink-0">→</span>
            <span className="truncate">📍 {bus.to}</span>
          </div>
          
          {/* Departure Time (MOST IMPORTANT - Now Prominent) */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Departs:</span>
              <span className="text-2xl sm:text-3xl font-bold text-emerald-600">
                {formatTime(bus.departureTime)}
              </span>
            </div>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-slate-500">Arrives:</span>
              <span className="text-base sm:text-lg font-semibold text-slate-700">
                {formatTime(bus.arrivalTime)}
              </span>
            </div>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-xs text-slate-500">
              {calculateDuration(bus.departureTime, bus.arrivalTime)}
            </span>
          </div>
        </div>

        {/* SECTION 3: Features & Actions (Compact Row) */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {/* Features - Compact */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-slate-600">
              <span>💺</span>
              <span className="font-medium">{bus.capacity || '40'}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <span>❄️</span>
              <span className="font-medium">{bus.category || 'AC'}</span>
            </div>
            {stops.length > 0 && (
              <div className="flex items-center gap-1 text-slate-600">
                <span>🛑</span>
                <span className="font-medium">{stops.length}</span>
              </div>
            )}
          </div>
          
          {/* Actions - Compact */}
          <div className="flex items-center gap-1.5">
            {stops.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  setShowStops(!showStops);
                }}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors min-h-[36px]"
                aria-label={showStops ? t('bus.hideStops', 'Hide stops') : t('bus.showStops', 'Show stops')}
              >
                {showStops ? '▼' : '▶'} {stops.length}
              </button>
            )}
            {onBook && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  onBook();
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-xs rounded-lg transition-all min-h-[36px]"
                aria-label={t('bus.book', 'Book Now')}
              >
                {t('bus.book', 'Book')}
              </button>
            )}
          </div>
        </div>

        {/* Expandable Stops Section */}
        {showStops && stops.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200/50 space-y-2">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Route Stops ({stops.length})
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {[...stops]
                .sort((a, b) => {
                  const timeA = a.departureTime || a.arrivalTime || '00:00';
                  const timeB = b.departureTime || b.arrivalTime || '00:00';
                  return timeA.localeCompare(timeB);
                })
                .map((stop, index) => (
                <div
                  key={stop.id || index}
                  className="flex items-center justify-between p-3 bg-slate-100/50 rounded-lg
                             border border-slate-200/50 hover:bg-slate-200/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-900 truncate">{stop.name}</div>
                      {stop.arrivalTime && (
                        <div className="text-xs text-slate-500">
                          {formatTime(stop.arrivalTime)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-600 whitespace-nowrap ml-2">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusItem;
