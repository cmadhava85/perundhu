import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bus, Stop } from '../../types';
import { formatTime, calculateDuration } from './busUtils';

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
        group relative min-h-[220px] sm:min-h-[240px] md:min-h-[260px]
        bg-white/80 backdrop-blur-md border border-white/20
        rounded-2xl sm:rounded-3xl
        shadow-lg hover:shadow-2xl
        transition-all duration-300 ease-out cursor-pointer
        p-4 sm:p-5 md:p-6
        ${isSelected 
          ? 'ring-2 ring-emerald-400/60 bg-white/90 backdrop-blur-xl border-emerald-400/30 shadow-emerald-400/20' 
          : 'hover:bg-white/90 hover:border-emerald-400/40 hover:scale-105 hover:backdrop-blur-xl'
        }
        active:scale-95 sm:active:scale-100
      `}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect();
        }
      }}
    >
      <div className={`h-full flex flex-col justify-between`}>
        {/* PREMIUM SECTION 1: Bus Route (Hero Text) */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl sm:text-3xl">🚌</span>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
                {bus.busName || bus.busNumber}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">{bus.busNumber}</p>
            </div>
          </div>
          
          {/* Route: From → To (Glanceable) */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 font-semibold">
            <span>📍 {bus.from}</span>
            <span className="text-slate-400">→</span>
            <span>📍 {bus.to}</span>
          </div>
        </div>

        {/* PREMIUM SECTION 2: Arrival Time (LARGEST TEXT - Hero Element) */}
        <div className="mb-4 py-3 px-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/50">
          <p className="text-xs sm:text-sm text-slate-600 font-semibold mb-1 uppercase tracking-wide">
            {t('bus.arrivalTime', 'Arrival')}
          </p>
          <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 leading-none">
            {formatTime(bus.arrivalTime)}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Depart: {formatTime(bus.departureTime)} • Duration: {calculateDuration(bus.departureTime, bus.arrivalTime)}
          </p>
        </div>

        {/* PREMIUM SECTION 3: Status Badge & Features Grid */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          {/* Status Badge - Premium Styling */}
          <div className={`
            px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold
            border transition-all duration-300
            ${statusBg}
            group-hover:scale-105
          `}>
            {isDelayed ? '⏱️ Delayed' : '✓ On Time'}
          </div>

          {/* Features - Compact Grid */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-1 text-slate-600 min-h-[32px] px-2 py-1">
              <span>💺</span>
              <span className="font-semibold">{bus.capacity || '40'}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600 min-h-[32px] px-2 py-1">
              <span>❄️</span>
              <span className="font-semibold">{bus.category || 'AC'}</span>
            </div>
            {stops.length > 0 && (
              <div className="flex items-center gap-1 text-slate-600 min-h-[32px] px-2 py-1">
                <span>🛑</span>
                <span className="font-semibold">{stops.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* PREMIUM SECTION 4: Expandable Stops & Book Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {stops.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStops(!showStops);
              }}
              className="w-full sm:flex-1 flex items-center justify-between px-3 sm:px-4 py-2 
                         rounded-xl bg-slate-100/50 hover:bg-slate-200/50 
                         border border-slate-200/50 hover:border-slate-300/50
                         transition-all duration-200 text-xs sm:text-sm font-medium text-slate-700"
            >
              <span>{showStops ? '▼' : '▶'} {t('bus.stops', 'Stops')}</span>
              <span className="text-slate-500">{stops.length}</span>
            </button>
          )}

          {onBook && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBook();
              }}
              className="w-full sm:w-auto min-h-[48px] px-4 sm:px-6 py-2 
                         bg-gradient-to-r from-emerald-500 to-emerald-600 
                         hover:from-emerald-600 hover:to-emerald-700
                         text-white font-semibold text-sm sm:text-base
                         rounded-xl shadow-lg hover:shadow-xl
                         transition-all duration-300 ease-out
                         active:scale-95 hover:scale-105 sm:active:scale-100
                         border border-emerald-400/50"
            >
              {t('bus.book', 'Book Now')}
            </button>
          )}
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
