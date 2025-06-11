import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface RejectModalProps {
  onClose: () => void;
  onReject: (reason: string) => void;
}

const RejectModal: React.FC<RejectModalProps> = ({ onClose, onReject }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(t('admin.error.reasonRequired', 'Rejection reason is required'));
      return;
    }
    onReject(reason);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('admin.modal.rejectTitle', 'Reject Contribution')}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="reason" className="form-label">
                {t('admin.modal.reasonLabel', 'Reason for rejection')}:
              </label>
              <textarea
                id="reason"
                className="form-textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('admin.modal.reasonPlaceholder', 'Please provide a reason for rejecting this contribution...')}
                rows={4}
              />
              {error && <div className="form-error">{error}</div>}
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn" 
              onClick={onClose}
            >
              {t('admin.button.cancel', 'Cancel')}
            </button>
            <button 
              type="submit" 
              className="btn btn-reject"
            >
              {t('admin.button.reject', 'Reject')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectModal;