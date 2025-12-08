import React from 'react';
import { useTranslation } from 'react-i18next';
import type { RouteContribution } from '../../types/contributionTypes';
import { ContributionStatus } from '../../types/admin';
import './RouteDetailsModal.css';

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
          {/* Basic Route Information */}
          <div className="details-section">
            <h3 className="section-title">
              <span className="section-icon">📍</span>
              {t('admin.routes.details.basicInfo', 'Basic Information')}
            </h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>{t('admin.routes.details.busName', 'Bus Name')}</label>
                <span>{contribution.busName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>{t('admin.routes.details.busNumber', 'Bus Number')}</label>
                <span>{contribution.busNumber}</span>
              </div>
              <div className="detail-item">
                <label>{t('admin.routes.details.submittedBy', 'Submitted By')}</label>
                <span>{contribution.submittedBy || 'Anonymous'}</span>
              </div>
              <div className="detail-item">
                <label>{t('admin.routes.details.submissionDate', 'Submission Date')}</label>
                <span>{formatDate(contribution.submissionDate)}</span>
              </div>
              {contribution.processedDate && (
                <div className="detail-item">
                  <label>{t('admin.routes.details.processedDate', 'Processed Date')}</label>
                  <span>{formatDate(contribution.processedDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Route Path Information */}
          <div className="details-section">
            <h3 className="section-title">
              <span className="section-icon">🛣️</span>
              {t('admin.routes.details.routePath', 'Route Path')}
            </h3>
            <div className="route-path-details">
              <div className="path-item from">
                <div className="path-header">
                  <span className="path-icon">🔵</span>
                  <h4>{t('admin.routes.details.origin', 'Origin')}</h4>
                </div>
                <div className="path-content">
                  <div className="location-name">{contribution.fromLocationName}</div>
                  <div className="coordinates">
                    {t('admin.routes.details.coordinates', 'Coordinates')}: {formatCoordinates(contribution.fromLatitude, contribution.fromLongitude)}
                  </div>
                </div>
              </div>

              <div className="path-connector">
                <div className="connector-line"></div>
                <div className="distance-info">
                  {calculateDistance(contribution.fromLatitude, contribution.fromLongitude, contribution.toLatitude, contribution.toLongitude)}
                </div>
              </div>

              <div className="path-item to">
                <div className="path-header">
                  <span className="path-icon">🔴</span>
                  <h4>{t('admin.routes.details.destination', 'Destination')}</h4>
                </div>
                <div className="path-content">
                  <div className="location-name">{contribution.toLocationName}</div>
                  <div className="coordinates">
                    {t('admin.routes.details.coordinates', 'Coordinates')}: {formatCoordinates(contribution.toLatitude, contribution.toLongitude)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timing Information */}
          <div className="details-section">
            <h3 className="section-title">
              <span className="section-icon">⏰</span>
              {t('admin.routes.details.timing', 'Timing Information')}
            </h3>
            <div className="timing-grid">
              <div className="timing-item">
                <div className="timing-label">{t('admin.routes.details.departure', 'Departure Time')}</div>
                <div className="timing-value">{formatTime(contribution.departureTime)}</div>
              </div>
              <div className="timing-connector">→</div>
              <div className="timing-item">
                <div className="timing-label">{t('admin.routes.details.arrival', 'Arrival Time')}</div>
                <div className="timing-value">{formatTime(contribution.arrivalTime)}</div>
              </div>
              <div className="timing-duration">
                <div className="duration-label">{t('admin.routes.details.duration', 'Journey Duration')}</div>
                <div className="duration-value">
                  {calculateJourneyDuration(contribution.departureTime, contribution.arrivalTime)}
                </div>
              </div>
            </div>
          </div>

          {/* Stops Information */}
          {contribution.stops && contribution.stops.length > 0 && (
            <div className="details-section">
              <h3 className="section-title">
                <span className="section-icon">🚏</span>
                {t('admin.routes.details.stops', 'Intermediate Stops')} ({contribution.stops.length})
              </h3>
              <div className="stops-list">
                {contribution.stops
                  .sort((a, b) => a.stopOrder - b.stopOrder)
                  .map((stop, index) => (
                    <div key={index} className="stop-item">
                      <div className="stop-order">{stop.stopOrder}</div>
                      <div className="stop-details">
                        <div className="stop-name">{stop.name}</div>
                        {(stop.latitude && stop.longitude) && (
                          <div className="stop-coordinates">
                            {formatCoordinates(stop.latitude, stop.longitude)}
                          </div>
                        )}
                        {(stop.arrivalTime || stop.departureTime) && (
                          <div className="stop-timing">
                            {stop.arrivalTime && (
                              <span className="stop-time">
                                {t('admin.routes.details.arrives', 'Arrives')}: {formatTime(stop.arrivalTime)}
                              </span>
                            )}
                            {stop.departureTime && (
                              <span className="stop-time">
                                {t('admin.routes.details.departs', 'Departs')}: {formatTime(stop.departureTime)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="details-section">
            <h3 className="section-title">
              <span className="section-icon">📝</span>
              {t('admin.routes.details.additional', 'Additional Information')}
            </h3>
            <div className="additional-info">
              {contribution.scheduleInfo && (
                <div className="info-item">
                  <label>{t('admin.routes.details.scheduleInfo', 'Schedule Information')}</label>
                  <div className="info-content">{contribution.scheduleInfo}</div>
                </div>
              )}
              {contribution.additionalNotes && (
                <div className="info-item">
                  <label>{t('admin.routes.details.notes', 'Additional Notes')}</label>
                  <div className="info-content">{contribution.additionalNotes}</div>
                </div>
              )}
              {contribution.validationMessage && (
                <div className="info-item validation">
                  <label>{t('admin.routes.details.validationMessage', 'Validation Message')}</label>
                  <div className="info-content warning">{contribution.validationMessage}</div>
                </div>
              )}
            </div>
          </div>
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