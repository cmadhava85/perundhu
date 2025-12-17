import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, Clock, XCircle, AlertTriangle, Eye, ChevronDown, ChevronUp, MapPin, Bus, Info } from 'lucide-react';
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

interface BusDetails {
  id: number;
  busNumber?: string;
  busName?: string;
  departureTime?: string;
  arrivalTime?: string;
  fromLocation?: string;
  toLocation?: string;
  busType?: string;
  fare?: number;
  operator?: string;
  frequency?: string;
}

interface StopInfo {
  id: number;
  name?: string;
  locationId?: number;
  stopOrder?: number;
  arrivalTime?: string;
  departureTime?: string;
}

interface IssueDetails {
  issue: RouteIssue;
  currentBusDetails?: BusDetails | null;
  currentStops?: StopInfo[];
  busNotFound?: boolean;
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
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'ALL'>('ALL');
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

  // Apply Changes modal state
  const [applyChangesModal, setApplyChangesModal] = useState<{
    isOpen: boolean;
    issue: RouteIssue | null;
    busDetails: BusDetails | null;
  }>({ isOpen: false, issue: null, busDetails: null });
  const [updatedDepartureTime, setUpdatedDepartureTime] = useState('');
  const [updatedArrivalTime, setUpdatedArrivalTime] = useState('');
  const [applyingChanges, setApplyingChanges] = useState(false);

  // Issue details state (with bus info)
  const [issueDetails, setIssueDetails] = useState<IssueDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Helper to get auth headers - Use Basic auth for admin endpoints
  const getAuthHeaders = useCallback(() => {
    // Admin credentials - in production these should come from a secure source
    const username = localStorage.getItem('adminUsername') || 'admin';
    const password = localStorage.getItem('adminPassword') || 'admin123';
    const credentials = btoa(`${username}:${password}`);
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`
    };
  }, []);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/route-issues/admin/statistics`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  }, [getAuthHeaders]);

  // Fetch issue details with bus information
  const fetchIssueDetails = useCallback(async (issueId: number) => {
    try {
      setLoadingDetails(true);
      const response = await fetch(`${API_BASE}/api/v1/route-issues/admin/${issueId}/details`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setIssueDetails(data);
      }
    } catch (err) {
      console.error('Failed to fetch issue details:', err);
    } finally {
      setLoadingDetails(false);
    }
  }, [getAuthHeaders]);

