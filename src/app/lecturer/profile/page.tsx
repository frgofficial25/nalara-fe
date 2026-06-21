"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  User, Camera, Save, Lock, Eye, EyeOff,
  Loader2, AlertCircle, CheckCircle2, Mail, Shield, Clock
} from 'lucide-react';
import { apiGet, apiPut, apiUpload } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import type { UserProfile } from '@/types/lecturer.types';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', full_name: '' });
  const [saving, setSaving] = useState(false);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ new_password: '', confirm_password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAuthHeaders = () => {
    const token = getStoredToken();
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    } else if (token) {
      headers['x-api-key'] = token;
    }
    return { token: token || undefined, headers };
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const auth = getAuthHeaders();
      const response = await apiGet<{ success: boolean; data: UserProfile } | UserProfile>('/api/profile', {
        token: auth.token,
        headers: auth.headers
      });

      let data: UserProfile;
      if ('data' in response && (response as { data: UserProfile }).data) {
        data = (response as { data: UserProfile }).data;
      } else {
        data = response as UserProfile;
      }

      setProfile(data);
      setEditForm({
        username: data.username || '',
        full_name: data.full_name || '',
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal memuat profil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSaveProfile = async () => {
    clearMessages();
    if (!editForm.username && !editForm.full_name) return;

    setSaving(true);
    try {
      const auth = getAuthHeaders();
      await apiPut('/api/profile', {
        username: editForm.username,
        full_name: editForm.full_name,
      }, {
        token: auth.token,
        headers: auth.headers
      });

      setSuccess('Profil berhasil diperbarui!');
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('Password baru dan konfirmasi tidak cocok.');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    setChangingPassword(true);
    try {
      const auth = getAuthHeaders();
      await apiPut('/api/profile/password', {
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password,
      }, {
        token: auth.token,
        headers: auth.headers
      });

      setSuccess('Password berhasil diubah!');
      setShowPasswordForm(false);
      setPasswordForm({ new_password: '', confirm_password: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clearMessages();
    setUploadingAvatar(true);
    try {
      const auth = getAuthHeaders();
      const formData = new FormData();
      formData.append('file', file);

      await apiUpload('/api/profile/avatar', formData, {
        token: auth.token,
        headers: auth.headers
      });

      setSuccess('Foto profil berhasil diperbarui!');
      fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengupload foto.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'superadmin': return { bg: 'rgba(244, 67, 54, 0.1)', text: '#FF5252', border: 'rgba(244, 67, 54, 0.2)' };
      case 'lecture': return { bg: 'rgba(65, 150, 240, 0.1)', text: '#4196F0', border: 'rgba(65, 150, 240, 0.2)' };
      case 'mentor': return { bg: 'rgba(255, 145, 0, 0.1)', text: '#FF9100', border: 'rgba(255, 145, 0, 0.2)' };
      default: return { bg: 'rgba(0, 200, 83, 0.1)', text: '#00C853', border: 'rgba(0, 200, 83, 0.2)' };
    }
  };

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <Loader2 size={36} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ marginTop: 12, color: 'var(--grey-blue)' }}>Loading profile...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const roleStyle = getRoleColor(profile?.role);

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.topHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={s.title}>My Profile</h1>
          </div>
          <p style={s.subtitle}>Manage your account information, password, and avatar</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={s.errorAlert}>
          <AlertCircle size={18} color="#FF5252" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div style={s.successAlert}>
          <CheckCircle2 size={18} color="#00C853" />
          <span>{success}</span>
        </div>
      )}

      <div style={s.mainGrid}>
        {/* Profile Card */}
        <div className="glass-panel" style={s.profileCard}>
          {/* Avatar Section */}
          <div style={s.avatarSection}>
            <div style={s.avatarWrap}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" style={s.avatarImg} />
              ) : (
                <div style={s.avatarPlaceholder}>
                  <User size={40} color="var(--grey-blue)" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={s.cameraBtn}
                disabled={uploadingAvatar}
                title="Change Photo"
              >
                {uploadingAvatar ? (
                  <Loader2 size={14} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Camera size={14} color="#fff" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
            </div>
            <h2 style={s.profileName}>{profile?.full_name || 'Unknown'}</h2>
            <span style={{
              ...s.roleBadge,
              background: roleStyle.bg,
              color: roleStyle.text,
              border: `1px solid ${roleStyle.border}`,
            }}>
              {profile?.role || 'User'}
            </span>
          </div>

          {/* Info Rows */}
          <div style={s.infoSection}>
            <div style={s.infoRow}>
              <div style={s.infoIcon}><Mail size={16} color="var(--azure)" /></div>
              <div style={s.infoContent}>
                <span style={s.infoLabel}>Email</span>
                <span style={s.infoValue}>{profile?.email || '-'}</span>
              </div>
            </div>
            <div style={s.infoRow}>
              <div style={s.infoIcon}><User size={16} color="#E040FB" /></div>
              <div style={s.infoContent}>
                <span style={s.infoLabel}>Username</span>
                <span style={s.infoValue}>@{profile?.username || '-'}</span>
              </div>
            </div>
            <div style={s.infoRow}>
              <div style={s.infoIcon}><Shield size={16} color="#FF9100" /></div>
              <div style={s.infoContent}>
                <span style={s.infoLabel}>Status</span>
                <span style={{ ...s.infoValue, color: profile?.status === 'Active' ? '#00C853' : 'var(--grey-blue)' }}>
                  {profile?.status || '-'}
                </span>
              </div>
            </div>
            {profile?.last_login_at && (
              <div style={s.infoRow}>
                <div style={s.infoIcon}><Clock size={16} color="var(--grey-blue)" /></div>
                <div style={s.infoContent}>
                  <span style={s.infoLabel}>Last Login</span>
                  <span style={s.infoValue}>
                    {new Date(profile.last_login_at).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit / Actions Column */}
        <div style={s.actionsColumn}>
          {/* Edit Profile Card */}
          <div className="glass-panel" style={s.actionCard}>
            <div style={s.actionCardHeader}>
              <h3 style={s.actionCardTitle}>Edit Profile</h3>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} style={s.editBtn}>Edit</button>
              )}
            </div>
            {isEditing ? (
              <div style={s.editForm}>
                <div style={s.formGroup}>
                  <label style={s.label}>Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    style={s.input}
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Full Name</label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    style={s.input}
                  />
                </div>
                <div style={s.editBtnRow}>
                  <button onClick={() => setIsEditing(false)} style={s.cancelBtn}>Cancel</button>
                  <button onClick={handleSaveProfile} disabled={saving} style={{ ...s.saveBtn, opacity: saving ? 0.6 : 1 }}>
                    <Save size={14} />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <p style={s.actionCardDesc}>
                Update your username and display name to personalize your account.
              </p>
            )}
          </div>

          {/* Change Password Card */}
          <div className="glass-panel" style={s.actionCard}>
            <div style={s.actionCardHeader}>
              <h3 style={s.actionCardTitle}>Security</h3>
              {!showPasswordForm && (
                <button onClick={() => setShowPasswordForm(true)} style={s.editBtn}>
                  <Lock size={12} />
                  <span>Change Password</span>
                </button>
              )}
            </div>
            {showPasswordForm ? (
              <form onSubmit={handleChangePassword} style={s.editForm}>
                <div style={s.formGroup}>
                  <label style={s.label}>New Password</label>
                  <div style={s.passwordInputWrap}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      placeholder="Min. 8 characters, uppercase, number, symbol"
                      style={{ ...s.input, paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={s.eyeBtn}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    placeholder="Repeat new password"
                    style={s.input}
                  />
                </div>
                <div style={s.editBtnRow}>
                  <button type="button" onClick={() => { setShowPasswordForm(false); setPasswordForm({ new_password: '', confirm_password: '' }); }} style={s.cancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" disabled={changingPassword} style={{ ...s.saveBtn, opacity: changingPassword ? 0.6 : 1 }}>
                    <Lock size={14} />
                    <span>{changingPassword ? 'Changing...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <p style={s.actionCardDesc}>
                Ensure your account is secure. Password must contain uppercase, number, and special character.
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    padding: '4px 0',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
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
  apiBadge: {
    fontSize: '0.72rem',
    fontWeight: 700,
    background: 'rgba(0, 200, 83, 0.12)',
    color: '#00C853',
    padding: '4px 10px',
    borderRadius: '99px',
    border: '1px solid rgba(0, 200, 83, 0.25)',
  },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 18px',
    background: 'rgba(244, 67, 54, 0.08)',
    border: '1px solid rgba(244, 67, 54, 0.2)',
    borderRadius: '8px',
    marginBottom: '20px',
    color: '#FF5252',
    fontSize: '0.85rem',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 18px',
    background: 'rgba(0, 200, 83, 0.08)',
    border: '1px solid rgba(0, 200, 83, 0.2)',
    borderRadius: '8px',
    marginBottom: '20px',
    color: '#00C853',
    fontSize: '0.85rem',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '360px 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  profileCard: {
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
  },
  avatarSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  avatarWrap: {
    position: 'relative',
    width: '96px',
    height: '96px',
  },
  avatarImg: {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid rgba(65, 150, 240, 0.3)',
  },
  avatarPlaceholder: {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.05)',
    border: '3px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--azure)',
    border: '3px solid rgba(25, 25, 25, 0.97)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  profileName: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    textAlign: 'center',
  },
  roleBadge: {
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: '99px',
    textTransform: 'uppercase',
  },
  infoSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: '20px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
  },
  infoIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  infoLabel: {
    fontSize: '0.72rem',
    color: 'var(--grey)',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: '0.88rem',
    color: '#fff',
    fontWeight: 500,
  },
  actionsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  actionCard: {
    padding: '24px',
  },
  actionCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  actionCardTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  actionCardDesc: {
    fontSize: '0.85rem',
    color: 'var(--grey-blue)',
    lineHeight: 1.5,
    margin: 0,
  },
  editBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    background: 'rgba(255,255,255,0.02)',
    color: 'var(--azure)',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  editForm: {
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
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--grey-blue)',
  },
  input: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
  },
  passwordInputWrap: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    color: 'var(--grey-blue)',
    cursor: 'pointer',
  },
  editBtnRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '8px',
  },
  cancelBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--silver)',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, var(--navy), var(--m-blue))',
    color: '#ffffff',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
