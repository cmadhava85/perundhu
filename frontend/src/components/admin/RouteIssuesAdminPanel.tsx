import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, Clock, XCircle, AlertTriangle, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import './RouteIssuesAdminPanel.css';

// Issue types matching backend
type IssueType = 
  | 'BUS_NOT_AVAILABLE'
  | 'WRONG_TIMING'
  | 'WRONG_SCHEDULE'
  | 'WRONG_STOPS'
  | 'WRONG_FARE'
  | 'ROUTE_CHANGED'
  | 'SERVICE_SUSPENDED'
  | 'OTHER';

type IssueStatus = 
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'CONFIRMED'
  | 'RESOLVED'
  | 'REJECTED'
  | 'DUPLICATE';

type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface RouteIssue {
  id: number;
  busId?: number;
  busName?: string;
  busNumber?: string;
  fromLocation?: string;
  toLocation?: string;
  issueType: IssueType;
  description?: string;
  suggestedDepartureTime?: string;
  suggestedArrivalTime?: string;
  lastTraveledDate?: string;
  status: IssueStatus;
  priority: IssuePriority;
  reportCount: number;
  adminNotes?: string;
  resolution?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
}

interface Statistics {
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  totalPending: number;
  highPriorityCount: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Admin panel for managing route issues reported by users
 */
const RouteIssuesAdminPanel: React.FC = () => {
  const { t } = useTranslation();
  const [issues, setIssues] = useState<RouteIssue[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'ALL'>('PENDING');
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | 'ALL'>('ALL');
  const [expandedIssueId, setExpandedIssueId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Resolution modal state
  const [resolutionModal, setResolutionModal] = useState<{
    isOpen: boolean;
    issue: RouteIssue | null;
    newStatus: IssueStatus;
  }>({ isOpen: false, issue: null, newStatus: 'RESOLVED' });
  const [resolutionText, setResolutionText] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/route-issues/admin/statistics`);
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  }, []);

  // Fetch issues based on filters
  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE}/api/v1/route-issues/admin/pending?page=0&size=100`;
      
      if (statusFilter === 'ALL') {
        // For "all", we need to fetch from a different endpoint or handle it
        // For now, fetch pending and high-priority combined
        const [pendingRes, highPriorityRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/route-issues/admin/pending?page=0&size=100`),
          fetch(`${API_BASE}/api/v1/route-issues/admin/high-priority`)
        ]);
        
        const pendingData = await pendingRes.json();
        const highPriorityData = await highPriorityRes.json();
        
        // Combine and deduplicate
        const allIssues = [...(pendingData.issues || [])];
        const pendingIds = new Set(allIssues.map((i: RouteIssue) => i.id));
        
        for (const issue of (highPriorityData.issues || [])) {
          if (!pendingIds.has(issue.id)) {
            allIssues.push(issue);
          }
        }
        
        setIssues(allIssues);
      } else {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch issues');
        }
        const data = await response.json();
        
        // Filter by status if not PENDING
        let filteredIssues = data.issues || [];
        if (statusFilter !== 'PENDING') {
          filteredIssues = filteredIssues.filter((i: RouteIssue) => i.status === statusFilter);
        }
        
        setIssues(filteredIssues);
      }
    } catch (err) {
      setError('Failed to load issues. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchIssues();
    fetchStatistics();
  }, [fetchIssues, fetchStatistics]);

  // Filter by priority
  const filteredIssues = priorityFilter === 'ALL' 
    ? issues 
    : issues.filter(i => i.priority === priorityFilter);

  // Update issue status
  const updateIssueStatus = async (issueId: number, newStatus: IssueStatus, resolution?: string, notes?: string) => {
    try {
      setActionLoading(issueId);
      
      const response = await fetch(`${API_BASE}/api/v1/route-issues/admin/${issueId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          resolution: resolution || null,
          adminNotes: notes || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setSuccessMessage(`Issue #${issueId} updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh data
      fetchIssues();
      fetchStatistics();
    } catch (err) {
      setError('Failed to update issue. Please try again.');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Quick actions
  const handleQuickAction = (issue: RouteIssue, action: 'review' | 'confirm' | 'reject' | 'resolve') => {
    switch (action) {
      case 'review':
        updateIssueStatus(issue.id, 'UNDER_REVIEW');
        break;
      case 'confirm':
        updateIssueStatus(issue.id, 'CONFIRMED');
        break;
      case 'reject':
        setResolutionModal({ isOpen: true, issue, newStatus: 'REJECTED' });
        break;
      case 'resolve':
        setResolutionModal({ isOpen: true, issue, newStatus: 'RESOLVED' });
        break;
    }
  };

  // Submit resolution
  const handleResolutionSubmit = () => {
    if (resolutionModal.issue) {
      updateIssueStatus(
        resolutionModal.issue.id, 
        resolutionModal.newStatus, 
        resolutionText, 
        adminNotes
      );
      setResolutionModal({ isOpen: false, issue: null, newStatus: 'RESOLVED' });
      setResolutionText('');
      setAdminNotes('');
    }
  };

  // Get issue type label
  const getIssueTypeLabel = (type: IssueType): string => {
    const labels: Record<IssueType, string> = {
      BUS_NOT_AVAILABLE: t('admin.issues.types.busNotAvailable', 'Bus Not Available'),
      WRONG_TIMING: t('admin.issues.types.wrongTiming', 'Wrong Timing'),
      WRONG_SCHEDULE: t('admin.issues.types.wrongSchedule', 'Wrong Schedule'),
      WRONG_STOPS: t('admin.issues.types.wrongStops', 'Wrong Stops'),
      WRONG_FARE: t('admin.issues.types.wrongFare', 'Wrong Fare'),
      ROUTE_CHANGED: t('admin.issues.types.routeChanged', 'Route Changed'),
      SERVICE_SUSPENDED: t('admin.issues.types.serviceSuspended', 'Service Suspended'),
      OTHER: t('admin.issues.types.other', 'Other')
    };
    return labels[type] || type;
  };

  // Get issue type icon
  const getIssueTypeIcon = (type: IssueType): string => {
    const icons: Record<IssueType, string> = {
      BUS_NOT_AVAILABLE: '🚫',
      WRONG_TIMING: '⏰',
      WRONG_SCHEDULE: '📅',
      WRONG_STOPS: '📍',
      WRONG_FARE: '💰',
      ROUTE_CHANGED: '🔄',
      SERVICE_SUSPENDED: '⚠️',
      OTHER: '❓'
    };
    return icons[type] || '📋';
  };

  // Get priority badge class
  const getPriorityClass = (priority: IssuePriority): string => {
    return `priority-badge priority-${priority.toLowerCase()}`;
  };

  // Get status badge class
  const getStatusClass = (status: IssueStatus): string => {
    return `status-badge status-${status.toLowerCase().replace('_', '-')}`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="route-issues-admin-panel">
      {/* Statistics Cards */}
      {statistics && (
        <div className="issues-stats-grid">
          <div className="stat-card stat-pending">
            <div className="stat-icon"><Clock size={24} /></div>
            <div className="stat-content">
              <div className="stat-value">{statistics.totalPending}</div>
              <div className="stat-label">{t('admin.issues.stats.pending', 'Pending')}</div>
            </div>
          </div>
          <div className="stat-card stat-high-priority">
            <div className="stat-icon"><AlertTriangle size={24} /></div>
            <div className="stat-content">
              <div className="stat-value">{statistics.highPriorityCount}</div>
              <div className="stat-label">{t('admin.issues.stats.highPriority', 'High Priority')}</div>
            </div>
          </div>
          <div className="stat-card stat-resolved">
            <div className="stat-icon"><CheckCircle size={24} /></div>
            <div className="stat-content">
              <div className="stat-value">{statistics.byStatus?.RESOLVED || 0}</div>
              <div className="stat-label">{t('admin.issues.stats.resolved', 'Resolved')}</div>
            </div>
          </div>
          <div className="stat-card stat-total">
            <div className="stat-icon"><AlertCircle size={24} /></div>
            <div className="stat-content">
              <div className="stat-value">
                {Object.values(statistics.byStatus || {}).reduce((a, b) => a + b, 0)}
              </div>
              <div className="stat-label">{t('admin.issues.stats.total', 'Total Issues')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="issues-filters">
        <div className="filter-group">
          <label>{t('admin.issues.filters.status', 'Status')}:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as IssueStatus | 'ALL')}
          >
            <option value="ALL">{t('admin.issues.filters.all', 'All')}</option>
            <option value="PENDING">{t('admin.issues.filters.pending', 'Pending')}</option>
            <option value="UNDER_REVIEW">{t('admin.issues.filters.underReview', 'Under Review')}</option>
            <option value="CONFIRMED">{t('admin.issues.filters.confirmed', 'Confirmed')}</option>
            <option value="RESOLVED">{t('admin.issues.filters.resolved', 'Resolved')}</option>
            <option value="REJECTED">{t('admin.issues.filters.rejected', 'Rejected')}</option>
          </select>
        </div>
        <div className="filter-group">
          <label>{t('admin.issues.filters.priority', 'Priority')}:</label>
          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value as IssuePriority | 'ALL')}
          >
            <option value="ALL">{t('admin.issues.filters.all', 'All')}</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">🟢 Low</option>
          </select>
        </div>
        <button className="refresh-btn" onClick={() => { fetchIssues(); fetchStatistics(); }}>
          🔄 {t('admin.issues.refresh', 'Refresh')}
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <CheckCircle size={18} />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <XCircle size={18} />
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t('admin.issues.loading', 'Loading issues...')}</p>
        </div>
      )}

      {/* Issues List */}
      {!loading && filteredIssues.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>{t('admin.issues.empty.title', 'No Issues Found')}</h3>
          <p>{t('admin.issues.empty.message', 'There are no issues matching your filters.')}</p>
        </div>
      )}

      {!loading && filteredIssues.length > 0 && (
        <div className="issues-list">
          {filteredIssues.map((issue) => (
            <div key={issue.id} className={`issue-card ${expandedIssueId === issue.id ? 'expanded' : ''}`}>
              {/* Issue Header */}
              <div className="issue-header" onClick={() => setExpandedIssueId(expandedIssueId === issue.id ? null : issue.id)}>
                <div className="issue-main-info">
                  <span className="issue-type-icon">{getIssueTypeIcon(issue.issueType)}</span>
                  <div className="issue-title">
                    <h4>{getIssueTypeLabel(issue.issueType)}</h4>
                    <span className="issue-route">
                      {issue.busNumber && <strong>#{issue.busNumber}</strong>}
                      {issue.fromLocation && issue.toLocation && (
                        <span> • {issue.fromLocation} → {issue.toLocation}</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="issue-meta">
                  <span className={getPriorityClass(issue.priority)}>{issue.priority}</span>
                  <span className={getStatusClass(issue.status)}>{issue.status.replace('_', ' ')}</span>
                  {issue.reportCount > 1 && (
                    <span className="report-count" title="Number of reports">
                      👥 {issue.reportCount}
                    </span>
                  )}
                  <span className="expand-icon">
                    {expandedIssueId === issue.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </span>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedIssueId === issue.id && (
                <div className="issue-details">
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>{t('admin.issues.details.bus', 'Bus')}:</label>
                      <span>{issue.busName || issue.busNumber || 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                      <label>{t('admin.issues.details.reported', 'Reported')}:</label>
                      <span>{formatDate(issue.createdAt)}</span>
                    </div>
                    {issue.suggestedDepartureTime && (
                      <div className="detail-item">
                        <label>{t('admin.issues.details.suggestedDeparture', 'Suggested Departure')}:</label>
                        <span>{issue.suggestedDepartureTime}</span>
                      </div>
                    )}
                    {issue.suggestedArrivalTime && (
                      <div className="detail-item">
                        <label>{t('admin.issues.details.suggestedArrival', 'Suggested Arrival')}:</label>
                        <span>{issue.suggestedArrivalTime}</span>
                      </div>
                    )}
                    {issue.lastTraveledDate && (
                      <div className="detail-item">
                        <label>{t('admin.issues.details.lastTraveled', 'Last Traveled')}:</label>
                        <span>{issue.lastTraveledDate}</span>
                      </div>
                    )}
                  </div>

                  {issue.description && (
                    <div className="description-section">
                      <label>{t('admin.issues.details.description', 'Description')}:</label>
                      <p>{issue.description}</p>
                    </div>
                  )}

                  {issue.adminNotes && (
                    <div className="admin-notes-section">
                      <label>{t('admin.issues.details.adminNotes', 'Admin Notes')}:</label>
                      <p>{issue.adminNotes}</p>
                    </div>
                  )}

                  {issue.resolution && (
                    <div className="resolution-section">
                      <label>{t('admin.issues.details.resolution', 'Resolution')}:</label>
                      <p>{issue.resolution}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {issue.status !== 'RESOLVED' && issue.status !== 'REJECTED' && (
                    <div className="issue-actions">
                      {issue.status === 'PENDING' && (
                        <>
                          <button 
                            className="action-btn review"
                            onClick={() => handleQuickAction(issue, 'review')}
                            disabled={actionLoading === issue.id}
                          >
                            <Eye size={16} />
                            {t('admin.issues.actions.review', 'Start Review')}
                          </button>
                          <button 
                            className="action-btn reject"
                            onClick={() => handleQuickAction(issue, 'reject')}
                            disabled={actionLoading === issue.id}
                          >
                            <XCircle size={16} />
                            {t('admin.issues.actions.reject', 'Reject')}
                          </button>
                        </>
                      )}
                      {issue.status === 'UNDER_REVIEW' && (
                        <>
                          <button 
                            className="action-btn confirm"
                            onClick={() => handleQuickAction(issue, 'confirm')}
                            disabled={actionLoading === issue.id}
                          >
                            <AlertCircle size={16} />
                            {t('admin.issues.actions.confirm', 'Confirm Issue')}
                          </button>
                          <button 
                            className="action-btn reject"
                            onClick={() => handleQuickAction(issue, 'reject')}
                            disabled={actionLoading === issue.id}
                          >
                            <XCircle size={16} />
                            {t('admin.issues.actions.reject', 'Reject')}
                          </button>
                        </>
                      )}
                      {issue.status === 'CONFIRMED' && (
                        <button 
                          className="action-btn resolve"
                          onClick={() => handleQuickAction(issue, 'resolve')}
                          disabled={actionLoading === issue.id}
                        >
                          <CheckCircle size={16} />
                          {t('admin.issues.actions.resolve', 'Mark Resolved')}
                        </button>
                      )}
                      {actionLoading === issue.id && <span className="action-loading">Processing...</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      {resolutionModal.isOpen && resolutionModal.issue && (
        <div className="modal-overlay" onClick={() => setResolutionModal({ isOpen: false, issue: null, newStatus: 'RESOLVED' })}>
          <div className="resolution-modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {resolutionModal.newStatus === 'RESOLVED' 
                ? t('admin.issues.modal.resolveTitle', 'Resolve Issue')
                : t('admin.issues.modal.rejectTitle', 'Reject Issue')}
            </h3>
            <p className="modal-subtitle">
              {getIssueTypeLabel(resolutionModal.issue.issueType)} - #{resolutionModal.issue.busNumber}
            </p>

            <div className="modal-field">
              <label>
                {resolutionModal.newStatus === 'RESOLVED' 
                  ? t('admin.issues.modal.resolution', 'Resolution (what was fixed)')
                  : t('admin.issues.modal.rejectReason', 'Rejection Reason')}
              </label>
              <textarea
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder={resolutionModal.newStatus === 'RESOLVED' 
                  ? 'e.g., Updated departure time to 06:30 AM based on new schedule'
                  : 'e.g., Unable to verify - bus schedule confirmed with operator'}
                rows={3}
              />
            </div>

            <div className="modal-field">
              <label>{t('admin.issues.modal.adminNotes', 'Internal Notes (optional)')}</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Any internal notes for the team..."
                rows={2}
              />
            </div>

            <div className="modal-actions">
              <button 
                className="modal-btn cancel"
                onClick={() => setResolutionModal({ isOpen: false, issue: null, newStatus: 'RESOLVED' })}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button 
                className={`modal-btn ${resolutionModal.newStatus === 'RESOLVED' ? 'resolve' : 'reject'}`}
                onClick={handleResolutionSubmit}
                disabled={!resolutionText.trim()}
              >
                {resolutionModal.newStatus === 'RESOLVED' 
                  ? t('admin.issues.modal.confirmResolve', 'Mark as Resolved')
                  : t('admin.issues.modal.confirmReject', 'Reject Issue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteIssuesAdminPanel;
