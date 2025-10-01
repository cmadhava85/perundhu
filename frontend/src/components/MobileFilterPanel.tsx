import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/MobileFilterPanel.css';

interface FilterOptions {
  busType: string[];
  departureTime: string;
  arrivalTime: string;
  priceRange: [number, number];
  duration: string;
  searchText: string;
}

interface MobileFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  searchText: string;
  onSearchChange: (text: string) => void;
}

const MobileFilterPanel: React.FC<MobileFilterPanelProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  searchText,
  onSearchChange
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'search' | 'sort' | 'filter'>('search');

  const busTypes = ['Express', 'Deluxe', 'AC', 'Non-AC', 'Sleeper', 'Semi-Sleeper'];

  const handleBusTypeToggle = (type: string) => {
    const newBusTypes = filters.busType.includes(type)
      ? filters.busType.filter(t => t !== type)
      : [...filters.busType, type];
    
    onFiltersChange({
      ...filters,
      busType: newBusTypes
    });
  };

  const handlePriceRangeChange = (value: number) => {
    onFiltersChange({
      ...filters,
      priceRange: [filters.priceRange[0], value]
    });
  };

  if (!isOpen) return null;

  return (
    <div className="mobile-filter-overlay">
      <div className="mobile-filter-panel">
        {/* Header */}
        <div className="mobile-filter-header">
          <h3 className="filter-title">Search & Filter</h3>
          <button className="close-btn" onClick={onClose}>
            <span>✕</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="filter-tabs">
          <button 
            className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <span className="tab-icon">🔍</span>
            Search
          </button>
          <button 
            className={`tab-btn ${activeTab === 'sort' ? 'active' : ''}`}
            onClick={() => setActiveTab('sort')}
          >
            <span className="tab-icon">📊</span>
            Sort
          </button>
          <button 
            className={`tab-btn ${activeTab === 'filter' ? 'active' : ''}`}
            onClick={() => setActiveTab('filter')}
          >
            <span className="tab-icon">🔧</span>
            Filter
          </button>
        </div>

        {/* Tab Content */}
        <div className="filter-content">
          {activeTab === 'search' && (
            <div className="search-tab">
              <div className="search-section">
                <label className="section-label">Search Buses</label>
                <div className="mobile-search-container">
                  <input
                    type="text"
                    placeholder="Bus name, number, or type..."
                    value={searchText}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="mobile-search-input"
                    autoFocus
                  />
                  <div className="search-icon">🔍</div>
                </div>
              </div>

              <div className="quick-filters">
                <label className="section-label">Quick Filters</label>
                <div className="quick-filter-chips">
                  <button 
                    className={`quick-chip ${filters.busType.includes('AC') ? 'active' : ''}`}
                    onClick={() => handleBusTypeToggle('AC')}
                  >
                    ❄️ AC Buses
                  </button>
                  <button 
                    className={`quick-chip ${filters.busType.includes('Express') ? 'active' : ''}`}
                    onClick={() => handleBusTypeToggle('Express')}
                  >
                    🚄 Express
                  </button>
                  <button 
                    className={`quick-chip ${filters.busType.includes('Sleeper') ? 'active' : ''}`}
                    onClick={() => handleBusTypeToggle('Sleeper')}
                  >
                    🛏️ Sleeper
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sort' && (
            <div className="sort-tab">
              <label className="section-label">Sort Results By</label>
              <div className="sort-options">
                <button 
                  className={`sort-option ${sortBy === 'departure' ? 'active' : ''}`}
                  onClick={() => onSortChange('departure')}
                >
                  <span className="sort-icon">🕐</span>
                  <div className="sort-text">
                    <div className="sort-name">Departure Time</div>
                    <div className="sort-desc">Earliest to latest</div>
                  </div>
                  {sortBy === 'departure' && <span className="check-icon">✓</span>}
                </button>

                <button 
                  className={`sort-option ${sortBy === 'arrival' ? 'active' : ''}`}
                  onClick={() => onSortChange('arrival')}
                >
                  <span className="sort-icon">🏁</span>
                  <div className="sort-text">
                    <div className="sort-name">Arrival Time</div>
                    <div className="sort-desc">Earliest to latest</div>
                  </div>
                  {sortBy === 'arrival' && <span className="check-icon">✓</span>}
                </button>

                <button 
                  className={`sort-option ${sortBy === 'duration' ? 'active' : ''}`}
                  onClick={() => onSortChange('duration')}
                >
                  <span className="sort-icon">⏱️</span>
                  <div className="sort-text">
                    <div className="sort-name">Duration</div>
                    <div className="sort-desc">Shortest to longest</div>
                  </div>
                  {sortBy === 'duration' && <span className="check-icon">✓</span>}
                </button>

                <button 
                  className={`sort-option ${sortBy === 'price' ? 'active' : ''}`}
                  onClick={() => onSortChange('price')}
                >
                  <span className="sort-icon">💰</span>
                  <div className="sort-text">
                    <div className="sort-name">Price</div>
                    <div className="sort-desc">Low to high</div>
                  </div>
                  {sortBy === 'price' && <span className="check-icon">✓</span>}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'filter' && (
            <div className="filter-tab">
              {/* Bus Type Filter */}
              <div className="filter-section">
                <label className="section-label">Bus Type</label>
                <div className="filter-grid">
                  {busTypes.map(type => (
                    <button
                      key={type}
                      className={`filter-option ${filters.busType.includes(type) ? 'active' : ''}`}
                      onClick={() => handleBusTypeToggle(type)}
                    >
                      {type}
                      {filters.busType.includes(type) && <span className="check-icon">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Filters */}
              <div className="filter-section">
                <label className="section-label">Departure Time</label>
                <div className="time-slots">
                  <button 
                    className={`time-slot ${filters.departureTime === 'morning' ? 'active' : ''}`}
                    onClick={() => onFiltersChange({...filters, departureTime: filters.departureTime === 'morning' ? '' : 'morning'})}
                  >
                    🌅 Morning (6-12 AM)
                  </button>
                  <button 
                    className={`time-slot ${filters.departureTime === 'afternoon' ? 'active' : ''}`}
                    onClick={() => onFiltersChange({...filters, departureTime: filters.departureTime === 'afternoon' ? '' : 'afternoon'})}
                  >
                    ☀️ Afternoon (12-6 PM)
                  </button>
                  <button 
                    className={`time-slot ${filters.departureTime === 'evening' ? 'active' : ''}`}
                    onClick={() => onFiltersChange({...filters, departureTime: filters.departureTime === 'evening' ? '' : 'evening'})}
                  >
                    🌆 Evening (6-12 PM)
                  </button>
                  <button 
                    className={`time-slot ${filters.departureTime === 'night' ? 'active' : ''}`}
                    onClick={() => onFiltersChange({...filters, departureTime: filters.departureTime === 'night' ? '' : 'night'})}
                  >
                    🌙 Night (12-6 AM)
                  </button>
                </div>
              </div>

              {/* Price Range */}
              <div className="filter-section">
                <label className="section-label">
                  Max Price: ₹{filters.priceRange[1]}
                </label>
                <input
                  type="range"
                  min="100"
                  max="3000"
                  step="50"
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceRangeChange(Number(e.target.value))}
                  className="price-slider"
                />
                <div className="price-range-labels">
                  <span>₹100</span>
                  <span>₹3000</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="filter-footer">
          <button 
            className="clear-btn"
            onClick={() => {
              onFiltersChange({
                busType: [],
                departureTime: '',
                arrivalTime: '',
                priceRange: [0, 3000],
                duration: '',
                searchText: ''
              });
              onSearchChange('');
            }}
          >
            Clear All
          </button>
          <button className="apply-btn" onClick={onClose}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileFilterPanel;