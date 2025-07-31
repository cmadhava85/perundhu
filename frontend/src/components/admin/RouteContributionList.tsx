import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AdminService from '../../services/adminService';
import RejectModal from './RejectModal';
import type { ContributionStatus, RouteContribution } from '../../types/contributionTypes';

const RouteContributionList: React.FC = () => {
  const { t } = useTranslation();
  const [contributions, setContributions] = useState<RouteContribution[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<ContributionStatus | 'ALL'>('PENDING');
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [selectedContribution, setSelectedContribution] = useState<RouteContribution | null>(null);

  useEffect(() => {
    fetchContributions();
  }, [filter]);

  const fetchContributions = async () => {
    setLoading(true);
    try {
      let data;
      if (filter === 'PENDING') {
        data = await AdminService.getPendingRouteContributions();
      } else {
        data = await AdminService.getRouteContributions();
      }
      setContributions(filter === 'ALL' ? data : data.filter(c => c.status === filter));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching route contributions:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (id: string | number | undefined) => {
    if (id === undefined) return;
    try {
      await AdminService.approveRouteContribution(Number(id));
      fetchContributions(); // Refresh the list
    } catch (error) {
      console.error('Error approving contribution:', error);
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedContribution || selectedContribution.id === undefined) return;
    
    try {
      await AdminService.rejectRouteContribution(Number(selectedContribution.id), reason);
      setRejectModalOpen(false);
      setSelectedContribution(null);
      fetchContributions(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting contribution:', error);
    }
  };

  const handleDelete = async (id: string | number | undefined) => {
    if (id === undefined) return;
    
    if (window.confirm(t('admin.confirm.deleteContribution', 'Are you sure you want to delete this contribution?'))) {
      try {
        await AdminService.deleteRouteContribution(Number(id));
        fetchContributions(); // Refresh the list
      } catch (error) {
        console.error('Error deleting contribution:', error);
      }
    }
  };

  const openRejectModal = (contribution: RouteContribution) => {
    setSelectedContribution(contribution);
    setRejectModalOpen(true);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="filter-controls">
        <div className="filter-group">
          <span className="filter-label">{t('admin.filter.status', 'Status')}:</span>
          <select 
            className="filter-select" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as ContributionStatus | 'ALL')}
          >
            <option value="ALL">{t('admin.filter.all', 'All')}</option>
            <option value="PENDING">{t('admin.filter.pending', 'Pending')}</option>
            <option value="APPROVED">{t('admin.filter.approved', 'Approved')}</option>
            <option value="REJECTED">{t('admin.filter.rejected', 'Rejected')}</option>
          </select>
        </div>
      </div>

      {contributions.length === 0 ? (
        <div className="empty-state">
          {t('admin.noContributions', 'No contributions found')}
        </div>
      ) : (
        <table className="contribution-list">
          <thead>
            <tr>
              <th>{t('admin.table.id', 'ID')}</th>
              <th>{t('admin.table.busNumber', 'Bus Number')}</th>
              <th>{t('admin.table.route', 'Route')}</th>
              <th>{t('admin.table.submissionDate', 'Submitted')}</th>
              <th>{t('admin.table.status', 'Status')}</th>
              <th>{t('admin.table.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {contributions.map((contribution) => (
              <tr key={contribution.id}>
                <td>{contribution.id}</td>
                <td>{contribution.busNumber}</td>
                <td>{contribution.fromLocationName} to {contribution.toLocationName}</td>
                <td>{contribution.submissionDate ? new Date(contribution.submissionDate).toLocaleDateString() : 'N/A'}</td>
                <td>
                  {contribution.status && (
                    <span className={`status-badge ${contribution.status.toLowerCase()}`}>
                      {contribution.status}
                    </span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    {contribution.status === 'PENDING' && (
                      <>
                        <button 
                          className="btn btn-approve" 
                          onClick={() => handleApprove(contribution.id)}
                        >
                          {t('admin.button.approve', 'Approve')}
                        </button>
                        <button 
                          className="btn btn-reject"
                          onClick={() => openRejectModal(contribution)}
                        >
                          {t('admin.button.reject', 'Reject')}
                        </button>
                      </>
                    )}
                    <button 
                      className="btn btn-delete"
                      onClick={() => handleDelete(contribution.id)}
                    >
                      {t('admin.button.delete', 'Delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {rejectModalOpen && selectedContribution && (
        <RejectModal
          onClose={() => {
            setRejectModalOpen(false);
            setSelectedContribution(null);
          }}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default RouteContributionList;