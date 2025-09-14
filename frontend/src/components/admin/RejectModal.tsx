import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './RejectModal.css';
import type { RouteContribution } from '../../types/contributionTypes';

interface RejectModalProps {
  contribution: RouteContribution;
  onReject: (reason: string) => void;
  onClose: () => void;
}

/**
 * Modal for rejecting a route contribution with a reason
 */
const RejectModal: React.FC<RejectModalProps> = ({ contribution, onReject, onClose }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError(t('admin.reject.reasonRequired', 'Please provide a reason for rejection.'));
      return;
    }
    
    if (contribution.id) {
      onReject(reason);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="reject-modal">
        <div className="modal-header">
          <h2>{t('admin.reject.title', 'Reject Route Contribution')}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-content">
          <div className="contribution-info">
            <p><strong>{t('admin.contributions.busNumber', 'Bus Number')}:</strong> {contribution.busNumber}</p>
            <p>
              <strong>{t('admin.contributions.route', 'Route')}:</strong> {contribution.fromLocationName} to {contribution.toLocationName}
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="rejection-reason">
                {t('admin.reject.reasonLabel', 'Reason for Rejection')}:
              </label>
              <textarea
                id="rejection-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('admin.reject.reasonPlaceholder', 'Please provide a clear reason for rejecting this contribution...')}
                rows={5}
                className={error ? 'error' : ''}
              />
              {error && <div className="error-message">{error}</div>}
            </div>
            
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {t('admin.reject.cancel', 'Cancel')}
              </button>
              <button type="submit" className="btn btn-primary">
                {t('admin.reject.confirm', 'Confirm Rejection')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;