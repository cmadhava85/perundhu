import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { RouteContribution } from '../../types/contributionTypes';
import { ContributionStatus } from '../../types/admin';
import AdminService from '../../services/adminService';
import './RouteDetailsModal.css';

interface ExistingBusDetails {
  id: number;
  busNumber: string;
  busName?: string;
  fromLocation: string;
  toLocation: string;
  departureTime?: string;
  arrivalTime?: string;
  stops?: Array<{
    name: string;
    arrivalTime?: string;
    departureTime?: string;
    stopOrder: number;
  }>;
}

interface RouteDetailsModalProps {
  contribution: RouteContribution;
  onClose: () => void;
  onApprove?: (id: number) => void;
  onReject?: (route: RouteContribution) => void;
  onDelete?: (id: number) => void;
}

const RouteDetailsModal: React.FC<RouteDetailsModalProps> = ({
  contribution,
  onClose,
  onApprove,
  onReject,
  onDelete
}) => {
  const { t } = useTranslation();
  const [existingBusDetails, setExistingBusDetails] = useState<ExistingBusDetails | null>(null);
  const [loadingExistingBus, setLoadingExistingBus] = useState(false);

  // Check if this is an ADD_STOPS contribution
  const isAddStopsContribution = contribution.contributionType === 'ADD_STOPS' || 
    contribution.additionalNotes?.includes('ADD_STOPS');
  
  // Extract sourceBusId from additionalNotes if not directly available
  const getSourceBusId = (): number | null => {
    if (contribution.sourceBusId) {
      return contribution.sourceBusId;
    }
    // Try to extract from additionalNotes: "ADD_STOPS for bus ID: 12"
    const match = contribution.additionalNotes?.match(/bus ID:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  // Fetch existing bus details when this is an ADD_STOPS contribution
  useEffect(() => {
    const sourceBusId = getSourceBusId();
    if (isAddStopsContribution && sourceBusId) {
      setLoadingExistingBus(true);
      AdminService.getBusDetails(sourceBusId)
        .then((details) => {
          setExistingBusDetails(details);
        })
        .catch(() => {
          // Ignore errors - existing bus might not be found
        })
        .finally(() => {
          setLoadingExistingBus(false);
        });
    }
  }, [contribution.sourceBusId, contribution.additionalNotes, isAddStopsContribution]);

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const formatCoordinates = (lat?: number, lng?: number) => {
    if (!lat || !lng) return 'Not provided';
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const calculateDistance = (lat1?: number, lng1?: number, lat2?: number, lng2?: number) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return 'N/A';
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return `${distance.toFixed(1)} km`;
  };

  const calculateJourneyDuration = (departure?: string, arrival?: string) => {
    if (!departure || !arrival) return 'N/A';
    
    try {
      const depTime = new Date(`1970-01-01T${departure}`);
      const arrTime = new Date(`1970-01-01T${arrival}`);
      let diff = arrTime.getTime() - depTime.getTime();
      
      // Handle next day arrival
      if (diff < 0) {
        diff += 24 * 60 * 60 * 1000;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours}h ${minutes}m`;
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="route-details-modal-overlay" onClick={onClose}>
      <div className="route-details-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-title">
            <div className="title-section">
              <h2 className="modal-title">
                <span className="title-icon">🚌</span>
                {t('admin.routes.details.title', 'Route Details')}
              </h2>
              <div className="route-number-badge">
                {contribution.busNumber}
              </div>
            </div>
            <span className={getStatusClass(contribution.status)}>
              {contribution.status || 'UNKNOWN'}
            </span>
          </div>
          <button className="close-btn" onClick={onClose} title={t('common.close', 'Close')}>
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          {/* Compact Summary Row - Key Info at a Glance */}
          <div className="quick-summary-row">
            <div className="summary-card route-summary">
              <div className="route-visual">
                <div className="location-pill origin">
                  <span className="dot">●</span>
                  <span className="name">{contribution.fromLocationName}</span>
                </div>
                <div className="route-arrow">
                  <span className="arrow">→</span>
                  <span className="distance">{calculateDistance(contribution.fromLatitude, contribution.fromLongitude, contribution.toLatitude, contribution.toLongitude)}</span>
                </div>
                <div className="location-pill destination">
                  <span className="dot">●</span>
                  <span className="name">{contribution.toLocationName}</span>
                </div>
              </div>
            </div>
            <div className="summary-card timing-summary">
              <div className="time-block">
                <span className="time-label">DEP</span>
                <span className="time-value">{formatTime(contribution.departureTime)}</span>
              </div>
              <span className="time-separator">→</span>
              <div className="time-block">
                <span className="time-label">ARR</span>
                <span className="time-value">{formatTime(contribution.arrivalTime)}</span>
              </div>
              <div className="duration-block">
                <span className="duration-value">{calculateJourneyDuration(contribution.departureTime, contribution.arrivalTime)}</span>
              </div>
            </div>
          </div>

          {/* Compact Meta Info */}
          <div className="meta-info-row">
            <div className="meta-item">
              <span className="meta-label">Bus Name</span>
              <span className="meta-value">{contribution.busName || 'N/A'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Submitted</span>
              <span className="meta-value">{formatDate(contribution.submissionDate)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">By</span>
              <span className="meta-value">{contribution.submittedBy || 'Anonymous'}</span>
            </div>
            {isAddStopsContribution && (
              <div className="meta-item highlight">
                <span className="meta-badge add-stops">🆕 Adding Stops</span>
              </div>
            )}
          </div>

          {/* Existing Route Details - shown only for ADD_STOPS contributions */}
          {isAddStopsContribution && (
            <div className="compact-existing-route">
              <div className="section-header-compact">
                <span>📋 Existing Route</span>
                {loadingExistingBus && <span className="loading-dot">⏳</span>}
              </div>
              {existingBusDetails ? (
                <div className="existing-route-compact">
                  <span className="existing-info">{existingBusDetails.busNumber}: {existingBusDetails.fromLocation} → {existingBusDetails.toLocation}</span>
                  {existingBusDetails.stops && existingBusDetails.stops.length > 0 && (
                    <div className="existing-stops-compact">
                      {existingBusDetails.stops.sort((a, b) => a.stopOrder - b.stopOrder).map((stop, idx) => (
                        <span key={idx} className="existing-stop-chip">{stop.stopOrder}. {stop.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : !loadingExistingBus && (
                <span className="no-data">Could not load existing route</span>
              )}
            </div>
          )}

          {/* Stops - Compact Horizontal Layout */}
          {contribution.stops && contribution.stops.length > 0 && (
            <div className="compact-stops-section">
              <div className="section-header-compact">
                <span>🚏 {isAddStopsContribution ? 'New Stops to Add' : 'Intermediate Stops'} ({contribution.stops.length})</span>
              </div>
              <div className="stops-chips">
                {contribution.stops
                  .sort((a, b) => (a.stopOrder ?? 0) - (b.stopOrder ?? 0))
                  .map((stop, index) => {
                    const displayName = stop.name || stop.locationName || `Stop ${stop.stopOrder || index + 1}`;
                    return (
                      <div key={index} className={`stop-chip ${isAddStopsContribution ? 'new' : ''}`}>
                        <span className="chip-order">{stop.stopOrder ?? index + 1}</span>
                        <span className="chip-name">{displayName}</span>
                        {(stop.arrivalTime || stop.departureTime) && (
                          <span className="chip-time">
                            {stop.arrivalTime && `↓${stop.arrivalTime}`}
                            {stop.arrivalTime && stop.departureTime && ' '}
                            {stop.departureTime && `↑${stop.departureTime}`}
                          </span>
                        )}
                      </div>
                    );
                  })
                }
              </div>
            </div>
          )}

          {/* Coordinates - Collapsible/Minimal */}
          {(contribution.fromLatitude || contribution.toLatitude) && (
            <div className="coords-row">
              <span className="coord-item">📍 From: {formatCoordinates(contribution.fromLatitude, contribution.fromLongitude)}</span>
              <span className="coord-item">📍 To: {formatCoordinates(contribution.toLatitude, contribution.toLongitude)}</span>
            </div>
          )}

          {/* Notes - Only if present */}
          {(contribution.scheduleInfo || contribution.additionalNotes || contribution.validationMessage) && (
            <div className="notes-section">
              {contribution.scheduleInfo && (
                <div className="note-item">
                  <span className="note-label">Schedule:</span> {contribution.scheduleInfo}
                </div>
              )}
              {contribution.additionalNotes && (
                <div className="note-item">
                  <span className="note-label">Notes:</span> {contribution.additionalNotes}
                </div>
              )}
              {contribution.validationMessage && (
                <div className="note-item warning">
                  <span className="note-label">⚠️ Validation:</span> {contribution.validationMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          <div className="action-group">
            {contribution.status === ContributionStatus.PENDING && (
              <>
                {onApprove && contribution.id && (
                  <button 
                    className="action-btn approve"
                    onClick={() => onApprove(contribution.id!)}
                  >
                    <span className="btn-icon">✓</span>
                    {t('admin.routes.approve', 'Approve')}
                  </button>
                )}
                {onReject && (
                  <button 
                    className="action-btn reject"
                    onClick={() => onReject(contribution)}
                  >
                    <span className="btn-icon">✕</span>
                    {t('admin.routes.reject', 'Reject')}
                  </button>
                )}
              </>
            )}
            {onDelete && contribution.id && (
              <button 
                className="action-btn delete"
                onClick={() => {
                  if (window.confirm(t('admin.routes.deleteConfirm', 'Are you sure you want to delete this route?'))) {
                    onDelete(contribution.id!);
                  }
                }}
              >
                <span className="btn-icon">🗑️</span>
                {t('admin.routes.delete', 'Delete')}
              </button>
            )}
          </div>
          <button className="action-btn secondary" onClick={onClose}>
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteDetailsModal;