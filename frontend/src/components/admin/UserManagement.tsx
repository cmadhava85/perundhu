import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AuthService from '../../services/authService';
import './UserManagement.css';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'banned';
  registrationDate: string;
  lastLogin: string;
  contributionsCount: number;
}

const UserManagement: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Fetch users from API
      const response = await AuthService.getUsers(0, 100);
      const apiUsers = response.users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.name || user.email.split('@')[0],
        role: (user.role?.toLowerCase() || 'user') as User['role'],
        status: 'active' as User['status'],
        registrationDate: user.createdAt || new Date().toISOString().split('T')[0],
        lastLogin: user.lastLogin || new Date().toISOString().split('T')[0],
        contributionsCount: 0
      }));
      setUsers(apiUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      // Show error to user
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await AuthService.updateUserRole(userId, newRole.toUpperCase());
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole as User['role'] } : user
      ));
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role. Please try again.');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      // Call appropriate API based on status
      if (newStatus === 'banned') {
        await AuthService.banUser(userId, 'Banned by administrator');
      } else if (newStatus === 'active') {
        await AuthService.unbanUser(userId);
      }
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus as User['status'] } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'status-badge active';
      case 'inactive': return 'status-badge inactive';
      case 'banned': return 'status-badge banned';
      default: return 'status-badge';
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'role-badge admin';
      case 'moderator': return 'role-badge moderator';
      case 'user': return 'role-badge user';
      default: return 'role-badge';
    }
  };

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('admin.users.loading', 'Loading users...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="panel-header">
        <h2 className="panel-title">
          <span className="title-icon">👥</span>
          {t('admin.users.title', 'User Management')}
        </h2>
        <p className="panel-subtitle">
          {t('admin.users.subtitle', 'Manage user accounts, roles, and permissions')}
        </p>
      </div>

      <div className="users-controls">
        <div className="search-filter-row">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder={t('admin.users.searchPlaceholder', 'Search users by email or username...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="filter-group">
            <label className="filter-label">{t('admin.users.filterByRole', 'Role')}:</label>
            <select 
              className="filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">{t('admin.users.allRoles', 'All Roles')}</option>
              <option value="admin">{t('admin.users.roleAdmin', 'Admin')}</option>
              <option value="moderator">{t('admin.users.roleModerator', 'Moderator')}</option>
              <option value="user">{t('admin.users.roleUser', 'User')}</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">{t('admin.users.filterByStatus', 'Status')}:</label>
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{t('admin.users.allStatuses', 'All Statuses')}</option>
              <option value="active">{t('admin.users.statusActive', 'Active')}</option>
              <option value="inactive">{t('admin.users.statusInactive', 'Inactive')}</option>
              <option value="banned">{t('admin.users.statusBanned', 'Banned')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="users-summary">
        <div className="summary-stat">
          <span className="stat-number">{filteredUsers.length}</span>
          <span className="stat-label">{t('admin.users.totalUsers', 'Total Users')}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-number">{filteredUsers.filter(u => u.status === 'active').length}</span>
          <span className="stat-label">{t('admin.users.activeUsers', 'Active')}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-number">{filteredUsers.filter(u => u.role === 'admin').length}</span>
          <span className="stat-label">{t('admin.users.adminUsers', 'Admins')}</span>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>{t('admin.users.email', 'Email')}</th>
              <th>{t('admin.users.username', 'Username')}</th>
              <th>{t('admin.users.role', 'Role')}</th>
              <th>{t('admin.users.status', 'Status')}</th>
              <th>{t('admin.users.registered', 'Registered')}</th>
              <th>{t('admin.users.lastLogin', 'Last Login')}</th>
              <th>{t('admin.users.contributions', 'Contributions')}</th>
              <th>{t('admin.users.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.username}</td>
                <td>
                  <select
                    className={getRoleBadgeClass(user.role)}
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  >
                    <option value="user">{t('admin.users.roleUser', 'User')}</option>
                    <option value="moderator">{t('admin.users.roleModerator', 'Moderator')}</option>
                    <option value="admin">{t('admin.users.roleAdmin', 'Admin')}</option>
                  </select>
                </td>
                <td>
                  <select
                    className={getStatusBadgeClass(user.status)}
                    value={user.status}
                    onChange={(e) => handleStatusChange(user.id, e.target.value)}
                  >
                    <option value="active">{t('admin.users.statusActive', 'Active')}</option>
                    <option value="inactive">{t('admin.users.statusInactive', 'Inactive')}</option>
                    <option value="banned">{t('admin.users.statusBanned', 'Banned')}</option>
                  </select>
                </td>
                <td>{formatDate(user.registrationDate)}</td>
                <td>{formatDate(user.lastLogin)}</td>
                <td>
                  <span className="contributions-count">{user.contributionsCount}</span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-view"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                      }}
                      title={t('admin.users.viewDetails', 'View Details')}
                    >
                      👁️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.users.userDetails', 'User Details')}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowUserModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="user-detail-grid">
                <div className="detail-item">
                  <label>{t('admin.users.email', 'Email')}:</label>
                  <span>{selectedUser.email}</span>
                </div>
                <div className="detail-item">
                  <label>{t('admin.users.username', 'Username')}:</label>
                  <span>{selectedUser.username}</span>
                </div>
                <div className="detail-item">
                  <label>{t('admin.users.role', 'Role')}:</label>
                  <span className={getRoleBadgeClass(selectedUser.role)}>
                    {selectedUser.role}
                  </span>
                </div>
                <div className="detail-item">
                  <label>{t('admin.users.status', 'Status')}:</label>
                  <span className={getStatusBadgeClass(selectedUser.status)}>
                    {selectedUser.status}
                  </span>
                </div>
                <div className="detail-item">
                  <label>{t('admin.users.registered', 'Registration Date')}:</label>
                  <span>{formatDate(selectedUser.registrationDate)}</span>
                </div>
                <div className="detail-item">
                  <label>{t('admin.users.lastLogin', 'Last Login')}:</label>
                  <span>{formatDate(selectedUser.lastLogin)}</span>
                </div>
                <div className="detail-item">
                  <label>{t('admin.users.contributions', 'Total Contributions')}:</label>
                  <span className="contributions-count">{selectedUser.contributionsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;