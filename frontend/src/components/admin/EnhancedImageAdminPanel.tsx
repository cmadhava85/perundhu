import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download, 
  Clock, 
  AlertCircle,
  Loader2,
  Calendar,
  User,
  Filter,
  Search,
  Grid,
  List,
  MoreVertical,
  CheckSquare,
  Square,
  Trash2,
  RefreshCw,
  FileText,
  Users
} from 'lucide-react';
import AdminService from '../../services/adminService';
import type { ImageContribution, ContributionStatus } from '../../types/contributionTypes';
import './EnhancedImageAdminPanel.css';

interface EnhancedImageAdminPanelProps {
  className?: string;
}

interface FilterOptions {
  status: ContributionStatus[];
  dateRange: { start: string; end: string };
  submittedBy: string[];
  hasExtractedData: boolean | null;
  searchQuery: string;
}

interface BatchAction {
  type: 'approve' | 'reject' | 'delete';
  reason?: string;
}

const EnhancedImageAdminPanel: React.FC<EnhancedImageAdminPanelProps> = ({ className = '' }) => {
  const [contributions, setContributions] = useState<ImageContribution[]>([]);
  const [filteredContributions, setFilteredContributions] = useState<ImageContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [processingBatch, setProcessingBatch] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    dateRange: { start: '', end: '' },
    submittedBy: [],
    hasExtractedData: null,
    searchQuery: ''
  });

  // Modal states
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBatchModal, setBatchModal] = useState(false);
  const [batchAction, setBatchAction] = useState<BatchAction | null>(null);
  const [selectedContribution, setSelectedContribution] = useState<ImageContribution | null>(null);

  // Fetch contributions
  const fetchContributions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AdminService.getImageContributions();
      setContributions(data);
      setFilteredContributions(data);
    } catch (error) {
      console.error('Error fetching image contributions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...contributions];

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(c => c.status && filters.status.includes(c.status));
    }

    // Date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(c => 
        c.submissionDate && new Date(c.submissionDate) >= new Date(filters.dateRange.start)
      );
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(c => 
        c.submissionDate && new Date(c.submissionDate) <= new Date(filters.dateRange.end)
      );
    }

    // Submitted by filter
    if (filters.submittedBy.length > 0) {
      filtered = filtered.filter(c => c.submittedBy && filters.submittedBy.includes(c.submittedBy));
    }

    // Has extracted data filter
    if (filters.hasExtractedData !== null) {
      filtered = filtered.filter(c => 
        filters.hasExtractedData ? !!c.extractedData : !c.extractedData
      );
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.submittedBy?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query) ||
        c.extractedData?.toLowerCase().includes(query)
      );
    }

    setFilteredContributions(filtered);
  }, [contributions, filters]);

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredContributions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContributions.map(c => c.id!.toString())));
    }
  };

  // Individual actions
  const handleApprove = async (id: string) => {
    try {
      await AdminService.approveImageContribution(Number(id));
      await fetchContributions();
    } catch (error) {
      console.error('Error approving contribution:', error);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await AdminService.rejectImageContribution(Number(id), reason);
      await fetchContributions();
    } catch (error) {
      console.error('Error rejecting contribution:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await AdminService.deleteImageContribution(Number(id));
      await fetchContributions();
    } catch (error) {
      console.error('Error deleting contribution:', error);
    }
  };

  // Batch actions
  const executeBatchAction = async (action: BatchAction) => {
    if (selectedIds.size === 0) return;

    setProcessingBatch(true);
    try {
      const promises = Array.from(selectedIds).map(async (id) => {
        switch (action.type) {
          case 'approve':
            return AdminService.approveImageContribution(Number(id));
          case 'reject':
            return AdminService.rejectImageContribution(Number(id), action.reason || 'Batch rejection');
          case 'delete':
            return AdminService.deleteImageContribution(Number(id));
        }
      });

      await Promise.allSettled(promises);
      await fetchContributions();
      setSelectedIds(new Set());
      setBatchModal(false);
    } catch (error) {
      console.error('Error executing batch action:', error);
    } finally {
      setProcessingBatch(false);
    }
  };

  // Statistics
  const getStats = () => {
    const total = contributions.length;
    const pending = contributions.filter(c => c.status === 'PENDING').length;
    const approved = contributions.filter(c => c.status === 'APPROVED').length;
    const rejected = contributions.filter(c => c.status === 'REJECTED').length;
    const withData = contributions.filter(c => c.extractedData).length;

    return { total, pending, approved, rejected, withData };
  };

  // Effects
  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading image contributions...</span>
      </div>
    );
  }

  return (
    <div className={`enhanced-image-admin-panel ${className}`}>
      {/* Header */}
      <div className="admin-header">
        <div className="header-title">
          <h2 className="text-2xl font-bold text-gray-900">Image Contributions</h2>
          <div className="header-stats">
            <div className="stat-item">
              <Users className="w-4 h-4" />
              <span>{stats.total} Total</span>
            </div>
            <div className="stat-item">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span>{stats.pending} Pending</span>
            </div>
            <div className="stat-item">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>{stats.approved} Approved</span>
            </div>
            <div className="stat-item">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>{stats.rejected} Rejected</span>
            </div>
            <div className="stat-item">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>{stats.withData} With Data</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-btn ${showFilters ? 'active' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <div className="view-toggle">
            <button
              onClick={() => setViewMode('grid')}
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={fetchContributions}
            className="refresh-btn"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Search</label>
            <div className="search-input-wrapper">
              <Search className="w-4 h-4 search-icon" />
              <input
                type="text"
                placeholder="Search by user, description, or extracted data..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="search-input"
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <div className="status-filters">
              {(['PENDING', 'APPROVED', 'REJECTED'] as ContributionStatus[]).map(status => (
                <label key={status} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status)}
                    onChange={(e) => {
                      const newStatus = e.target.checked
                        ? [...filters.status, status]
                        : filters.status.filter(s => s !== status);
                      setFilters(prev => ({ ...prev, status: newStatus }));
                    }}
                  />
                  <span className={`status-badge ${status.toLowerCase()}`}>
                    {status}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Date Range</label>
            <div className="date-range">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="date-input"
              />
              <span className="date-separator">to</span>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="date-input"
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Data Status</label>
            <select
              value={filters.hasExtractedData === null ? '' : filters.hasExtractedData.toString()}
              onChange={(e) => {
                const value = e.target.value === '' ? null : e.target.value === 'true';
                setFilters(prev => ({ ...prev, hasExtractedData: value }));
              }}
              className="data-select"
            >
              <option value="">All</option>
              <option value="true">Has Extracted Data</option>
              <option value="false">No Extracted Data</option>
            </select>
          </div>

          <div className="filter-actions">
            <button
              onClick={() => setFilters({
                status: [],
                dateRange: { start: '', end: '' },
                submittedBy: [],
                hasExtractedData: null,
                searchQuery: ''
              })}
              className="clear-filters-btn"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Batch Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="batch-actions-bar">
          <div className="selected-count">
            <button onClick={selectAll} className="select-all-btn">
              {selectedIds.size === filteredContributions.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
            <span>{selectedIds.size} of {filteredContributions.length} selected</span>
          </div>

          <div className="batch-actions">
            <button
              onClick={() => {
                setBatchAction({ type: 'approve' });
                setBatchModal(true);
              }}
              className="batch-btn approve"
              disabled={processingBatch}
            >
              <CheckCircle className="w-4 h-4" />
              Approve Selected
            </button>

            <button
              onClick={() => {
                setBatchAction({ type: 'reject' });
                setBatchModal(true);
              }}
              className="batch-btn reject"
              disabled={processingBatch}
            >
              <XCircle className="w-4 h-4" />
              Reject Selected
            </button>

            <button
              onClick={() => {
                setBatchAction({ type: 'delete' });
                setBatchModal(true);
              }}
              className="batch-btn delete"
              disabled={processingBatch}
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Contributions Grid/List */}
      <div className={`contributions-container ${viewMode}`}>
        {filteredContributions.length === 0 ? (
          <div className="empty-state">
            <AlertCircle className="w-12 h-12 text-gray-400" />
            <h3>No contributions found</h3>
            <p>Try adjusting your filters or check back later for new submissions.</p>
          </div>
        ) : (
          filteredContributions.map((contribution) => (
            <ContributionCard
              key={contribution.id}
              contribution={contribution}
              viewMode={viewMode}
              isSelected={selectedIds.has(contribution.id!.toString())}
              onToggleSelect={() => toggleSelection(contribution.id!.toString())}
              onApprove={() => handleApprove(contribution.id!.toString())}
              onReject={(reason) => handleReject(contribution.id!.toString(), reason)}
              onDelete={() => handleDelete(contribution.id!.toString())}
              onPreview={(imageUrl) => setPreviewImage(imageUrl)}
            />
          ))
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="preview-modal" onClick={() => setPreviewImage(null)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="preview-close"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <img src={previewImage} alt="Full size preview" className="preview-image" />
          </div>
        </div>
      )}

      {/* Batch Action Modal */}
      {showBatchModal && batchAction && (
        <BatchActionModal
          action={batchAction}
          selectedCount={selectedIds.size}
          onConfirm={executeBatchAction}
          onCancel={() => {
            setBatchModal(false);
            setBatchAction(null);
          }}
          processing={processingBatch}
        />
      )}
    </div>
  );
};

// Contribution Card Component
interface ContributionCardProps {
  contribution: ImageContribution;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onToggleSelect: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onDelete: () => void;
  onPreview: (imageUrl: string) => void;
}

const ContributionCard: React.FC<ContributionCardProps> = ({
  contribution,
  viewMode,
  isSelected,
  onToggleSelect,
  onApprove,
  onReject,
  onDelete,
  onPreview
}) => {
  const [showActions, setShowActions] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      default: return 'status-unknown';
    }
  };

  const handleRejectSubmit = () => {
    if (rejectReason.trim()) {
      onReject(rejectReason);
      setShowRejectInput(false);
      setRejectReason('');
    }
  };

  return (
    <div className={`contribution-card ${isSelected ? 'selected' : ''}`}>
      <div className="card-header">
        <button
          onClick={onToggleSelect}
          className="select-checkbox"
        >
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-blue-600" />
          ) : (
            <Square className="w-5 h-5 text-gray-400" />
          )}
        </button>

        <span className={`status-badge ${getStatusColor(contribution.status || 'PENDING')}`}>
          {contribution.status || 'PENDING'}
        </span>

        <div className="card-actions">
          <button
            onClick={() => setShowActions(!showActions)}
            className="actions-toggle"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showActions && (
            <div className="actions-menu">
              <button onClick={() => contribution.imageUrl && onPreview(contribution.imageUrl)} className="action-item">
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button onClick={() => contribution.imageUrl && window.open(contribution.imageUrl, '_blank')} className="action-item">
                <Download className="w-4 h-4" />
                Download
              </button>
              {contribution.status === 'PENDING' && (
                <>
                  <button onClick={onApprove} className="action-item approve">
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button onClick={() => setShowRejectInput(true)} className="action-item reject">
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
              <button onClick={onDelete} className="action-item delete">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card-content">
        <div className="image-section">
          <img
            src={contribution.imageUrl}
            alt="Bus schedule"
            className="contribution-image"
            onClick={() => contribution.imageUrl && onPreview(contribution.imageUrl)}
          />
        </div>

        <div className="details-section">
          <h3 className="contribution-title">
            Contribution #{contribution.id?.toString().slice(-8)}
          </h3>

          <div className="meta-info">
            <div className="meta-item">
              <User className="w-4 h-4" />
              <span>{contribution.submittedBy}</span>
            </div>
            <div className="meta-item">
              <Calendar className="w-4 h-4" />
              <span>{contribution.submissionDate ? new Date(contribution.submissionDate).toLocaleDateString() : 'Unknown'}</span>
            </div>
          </div>

          {contribution.description && (
            <p className="description">{contribution.description}</p>
          )}

          {contribution.extractedData && (
            <div className="extracted-data">
              <h4 className="extracted-title">Extracted Data</h4>
              <div className="extracted-items">
                <div className="extracted-item">
                  <span className="label">Raw Data:</span>
                  <span className="value">{contribution.extractedData}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Input */}
      {showRejectInput && (
        <div className="reject-input-section">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="reject-textarea"
          />
          <div className="reject-actions">
            <button onClick={handleRejectSubmit} className="reject-submit">
              Reject
            </button>
            <button onClick={() => setShowRejectInput(false)} className="reject-cancel">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Batch Action Modal Component
interface BatchActionModalProps {
  action: BatchAction;
  selectedCount: number;
  onConfirm: (action: BatchAction) => void;
  onCancel: () => void;
  processing: boolean;
}

const BatchActionModal: React.FC<BatchActionModalProps> = ({
  action,
  selectedCount,
  onConfirm,
  onCancel,
  processing
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (action.type === 'reject' && !reason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    onConfirm({ ...action, reason: reason.trim() || undefined });
  };

  const getActionText = () => {
    switch (action.type) {
      case 'approve': return 'approve';
      case 'reject': return 'reject';
      case 'delete': return 'delete';
    }
  };

  return (
    <div className="batch-modal-overlay">
      <div className="batch-modal">
        <h3 className="batch-modal-title">
          Confirm Batch {getActionText().charAt(0).toUpperCase() + getActionText().slice(1)}
        </h3>
        
        <p className="batch-modal-message">
          Are you sure you want to {getActionText()} {selectedCount} selected contribution{selectedCount !== 1 ? 's' : ''}?
        </p>

        {action.type === 'reject' && (
          <div className="batch-reason-input">
            <label htmlFor="batchReason">Rejection Reason</label>
            <textarea
              id="batchReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for batch rejection..."
              className="batch-reason-textarea"
            />
          </div>
        )}

        <div className="batch-modal-actions">
          <button
            onClick={onCancel}
            className="batch-modal-cancel"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`batch-modal-confirm ${action.type}`}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              `${getActionText().charAt(0).toUpperCase() + getActionText().slice(1)} ${selectedCount} Item${selectedCount !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedImageAdminPanel;