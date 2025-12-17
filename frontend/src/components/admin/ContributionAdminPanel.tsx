import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Search,
  Download,
  MapPin,
  Bus,
  User,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import type { RouteContribution } from '../../types/contributionTypes';
import AuthService from '../../services/authService';
import AdminService from '../../services/adminService';
import './ContributionAdminPanel.css';

interface AdminStats {
  totalContributions: number;
  pendingContributions: number;
  approvedContributions: number;
  rejectedContributions: number;
  totalRouteContributions: number;
  totalImageContributions: number;
}

interface ContributionWithType extends RouteContribution {
  type: 'route' | 'image';
  submittedBy?: string;
  imageUrl?: string;
  description?: string;
}

const ContributionAdminPanel: React.FC = () => {
  const [contributions, setContributions] = useState<ContributionWithType[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContribution, setSelectedContribution] = useState<ContributionWithType | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'route' | 'image'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (AuthService.isAdmin() || AuthService.isModerator()) {
        try {
          setLoading(true);
          const response = await fetch('/api/v1/admin/contributions', {
            headers: {
              'Authorization': AdminService.getAuthHeader(),
              'Content-Type': 'application/json'
            }
          });

          if (response.ok && isMounted) {
            const data = await response.json();
            setContributions(data);
          }
        } catch (_error) {
          // Failed to fetch contributions
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }

        // Fetch stats
        try {
          const statsResponse = await fetch('/api/v1/contributions/statistics', {
            headers: {
              'Authorization': AdminService.getAuthHeader(),
              'Content-Type': 'application/json'
            }
          });

          if (statsResponse.ok && isMounted) {
            const statsData = await statsResponse.json();
            setStats(statsData);
          }
        } catch (_error) {
          // Failed to fetch stats
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [filter, typeFilter]);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/contributions', {
        headers: {
          'Authorization': AdminService.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContributions(data);
      }
    } catch (_error) {
      // Failed to fetch contributions
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/contributions/statistics', {
        headers: {
          'Authorization': AdminService.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (_error) {
      // Failed to fetch stats
    }
  };

  const handleApprove = async (contributionId: string, type: 'route' | 'image') => {
    setActionLoading(true);
    try {
      const endpoint = type === 'route' 
        ? `/api/v1/admin/contributions/routes/${contributionId}/approve`
        : `/api/v1/admin/contributions/images/${contributionId}/approve`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': AdminService.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchContributions();
        await fetchStats();
        setShowModal(false);
        setSelectedContribution(null);
      }
    } catch (_error) {
      // Failed to approve contribution
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (contributionId: string, type: 'route' | 'image', reason: string) => {
    setActionLoading(true);
    try {
      const endpoint = type === 'route' 
        ? `/api/v1/admin/contributions/routes/${contributionId}/reject`
        : `/api/v1/admin/contributions/images/${contributionId}/reject`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': AdminService.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        await fetchContributions();
        await fetchStats();
        setShowModal(false);
        setSelectedContribution(null);
      }
    } catch (_error) {
      // Failed to reject contribution
    } finally {
      setActionLoading(false);
    }
  };

  const filteredContributions = contributions.filter(contribution => {
    const matchesStatus = filter === 'all' || contribution.status === filter.toUpperCase();
    const matchesType = typeFilter === 'all' || contribution.type === typeFilter;
    const matchesSearch = searchTerm === '' || 
      contribution.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contribution.fromLocationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contribution.toLocationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contribution.submittedBy?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesType && matchesSearch;
  });

  const exportContributions = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "ID,Type,Status,Bus Number,From,To,Submitted By,Submission Date\n" +
      filteredContributions.map(c => 
        `${c.id},${c.type},${c.status},${c.busNumber || ''},${c.fromLocationName || ''},${c.toLocationName || ''},${c.submittedBy || ''},${c.submissionDate}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "contributions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!AuthService.isAdmin() && !AuthService.isModerator()) {
    return (
      <div className="admin-panel">
        <div className="unauthorized">
          <AlertTriangle size={48} />
          <h2>Unauthorized Access</h2>
          <p>You don't have permission to access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Contribution Management</h1>
        <p>Review and manage user contributions to the bus route database</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">
              <Bus />
            </div>
            <div className="stat-content">
              <h3>{stats.totalContributions}</h3>
              <p>Total Contributions</p>
            </div>
          </div>
          
          <div className="stat-card pending">
            <div className="stat-icon">
              <Clock />
            </div>
            <div className="stat-content">
              <h3>{stats.pendingContributions}</h3>
              <p>Pending Review</p>
            </div>
          </div>
          
          <div className="stat-card approved">
            <div className="stat-icon">
              <CheckCircle />
            </div>
            <div className="stat-content">
              <h3>{stats.approvedContributions}</h3>
              <p>Approved</p>
            </div>
          </div>
          
          <div className="stat-card rejected">
            <div className="stat-icon">
              <XCircle />
            </div>
            <div className="stat-content">
              <h3>{stats.rejectedContributions}</h3>
              <p>Rejected</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="admin-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by bus number, location, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filters">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'route' | 'image')}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="route">Route Data</option>
            <option value="image">Image Upload</option>
          </select>
          
          <button onClick={exportContributions} className="export-btn">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Contributions Table */}
      <div className="contributions-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading contributions...</p>
          </div>
        ) : (
          <table className="contributions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Bus Info</th>
                <th>Route</th>
                <th>Submitted By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContributions.map((contribution) => (
                <tr key={contribution.id} className={`contribution-row ${contribution.status?.toLowerCase()}`}>
                  <td className="id-cell">#{contribution.id?.toString().slice(-6)}</td>
                  <td>
                    <span className={`type-badge ${contribution.type}`}>
                      {contribution.type === 'route' ? <Bus size={14} /> : <MapPin size={14} />}
                      {contribution.type}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${contribution.status?.toLowerCase()}`}>
                      {contribution.status === 'PENDING' && <Clock size={14} />}
                      {contribution.status === 'APPROVED' && <CheckCircle size={14} />}
                      {contribution.status === 'REJECTED' && <XCircle size={14} />}
                      {contribution.status}
                    </span>
                  </td>
                  <td className="bus-info">
                    <div className="bus-number">{contribution.busNumber || 'N/A'}</div>
                    <div className="bus-name">{contribution.busName || ''}</div>
                  </td>
                  <td className="route-info">
                    <div className="route-text">
                      {contribution.fromLocationName} → {contribution.toLocationName}
                    </div>
                    {contribution.departureTime && contribution.arrivalTime && (
                      <div className="timing">
                        {contribution.departureTime} - {contribution.arrivalTime}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="user-info">
                      <User size={14} />
                      {contribution.submittedBy || 'Anonymous'}
                    </div>
                  </td>
                  <td>
                    <div className="date-info">
                      <Calendar size={14} />
                      {new Date(contribution.submissionDate!).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedContribution(contribution);
                        setShowModal(true);
                      }}
                      className="view-btn"
                    >
                      <Eye size={16} />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {!loading && filteredContributions.length === 0 && (
          <div className="empty-state">
            <Bus size={48} />
            <h3>No contributions found</h3>
            <p>Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showModal && selectedContribution && (
        <ContributionReviewModal
          contribution={selectedContribution}
          onApprove={(id, type) => handleApprove(id, type)}
          onReject={(id, type, reason) => handleReject(id, type, reason)}
          onClose={() => {
            setShowModal(false);
            setSelectedContribution(null);
          }}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

// Review Modal Component
interface ReviewModalProps {
  contribution: ContributionWithType;
  onApprove: (id: string, type: 'route' | 'image') => void;
  onReject: (id: string, type: 'route' | 'image', reason: string) => void;
  onClose: () => void;
  loading: boolean;
}

const ContributionReviewModal: React.FC<ReviewModalProps> = ({
  contribution,
  onApprove,
  onReject,
  onClose,
  loading
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(contribution.id!.toString(), contribution.type, rejectReason);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="review-modal">
        <div className="modal-header">
          <h2>Review Contribution</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="modal-content">
          <div className="contribution-details">
            <div className="detail-group">
              <label>Type:</label>
              <span className={`type-badge ${contribution.type}`}>
                {contribution.type}
              </span>
            </div>
            
            <div className="detail-group">
              <label>Status:</label>
              <span className={`status-badge ${contribution.status?.toLowerCase()}`}>
                {contribution.status}
              </span>
            </div>
            
            <div className="detail-group">
              <label>Bus Number:</label>
              <span>{contribution.busNumber || 'N/A'}</span>
            </div>
            
            <div className="detail-group">
              <label>Route:</label>
              <span>{contribution.fromLocationName} → {contribution.toLocationName}</span>
            </div>
            
            {contribution.departureTime && (
              <div className="detail-group">
                <label>Timing:</label>
                <span>{contribution.departureTime} - {contribution.arrivalTime}</span>
              </div>
            )}
            
            <div className="detail-group">
              <label>Submitted By:</label>
              <span>{contribution.submittedBy || 'Anonymous'}</span>
            </div>
            
            <div className="detail-group">
              <label>Submission Date:</label>
              <span>{new Date(contribution.submissionDate!).toLocaleString()}</span>
            </div>
            
            {contribution.additionalNotes && (
              <div className="detail-group">
                <label>Notes:</label>
                <span>{contribution.additionalNotes}</span>
              </div>
            )}
            
            {contribution.validationMessage && (
              <div className="detail-group">
                <label>Validation Message:</label>
                <span className="validation-message">{contribution.validationMessage}</span>
              </div>
            )}
          </div>
          
          {!showRejectForm ? (
            <div className="modal-actions">
              {contribution.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => onApprove(contribution.id!.toString(), contribution.type)}
                    className="approve-btn"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="reject-btn"
                    disabled={loading}
                  >
                    Reject
                  </button>
                </>
              )}
              <button onClick={onClose} className="cancel-btn">
                Close
              </button>
            </div>
          ) : (
            <div className="reject-form">
              <label htmlFor="rejectReason">Rejection Reason:</label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows={4}
              />
              <div className="reject-actions">
                <button
                  onClick={handleReject}
                  className="confirm-reject-btn"
                  disabled={loading || !rejectReason.trim()}
                >
                  {loading ? 'Processing...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContributionAdminPanel;