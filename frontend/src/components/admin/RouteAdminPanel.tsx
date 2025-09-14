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

  // Load routes on component mount and when filter changes
  useEffect(() => {
    loadRoutes();
  }, [statusFilter]);

  // Filter routes when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRoutes(routes);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = routes.filter(
        route =>
          route.busNumber.toLowerCase().includes(lowerQuery) ||
          (route.fromLocationName && route.fromLocationName.toLowerCase().includes(lowerQuery)) ||
          (route.toLocationName && route.toLocationName.toLowerCase().includes(lowerQuery))
      );
      setFilteredRoutes(filtered);
    }
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
    } catch (err) {
      setError('Failed to load route contributions. Please try again later.');
      console.error('Error loading routes:', err);
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
    } catch (err) {
      setError('Failed to approve route. Please try again.');
      console.error('Error approving route:', err);
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
    } catch (err) {
      setError('Failed to reject route. Please try again.');
      console.error('Error rejecting route:', err);
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
      } catch (err) {
        setError('Failed to delete route. Please try again.');
        console.error('Error deleting route:', err);
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
            <span className="location-name">{route.fromLocationName}</span>
          </div>
          <div className="path-arrow">→</div>
          <div className="location to">
            <span className="location-icon">🎯</span>
            <span className="location-name">{route.toLocationName}</span>
          </div>
        </div>
        
        <div className="route-meta">
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
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>{t('admin.routes.loading', 'Loading routes...')}</p>
        </div>
      ) : filteredRoutes.length > 0 ? (
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
                    <td>{route.busNumber}</td>
                    <td>{route.fromLocationName}</td>
                    <td>{route.toLocationName}</td>
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