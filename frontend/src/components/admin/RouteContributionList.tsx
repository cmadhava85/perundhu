import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './RouteContributionList.css';
import RejectModal from './RejectModal';
import type { RouteContribution } from '../../types/contributionTypes';
import AdminService from '../../services/adminService';

/**
 * Component for displaying and managing route contributions
 */
const RouteContributionList: React.FC = () => {
  const { t } = useTranslation();
  const [contributions, setContributions] = useState<RouteContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState<RouteContribution | null>(null);
  const [retryingId, setRetryingId] = useState<number | null>(null);
  
  // Load contributions on component mount
  useEffect(() => {
    loadContributions();
  }, [statusFilter]);

  // Function to load contributions based on status filter
  const loadContributions = async () => {
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
        data = data.filter((c: RouteContribution) => c.status?.toLowerCase() === statusFilter);
      }
      
      setContributions(data);
      setError(null);
    } catch (err) {
      setError('Failed to load route contributions. Please try again later.');
      console.error('Error loading contributions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle contribution approval
  const handleApprove = async (id: number | undefined) => {
    if (!id) return;
    try {
      setLoading(true);
      await AdminService.approveRouteContribution(id);
      
      // Reload contributions to get updated list
      await loadContributions();
    } catch (err) {
      setError('Failed to approve contribution. Please try again.');
      console.error('Error approving contribution:', err);
      setLoading(false);
    }
  };

  // Open reject modal with selected contribution
  const handleOpenRejectModal = (contribution: RouteContribution) => {
    setSelectedContribution(contribution);
    setRejectModalOpen(true);
  };

  // Handle contribution rejection
  const handleReject = async (reason: string) => {
    if (!selectedContribution?.id) return;
    try {
      setLoading(true);
      await AdminService.rejectRouteContribution(selectedContribution.id, reason);
      
      // Close the modal and reload contributions
      setRejectModalOpen(false);
      setSelectedContribution(null);
      await loadContributions();
    } catch (err) {
      setError('Failed to reject contribution. Please try again.');
      console.error('Error rejecting contribution:', err);
      setLoading(false);
    }
  };

  // Handle contribution deletion
  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    if (window.confirm(t('admin.contributions.deleteConfirm', 'Are you sure you want to delete this contribution? This action cannot be undone.'))) {
      try {
        setLoading(true);
        await AdminService.deleteRouteContribution(id);
        
        // Reload contributions to get updated list
        await loadContributions();
      } catch (err) {
        setError('Failed to delete contribution. Please try again.');
        console.error('Error deleting contribution:', err);
        setLoading(false);
      }
    }
  };

  // Handle retry for failed integrations
  const handleRetry = async (id: number | undefined) => {
    if (!id) return;
    try {
      setRetryingId(id);
      setError(null);
      await AdminService.retryIntegration(id);
      
      // Reload contributions to get updated list
      await loadContributions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry integration';
      setError(errorMessage);
      console.error('Error retrying integration:', err);
    } finally {
      setRetryingId(null);
    }
  };

  // Close the reject modal
  const handleCloseRejectModal = () => {
    setRejectModalOpen(false);
    setSelectedContribution(null);
  };

  // Get appropriate CSS class for status
  const getStatusClass = (status?: string) => {
    if (!status) return 'status-badge';
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-badge pending';
      case 'approved':
        return 'status-badge approved';
      case 'rejected':
        return 'status-badge rejected';
      case 'integration_failed':
        return 'status-badge integration-failed';
      case 'pending_review':
        return 'status-badge pending-review';
      case 'integrated':
        return 'status-badge integrated';
      default:
        return 'status-badge';
    }
  };

  // Get row class for styling
  const getRowClass = (status?: string) => {
    if (!status) return '';
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'integration_failed':
        return 'status-integration-failed';
      case 'pending_review':
        return 'status-pending-review';
      case 'integrated':
        return 'status-integrated';
      default:
        return '';
    }
  };

  return (
    <div className="route-contribution-list">
      <div className="filter-controls">
        <div className="filter-group">
          <span className="filter-label">{t('admin.contributions.filterBy', 'Filter by:')}</span>
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('admin.contributions.statusAll', 'All')}</option>
            <option value="pending">{t('admin.contributions.statusPending', 'Pending')}</option>
            <option value="approved">{t('admin.contributions.statusApproved', 'Approved')}</option>
            <option value="rejected">{t('admin.contributions.statusRejected', 'Rejected')}</option>
            <option value="integration_failed">{t('admin.contributions.statusIntegrationFailed', 'Integration Failed')}</option>
            <option value="pending_review">{t('admin.contributions.statusPendingReview', 'Pending Review')}</option>
            <option value="integrated">{t('admin.contributions.statusIntegrated', 'Integrated')}</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">{t('admin.contributions.loading', 'Loading contributions...')}</div>
      ) : contributions.length > 0 ? (
        <table className="contribution-table">
          <thead>
            <tr>
              <th>{t('admin.contributions.id', 'ID')}</th>
              <th>{t('admin.contributions.busNumber', 'Bus Number')}</th>
              <th>{t('admin.contributions.fromLocation', 'From')}</th>
              <th>{t('admin.contributions.toLocation', 'To')}</th>
              <th>{t('admin.contributions.submittedBy', 'Submitted By')}</th>
              <th>{t('admin.contributions.submissionDate', 'Date')}</th>
              <th>{t('admin.contributions.status', 'Status')}</th>
              <th>{t('admin.contributions.errorDetails', 'Error/Notes')}</th>
              <th>{t('admin.contributions.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {contributions.map(contribution => (
              <tr key={contribution.id} className={getRowClass(contribution.status)}>
                <td>{contribution.id}</td>
                <td>{contribution.busNumber}</td>
                <td>{contribution.fromLocationName}</td>
                <td>{contribution.toLocationName}</td>
                <td>{contribution.submittedBy || 'Anonymous'}</td>
                <td>{contribution.submissionDate ? new Date(contribution.submissionDate).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <span className={getStatusClass(contribution.status)}>
                    {contribution.status}
                  </span>
                </td>
                <td className="validation-message-cell">
                  {contribution.validationMessage ? (
                    <span className="validation-message" title={contribution.validationMessage}>
                      ⚠️ {contribution.validationMessage.length > 50 
                        ? `${contribution.validationMessage.substring(0, 50)}...` 
                        : contribution.validationMessage}
                    </span>
                  ) : '-'}
                </td>
                <td>
                  <div className="action-buttons">
                    {contribution.status?.toLowerCase() === 'pending' && (
                      <>
                        <button 
                          className="btn btn-approve"
                          onClick={() => contribution.id && handleApprove(contribution.id)}
                        >
                          {t('admin.contributions.approve', 'Approve')}
                        </button>
                        <button 
                          className="btn btn-reject"
                          onClick={() => handleOpenRejectModal(contribution)}
                        >
                          {t('admin.contributions.reject', 'Reject')}
                        </button>
                      </>
                    )}
                    {(contribution.status?.toLowerCase() === 'integration_failed' || 
                      contribution.status?.toLowerCase() === 'pending_review' ||
                      contribution.status?.toLowerCase() === 'approved') && (
                      <button 
                        className="btn btn-retry"
                        onClick={() => contribution.id && handleRetry(contribution.id)}
                        disabled={retryingId === contribution.id}
                      >
                        {retryingId === contribution.id 
                          ? t('admin.contributions.retrying', 'Retrying...') 
                          : t('admin.contributions.retry', 'Retry Integration')}
                      </button>
                    )}
                    <button 
                      className="btn btn-view"
                      onClick={() => alert('View details - To be implemented')}
                    >
                      {t('admin.contributions.view', 'View')}
                    </button>
                    <button 
                      className="btn btn-delete"
                      onClick={() => contribution.id && handleDelete(contribution.id)}
                    >
                      {t('admin.contributions.delete', 'Delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">
          {t('admin.contributions.noContributions', 'No route contributions found.')}
        </div>
      )}

      {rejectModalOpen && selectedContribution && (
        <RejectModal
          contribution={selectedContribution}
          onReject={handleReject}
          onClose={handleCloseRejectModal}
        />
      )}
    </div>
  );
};

export default RouteContributionList;