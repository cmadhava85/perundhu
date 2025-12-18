import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Edit2, 
  Power, 
  PowerOff,
  MapPin
} from 'lucide-react';
import BusDatabaseService from '../../services/busDatabaseService';
import type { 
  BusListItem, 
  PagedBusResponse,
  BusFilters 
} from '../../services/busDatabaseService';
import StopsModal from './StopsModal';
import BusTimingEditModal from './BusTimingEditModal';
import './BusDatabaseBrowser.css';

/**
 * Admin panel for browsing and managing the bus database
 */
const BusDatabaseBrowser: React.FC = () => {
  const { t } = useTranslation();
  
  // Data state
  const [buses, setBuses] = useState<BusListItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [pageSize] = useState(100);
  
  // Filter options
  const [originOptions, setOriginOptions] = useState<string[]>([]);
  const [destinationOptions, setDestinationOptions] = useState<string[]>([]);
  
  // Modal state
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [stopsModalOpen, setStopsModalOpen] = useState(false);
  const [timingModalOpen, setTimingModalOpen] = useState(false);
  const [selectedBusForTiming, setSelectedBusForTiming] = useState<BusListItem | null>(null);

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [origins, destinations] = await Promise.all([
          BusDatabaseService.getUniqueOrigins(),
          BusDatabaseService.getUniqueDestinations()
        ]);
        setOriginOptions(origins);
        setDestinationOptions(destinations);
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    loadFilterOptions();
  }, []);

  // Load buses
  const loadBuses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: BusFilters = {
        page: currentPage,
        size: pageSize,
        search: searchQuery || undefined,
        origin: originFilter || undefined,
        destination: destinationFilter || undefined,
        activeOnly: activeOnly || undefined,
      };
      
      const response: PagedBusResponse = await BusDatabaseService.getBuses(filters);
      
      setBuses(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Failed to load buses:', err);
      setError('Failed to load buses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, originFilter, destinationFilter, activeOnly]);

  useEffect(() => {
    loadBuses();
  }, [loadBuses]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle filter changes
  const handleOriginChange = (value: string) => {
    setOriginFilter(value);
    setCurrentPage(0);
  };

  const handleDestinationChange = (value: string) => {
    setDestinationFilter(value);
    setCurrentPage(0);
  };

  const handleActiveOnlyChange = (checked: boolean) => {
    setActiveOnly(checked);
    setCurrentPage(0);
  };

  // Handle stops click
  const handleStopsClick = (busId: number) => {
    setSelectedBusId(busId);
    setStopsModalOpen(true);
  };

  // Handle timing edit
  const handleTimingEdit = (bus: BusListItem) => {
    setSelectedBusForTiming(bus);
    setTimingModalOpen(true);
  };

  // Handle toggle active
  const handleToggleActive = async (bus: BusListItem) => {
    const action = bus.active ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} bus ${bus.busNumber}?`)) {
      return;
    }
    
    try {
      await BusDatabaseService.toggleBusActive(bus.id, !bus.active);
      loadBuses(); // Refresh list
    } catch (err) {
      console.error('Failed to toggle bus active status:', err);
      alert('Failed to update bus status. Please try again.');
    }
  };

  // Close modals
  const handleCloseStopsModal = () => {
    setStopsModalOpen(false);
    setSelectedBusId(null);
  };

  const handleCloseTimingModal = () => {
    setTimingModalOpen(false);
    setSelectedBusForTiming(null);
  };

  const handleTimingSaved = () => {
    handleCloseTimingModal();
    loadBuses(); // Refresh list
  };

  // Pagination
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setOriginFilter('');
    setDestinationFilter('');
    setActiveOnly(false);
    setCurrentPage(0);
  };

  return (
    <div className="bus-database-browser">
      <div className="panel-header">
        <h2 className="panel-title">
          <span className="title-icon">🗄️</span>
          {t('admin.busDatabase.title', 'Bus Database')}
        </h2>
        <p className="panel-subtitle">
          {t('admin.busDatabase.subtitle', 'Browse and manage all bus routes in the database')}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="filters-container">
        <div className="search-row">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder={t('admin.busDatabase.searchPlaceholder', 'Search by bus number, name, or location...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <button className="refresh-btn" onClick={loadBuses} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            <span>{t('admin.busDatabase.refresh', 'Refresh')}</span>
          </button>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label className="filter-label">
              <Filter size={14} />
              {t('admin.busDatabase.origin', 'Origin')}
            </label>
            <select 
              value={originFilter}
              onChange={(e) => handleOriginChange(e.target.value)}
              className="filter-select"
            >
              <option value="">{t('admin.busDatabase.allOrigins', 'All Origins')}</option>
              {originOptions.map(origin => (
                <option key={origin} value={origin}>{origin}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <MapPin size={14} />
              {t('admin.busDatabase.destination', 'Destination')}
            </label>
            <select 
              value={destinationFilter}
              onChange={(e) => handleDestinationChange(e.target.value)}
              className="filter-select"
            >
              <option value="">{t('admin.busDatabase.allDestinations', 'All Destinations')}</option>
              {destinationOptions.map(dest => (
                <option key={dest} value={dest}>{dest}</option>
              ))}
            </select>
          </div>

          <div className="filter-group checkbox-group">
            <label className="checkbox-label">
              <input 
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => handleActiveOnlyChange(e.target.checked)}
              />
              <span>{t('admin.busDatabase.activeOnly', 'Active Only')}</span>
            </label>
          </div>

          {(searchQuery || originFilter || destinationFilter || activeOnly) && (
            <button className="clear-filters-btn" onClick={handleClearFilters}>
              {t('admin.busDatabase.clearFilters', 'Clear Filters')}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">{totalElements}</span>
          <span className="stat-label">{t('admin.busDatabase.totalBuses', 'Total Buses')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{buses.filter(b => b.active).length}</span>
          <span className="stat-label">{t('admin.busDatabase.activeOnPage', 'Active on Page')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">
            {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)}
          </span>
          <span className="stat-label">{t('admin.busDatabase.showing', 'Showing')}</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('admin.busDatabase.loading', 'Loading buses...')}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="buses-table">
            <thead>
              <tr>
                <th>{t('admin.busDatabase.busNumber', 'Bus #')}</th>
                <th>{t('admin.busDatabase.name', 'Name')}</th>
                <th>{t('admin.busDatabase.originCol', 'Origin')}</th>
                <th>{t('admin.busDatabase.destinationCol', 'Destination')}</th>
                <th>{t('admin.busDatabase.departure', 'Departure')}</th>
                <th>{t('admin.busDatabase.arrival', 'Arrival')}</th>
                <th>{t('admin.busDatabase.stops', 'Stops')}</th>
                <th>{t('admin.busDatabase.status', 'Status')}</th>
                <th>{t('admin.busDatabase.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {buses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="no-data">
                    {t('admin.busDatabase.noResults', 'No buses found matching your criteria')}
                  </td>
                </tr>
              ) : (
                buses.map(bus => (
                  <tr key={bus.id} className={bus.active ? '' : 'inactive-row'}>
                    <td className="bus-number-cell">{bus.busNumber}</td>
                    <td className="name-cell">{bus.name}</td>
                    <td className="location-cell">{bus.origin || '-'}</td>
                    <td className="location-cell">{bus.destination || '-'}</td>
                    <td className="time-cell">
                      {bus.departureTime || (
                        <span className="missing-time">⚠️ Missing</span>
                      )}
                    </td>
                    <td className="time-cell">
                      {bus.arrivalTime || (
                        <span className="missing-time">⚠️ Missing</span>
                      )}
                    </td>
                    <td className="stops-cell">
                      <button 
                        className="stops-link"
                        onClick={() => handleStopsClick(bus.id)}
                        title={t('admin.busDatabase.viewStops', 'View and edit stops')}
                      >
                        {bus.stopCount} {t('admin.busDatabase.stopsLabel', 'stops')}
                      </button>
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge ${bus.active ? 'active' : 'inactive'}`}>
                        {bus.active ? t('admin.busDatabase.active', 'Active') : t('admin.busDatabase.inactive', 'Inactive')}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleTimingEdit(bus)}
                        title={t('admin.busDatabase.editTiming', 'Edit timing')}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className={`action-btn toggle-btn ${bus.active ? 'deactivate' : 'activate'}`}
                        onClick={() => handleToggleActive(bus)}
                        title={bus.active 
                          ? t('admin.busDatabase.deactivate', 'Deactivate') 
                          : t('admin.busDatabase.activate', 'Activate')}
                      >
                        {bus.active ? <PowerOff size={14} /> : <Power size={14} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <button 
            className="pagination-btn"
            onClick={handlePrevPage}
            disabled={currentPage === 0}
          >
            <ChevronLeft size={16} />
            <span>{t('admin.busDatabase.previous', 'Previous')}</span>
          </button>
          
          <div className="page-info">
            <span>{t('admin.busDatabase.page', 'Page')} </span>
            <strong>{currentPage + 1}</strong>
            <span> {t('admin.busDatabase.of', 'of')} </span>
            <strong>{totalPages}</strong>
          </div>
          
          <button 
            className="pagination-btn"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
          >
            <span>{t('admin.busDatabase.next', 'Next')}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Stops Modal */}
      {stopsModalOpen && selectedBusId && (
        <StopsModal
          busId={selectedBusId}
          onClose={handleCloseStopsModal}
          onUpdate={loadBuses}
        />
      )}

      {/* Timing Edit Modal */}
      {timingModalOpen && selectedBusForTiming && (
        <BusTimingEditModal
          bus={selectedBusForTiming}
          onClose={handleCloseTimingModal}
          onSave={handleTimingSaved}
        />
      )}
    </div>
  );
};

export default BusDatabaseBrowser;
