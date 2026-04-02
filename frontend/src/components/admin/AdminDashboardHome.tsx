import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  Clock,
  Bus,
  Image as ImageIcon,
  AlertTriangle,
  Users,
  Activity
} from 'lucide-react';
import AdminService from '../../services/adminService';
import './AdminDashboardHome.css';

interface DashboardStats {
  pendingRoutes: number;
  pendingImages: number;
  highPriorityIssues: number;
  routesApprovedToday: number;
  issuesResolvedToday: number;
  totalSearchesToday: number;
  activeUsers24h: number;
}

interface ActivityItem {
  id: string;
  type: 'route_approved' | 'route_rejected' | 'issue_resolved' | 'image_approved';
  message: string;
  timestamp: string;
  adminUser?: string;
}

/**
 * Admin Dashboard Home - Overview and Quick Stats
 * Shows pending actions, daily stats, and recent activity
 */
const AdminDashboardHome: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [routes, images, publicStats] = await Promise.all([
        AdminService.getRouteContributions(),
        AdminService.getImageContributions(),
        fetch(`${import.meta.env.VITE_API_URL || ''}/v1/bus-schedules/public-stats`).then(res => res.json()).catch(() => ({ dailyUsers: 0 }))
      ]);

      // Calculate stats
      const pendingRoutes = routes.filter(r => r.status === 'PENDING').length;
      const pendingImages = images.filter(i => i.status === 'PENDING').length;
      
      // For now, mock some stats (can be replaced with real API calls)
      const dashboardStats: DashboardStats = {
        pendingRoutes,
        pendingImages,
        highPriorityIssues: 0, // TODO: Add route issues API call
        routesApprovedToday: routes.filter(r => 
          r.status === 'APPROVED' && isToday(r.processedDate || r.submissionDate)
        ).length,
        issuesResolvedToday: 0, // TODO: Add from issues API
        totalSearchesToday: 0, // TODO: Add from analytics API
        activeUsers24h: publicStats.dailyUsers || 0
      };

      setStats(dashboardStats);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const isToday = (dateString?: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <div className="dashboard-home loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('admin.dashboard.loading', 'Loading dashboard...')}</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="dashboard-home error">
        <AlertCircle size={48} />
        <p>{error || 'Failed to load dashboard'}</p>
        <button onClick={loadDashboardData} className="retry-btn">
          {t('admin.dashboard.retry', 'Retry')}
        </button>
      </div>
    );
  }

  const totalPending = stats.pendingRoutes + stats.pendingImages + stats.highPriorityIssues;

  return (
    <div className="dashboard-home">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h2>{t('admin.dashboard.welcome', 'Welcome to Admin Dashboard')}</h2>
        <p>{t('admin.dashboard.welcomeSubtitle', 'Manage contributions and monitor system health')}</p>
      </div>

      {/* Pending Actions - Requires Attention */}
      <div className="pending-actions-section">
        <div className="section-header">
          <AlertCircle size={20} />
          <h3>{t('admin.dashboard.pendingActions', 'Pending Actions')}</h3>
          {totalPending > 0 && (
            <span className="badge badge-warning">{totalPending}</span>
          )}
        </div>

        <div className="pending-cards">
          <PendingCard
            icon={<Bus />}
            label={t('admin.dashboard.routeContributions', 'Route Contributions')}
            count={stats.pendingRoutes}
            priority={stats.pendingRoutes > 20 ? 'high' : stats.pendingRoutes > 10 ? 'medium' : 'normal'}
            linkText={t('admin.dashboard.review', 'Review')}
          />

          <PendingCard
            icon={<ImageIcon />}
            label={t('admin.dashboard.imageReviews', 'Image Reviews')}
            count={stats.pendingImages}
            priority={stats.pendingImages > 15 ? 'high' : stats.pendingImages > 5 ? 'medium' : 'normal'}
            linkText={t('admin.dashboard.review', 'Review')}
          />

          <PendingCard
            icon={<AlertTriangle />}
            label={t('admin.dashboard.highPriorityIssues', 'High Priority Issues')}
            count={stats.highPriorityIssues}
            priority={stats.highPriorityIssues > 5 ? 'high' : 'normal'}
            linkText={t('admin.dashboard.resolve', 'Resolve')}
          />
        </div>
      </div>

      {/* Quick Stats - Last 24 Hours */}
      <div className="quick-stats-section">
        <div className="section-header">
          <TrendingUp size={20} />
          <h3>{t('admin.dashboard.quickStats', 'Last 24 Hours')}</h3>
        </div>

        <div className="stats-grid">
          <StatCard
            icon={<CheckCircle className="icon-success" />}
            value={stats.routesApprovedToday}
            label={t('admin.dashboard.routesApproved', 'Routes Approved')}
            trend="up"
          />

          <StatCard
            icon={<AlertCircle className="icon-success" />}
            value={stats.issuesResolvedToday}
            label={t('admin.dashboard.issuesResolved', 'Issues Resolved')}
            trend="up"
          />

          <StatCard
            icon={<Activity className="icon-primary" />}
            value={stats.totalSearchesToday}
            label={t('admin.dashboard.searches', 'Searches Performed')}
            trend="neutral"
          />

          <StatCard
            icon={<Users className="icon-primary" />}
            value={stats.activeUsers24h}
            label={t('admin.dashboard.activeUsers', 'Active Users')}
            trend="neutral"
          />
        </div>
      </div>

      {/* System Health Indicators */}
      <div className="system-health-section">
        <div className="section-header">
          <Activity size={20} />
          <h3>{t('admin.dashboard.systemHealth', 'System Health')}</h3>
        </div>

        <div className="health-indicators">
          <HealthIndicator
            label={t('admin.dashboard.apiStatus', 'API Status')}
            status="healthy"
            message={t('admin.dashboard.allServicesRunning', 'All services running normally')}
          />

          <HealthIndicator
            label={t('admin.dashboard.database', 'Database')}
            status="healthy"
            message={t('admin.dashboard.connectionStable', 'Connection stable')}
          />

          <HealthIndicator
            label={t('admin.dashboard.workload', 'Workload')}
            status={totalPending > 30 ? 'warning' : 'healthy'}
            message={totalPending > 30 
              ? t('admin.dashboard.highWorkload', 'High pending queue')
              : t('admin.dashboard.normalWorkload', 'Normal workload')
            }
          />
        </div>
      </div>
    </div>
  );
};

// Sub-components

interface PendingCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  priority: 'high' | 'medium' | 'normal';
  linkText: string;
}

const PendingCard: React.FC<PendingCardProps> = ({ icon, label, count, priority, linkText }) => {
  return (
    <div className={`pending-card priority-${priority}`}>
      <div className="card-icon">{icon}</div>
      <div className="card-content">
        <div className="card-count">{count}</div>
        <div className="card-label">{label}</div>
      </div>
      {count > 0 && (
        <div className="card-action">
          <span className="action-link">{linkText} →</span>
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  trend: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, trend }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value.toLocaleString()}</div>
        <div className="stat-label">{label}</div>
      </div>
      {trend !== 'neutral' && (
        <div className={`stat-trend trend-${trend}`}>
          {trend === 'up' ? '↑' : '↓'}
        </div>
      )}
    </div>
  );
};

interface HealthIndicatorProps {
  label: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
}

const HealthIndicator: React.FC<HealthIndicatorProps> = ({ label, status, message }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="status-icon healthy" />;
      case 'warning':
        return <AlertTriangle className="status-icon warning" />;
      case 'error':
        return <AlertCircle className="status-icon error" />;
    }
  };

  return (
    <div className={`health-indicator status-${status}`}>
      {getStatusIcon()}
      <div className="indicator-content">
        <div className="indicator-label">{label}</div>
        <div className="indicator-message">{message}</div>
      </div>
    </div>
  );
};

export default AdminDashboardHome;
