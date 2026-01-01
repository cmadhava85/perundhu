import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Send,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  Users,
  Zap,
  Save
} from 'lucide-react';
import AnnouncementService, { type Announcement, type AnnouncementStats } from '../../services/announcementService';
import './AnnouncementAdminPanel.css';

type AnnouncementType = 'INFO' | 'WARNING' | 'SUCCESS' | 'NEW_FEATURE' | 'MAINTENANCE';
type TargetAudience = 'ALL' | 'ADMIN' | 'CONTRIBUTORS' | 'REGULAR_USERS';
type AnnouncementStatus = 'DRAFT' | 'PUBLISHED';

interface FormState {
  id?: number;
  uniqueId: string;
  type: AnnouncementType;
  titleKey: string;
  titleFallback: string;
  messageKey: string;
  messageFallback: string;
  link?: string;
  linkTextKey?: string;
  linkTextFallback?: string;
  isActive: boolean;
  isDismissible: boolean;
  priority: number;
  announcementCategory?: string;
  targetUsers: TargetAudience;
  displayBanner: boolean;
  displayModal: boolean;
  startsAt?: string;
  expiresAt?: string;
  status: AnnouncementStatus;
}

const INITIAL_FORM: FormState = {
  uniqueId: '',
  type: 'INFO',
  titleKey: 'announcements.new.title',
  titleFallback: '',
  messageKey: 'announcements.new.message',
  messageFallback: '',
  isActive: false,
  isDismissible: true,
  priority: 5,
  targetUsers: 'ALL',
  displayBanner: true,
  displayModal: false,
  status: 'DRAFT'
};

export const AnnouncementAdminPanel: React.FC = () => {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<AnnouncementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Filter/search
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Load data on mount
  useEffect(() => {
    loadAnnouncements();
    loadStatistics();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await AnnouncementService.getAllAnnouncements();
      setAnnouncements(data);
      setError(null);
    } catch (err) {
      setError('Failed to load announcements');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const statsData = await AnnouncementService.getStatistics();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.uniqueId.trim()) errors.uniqueId = 'Unique ID is required';
    if (!formData.titleFallback.trim()) errors.titleFallback = 'Title is required';
    if (!formData.messageFallback.trim()) errors.messageFallback = 'Message is required';
    if (formData.priority < 0 || formData.priority > 100) errors.priority = 'Priority must be 0-100';
    
    if (formData.startsAt && formData.expiresAt && formData.startsAt > formData.expiresAt) {
      errors.scheduling = 'Start date must be before expiration date';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setEditingId(null);
  };

  const handleEdit = async (announcement: Announcement) => {
    setFormData(announcement as FormState);
    setEditingId(announcement.id!);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      if (editingId) {
        await AnnouncementService.updateAnnouncement(editingId, formData as Announcement);
        setSuccess('Announcement updated successfully');
      } else {
        await AnnouncementService.createAnnouncement(formData as Announcement);
        setSuccess('Announcement created successfully');
      }

      setShowForm(false);
      resetForm();
      await loadAnnouncements();
      await loadStatistics();
    } catch (err) {
      setError('Failed to save announcement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      setLoading(true);
      await AnnouncementService.deleteAnnouncement(id);
      setSuccess('Announcement deleted successfully');
      await loadAnnouncements();
      await loadStatistics();
    } catch (err) {
      setError('Failed to delete announcement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: number) => {
    try {
      setLoading(true);
      await AnnouncementService.publishAnnouncement(id);
      setSuccess('Announcement published');
      await loadAnnouncements();
      await loadStatistics();
    } catch (err) {
      setError('Failed to publish announcement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async (id: number) => {
    try {
      setLoading(true);
      await AnnouncementService.unpublishAnnouncement(id);
      setSuccess('Announcement unpublished');
      await loadAnnouncements();
      await loadStatistics();
    } catch (err) {
      setError('Failed to unpublish announcement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || a.type === typeFilter;
    const matchesSearch = searchQuery === '' || 
      a.titleFallback.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.messageFallback.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.uniqueId.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const handleAutoGenerateId = () => {
    const prefix = formData.type.toLowerCase();
    const timestamp = Date.now().toString().slice(-6);
    const randomStr = Math.random().toString(36).substring(2, 5);
    setFormData(prev => ({
      ...prev,
      uniqueId: `${prefix}-${timestamp}-${randomStr}`
    }));
  };

  const getTypeColor = (type: AnnouncementType) => {
    const colors: Record<AnnouncementType, string> = {
      'INFO': '#3b82f6',
      'WARNING': '#f59e0b',
      'SUCCESS': '#10b981',
      'NEW_FEATURE': '#8b5cf6',
      'MAINTENANCE': '#ef4444'
    };
    return colors[type];
  };

  const getTypeIcon = (type: AnnouncementType) => {
    const icons: Record<AnnouncementType, string> = {
      'INFO': 'ℹ️',
      'WARNING': '⚠️',
      'SUCCESS': '✅',
      'NEW_FEATURE': '✨',
      'MAINTENANCE': '🔧'
    };
    return icons[type];
  };

  if (loading && announcements.length === 0) {
    return (
      <div className="announcement-admin-panel loading">
        <div className="loader">Loading announcements...</div>
      </div>
    );
  }

  return (
    <div className="announcement-admin-panel">
      {/* Header */}
      <div className="panel-header">
        <div>
          <h2 className="panel-title">📢 Announcement Management</h2>
          <p className="panel-subtitle">Create, edit, and manage system announcements</p>
        </div>
        <button 
          className="btn-primary btn-lg"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus size={20} />
          New Announcement
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Announcements</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon active">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.active}</h3>
              <p>Active Now</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon upcoming">
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.upcoming}</h3>
              <p>Upcoming</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon engagement">
              <Eye size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.totalViews.toLocaleString()}</h3>
              <p>Total Views</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon dismissed">
              <X size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.totalDismisses.toLocaleString()}</h3>
              <p>Total Dismisses</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <CheckCircle size={20} />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}><X size={16} /></button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AnnouncementStatus | 'ALL')}
          className="filter-select"
        >
          <option value="ALL">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>

        <select 
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as AnnouncementType | 'ALL')}
          className="filter-select"
        >
          <option value="ALL">All Types</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="SUCCESS">Success</option>
          <option value="NEW_FEATURE">New Feature</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>

      {/* Announcements List */}
      <div className="announcements-list">
        {filteredAnnouncements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No announcements found</h3>
            <p>Create your first announcement or adjust your filters</p>
          </div>
        ) : (
          filteredAnnouncements.map(announcement => (
            <div key={announcement.id} className="announcement-card">
              <div className="card-header">
                <div className="header-info">
                  <span className="type-badge" style={{ backgroundColor: getTypeColor(announcement.type) }}>
                    {getTypeIcon(announcement.type)} {announcement.type}
                  </span>
                  <h3 className="card-title">{announcement.titleFallback}</h3>
                  <span className={`status-badge status-${announcement.status.toLowerCase()}`}>
                    {announcement.status}
                  </span>
                </div>
                <div className="card-actions">
                  <button 
                    className="btn-icon btn-edit"
                    onClick={() => handleEdit(announcement)}
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  {announcement.status === 'DRAFT' ? (
                    <button 
                      className="btn-icon btn-publish"
                      onClick={() => handlePublish(announcement.id!)}
                      title="Publish"
                    >
                      <Send size={18} />
                    </button>
                  ) : (
                    <button 
                      className="btn-icon btn-unpublish"
                      onClick={() => handleUnpublish(announcement.id!)}
                      title="Unpublish"
                    >
                      <EyeOff size={18} />
                    </button>
                  )}
                  <button 
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(announcement.id!)}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="card-body">
                <p className="card-message">{announcement.messageFallback}</p>
                
                <div className="card-meta">
                  <div className="meta-item">
                    <Users size={14} />
                    <span>{announcement.targetUsers}</span>
                  </div>
                  <div className="meta-item">
                    <Zap size={14} />
                    <span>Priority: {announcement.priority}</span>
                  </div>
                  <div className="meta-item">
                    <Eye size={14} />
                    <span>{announcement.viewCount || 0} views</span>
                  </div>
                  <div className="meta-item">
                    <X size={14} />
                    <span>{announcement.dismissCount || 0} dismisses</span>
                  </div>
                </div>

                {(announcement.startsAt || announcement.expiresAt) && (
                  <div className="card-schedule">
                    {announcement.startsAt && (
                      <div className="schedule-item">
                        <Calendar size={14} />
                        <span>Starts: {new Date(announcement.startsAt).toLocaleString()}</span>
                      </div>
                    )}
                    {announcement.expiresAt && (
                      <div className="schedule-item">
                        <Clock size={14} />
                        <span>Expires: {new Date(announcement.expiresAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content announcement-form">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Announcement' : 'Create New Announcement'}</h2>
              <button 
                className="btn-close"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-body announcement-form-body">
              {/* Type Selection */}
              <div className="form-section">
                <h3>Type & Priority</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type *</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as AnnouncementType }))}
                      className="form-select"
                    >
                      <option value="INFO">ℹ️ Info</option>
                      <option value="WARNING">⚠️ Warning</option>
                      <option value="SUCCESS">✅ Success</option>
                      <option value="NEW_FEATURE">✨ New Feature</option>
                      <option value="MAINTENANCE">🔧 Maintenance</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority (0-100) *</label>
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                      className="form-input"
                    />
                    <small>Higher = displayed first</small>
                  </div>
                </div>
              </div>

              {/* Unique ID */}
              <div className="form-section">
                <h3>Unique Identifier</h3>
                <div className="form-group">
                  <label>Unique ID *</label>
                  <div className="input-with-button">
                    <input 
                      type="text"
                      value={formData.uniqueId}
                      onChange={(e) => setFormData(prev => ({ ...prev, uniqueId: e.target.value }))}
                      placeholder="e.g., announcement-001"
                      className="form-input"
                    />
                    <button 
                      type="button"
                      className="btn-icon btn-generate"
                      onClick={handleAutoGenerateId}
                      title="Auto-generate ID"
                    >
                      <Zap size={16} />
                    </button>
                  </div>
                  {formErrors.uniqueId && <span className="error-text">{formErrors.uniqueId}</span>}
                </div>
              </div>

              {/* Content - English */}
              <div className="form-section">
                <h3>🇬🇧 English Content</h3>
                
                <div className="form-group">
                  <label>Title Key</label>
                  <input 
                    type="text"
                    value={formData.titleKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, titleKey: e.target.value }))}
                    placeholder="e.g., announcements.maintenance.title"
                    className="form-input"
                  />
                  <small>Translation key for multilingual support</small>
                </div>

                <div className="form-group">
                  <label>Title (Fallback) *</label>
                  <input 
                    type="text"
                    value={formData.titleFallback}
                    onChange={(e) => setFormData(prev => ({ ...prev, titleFallback: e.target.value }))}
                    placeholder="e.g., System Maintenance"
                    className="form-input"
                  />
                  {formErrors.titleFallback && <span className="error-text">{formErrors.titleFallback}</span>}
                </div>

                <div className="form-group">
                  <label>Message Key</label>
                  <input 
                    type="text"
                    value={formData.messageKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, messageKey: e.target.value }))}
                    placeholder="e.g., announcements.maintenance.message"
                    className="form-input"
                  />
                  <small>Translation key for multilingual support</small>
                </div>

                <div className="form-group">
                  <label>Message *</label>
                  <textarea 
                    value={formData.messageFallback}
                    onChange={(e) => setFormData(prev => ({ ...prev, messageFallback: e.target.value }))}
                    placeholder="Announcement message..."
                    className="form-textarea"
                    rows={4}
                  />
                  {formErrors.messageFallback && <span className="error-text">{formErrors.messageFallback}</span>}
                </div>
              </div>

              {/* Action Link */}
              <div className="form-section">
                <h3>Action Link (Optional)</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Link URL</label>
                    <input 
                      type="text"
                      value={formData.link || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                      placeholder="e.g., /search"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Link Text Key</label>
                    <input 
                      type="text"
                      value={formData.linkTextKey || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkTextKey: e.target.value }))}
                      placeholder="e.g., announcements.action.view"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Link Text (Fallback)</label>
                    <input 
                      type="text"
                      value={formData.linkTextFallback || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkTextFallback: e.target.value }))}
                      placeholder="e.g., Learn More"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Scheduling */}
              <div className="form-section">
                <h3>📅 Scheduling</h3>
                {formErrors.scheduling && <span className="error-text">{formErrors.scheduling}</span>}
                <div className="form-row">
                  <div className="form-group">
                    <label>Starts At (Optional)</label>
                    <input 
                      type="datetime-local"
                      value={formData.startsAt || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, startsAt: e.target.value }))}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Expires At (Optional)</label>
                    <input 
                      type="datetime-local"
                      value={formData.expiresAt || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Targeting & Display */}
              <div className="form-section">
                <h3>🎯 Targeting & Display</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Target Users</label>
                    <select 
                      value={formData.targetUsers}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetUsers: e.target.value as TargetAudience }))}
                      className="form-select"
                    >
                      <option value="ALL">All Users</option>
                      <option value="ADMIN">Admin Only</option>
                      <option value="CONTRIBUTORS">Contributors</option>
                      <option value="REGULAR_USERS">Regular Users</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Category (Optional)</label>
                    <input 
                      type="text"
                      value={formData.announcementCategory || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, announcementCategory: e.target.value }))}
                      placeholder="e.g., system, feature"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group checkbox">
                    <input 
                      type="checkbox"
                      id="displayBanner"
                      checked={formData.displayBanner}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayBanner: e.target.checked }))}
                    />
                    <label htmlFor="displayBanner">Show in Banner</label>
                  </div>

                  <div className="form-group checkbox">
                    <input 
                      type="checkbox"
                      id="displayModal"
                      checked={formData.displayModal}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayModal: e.target.checked }))}
                    />
                    <label htmlFor="displayModal">Show as Modal</label>
                  </div>

                  <div className="form-group checkbox">
                    <input 
                      type="checkbox"
                      id="isDismissible"
                      checked={formData.isDismissible}
                      onChange={(e) => setFormData(prev => ({ ...prev, isDismissible: e.target.checked }))}
                    />
                    <label htmlFor="isDismissible">User Can Dismiss</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleSave}
                disabled={loading}
              >
                <Save size={18} />
                {editingId ? 'Update' : 'Create'} Announcement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementAdminPanel;
