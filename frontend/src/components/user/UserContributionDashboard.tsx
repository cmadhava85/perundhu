import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Bus, 
  MapPin, 
  Calendar,
  TrendingUp,
  Award,
  FileText,
  Eye
} from 'lucide-react';
import type { RouteContribution } from '../../types/contributionTypes';
import AuthService from '../../services/authService';
import './UserContributionDashboard.css';

interface UserStats {
  totalContributions: number;
  approvedContributions: number;
  pendingContributions: number;
  rejectedContributions: number;
  recentActivity: number;
}

interface ContributionSummary extends RouteContribution {
  type: 'route' | 'image';
  lastUpdated?: string;
}

const UserContributionDashboard: React.FC = () => {
  const [contributions, setContributions] = useState<ContributionSummary[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContribution, setSelectedContribution] = useState<ContributionSummary | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      fetchUserContributions();
    }
  }, []);

  const fetchUserContributions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/contributions/status', {
        headers: {
          'Authorization': `Bearer ${AuthService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContributions(data);
        calculateStats(data);
      } else {
        console.error('Failed to fetch user contributions');
      }
    } catch (error) {
      console.error('Error fetching user contributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (contributionData: ContributionSummary[]) => {
    const total = contributionData.length;
    const approved = contributionData.filter(c => c.status === 'APPROVED').length;
    const pending = contributionData.filter(c => c.status === 'PENDING').length;
    const rejected = contributionData.filter(c => c.status === 'REJECTED').length;
    
    // Calculate recent activity (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recent = contributionData.filter(c => 
      new Date(c.submissionDate!) > oneWeekAgo
    ).length;

    setStats({
      totalContributions: total,
      approvedContributions: approved,
      pendingContributions: pending,
      rejectedContributions: rejected,
      recentActivity: recent
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock size={16} className="status-icon pending" />;
      case 'APPROVED':
        return <CheckCircle size={16} className="status-icon approved" />;
      case 'REJECTED':
        return <XCircle size={16} className="status-icon rejected" />;
      default:
        return <Clock size={16} className="status-icon" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Under Review';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  const calculateApprovalRate = () => {
    if (!stats || stats.totalContributions === 0) return 0;
    return Math.round((stats.approvedContributions / stats.totalContributions) * 100);
  };

  if (!AuthService.isAuthenticated()) {
    return (
      <div className="user-dashboard">
        <div className="auth-required">
          <Bus size={48} />
          <h2>Authentication Required</h2>
          <p>Please log in to view your contribution history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h1>My Contributions</h1>
        <p>Track your submissions and contribution history</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-overview">
          <div className="stat-card primary">
            <div className="stat-icon">
              <FileText />
            </div>
            <div className="stat-content">
              <h3>{stats.totalContributions}</h3>
              <p>Total Contributions</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <CheckCircle />
            </div>
            <div className="stat-content">
              <h3>{stats.approvedContributions}</h3>
              <p>Approved</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              <Clock />
            </div>
            <div className="stat-content">
              <h3>{stats.pendingContributions}</h3>
              <p>Under Review</p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">
              <TrendingUp />
            </div>
            <div className="stat-content">
              <h3>{stats.recentActivity}</h3>
              <p>This Week</p>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Section */}
      {stats && stats.totalContributions > 0 && (
        <div className="achievement-section">
          <div className="achievement-card">
            <div className="achievement-icon">
              <Award />
            </div>
            <div className="achievement-content">
              <h3>Approval Rate</h3>
              <div className="approval-rate">
                <span className="rate-number">{calculateApprovalRate()}%</span>
                <div className="rate-bar">
                  <div 
                    className="rate-fill" 
                    style={{ width: `${calculateApprovalRate()}%` }}
                  ></div>
                </div>
              </div>
              <p>
                {calculateApprovalRate() >= 80 
                  ? "Excellent contribution quality!" 
                  : calculateApprovalRate() >= 60 
                  ? "Good work, keep it up!" 
                  : "Room for improvement"
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contributions List */}
      <div className="contributions-section">
        <h2>Recent Contributions</h2>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your contributions...</p>
          </div>
        ) : contributions.length === 0 ? (
          <div className="empty-state">
            <Bus size={48} />
            <h3>No contributions yet</h3>
            <p>Start contributing to help improve the bus route database!</p>
          </div>
        ) : (
          <div className="contributions-grid">
            {contributions.map((contribution) => (
              <div key={contribution.id} className={`contribution-card ${contribution.status?.toLowerCase()}`}>
                <div className="card-header">
                  <div className="contribution-type">
                    {contribution.type === 'route' ? <Bus size={18} /> : <MapPin size={18} />}
                    <span>{contribution.type === 'route' ? 'Route Data' : 'Image Upload'}</span>
                  </div>
                  <div className="contribution-status">
                    {getStatusIcon(contribution.status!)}
                    <span>{getStatusText(contribution.status!)}</span>
                  </div>
                </div>

                <div className="card-content">
                  <div className="route-info">
                    <h4>{contribution.busNumber || 'Route Information'}</h4>
                    {contribution.fromLocationName && contribution.toLocationName && (
                      <p className="route-path">
                        {contribution.fromLocationName} → {contribution.toLocationName}
                      </p>
                    )}
                  </div>

                  {contribution.departureTime && contribution.arrivalTime && (
                    <div className="timing-info">
                      <span className="timing">
                        {contribution.departureTime} - {contribution.arrivalTime}
                      </span>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <div className="submission-date">
                    <Calendar size={14} />
                    <span>{new Date(contribution.submissionDate!).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedContribution(contribution);
                      setShowModal(true);
                    }}
                    className="view-details-btn"
                  >
                    <Eye size={14} />
                    Details
                  </button>
                </div>

                {contribution.validationMessage && (
                  <div className="validation-message">
                    <p>{contribution.validationMessage}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contribution Details Modal */}
      {showModal && selectedContribution && (
        <ContributionDetailsModal
          contribution={selectedContribution}
          onClose={() => {
            setShowModal(false);
            setSelectedContribution(null);
          }}
        />
      )}
    </div>
  );
};

// Contribution Details Modal Component
interface DetailsModalProps {
  contribution: ContributionSummary;
  onClose: () => void;
}

const ContributionDetailsModal: React.FC<DetailsModalProps> = ({
  contribution,
  onClose
}) => {
  return (
    <div className="modal-overlay">
      <div className="details-modal">
        <div className="modal-header">
          <h2>Contribution Details</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="modal-content">
          <div className="contribution-overview">
            <div className="overview-header">
              <div className="type-indicator">
                {contribution.type === 'route' ? <Bus size={24} /> : <MapPin size={24} />}
                <span>{contribution.type === 'route' ? 'Route Data' : 'Image Upload'}</span>
              </div>
              <div className={`status-badge ${contribution.status?.toLowerCase()}`}>
                {contribution.status === 'PENDING' && <Clock size={16} />}
                {contribution.status === 'APPROVED' && <CheckCircle size={16} />}
                {contribution.status === 'REJECTED' && <XCircle size={16} />}
                {contribution.status}
              </div>
            </div>

            <div className="contribution-details">
              <div className="detail-row">
                <label>Submission ID:</label>
                <span className="mono">#{contribution.id?.toString().slice(-8)}</span>
              </div>
              
              <div className="detail-row">
                <label>Submitted:</label>
                <span>{new Date(contribution.submissionDate!).toLocaleString()}</span>
              </div>

              {contribution.processedDate && (
                <div className="detail-row">
                  <label>Processed:</label>
                  <span>{new Date(contribution.processedDate).toLocaleString()}</span>
                </div>
              )}

              {contribution.busNumber && (
                <div className="detail-row">
                  <label>Bus Number:</label>
                  <span>{contribution.busNumber}</span>
                </div>
              )}

              {contribution.busName && (
                <div className="detail-row">
                  <label>Bus Name:</label>
                  <span>{contribution.busName}</span>
                </div>
              )}

              {contribution.fromLocationName && contribution.toLocationName && (
                <div className="detail-row">
                  <label>Route:</label>
                  <span>{contribution.fromLocationName} → {contribution.toLocationName}</span>
                </div>
              )}

              {contribution.departureTime && contribution.arrivalTime && (
                <div className="detail-row">
                  <label>Timing:</label>
                  <span>{contribution.departureTime} - {contribution.arrivalTime}</span>
                </div>
              )}

              {contribution.scheduleInfo && (
                <div className="detail-row">
                  <label>Schedule:</label>
                  <span>{contribution.scheduleInfo}</span>
                </div>
              )}

              {contribution.additionalNotes && (
                <div className="detail-row">
                  <label>Notes:</label>
                  <span>{contribution.additionalNotes}</span>
                </div>
              )}

              {contribution.validationMessage && (
                <div className="detail-row">
                  <label>Status Message:</label>
                  <span className={`validation-text ${contribution.status?.toLowerCase()}`}>
                    {contribution.validationMessage}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="close-modal-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserContributionDashboard;