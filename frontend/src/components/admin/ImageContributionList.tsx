import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ImageContributionList.css';
import AdminService from '../../services/adminService';
import RejectModal from './RejectModal';
import type { ContributionStatus, ImageContribution } from '../../types/contributionTypes';

const ImageContributionList: React.FC = () => {
  const { t } = useTranslation();
  const [contributions, setContributions] = useState<ImageContribution[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<ContributionStatus | 'ALL'>('PENDING');
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [selectedContribution, setSelectedContribution] = useState<ImageContribution | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchContributions();
  }, [filter]);

  const fetchContributions = async () => {
    setLoading(true);
    try {
      let data;
      if (filter === 'PENDING') {
        data = await AdminService.getPendingImageContributions();
      } else {
        data = await AdminService.getImageContributions();
      }
      setContributions(filter === 'ALL' ? data : data.filter(c => c.status === filter));
      setLoading(false);
    } catch (_error) {
      // Failed to fetch image contributions
      setLoading(false);
    }
  };

  const handleApprove = async (id: string | number | undefined) => {
    if (id === undefined) return;
    try {
      await AdminService.approveImageContribution(Number(id));
      fetchContributions();
    } catch (_error) {
      // Failed to approve image contribution
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedContribution || selectedContribution.id === undefined) return;
    
    try {
      await AdminService.rejectImageContribution(Number(selectedContribution.id), reason);
      setRejectModalOpen(false);
      setSelectedContribution(null);
      fetchContributions();
    } catch (_error) {
      // Failed to reject image contribution
    }
  };

  const handleDelete = async (id: string | number | undefined) => {
    if (id === undefined) return;
    
    if (window.confirm(t('admin.confirm.deleteContribution', 'Are you sure you want to delete this contribution?'))) {
      try {
        await AdminService.deleteImageContribution(Number(id));
        fetchContributions();
      } catch (_error) {
        // Failed to delete image contribution
      }
    }
  };

  const openRejectModal = (contribution: ImageContribution) => {
    setSelectedContribution(contribution);
    setRejectModalOpen(true);
  };

  const openImagePreview = (imageUrl: string | undefined) => {
    if (imageUrl) {
      setPreviewImage(imageUrl);
    }
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
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
              <th>{t('admin.table.image', 'Image')}</th>
              <th>{t('admin.table.busNumber', 'Bus Number')}</th>
              <th>{t('admin.table.description', 'Description')}</th>
              <th>{t('admin.table.submissionDate', 'Submitted')}</th>
              <th>{t('admin.table.status', 'Status')}</th>
              <th>{t('admin.table.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {contributions.map((contribution) => (
              <tr key={contribution.id}>
                <td>{contribution.id}</td>
                <td>
                  <div className="thumbnail-container">
                    {contribution.imageUrl && (
                      <img 
                        src={contribution.imageUrl} 
                        alt="Bus" 
                        className="thumbnail"
                        onClick={() => openImagePreview(contribution.imageUrl)}
                        onError={(e) => {
                          console.error('Failed to load image:', contribution.imageUrl);
                          e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><text x="10" y="30" fill="red">Error</text></svg>';
                        }}
                      />
                    )}
                  </div>
                </td>
                <td>{contribution.busNumber || '-'}</td>
                <td>{contribution.description || '-'}</td>
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
                    <button 
                      className="btn btn-view"
                      onClick={() => openImagePreview(contribution.imageUrl)}
                      title={t('admin.button.view', 'View Image')}
                    >
                      👁️
                    </button>
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
          contribution={{
            id: selectedContribution.id,
            busNumber: selectedContribution.busNumber || '',
            fromLocationName: '',
            toLocationName: ''
          }}
          onReject={(reason) => handleReject(reason)}
          onClose={() => {
            setRejectModalOpen(false);
            setSelectedContribution(null);
          }}
        />
      )}

      {previewImage && (
        <div className="modal-overlay" onClick={closeImagePreview}>
          <div className="image-preview" onClick={e => e.stopPropagation()}>
            <img 
              src={previewImage} 
              alt="Preview" 
              onError={() => {
                console.error('Failed to load preview image:', previewImage);
              }}
            />
            <button className="close-button" onClick={closeImagePreview}>
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageContributionList;