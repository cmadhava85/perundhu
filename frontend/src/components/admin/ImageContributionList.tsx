import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './ImageContributionList.css';
import AdminService from '../../services/adminService';
import RejectModal from './RejectModal';
import type { ContributionStatus, ImageContribution } from '../../types/contributionTypes';

interface PaginatedResponse {
  data: ImageContribution[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  duration_ms?: number;
}

const ImageContributionList: React.FC = () => {
  const { t } = useTranslation();
  const [contributions, setContributions] = useState<ImageContribution[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // Default to PENDING to only show images that need approval
  const [filter, setFilter] = useState<ContributionStatus | 'ALL'>('PENDING');
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [selectedContribution, setSelectedContribution] = useState<ImageContribution | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [loadingTime, setLoadingTime] = useState<number>(0);
  
  // Lazy loading state for images
  const [loadedImageIds, setLoadedImageIds] = useState<Set<string>>(new Set());

  const fetchContributions = useCallback(async (page: number = 0) => {
    setLoading(true);
    const startTime = performance.now();
    try {
      let response: PaginatedResponse;
      
      // Call API with pagination parameters
      if (filter === 'PENDING') {
        const result = await AdminService.getPendingImageContributionsPaged?.(page, pageSize) ||
                       await AdminService.getPendingImageContributions();
        response = Array.isArray(result) 
          ? { data: result, total: result.length, page: 0, size: pageSize, totalPages: 1 }
          : result;
      } else if (filter === 'ALL') {
        const result = await AdminService.getImageContributionsPaged?.(page, pageSize) ||
                       await AdminService.getImageContributions();
        response = Array.isArray(result)
          ? { data: result, total: result.length, page: 0, size: pageSize, totalPages: 1 }
          : result;
      } else {
        const result = await AdminService.getImageContributionsPaged?.(page, pageSize) ||
                       await AdminService.getImageContributions();
        const data = Array.isArray(result) ? result : result.data;
        const filtered = data.filter((c: ImageContribution) => c.status === filter);
        response = {
          data: filtered,
          total: filtered.length,
          page: 0,
          size: pageSize,
          totalPages: Math.ceil(filtered.length / pageSize)
        };
      }
      
      setContributions(response.data);
      setTotalCount(response.total);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
      
      const duration = performance.now() - startTime;
      setLoadingTime(Math.round(duration));
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch image contributions:', error);
      setLoading(false);
    }
  }, [filter, pageSize]);

  useEffect(() => {
    setCurrentPage(0);
    fetchContributions(0);
  }, [filter, fetchContributions]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchContributions(newPage);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const handleApprove = async (id: string | number | undefined) => {
    if (id === undefined) return;
    try {
      await AdminService.approveImageContribution(Number(id));
      fetchContributions(currentPage);
    } catch (error) {
      console.error('Failed to approve image contribution:', error);
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedContribution || selectedContribution.id === undefined) return;
    
    try {
      await AdminService.rejectImageContribution(Number(selectedContribution.id), reason);
      setRejectModalOpen(false);
      setSelectedContribution(null);
      fetchContributions(currentPage);
    } catch (error) {
      console.error('Failed to reject image contribution:', error);
    }
  };

  const handleDelete = async (id: string | number | undefined) => {
    if (id === undefined) return;
    
    if (window.confirm(t('admin.confirm.deleteContribution', 'Are you sure you want to delete this contribution?'))) {
      try {
        await AdminService.deleteImageContribution(Number(id));
        fetchContributions(currentPage);
      } catch (error) {
        console.error('Failed to delete image contribution:', error);
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

  const markImageAsLoaded = (id: string) => {
    setLoadedImageIds(prev => new Set(prev).add(id));
  };

  if (loading && contributions.length === 0) {
    return <div className="loading">Loading...{loadingTime > 0 && ` (${loadingTime}ms)`}</div>;
  }

  return (
    <div>
      {filter === 'PENDING' && contributions.length > 0 && (
        <div className="info-banner">
          <span>⚠️ Showing {contributions.length} images pending approval</span>
        </div>
      )}
      
      <div className="filter-controls">
        <div className="filter-group">
          <span className="filter-label">{t('admin.filter.status', 'Status')}:</span>
          <select 
            className="filter-select" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as ContributionStatus | 'ALL')}
          >
            <option value="PENDING">{t('admin.filter.pending', 'Pending (Needs Approval)')}</option>
            <option value="ALL">{t('admin.filter.all', 'All')}</option>
            <option value="APPROVED">{t('admin.filter.approved', 'Approved')}</option>
            <option value="REJECTED">{t('admin.filter.rejected', 'Rejected')}</option>
          </select>
        </div>
        
        <div className="filter-group">
          <span className="filter-label">{t('admin.filter.pageSize', 'Page Size')}:</span>
          <select 
            className="filter-select" 
            value={pageSize} 
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        
        {loadingTime > 0 && (
          <div className="load-time-indicator">
            Loaded in {loadingTime}ms
          </div>
        )}
      </div>

      {contributions.length === 0 ? (
        <div className="empty-state">
          {t('admin.noContributions', 'No contributions found')}
        </div>
      ) : (
        <>
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
                          loading="lazy"
                          onClick={() => openImagePreview(contribution.imageUrl)}
                          onLoad={() => markImageAsLoaded(String(contribution.id))}
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
          
          {/* Pagination Controls */}
          <div className="pagination-controls">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="pagination-btn"
            >
              ← {t('admin.pagination.previous', 'Previous')}
            </button>
            
            <span className="pagination-info">
              {t('admin.pagination.page', 'Page')} {currentPage + 1} {t('admin.pagination.of', 'of')} {totalPages} 
              ({totalCount} {t('admin.pagination.total', 'total')})
            </span>
            
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="pagination-btn"
            >
              {t('admin.pagination.next', 'Next')} →
            </button>
          </div>
        </>
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
