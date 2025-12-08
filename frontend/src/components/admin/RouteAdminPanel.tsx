import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './RouteAdminPanel.css';
import type { RouteContribution } from '../../types/contributionTypes';
import { ContributionStatus } from '../../types/admin';
import AdminService from '../../services/adminService';
import RejectModal from './RejectModal';
import RouteDetailsModal from './RouteDetailsModal';

/**
 * Admin panel for route management and approval
 */
const RouteAdminPanel: React.FC = () => {
  const { t } = useTranslation();
  const [routes, setRoutes] = useState<RouteContribution[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<RouteContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteContribution | null>(null);
  const [selectedView, setSelectedView] = useState<'grid' | 'list'>('grid');
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRouteForDetails, setSelectedRouteForDetails] = useState<RouteContribution | null>(null);
  
  // Integration state - integrationLoading is set but checked implicitly via loading UI state
  const [integrationLoading, setIntegrationLoading] = useState(false);
  void integrationLoading; // Used for loading state tracking
  const [integrationError, setIntegrationError] = useState<string>('');
  const [integrationSuccess, setIntegrationSuccess] = useState<string>('');

  // Load routes on component mount and when filter changes
  useEffect(() => {
    let isMounted = true;

    const loadRoutes = async () => {
      try {
        if (isMounted) {
          setLoading(true);
        }
        let data;
        
        if (statusFilter === 'all') {
          data = await AdminService.getRouteContributions();
        } else if (statusFilter === 'pending') {
          data = await AdminService.getPendingRouteContributions();
        } else {
          data = await AdminService.getRouteContributions();
          // Filter by status if not 'all'
          data = data.filter(c => c.status?.toLowerCase() === statusFilter);
        }
        
        if (isMounted) {
          setRoutes(data);
          setFilteredRoutes(data);
          setError(null);
        }
      } catch (_err) {
        if (isMounted) {
          setError('Failed to load route contributions. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRoutes();

    return () => {
      isMounted = false;
    };
  }, [statusFilter]);

  // Filter routes when search query changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() === '') {
        setFilteredRoutes(routes);
      } else {
        const lowerQuery = searchQuery.toLowerCase();
        
        // Helper function to check if text matches query
        const textMatches = (text?: string) => text?.toLowerCase().includes(lowerQuery) || false;
        
        const filtered = routes.filter(route => {
          // Search in bus number, location names, stops, and submitter
          return textMatches(route.busNumber) ||
                 textMatches(route.fromLocationName) ||
                 textMatches(route.fromLocationTranslatedName) ||
                 textMatches(route.fromLocationTaName) ||
                 textMatches(route.toLocationName) ||
                 textMatches(route.toLocationTranslatedName) ||
                 textMatches(route.toLocationTaName) ||
                 textMatches(route.submittedBy) ||
                 route.stops?.some(stop => 
                   textMatches(stop.name) ||
                   textMatches(stop.translatedName) ||
                   textMatches(stop.taName)
                 );
        });
        
        setFilteredRoutes(filtered);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, routes]);

  // Function to load routes based on status filter
  const loadRoutes = async () => {
    try {
      setLoading(true);
      let data;
      
      if (statusFilter === 'all') {
        data = await AdminService.getRouteContributions();
      } else if (statusFilter === 'pending') {
        data = await AdminService.getPendingRouteContributions();
      } else {
        data = await AdminService.getRouteContributions();
        // Filter by status if not 'all'
        data = data.filter(c => c.status?.toLowerCase() === statusFilter);
      }
      
      setRoutes(data);
      setFilteredRoutes(data);
      setError(null);
    } catch (_err) {
      setError('Failed to load route contributions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle route approval
  const handleApprove = async (id: number | undefined) => {
    if (!id) return;
    try {
      setLoading(true);
      await AdminService.approveRouteContribution(id);
      
      // Reload routes to get updated list
      await loadRoutes();
    } catch (_err) {
      setError('Failed to approve route. Please try again.');
      setLoading(false);
    }
  };

  // Open reject modal with selected route
  const handleOpenRejectModal = (route: RouteContribution) => {
    setSelectedRoute(route);
    setRejectModalOpen(true);
  };

  // Handle route rejection
  const handleReject = async (reason: string) => {
    if (!selectedRoute?.id) return;
    try {
      setLoading(true);
      await AdminService.rejectRouteContribution(selectedRoute.id, reason);
      
      // Close the modal and reload routes
      setRejectModalOpen(false);
      setSelectedRoute(null);
      await loadRoutes();
    } catch (_err) {
      setError('Failed to reject route. Please try again.');
      setLoading(false);
    }
  };

  // Handle route deletion
  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    if (window.confirm(t('admin.routes.deleteConfirm', 'Are you sure you want to delete this route? This action cannot be undone.'))) {
      try {
        setLoading(true);
        await AdminService.deleteRouteContribution(id);
        
        // Reload routes to get updated list
        await loadRoutes();
      } catch (_err) {
        setError('Failed to delete route. Please try again.');
        setLoading(false);
      }
    }
  };

  // Close the reject modal
  const handleCloseRejectModal = () => {
    setRejectModalOpen(false);
    setSelectedRoute(null);
  };

  // Handle opening route details modal
  const handleViewDetails = (route: RouteContribution) => {
    setSelectedRouteForDetails(route);
    setDetailsModalOpen(true);
  };

  // Handle closing route details modal
  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedRouteForDetails(null);
  };

  // Handle approve from details modal
  const handleApproveFromDetails = async (id: number) => {
    await handleApprove(id);
    handleCloseDetailsModal();
  };

  // Handle reject from details modal
  const handleRejectFromDetails = (route: RouteContribution) => {
    handleCloseDetailsModal();
    handleOpenRejectModal(route);
  };

  // Handle delete from details modal
  const handleDeleteFromDetails = async (id: number) => {
    await handleDelete(id);
    handleCloseDetailsModal();
  };

  // Handle integration of approved routes
    const handleIntegrateApprovedRoutes = async () => {
    try {
      setIntegrationLoading(true);
      const result = await AdminService.integrateApprovedRoutes();
      
      if (result.manualIntegrationRequired) {
        // Show manual integration instructions
        setIntegrationError('');
        setIntegrationSuccess('');
        
        // Create a detailed modal or alert with manual instructions
        const message = `
${result.message}

Manual Integration Steps:
${(result.instructions ?? []).join('\n')}

SQL Example:
${result.sqlExample}`;
        
        alert(message);
        
        // Also set a helpful UI message
        setIntegrationError(
          'Integration endpoint not available. Please run manual integration script. Check console for details.'
        );
        
      } else if (result.error) {
        setIntegrationError(result.error);
        setIntegrationSuccess('');
      } else {
        setIntegrationSuccess(
          `Integration completed! ${result.successCount || 0} routes integrated successfully.`
        );
        setIntegrationError('');
        // Refresh the contributions list
        await loadRoutes();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to integrate approved routes. Check browser console for manual integration instructions.';
      setIntegrationError(errorMessage);
      setIntegrationSuccess('');
    } finally {
      setIntegrationLoading(false);
    }
  };

  // Handle integration of a specific route
  const handleIntegrateSpecificRoute = async (route: RouteContribution) => {
    if (route.status !== 'APPROVED') {
      alert('Only approved routes can be integrated.');
      return;
    }

    try {
      setLoading(true);
      const result = await AdminService.integrateSpecificRoute(route.id || 0);
      
      if (result.error) {
        setError(`Integration failed: ${result.error}`);
      } else {
        alert(`Successfully integrated route: ${route.busNumber} (${route.fromLocationName} → ${route.toLocationName})`);
        await loadRoutes();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Integration failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Get appropriate CSS class for status
  const getStatusClass = (status?: ContributionStatus) => {
    if (!status) return 'status-badge';
    switch (status) {
      case ContributionStatus.PENDING:
        return 'status-badge pending';
      case ContributionStatus.APPROVED:
        return 'status-badge approved';
      case ContributionStatus.REJECTED:
        return 'status-badge rejected';
      default:
        return 'status-badge';
    }
  };

  // Get row class for styling
  const getRowClass = (status?: ContributionStatus) => {
    if (!status) return '';
    switch (status) {
      case ContributionStatus.PENDING:
        return 'status-pending';
      case ContributionStatus.APPROVED:
        return 'status-approved';
      case ContributionStatus.REJECTED:
        return 'status-rejected';
      default:
        return '';
    }
  };

  // Render a route card for grid view
  const renderRouteCard = (route: RouteContribution) => (
    <div key={route.id} className={`route-card ${getRowClass(route.status)}`}>
      <div className="route-card-header">
        <span className="route-number">{route.busNumber}</span>
        <span className={getStatusClass(route.status)}>
          {route.status}
        </span>
      </div>
      
      <div className="route-details">
        <div className="route-path">
          <div className="location from">
            <span className="location-icon">📍</span>
            <div className="location-names">
              <span className="location-name primary">{route.fromLocationName}</span>
              {route.fromLocationTranslatedName && route.fromLocationTranslatedName !== route.fromLocationName && (
                <span className="location-name translated">{route.fromLocationTranslatedName}</span>
              )}
              {route.fromLocationTaName && route.fromLocationTaName !== route.fromLocationName && route.fromLocationTaName !== route.fromLocationTranslatedName && (
                <span className="location-name tamil">{route.fromLocationTaName}</span>
              )}
            </div>
          </div>
          <div className="path-arrow">→</div>
          <div className="location to">
            <span className="location-icon">🎯</span>
            <div className="location-names">
              <span className="location-name primary">{route.toLocationName}</span>
              {route.toLocationTranslatedName && route.toLocationTranslatedName !== route.toLocationName && (
                <span className="location-name translated">{route.toLocationTranslatedName}</span>
              )}
              {route.toLocationTaName && route.toLocationTaName !== route.toLocationName && route.toLocationTaName !== route.toLocationTranslatedName && (
                <span className="location-name tamil">{route.toLocationTaName}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="route-meta">
          {/* Timing Information */}
          {(route.departureTime || route.arrivalTime) && (
            <div className="route-timing">
              <span className="meta-icon">🕐</span>
              <div className="timing-details">
                {route.departureTime && (
                  <span className="timing-item">
                    <span className="timing-label">Dep:</span>
                    <span className="timing-value">{route.departureTime}</span>
                  </span>
                )}
                {route.arrivalTime && (
                  <span className="timing-item">
                    <span className="timing-label">Arr:</span>
                    <span className="timing-value">{route.arrivalTime}</span>
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="route-stops">
            {route.stops && route.stops.length > 0 && (
              <>
                <span className="meta-label">{t('admin.routes.stops')}:</span>
                <span className="meta-value">{route.stops.length} stops</span>
              </>
            )}
          </div>
          <div className="route-submitter">
            <span className="meta-label">{t('admin.routes.submittedBy')}:</span>
            <span className="meta-value">{route.submittedBy || 'Anonymous'}</span>
          </div>
          <div className="route-date">
            <span className="meta-label">{t('admin.routes.date')}:</span>
            <span className="meta-value">
              {route.submissionDate ? new Date(route.submissionDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="route-actions">
        {route.status === ContributionStatus.PENDING && (
          <>
            <button 
              className="action-btn approve"
              onClick={() => handleApprove(route.id)}
              title={t('admin.routes.approve')}
            >
              <span className="btn-icon">✓</span>
              <span className="btn-text">{t('admin.routes.approve')}</span>
            </button>
            <button 
              className="action-btn reject"
              onClick={() => handleOpenRejectModal(route)}
              title={t('admin.routes.reject')}
            >
              <span className="btn-icon">✕</span>
              <span className="btn-text">{t('admin.routes.reject')}</span>
            </button>
          </>
        )}
        {route.status === 'APPROVED' && (
          <button 
            className="action-btn integrate"
            onClick={() => handleIntegrateSpecificRoute(route)}
            title="Integrate this route into search database"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white'
            }}
          >
            <span className="btn-icon">🔗</span>
            <span className="btn-text">Sync</span>
          </button>
        )}
        <button 
          className="action-btn view"
          onClick={() => handleViewDetails(route)}
          title={t('admin.routes.view')}
        >
          <span className="btn-icon">👁️</span>
          <span className="btn-text">{t('admin.routes.view')}</span>
        </button>
        <button 
          className="action-btn delete"
          onClick={() => handleDelete(route.id)}
          title={t('admin.routes.delete')}
        >
          <span className="btn-icon">🗑️</span>
          <span className="btn-text">{t('admin.routes.delete')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="route-admin-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span className="title-icon">🚌</span>
          {t('admin.routes.title', 'Route Management')}
        </h2>
        <p className="panel-subtitle">
          {t('admin.routes.subtitle', 'Manage bus routes and review pending requests')}
        </p>
      </div>

      <div className="panel-controls">
        <div className="search-filter-row">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('admin.routes.searchPlaceholder', 'Search routes...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">{t('admin.routes.filterBy')}:</label>
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{t('admin.routes.statusAll', 'All')}</option>
              <option value="pending">{t('admin.routes.statusPending', 'Pending')}</option>
              <option value="approved">{t('admin.routes.statusApproved', 'Approved')}</option>
              <option value="rejected">{t('admin.routes.statusRejected', 'Rejected')}</option>
            </select>
          </div>
          
          <div className="view-toggle">
            <button 
              className={`view-btn ${selectedView === 'grid' ? 'active' : ''}`}
              onClick={() => setSelectedView('grid')}
              title={t('admin.routes.gridView')}
            >
              <span className="view-icon">▤</span>
            </button>
            <button 
              className={`view-btn ${selectedView === 'list' ? 'active' : ''}`}
              onClick={() => setSelectedView('list')}
              title={t('admin.routes.listView')}
            >
              <span className="view-icon">☰</span>
            </button>
          </div>
        </div>
        
        <div className="action-stats-row">
          <div className="route-stats">
            <div className="stat-item">
              <span className="stat-value">{routes.filter(r => r.status === ContributionStatus.PENDING).length}</span>
              <span className="stat-label">{t('admin.routes.pendingCount')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{routes.filter(r => r.status === ContributionStatus.APPROVED).length}</span>
              <span className="stat-label">{t('admin.routes.approvedCount')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{routes.filter(r => r.status === ContributionStatus.REJECTED).length}</span>
              <span className="stat-label">{t('admin.routes.rejectedCount')}</span>
            </div>
          </div>
          
          <button className="refresh-btn" onClick={loadRoutes} disabled={loading}>
            <span className="btn-icon">🔄</span>
            <span className="btn-text">{t('admin.routes.refresh')}</span>
          </button>
          
          <button 
            className="integrate-btn" 
            onClick={handleIntegrateApprovedRoutes} 
            disabled={loading}
            title="Integrate approved routes into search database"
            style={{
              marginLeft: '1rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <span className="btn-icon">🔗</span>
            <span className="btn-text">Sync to Search</span>
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {/* Show integration notice if there are approved routes */}
      {filteredRoutes.filter(r => r.status === 'APPROVED').length > 0 && (
        <div className="integration-notice" style={{
          background: 'linear-gradient(135deg, #fef3c7, #fbbf24)',
          border: '1px solid #f59e0b',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <h4 style={{ margin: 0, color: '#92400e', fontSize: '0.95rem', fontWeight: '600' }}>
              Approved Routes Need Integration
            </h4>
            <p style={{ margin: '0.25rem 0 0 0', color: '#92400e', fontSize: '0.85rem' }}>
              You have {filteredRoutes.filter(r => r.status === 'APPROVED').length} approved route(s) that aren't showing in search results. 
              Click "Sync to Search" to integrate them into the main bus database.
            </p>
          </div>
        </div>
      )}
      
      {/* Integration status messages */}
      {integrationError && (
        <div className="integration-error" style={{
          background: 'linear-gradient(135deg, #fecaca, #f87171)',
          border: '1px solid #ef4444',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>❌</span>
          <div>
            <h4 style={{ margin: 0, color: '#7f1d1d', fontSize: '0.95rem', fontWeight: '600' }}>
              Integration Error
            </h4>
            <p style={{ margin: '0.25rem 0 0 0', color: '#7f1d1d', fontSize: '0.85rem' }}>
              {integrationError}
            </p>
          </div>
        </div>
      )}
      
      {integrationSuccess && (
        <div className="integration-success" style={{
          background: 'linear-gradient(135deg, #bbf7d0, #4ade80)',
          border: '1px solid #22c55e',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <div>
            <h4 style={{ margin: 0, color: '#14532d', fontSize: '0.95rem', fontWeight: '600' }}>
              Integration Successful
            </h4>
            <p style={{ margin: '0.25rem 0 0 0', color: '#14532d', fontSize: '0.85rem' }}>
              {integrationSuccess}
            </p>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>{t('admin.routes.loading', 'Loading routes...')}</p>
        </div>
      ) : (
        <div className="routes-content">
          {filteredRoutes.length > 0 ? (
            <>
              {selectedView === 'grid' ? (
                <div className="routes-grid">
                  {filteredRoutes.map(route => renderRouteCard(route))}
                </div>
              ) : (
                <table className="routes-table">
              <thead>
                <tr>
                  <th>{t('admin.routes.id')}</th>
                  <th>{t('admin.routes.busNumber')}</th>
                  <th>{t('admin.routes.fromLocation')}</th>
                  <th>{t('admin.routes.toLocation')}</th>
                  <th>{t('admin.routes.departure', 'Departure')}</th>
                  <th>{t('admin.routes.arrival', 'Arrival')}</th>
                  <th>{t('admin.routes.stops')}</th>
                  <th>{t('admin.routes.submittedBy')}</th>
                  <th>{t('admin.routes.date')}</th>
                  <th>{t('admin.routes.status')}</th>
                  <th>{t('admin.routes.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.map(route => (
                  <tr key={route.id} className={getRowClass(route.status)}>
                    <td>{route.id}</td>
                    <td className="bus-number-cell">{route.busNumber}</td>
                    <td className="location-cell">
                      <div className="location-names-list">
                        <div className="primary-name">{route.fromLocationName}</div>
                        {route.fromLocationTranslatedName && route.fromLocationTranslatedName !== route.fromLocationName && (
                          <div className="translated-name">{route.fromLocationTranslatedName}</div>
                        )}
                        {route.fromLocationTaName && route.fromLocationTaName !== route.fromLocationName && route.fromLocationTaName !== route.fromLocationTranslatedName && (
                          <div className="tamil-name">{route.fromLocationTaName}</div>
                        )}
                      </div>
                    </td>
                    <td className="location-cell">
                      <div className="location-names-list">
                        <div className="primary-name">{route.toLocationName}</div>
                        {route.toLocationTranslatedName && route.toLocationTranslatedName !== route.toLocationName && (
                          <div className="translated-name">{route.toLocationTranslatedName}</div>
                        )}
                        {route.toLocationTaName && route.toLocationTaName !== route.toLocationName && route.toLocationTaName !== route.toLocationTranslatedName && (
                          <div className="tamil-name">{route.toLocationTaName}</div>
                        )}
                      </div>
                    </td>
                    <td className="timing-cell">
                      {route.departureTime ? (
                        <span className="timing-badge departure">{route.departureTime}</span>
                      ) : (
                        <span className="no-timing">-</span>
                      )}
                    </td>
                    <td className="timing-cell">
                      {route.arrivalTime ? (
                        <span className="timing-badge arrival">{route.arrivalTime}</span>
                      ) : (
                        <span className="no-timing">-</span>
                      )}
                    </td>
                    <td className="stops-cell">
                      {route.stops && route.stops.length > 0 ? (
                        <div className="stops-info">
                          <span className="stops-count">{route.stops.length}</span>
                          <div className="stops-preview">
                            {route.stops.slice(0, 2).map((stop, idx) => (
                              <div key={`${stop.name}-${idx}`} className="stop-name">
                                {stop.name}
                                {stop.translatedName && stop.translatedName !== stop.name && (
                                  <span className="stop-translated"> ({stop.translatedName})</span>
                                )}
                              </div>
                            ))}
                            {route.stops.length > 2 && (
                              <div className="stops-more">+{route.stops.length - 2} more</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="no-stops">-</span>
                      )}
                    </td>
                    <td>{route.submittedBy || 'Anonymous'}</td>
                    <td>{route.submissionDate ? new Date(route.submissionDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={getStatusClass(route.status)}>
                        {route.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {route.status === ContributionStatus.PENDING && (
                          <>
                            <button 
                              className="btn btn-approve"
                              onClick={() => handleApprove(route.id)}
                              title={t('admin.routes.approve')}
                            >
                              ✓
                            </button>
                            <button 
                              className="btn btn-reject"
                              onClick={() => handleOpenRejectModal(route)}
                              title={t('admin.routes.reject')}
                            >
                              ✕
                            </button>
                          </>
                        )}
                        {route.status === 'APPROVED' && (
                          <button 
                            className="btn btn-integrate"
                            onClick={() => handleIntegrateSpecificRoute(route)}
                            title="Integrate into search"
                            style={{
                              background: '#10b981',
                              color: 'white'
                            }}
                          >
                            🔗
                          </button>
                        )}
                        <button 
                          className="btn btn-view"
                          onClick={() => handleViewDetails(route)}
                          title={t('admin.routes.view')}
                        >
                          👁️
                        </button>
                        <button 
                          className="btn btn-delete"
                          onClick={() => handleDelete(route.id)}
                          title={t('admin.routes.delete')}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🚏</div>
          <h3>{t('admin.routes.noRoutes', 'No routes found')}</h3>
          <p>{t('admin.routes.noRoutesDesc', 'No route contributions match your current filter')}</p>
        </div>
      )}
        </div>
      )}

      {rejectModalOpen && selectedRoute && (
        <RejectModal
          contribution={selectedRoute}
          onReject={handleReject}
          onClose={handleCloseRejectModal}
        />
      )}

      {detailsModalOpen && selectedRouteForDetails && (
        <RouteDetailsModal
          contribution={selectedRouteForDetails}
          onClose={handleCloseDetailsModal}
          onApprove={handleApproveFromDetails}
          onReject={handleRejectFromDetails}
          onDelete={handleDeleteFromDetails}
        />
      )}
    </div>
  );
};

export default RouteAdminPanel;