"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, Search, UserPlus, Edit2, Trash2, ShieldAlert, 
  Check, X, RefreshCw, AlertTriangle, Shield, CheckCircle2, Copy, Eye, EyeOff
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import Portal from '@/components/common/Portal';

interface User {
  uuid_user: string;
  username: string;
  email: string;
  full_name: string;
  role: 'SuperAdmin' | 'User' | 'Lecturer' | 'Mentor';
  status: 'Pending' | 'Active' | 'Inactive';
  created_at: string;
  last_login_at?: string;
}

export default function SuperadminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  // Success password display state
  const [createdUserInfo, setCreatedUserInfo] = useState<{ username: string; email: string; pass: string } | null>(null);

  // Form states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState<'SuperAdmin' | 'User' | 'Lecturer' | 'Mentor'>('User');
  const [formStatus, setFormStatus] = useState<'Pending' | 'Active' | 'Inactive'>('Active');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setError(null);
      const token = getStoredToken();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      } else if (token) {
        headers['x-api-key'] = token;
      }

      const response = await apiGet<{ success: boolean; data: User[] }>(
        '/api/users',
        {
          token: token || undefined,
          headers
        }
      );

      if (response && response.success) {
        setUsers(response.data || []);
      } else {
        throw new Error('Gagal mengambil data user');
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar user');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter effect
  useEffect(() => {
    let result = users;

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.full_name.toLowerCase().includes(term)
      );
    }

    if (roleFilter !== 'all') {
      result = result.filter(u => u.role.toLowerCase() === roleFilter.toLowerCase());
    }

    if (statusFilter !== 'all') {
      result = result.filter(u => u.status.toLowerCase() === statusFilter.toLowerCase());
    }

    setFilteredUsers(result);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUsers();
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  const handleOpenAddModal = () => {
    setFormUsername('');
    setFormEmail('');
    setFormFullName('');
    setFormRole('User');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername || !formEmail || !formFullName || !formRole) {
      setFormError('Semua kolom harus diisi');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const token = getStoredToken();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      } else if (token) {
        headers['x-api-key'] = token;
      }

      const payload = {
        username: formUsername,
        email: formEmail,
        full_name: formFullName,
        role: formRole
      };

      const response = await apiPost<any>(
        '/api/users',
        payload,
        {
          token: token || undefined,
          headers
        }
      );

      if (response && response.success) {
        const generatedPassword = response.data?.generatedPassword || '';
        setCreatedUserInfo({
          username: formUsername,
          email: formEmail,
          pass: generatedPassword
        });
        
        setIsAddModalOpen(false);
        showSuccess('User baru berhasil ditambahkan!');
        fetchUsers();
      } else {
        throw new Error(response.message || 'Gagal menambahkan user');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormFullName(user.full_name);
    setFormRole(user.role);
    setFormStatus(user.status);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setFormLoading(true);
    setFormError(null);

    try {
      const token = getStoredToken();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      } else if (token) {
        headers['x-api-key'] = token;
      }

      const payload = {
        username: formUsername,
        email: formEmail,
        full_name: formFullName,
        role: formRole,
        status: formStatus
      };

      const response = await apiPut<any>(
        `/api/users/${selectedUser.uuid_user}`,
        payload,
        {
          token: token || undefined,
          headers
        }
      );

      if (response && response.success) {
        setIsEditModalOpen(false);
        showSuccess('Data user berhasil diperbarui!');
        fetchUsers();
      } else {
        throw new Error(response.message || 'Gagal memperbarui user');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenDeleteConfirm = (user: User) => {
    setSelectedUser(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setFormLoading(true);

    try {
      const token = getStoredToken();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      } else if (token) {
        headers['x-api-key'] = token;
      }

      const response = await apiDelete<any>(
        `/api/users/${selectedUser.uuid_user}`,
        {
          token: token || undefined,
          headers
        }
      );

      if (response && response.success) {
        setIsDeleteConfirmOpen(false);
        showSuccess('User berhasil dihapus dari sistem!');
        fetchUsers();
      } else {
        throw new Error(response.message || 'Gagal menghapus user');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus user');
    } finally {
      setFormLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Berhasil disalin ke clipboard!');
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={s.container}>
      {/* Top Header */}
      <div style={s.topHeader}>
        <div>
          <h1 style={s.title}>SuperAdmin Users</h1>
          <p style={s.subtitle}>Kelola seluruh akun terdaftar, set status, dan atur hak akses (Role)</p>
        </div>
        <div style={s.headerActions}>
          <button 
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            style={s.refreshBtn}
          >
            <RefreshCw 
              size={15} 
              color="var(--silver)" 
              style={{ 
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none' 
              }} 
            />
            <span>Refresh</span>
          </button>
          <button onClick={handleOpenAddModal} style={s.addUserBtn}>
            <UserPlus size={16} />
            <span>Tambah User</span>
          </button>
        </div>
      </div>

      {/* Alert Success */}
      {successMsg && (
        <div style={s.successAlert}>
          <CheckCircle2 size={18} color="#10B981" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Alert Error */}
      {error && (
        <div style={s.errorAlert}>
          <ShieldAlert size={20} color="#ef4444" />
          <div style={s.errorContent}>
            <strong style={s.errorTitle}>Gagal memuat data dari Backend API</strong>
            <span style={s.errorMsg}>{error}</span>
          </div>
          <button style={s.retryBtn} onClick={handleRefresh}>Coba Lagi</button>
        </div>
      )}

      {/* Temporary Password Modal / Information Box */}
      {createdUserInfo && (
        <div style={s.infoBox}>
          <div style={s.infoBoxHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#FFA826" />
              <strong style={{ color: '#FFA826', fontSize: '0.9rem' }}>User Berhasil Dibuat!</strong>
            </div>
            <button style={s.closeInfoBtn} onClick={() => setCreatedUserInfo(null)}>
              <X size={16} color="var(--grey-blue)" />
            </button>
          </div>
          <p style={s.infoBoxDesc}>
            Harap simpan atau berikan informasi akun sementara ini ke pengguna. Password ini di-generate secara acak.
          </p>
          <div style={s.credentialsGroup}>
            <div style={s.credentialRow}>
              <span style={s.credentialLabel}>Username:</span>
              <strong style={s.credentialVal}>{createdUserInfo.username}</strong>
            </div>
            <div style={s.credentialRow}>
              <span style={s.credentialLabel}>Email:</span>
              <strong style={s.credentialVal}>{createdUserInfo.email}</strong>
            </div>
            <div style={s.credentialRow}>
              <span style={s.credentialLabel}>Password Sementara:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code style={s.passwordCode}>{createdUserInfo.pass}</code>
                <button 
                  onClick={() => copyToClipboard(createdUserInfo.pass)}
                  style={s.copyBtn}
                  title="Salin Password"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="glass-panel" style={s.filterPanel}>
        <div style={s.searchWrap}>
          <Search size={16} color="var(--grey-blue)" style={s.searchIcon} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama, email, username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={s.searchInput}
          />
        </div>
        <div style={s.filterGroup}>
          <div style={s.selectWrap}>
            <span style={s.selectLabel}>Role:</span>
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              style={s.select}
            >
              <option value="all">Semua Role</option>
              <option value="SuperAdmin">SuperAdmin</option>
              <option value="Lecturer">Lecturer</option>
              <option value="Mentor">Tentor (Mentor)</option>
              <option value="User">Student (User)</option>
            </select>
          </div>

          <div style={s.selectWrap}>
            <span style={s.selectLabel}>Status:</span>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={s.select}
            >
              <option value="all">Semua Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table Container */}
      <div className="glass-panel" style={s.tableContainer}>
        {loading ? (
          <div style={s.loadingState}>
            <RefreshCw size={24} style={{ animation: 'spin 1.2s linear infinite' }} />
            <p style={{ marginTop: '12px' }}>Memuat daftar user...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={s.emptyState}>
            <Users size={40} color="var(--grey)" />
            <h4 style={{ marginTop: '16px', color: '#ffffff' }}>Tidak ada user ditemukan</h4>
            <p style={{ fontSize: '0.85rem' }}>Silakan sesuaikan filter pencarian atau tambahkan user baru.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr style={s.thRow}>
                  <th style={s.th}>Nama Lengkap & Info</th>
                  <th style={s.th}>Username</th>
                  <th style={s.th}>Role</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Terdaftar Pada</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.uuid_user} className="user-tr">
                    <td style={s.td}>
                      <div style={s.userInfoWrap}>
                        <div style={s.avatarPlaceholder}>
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={s.userFullName}>{user.full_name}</span>
                          <span style={s.userEmail}>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>
                      <span style={s.usernameTxt}>@{user.username}</span>
                    </td>
                    <td style={s.td}>
                      <span style={{
                        ...s.roleBadge,
                        backgroundColor: getRoleBadgeColor(user.role) + '15',
                        border: `1px solid ${getRoleBadgeColor(user.role)}30`,
                        color: getRoleBadgeColor(user.role)
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={{
                        ...s.statusBadge,
                        backgroundColor: getStatusBadgeColor(user.status) + '15',
                        border: `1px solid ${getStatusBadgeColor(user.status)}30`,
                        color: getStatusBadgeColor(user.status)
                      }}>
                        {user.status}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={s.dateTxt}>{formatDate(user.created_at)}</span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <div style={s.actionBtnGroup}>
                        <button 
                          onClick={() => handleOpenEditModal(user)} 
                          style={s.editBtn}
                          title="Edit User"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleOpenDeleteConfirm(user)} 
                          style={s.deleteBtn}
                          title="Hapus User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <Portal>
          <div style={s.modalOverlay}>
            <div className="glass-panel" style={s.modalContent}>
              <div style={s.modalHeader}>
                <h3>Tambah User Baru</h3>
                <button style={s.modalCloseBtn} onClick={() => setIsAddModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              {formError && (
                <div style={s.modalError}>
                  <AlertTriangle size={16} />
                  <span>{formError}</span>
                </div>
              )}
              <form onSubmit={handleCreateUser} style={s.form}>
                <div style={s.formGroup}>
                  <label style={s.label}>Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    style={s.input}
                    required
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Username</label>
                  <input 
                    type="text" 
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="Contoh: budis123"
                    style={s.input}
                    required
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Email</label>
                  <input 
                    type="email" 
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Contoh: budi@gmail.com"
                    style={s.input}
                    required
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Hak Akses (Role)</label>
                  <select 
                    value={formRole} 
                    onChange={(e: any) => setFormRole(e.target.value)}
                    style={s.input}
                  >
                    <option value="User">Student (User)</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Mentor">Tentor (Mentor)</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </select>
                </div>
                <div style={s.modalFooter}>
                  <button 
                    type="button" 
                    onClick={() => setIsAddModalOpen(false)} 
                    style={s.cancelBtn}
                    disabled={formLoading}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    style={s.submitBtn}
                    disabled={formLoading}
                  >
                    {formLoading ? 'Memproses...' : 'Simpan Akun'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <Portal>
          <div style={s.modalOverlay}>
            <div className="glass-panel" style={s.modalContent}>
              <div style={s.modalHeader}>
                <h3>Ubah Data User</h3>
                <button style={s.modalCloseBtn} onClick={() => setIsEditModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              {formError && (
                <div style={s.modalError}>
                  <AlertTriangle size={16} />
                  <span>{formError}</span>
                </div>
              )}
              <form onSubmit={handleUpdateUser} style={s.form}>
                <div style={s.formGroup}>
                  <label style={s.label}>Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    style={s.input}
                    required
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Username</label>
                  <input 
                    type="text" 
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    style={s.input}
                    required
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Email</label>
                  <input 
                    type="email" 
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    style={s.input}
                    required
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Hak Akses (Role)</label>
                  <select 
                    value={formRole} 
                    onChange={(e: any) => setFormRole(e.target.value)}
                    style={s.input}
                  >
                    <option value="User">Student (User)</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Mentor">Tentor (Mentor)</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Status Akun</label>
                  <select 
                    value={formStatus} 
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    style={s.input}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div style={s.modalFooter}>
                  <button 
                    type="button" 
                    onClick={() => setIsEditModalOpen(false)} 
                    style={s.cancelBtn}
                    disabled={formLoading}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    style={s.submitBtn}
                    disabled={formLoading}
                  >
                    {formLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && selectedUser && (
        <Portal>
          <div style={s.modalOverlay}>
            <div className="glass-panel" style={{ ...s.modalContent, maxWidth: '400px' }}>
              <div style={s.modalHeader}>
                <h3 style={{ color: '#FF5252' }}>Konfirmasi Hapus</h3>
                <button style={s.modalCloseBtn} onClick={() => setIsDeleteConfirmOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ padding: '8px 0 20px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <ShieldAlert size={36} color="#FF5252" style={{ flexShrink: 0 }} />
                  <p style={{ color: 'var(--silver)', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                    Apakah Anda yakin ingin menghapus user <strong>{selectedUser.full_name}</strong> (<strong>@{selectedUser.username}</strong>)?
                    Tindakan ini tidak dapat dibatalkan dan akan menghapus akun tersebut dari Supabase Auth serta database relasional.
                  </p>
                </div>
              </div>
              <div style={s.modalFooter}>
                <button 
                  onClick={() => setIsDeleteConfirmOpen(false)} 
                  style={s.cancelBtn}
                  disabled={formLoading}
                >
                  Batal
                </button>
                <button 
                  onClick={handleDeleteUser} 
                  style={{ ...s.submitBtn, backgroundColor: '#ef4444' }}
                  disabled={formLoading}
                >
                  {formLoading ? 'Menghapus...' : 'Hapus Permanen'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .user-tr {
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          transition: background-color 0.2s ease;
        }
        .user-tr:hover {
          background-color: rgba(255, 255, 255, 0.01) !important;
        }
      `}</style>
    </div>
  );
}

// Helper colors for badges
function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'SuperAdmin': return '#ef4444';
    case 'Lecturer': return '#9C27B0';
    case 'Mentor': return '#FFA826';
    default: return '#4196F0';
  }
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'Active': return '#10B981';
    case 'Pending': return '#F59E0B';
    default: return '#EF4444';
  }
}

const s: Record<string, React.CSSProperties> = {
  container: {
    padding: '8px 0',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#ffffff',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--grey-blue)',
    marginTop: '4px',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'rgba(255, 255, 255, 0.03)',
    color: 'var(--silver)',
    fontSize: '0.82rem',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  addUserBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, var(--navy), var(--m-blue))',
    color: '#ffffff',
    fontSize: '0.82rem',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    boxShadow: '0 4px 14px 0 rgba(6, 99, 199, 0.3)',
    transition: 'all 0.2s ease',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '8px',
    color: '#10B981',
    fontSize: '0.85rem',
    marginBottom: '20px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '14px 18px',
    background: 'rgba(244, 67, 54, 0.08)',
    border: '1px solid rgba(244, 67, 54, 0.2)',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  errorContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  errorTitle: {
    fontSize: '0.85rem',
    color: '#FF5252',
    fontWeight: 600,
  },
  errorMsg: {
    fontSize: '0.8rem',
    color: 'var(--grey-blue)',
    marginTop: '2px',
  },
  retryBtn: {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  
  // Temporary Pass Info Box
  infoBox: {
    background: 'rgba(255, 168, 38, 0.07)',
    border: '1px solid rgba(255, 168, 38, 0.25)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
  },
  infoBoxHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  closeInfoBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  infoBoxDesc: {
    fontSize: '0.78rem',
    color: 'var(--grey-blue)',
    margin: '0 0 12px 0',
  },
  credentialsGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    background: 'rgba(0, 0, 0, 0.2)',
    padding: '12px 14px',
    borderRadius: '8px',
  },
  credentialRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    fontSize: '0.8rem',
  },
  credentialLabel: {
    color: 'var(--grey-blue)',
  },
  credentialVal: {
    color: '#ffffff',
  },
  passwordCode: {
    background: 'rgba(255, 255, 255, 0.08)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    color: '#FFA826',
    fontWeight: 'bold',
  },
  copyBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    padding: '4px 6px',
    cursor: 'pointer',
    color: 'var(--silver)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter Panel
  filterPanel: {
    padding: '16px 20px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  searchWrap: {
    position: 'relative',
    flex: 1,
    minWidth: '280px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px 8px 36px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '0.82rem',
    color: '#ffffff',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
  },
  filterGroup: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  selectWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  selectLabel: {
    fontSize: '0.8rem',
    color: 'var(--grey-blue)',
  },
  select: {
    padding: '8px 24px 8px 12px',
    background: 'rgba(25, 25, 25, 0.6)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '0.82rem',
    color: '#ffffff',
    outline: 'none',
    cursor: 'pointer',
  },

  // Table
  tableContainer: {
    padding: '12px',
    overflow: 'hidden',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
    color: 'var(--grey-blue)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
    textAlign: 'center',
    color: 'var(--grey-blue)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  th: {
    padding: '12px 16px',
    fontSize: '0.78rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'var(--grey-blue)',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
    transition: 'background-color 0.2s ease',
  },
  td: {
    padding: '14px 16px',
    verticalAlign: 'middle',
  },
  userInfoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatarPlaceholder: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--navy), var(--m-blue))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    color: '#ffffff',
    fontSize: '0.85rem',
  },
  userFullName: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#ffffff',
  },
  userEmail: {
    fontSize: '0.75rem',
    color: 'var(--grey-blue)',
    marginTop: '2px',
  },
  usernameTxt: {
    fontSize: '0.8rem',
    color: 'var(--azure)',
    fontFamily: 'monospace',
  },
  roleBadge: {
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '0.72rem',
    fontWeight: 600,
    display: 'inline-block',
  },
  statusBadge: {
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '0.72rem',
    fontWeight: 600,
    display: 'inline-block',
  },
  dateTxt: {
    fontSize: '0.78rem',
    color: 'var(--grey)',
  },
  actionBtnGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  editBtn: {
    background: 'rgba(65, 150, 240, 0.1)',
    border: '1px solid rgba(65, 150, 240, 0.2)',
    color: 'var(--azure)',
    borderRadius: '6px',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  deleteBtn: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    borderRadius: '6px',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Modals
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '480px',
    padding: '24px',
    position: 'relative',
    background: 'rgba(25, 25, 27, 0.95)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '12px',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--grey-blue)',
    cursor: 'pointer',
  },
  modalError: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    color: '#ef4444',
    fontSize: '0.8rem',
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--silver)',
  },
  input: {
    padding: '10px 12px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '0.85rem',
    color: '#ffffff',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
  },
  cancelBtn: {
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-color)',
    color: 'var(--silver)',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, var(--navy), var(--m-blue))',
    border: 'none',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 14px 0 rgba(6, 99, 199, 0.3)',
  }
};