  // Fetch issues based on filters
  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (statusFilter === 'ALL') {
        // Fetch all statuses
        const statuses: IssueStatus[] = ['PENDING', 'UNDER_REVIEW', 'CONFIRMED', 'RESOLVED', 'REJECTED'];
        const responses = await Promise.all(
          statuses.map(status => 
            fetch(`${API_BASE}/api/v1/route-issues/admin/by-status?status=${status}&page=0&size=100`, { 
              headers: getAuthHeaders() 
            })
          )
        );
        
        const allIssues: RouteIssue[] = [];
        for (const response of responses) {
          if (response.ok) {
            const data = await response.json();
            allIssues.push(...(data.issues || []));
          }
        }
        
        setIssues(allIssues);
      } else {
        // Fetch specific status
        const response = await fetch(
          `${API_BASE}/api/v1/route-issues/admin/by-status?status=${statusFilter}&page=0&size=100`,
          { headers: getAuthHeaders() }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch issues');
        }
        
        const data = await response.json();
        setIssues(data.issues || []);
      }
    } catch (err) {
      setError('Failed to load issues. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, getAuthHeaders]);

  useEffect(() => {
    fetchIssues();
    fetchStatistics();
  }, [fetchIssues, fetchStatistics]);

  // ESC key handler for modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (resolutionModal.isOpen) {
          setResolutionModal({ isOpen: false, issue: null, newStatus: 'RESOLVED' });
          setResolutionText('');
          setAdminNotes('');
        }
        if (applyChangesModal.isOpen) {
          setApplyChangesModal({ isOpen: false, issue: null, busDetails: null });
          setUpdatedDepartureTime('');
          setUpdatedArrivalTime('');
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [resolutionModal.isOpen, applyChangesModal.isOpen]);

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
        headers: getAuthHeaders(),
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

  // Open Apply Changes modal
  const handleApplyChanges = (issue: RouteIssue) => {
    const busDetails = issueDetails?.currentBusDetails || null;
    setApplyChangesModal({ isOpen: true, issue, busDetails });
    // Pre-fill with suggested times if available
    setUpdatedDepartureTime(issue.suggestedDepartureTime || busDetails?.departureTime || '');
    setUpdatedArrivalTime(issue.suggestedArrivalTime || busDetails?.arrivalTime || '');
  };

  // Apply changes to database
  const handleApplyChangesToDatabase = async () => {
    if (!applyChangesModal.issue || !applyChangesModal.busDetails) return;
    
    setApplyingChanges(true);
    try {
      // Update the bus timing in the database
      const response = await fetch(`${API_BASE}/api/v1/admin/buses/${applyChangesModal.busDetails.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          departureTime: updatedDepartureTime,
          arrivalTime: updatedArrivalTime
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update bus');
      }

      // Mark issue as resolved with auto-generated resolution
      const resolution = `Updated bus timings from ${applyChangesModal.busDetails.departureTime || 'N/A'} → ${updatedDepartureTime} (departure) and ${applyChangesModal.busDetails.arrivalTime || 'N/A'} → ${updatedArrivalTime} (arrival) based on user report`;
      
      await updateIssueStatus(
        applyChangesModal.issue.id,
        'RESOLVED',
        resolution,
        'Changes applied to database'
      );

      setSuccessMessage(`Successfully updated bus #${applyChangesModal.busDetails.busNumber} and resolved issue #${applyChangesModal.issue.id}`);
      setTimeout(() => setSuccessMessage(null), 5000);

      // Close modal and refresh
      setApplyChangesModal({ isOpen: false, issue: null, busDetails: null });
      setUpdatedDepartureTime('');
      setUpdatedArrivalTime('');
      
      // Refresh issue details
      if (expandedIssueId) {
        fetchIssueDetails(expandedIssueId);
      }
    } catch (err) {
      setError('Failed to apply changes. Please try again.');
      console.error(err);
    } finally {
      setApplyingChanges(false);
    }
  };

  // Get action guide based on issue type
  const getActionGuide = (type: IssueType, issue: RouteIssue, busDetails?: BusDetails | null) => {
    switch (type) {
      case 'WRONG_TIMING':
        return (
          <ul>
            <li>Verify the reported timing against official schedules</li>
            <li>Current: {busDetails?.departureTime || 'N/A'} → {busDetails?.arrivalTime || 'N/A'}</li>
            {issue.suggestedDepartureTime && <li>User suggests: {issue.suggestedDepartureTime} → {issue.suggestedArrivalTime || 'N/A'}</li>}
            <li>If verified, use <strong>Apply Changes & Resolve</strong> to update database automatically</li>
          </ul>
        );
      case 'WRONG_STOPS':
        return (
          <ul>
            <li>Review the current stops list above</li>
            <li>Cross-check with user's description about missing/incorrect stops</li>
            <li>Navigate to Route Admin Panel to add/remove/reorder stops</li>
            <li>Mark as Resolved after updating</li>
          </ul>
        );
      case 'BUS_NOT_AVAILABLE':
        return (
          <ul>
            <li>Verify if this bus is still operational</li>
            <li>Check with transport authority or multiple user reports</li>
            <li>If confirmed discontinued, archive this bus in Route Admin Panel</li>
            <li>Mark as Resolved with note about discontinuation</li>
          </ul>
        );
      case 'ROUTE_CHANGED':
        return (
          <ul>
            <li>Check if the route path has changed</li>
            <li>Review stops and verify against current route</li>
            <li>Update stops/route in Route Admin Panel if needed</li>
            <li>Mark as Resolved after updating route</li>
          </ul>
        );
      case 'WRONG_SCHEDULE':
        return (
          <ul>
            <li>Verify the operating days/schedule</li>
            <li>Update schedule information if incorrect</li>
            <li>Mark as Resolved after correction</li>
          </ul>
        );
      case 'SERVICE_SUSPENDED':
        return (
          <ul>
            <li>Confirm if service is temporarily suspended</li>
            <li>Add suspension note if confirmed</li>
            <li>Mark bus as inactive if long-term suspension</li>
          </ul>
        );
      default:
        return (
          <ul>
            <li>Review user description carefully</li>
            <li>Take appropriate action based on the reported issue</li>
            <li>Update relevant data in Route Admin Panel</li>
            <li>Mark as Resolved or Rejected with clear notes</li>
          </ul>
        );
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
              <div className="issue-header" onClick={() => {
                if (expandedIssueId === issue.id) {
                  setExpandedIssueId(null);
                  setIssueDetails(null);
                } else {
                  setExpandedIssueId(issue.id);
                  fetchIssueDetails(issue.id);
                }
              }}>
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
                  {/* Loading indicator for details */}
                  {loadingDetails && (
                    <div className="details-loading">
                      <div className="spinner small"></div>
                      <span>Loading bus details...</span>
                    </div>
                  )}

                  {/* Current Bus Details Section - Similar to Add Stops */}
                  {!loadingDetails && issueDetails?.currentBusDetails && (
                    <div className="bus-details-comparison">
                      <div className="comparison-header">
                        <Bus size={20} />
                        <h4>{t('admin.issues.currentBusInfo', 'Current Bus Information')}</h4>
                      </div>
                      
                      <div className="comparison-grid">
                        {/* Current System Column */}
                        <div className="comparison-column current-data">
                          <h5>📊 {t('admin.issues.currentSystem', 'Current System')}</h5>
                          <div className="data-card">
                                <div className="data-row">
                                  <span className="data-label">Bus Number:</span>
                                  <span className="data-value">#{issueDetails.currentBusDetails.busNumber}</span>
                                </div>
                                <div className="data-row">
                                  <span className="data-label">Bus Name:</span>
                                  <span className="data-value">{issueDetails.currentBusDetails.busName}</span>
                                </div>
                                <div className="data-row">
                                  <span className="data-label">Route:</span>
                                  <span className="data-value">
                                    {issueDetails.currentBusDetails.fromLocation} → {issueDetails.currentBusDetails.toLocation}
                                  </span>
                                </div>
                                <div className="data-row highlight-time">
                                  <span className="data-label">🟢 Departure Time:</span>
                                  <span className="data-value time-value">{issueDetails.currentBusDetails.departureTime || 'Not set'}</span>
                                </div>
                                <div className="data-row highlight-time">
                                  <span className="data-label">🔴 Arrival Time:</span>
                                  <span className="data-value time-value">{issueDetails.currentBusDetails.arrivalTime || 'Not set'}</span>
                                </div>
                                {issueDetails.currentBusDetails.fare && (
                                  <div className="data-row">
                                    <span className="data-label">Fare:</span>
                                    <span className="data-value">₹{issueDetails.currentBusDetails.fare}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Reported Issue Column */}
                            <div className="comparison-column reported-data">
                              <h5>🚨 {t('admin.issues.reportedIssue', 'Reported Issue')}</h5>
                              <div className="data-card">
                                <div className="data-row">
                                  <span className="data-label">Issue Type:</span>
                                  <span className="data-value issue-type-badge">
                                    {getIssueTypeIcon(issue.issueType)} {getIssueTypeLabel(issue.issueType)}
                                  </span>
                                </div>
                                <div className="data-row">
                                  <span className="data-label">Reported:</span>
                                  <span className="data-value">{formatDate(issue.createdAt)}</span>
                                </div>
                                {issue.suggestedDepartureTime && (
                                  <div className="data-row highlight-suggestion">
                                    <span className="data-label">⚡ Suggested Departure:</span>
                                    <span className="data-value suggested-time">{issue.suggestedDepartureTime}</span>
                                  </div>
                                )}
                                {issue.suggestedArrivalTime && (
                                  <div className="data-row highlight-suggestion">
                                    <span className="data-label">⚡ Suggested Arrival:</span>
                                    <span className="data-value suggested-time">{issue.suggestedArrivalTime}</span>
                                  </div>
                                )}
                                {issue.lastTraveledDate && (
                                  <div className="data-row">
                                    <span className="data-label">Last Traveled:</span>
                                    <span className="data-value">{issue.lastTraveledDate}</span>
                                  </div>
                                )}
                                {issue.reportCount > 1 && (
                                  <div className="data-row highlight-reports">
                                    <span className="data-label">👥 Reports:</span>
                                    <span className="data-value report-count-value">{issue.reportCount} users reported this</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                        {/* Current Stops */}
                        {issueDetails.currentStops && issueDetails.currentStops.length > 0 && (
                          <div className="stops-section">
                            <div className="stops-header">
                              <MapPin size={18} />
                              <h5>{t('admin.issues.currentStops', 'Route Stops')} ({issueDetails.currentStops.length})</h5>
                            </div>
                            <div className="stops-timeline">
                              {[...issueDetails.currentStops]
                                .sort((a, b) => {
                                  const timeA = a.departureTime || a.arrivalTime || '00:00';
                                  const timeB = b.departureTime || b.arrivalTime || '00:00';
                                  return timeA.localeCompare(timeB);
                                })
                                .map((stop, index) => (
                                <div key={stop.id || index} className="stop-item">
                                  <div className="stop-marker">
                                    <div className="stop-dot"></div>
                                    {index < issueDetails.currentStops!.length - 1 && <div className="stop-line"></div>}
                                  </div>
                                  <div className="stop-content">
                                    <span className="stop-order">#{index + 1}</span>
                                    <span className="stop-name">{stop.name || `Stop ${stop.locationId || index + 1}`}</span>
                                    {(stop.arrivalTime || stop.departureTime) && (
                                      <span className="stop-time">
                                        {stop.arrivalTime || stop.departureTime}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                  )}

                  {/* Bus not found warning */}
                  {!loadingDetails && issueDetails?.busNotFound && (
                    <div className="bus-not-found-warning">
                      <AlertTriangle size={18} />
                      <span>{t('admin.issues.busNotFound', 'Bus not found in system - may have been removed or ID is invalid')}</span>
                    </div>
                  )}

                  {/* User Description & Action Guide */}
                  <div className="description-action-section">
                    <div className="section-header">
                      <Info size={18} />
                      <h4>{t('admin.issues.userDescription', 'User Description & Suggested Action')}</h4>
                    </div>

                    {/* Suggested Times Display */}
                    {(issue.suggestedDepartureTime || issue.suggestedArrivalTime) && (
                      <div className="details-grid">
                        {issue.suggestedDepartureTime && (
                          <div className="detail-item">
                            <label>{t('admin.issues.details.suggestedDeparture', 'Suggested Departure')}:</label>
                            <span className="suggested-value">⚡ {issue.suggestedDepartureTime}</span>
                          </div>
                        )}
                        {issue.suggestedArrivalTime && (
                          <div className="detail-item">
                            <label>{t('admin.issues.details.suggestedArrival', 'Suggested Arrival')}:</label>
                            <span className="suggested-value">⚡ {issue.suggestedArrivalTime}</span>
                          </div>
                        )}
                        {issue.lastTraveledDate && (
                          <div className="detail-item">
                            <label>{t('admin.issues.details.lastTraveled', 'Last Traveled')}:</label>
                            <span>{issue.lastTraveledDate}</span>
                          </div>
                        )}
                      </div>
                    )}

                  {issue.description && (
                    <div className="user-description">
                      <label>💬 {t('admin.issues.description', 'User Report')}:</label>
                      <p className="description-text">{issue.description}</p>
                    </div>
                  )}

                  {/* Action Guide based on issue type */}
                  <div className="action-guide">
                    <label>✅ {t('admin.issues.suggestedAction', 'Suggested Action')}:</label>
                    <div className="action-steps">
                      {getActionGuide(issue.issueType, issue, issueDetails?.currentBusDetails)}
                    </div>
                  </div>
                </div>

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
                      {/* Apply Changes - for timing issues with suggestions */}
                      {(issue.issueType === 'WRONG_TIMING' || issue.issueType === 'WRONG_SCHEDULE') && 
                       (issue.suggestedDepartureTime || issue.suggestedArrivalTime) && 
                       issueDetails?.currentBusDetails && (
                        <button 
                          className="action-btn apply-changes"
                          onClick={() => handleApplyChanges(issue)}
                          disabled={actionLoading === issue.id}
                        >
                          <CheckCircle size={16} />
                          {t('admin.issues.actions.applyChanges', 'Apply Changes & Resolve')}
                        </button>
                      )}
                      
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

      {/* Apply Changes Modal */}
      {applyChangesModal.isOpen && applyChangesModal.issue && applyChangesModal.busDetails && (
        <div 
          className="modal-overlay" 
          onClick={() => {
            setApplyChangesModal({ isOpen: false, issue: null, busDetails: null });
            setUpdatedDepartureTime('');
            setUpdatedArrivalTime('');
          }}
        >
          <div className="apply-changes-modal" onClick={(e) => e.stopPropagation()}>
            <h3>✏️ Apply Changes to Database</h3>
            <p className="modal-subtitle">
              Update bus #{applyChangesModal.busDetails.busNumber} timings and resolve issue
            </p>

            <div className="timing-comparison">
              <div className="timing-row">
                <label>Current Departure Time:</label>
                <span className="current-value">{applyChangesModal.busDetails.departureTime || 'Not set'}</span>
              </div>
              <div className="timing-row">
                <label>New Departure Time:</label>
                <input
                  type="time"
                  value={updatedDepartureTime}
                  onChange={(e) => setUpdatedDepartureTime(e.target.value)}
                  className="time-input"
                />
              </div>
            </div>

            <div className="timing-comparison">
              <div className="timing-row">
                <label>Current Arrival Time:</label>
                <span className="current-value">{applyChangesModal.busDetails.arrivalTime || 'Not set'}</span>
              </div>
              <div className="timing-row">
                <label>New Arrival Time:</label>
                <input
                  type="time"
                  value={updatedArrivalTime}
                  onChange={(e) => setUpdatedArrivalTime(e.target.value)}
                  className="time-input"
                />
              </div>
            </div>

            <div className="modal-info">
              ℹ️ This will update the bus timings in the database and automatically mark the issue as resolved.
            </div>

            <div className="modal-actions">
              <button
                className="modal-btn cancel"
                onClick={() => {
                  setApplyChangesModal({ isOpen: false, issue: null, busDetails: null });
                  setUpdatedDepartureTime('');
                  setUpdatedArrivalTime('');
                }}
              >
                Cancel
              </button>
              <button
                className="modal-btn apply"
                onClick={handleApplyChangesToDatabase}
                disabled={applyingChanges || !updatedDepartureTime || !updatedArrivalTime}
              >
                {applyingChanges ? 'Applying...' : 'Apply Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {resolutionModal.isOpen && resolutionModal.issue && (
        <div 
          className="modal-overlay" 
          onClick={() => {
            setResolutionModal({ isOpen: false, issue: null, newStatus: 'RESOLVED' });
            setResolutionText('');
            setAdminNotes('');
          }}
        >
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
