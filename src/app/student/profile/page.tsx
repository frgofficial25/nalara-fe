"use client";

import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Edit2, Loader2, AlertCircle, CheckCircle2, Lock, Eye, EyeOff, Clock } from 'lucide-react';
import { apiGet, apiPut } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

interface ProfileData {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  avatar_url?: string;
  created_at?: string;
}

function getAuthHeaders() {
  const token = getStoredToken();
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) headers['x-api-key'] = apiKey;
  else if (token) headers['x-api-key'] = token;
  return { token: token || undefined, headers };
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ full_name: '', username: '' });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true); setError(null);
      const auth = getAuthHeaders();
      const res = await apiGet<any>('/api/profile', { token: auth.token, headers: auth.headers });
      const d = res.data || res;
      const mappedName = d.nama_lengkap || d.full_name || '';
      const mappedAvatar = d.foto_profile || d.avatar_url || null;
      setProfile({
        id: d.uuid_user || d.id || '',
        full_name: mappedName,
        username: d.username || '',
        email: d.email || '',
        role: d.role || 'User',
        avatar_url: mappedAvatar,
        created_at: d.created_at || d.tanggal_bergabung,
      });
      setForm({ full_name: mappedName, username: d.username || '' });
    } catch (e: any) { setError(e.message || 'Gagal memuat profil.'); }
    finally { setLoading(false); }
  };

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const auth = getAuthHeaders();
      await apiPut('/api/profile', { 
        full_name: form.full_name, 
        nama_lengkap: form.full_name,
        username: form.username 
      }, { token: auth.token, headers: auth.headers });
      setSaved(true); setEditing(false);
      fetchProfile();
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setError(e.message || 'Gagal menyimpan profil.'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!passwordForm.old_password) {
      setError('Password lama wajib diisi.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('Password baru dan konfirmasi tidak cocok.');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setError('Password baru minimal 8 karakter.');
      return;
    }

    setChangingPassword(true);
    try {
      const auth = getAuthHeaders();
      await apiPut('/api/profile/password', {
        password_lama: passwordForm.old_password,
        password_baru: passwordForm.new_password,
        konfirmasi_password_baru: passwordForm.confirm_password,
      }, {
        token: auth.token,
        headers: auth.headers
      });

      setSaved(true);
      setShowPasswordForm(false);
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah password.');
    } finally {
      setChangingPassword(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const initials = profile?.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div style={s.page}>
      <style>{`
        .profile-grid-container {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .profile-grid-container {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Profil Saya</h1>
          <p style={s.pageSubtitle}>Kelola informasi akun dan data pribadi Anda</p>
        </div>
      </div>

      {error && <div style={s.errorBanner}><AlertCircle size={16} /><span>{error}</span></div>}
      {saved && <div style={s.successBanner}><CheckCircle2 size={16} /><span>Profil berhasil disimpan!</span></div>}

      {loading ? (
        <div style={s.centered}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /><p>Memuat profil...</p></div>
      ) : profile && (
        <div className="profile-grid-container">
          {/* Column 1: Info Card */}
          <div style={s.profileCard} className="glass-panel">
             {/* Avatar & basic info */}
             <div style={s.avatarSection}>
               <div style={s.avatarWrap}>
                 {profile.avatar_url ? (
                   <img src={profile.avatar_url} alt="Avatar" style={s.avatarImg} />
                 ) : (
                   <div style={s.avatarPlaceholder}>{initials}</div>
                 )}
               </div>
               <h2 style={s.profileName}>{profile.full_name}</h2>
               <span style={s.roleBadge}>{profile.role}</span>
             </div>

             {/* Info Rows */}
             <div style={s.infoSection}>
               <div style={s.infoRow}>
                 <div style={s.infoIcon}><User size={16} color="var(--azure)" /></div>
                 <div style={s.infoContent}>
                   <span style={s.infoLabel}>Username</span>
                   <span style={s.infoValue}>@{profile.username}</span>
                 </div>
               </div>
               <div style={s.infoRow}>
                 <div style={s.infoIcon}><Mail size={16} color="var(--azure)" /></div>
                 <div style={s.infoContent}>
                   <span style={s.infoLabel}>Email</span>
                   <span style={s.infoValue}>{profile.email}</span>
                 </div>
               </div>
               <div style={s.infoRow}>
                 <div style={s.infoIcon}><Shield size={16} color="var(--azure)" /></div>
                 <div style={s.infoContent}>
                   <span style={s.infoLabel}>Role</span>
                   <span style={s.infoValue}>{profile.role}</span>
                 </div>
               </div>
               {profile.created_at && (
                 <div style={s.infoRow}>
                   <div style={s.infoIcon}><Clock size={16} color="var(--azure)" /></div>
                   <div style={s.infoContent}>
                     <span style={s.infoLabel}>Tanggal Bergabung</span>
                     <span style={s.infoValue}>{new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                   </div>
                 </div>
               )}
             </div>
          </div>

          {/* Column 2: Actions / Settings */}
          <div style={s.actionsColumn}>
            {/* Edit Profil Card */}
            <div style={s.actionCard} className="glass-panel">
              <div style={s.actionCardHeader}>
                <h3 style={s.actionCardTitle}>Informasi Pribadi</h3>
              </div>

              <p style={s.actionCardDesc}>
                Nama lengkap dan username Anda digunakan di forum, pengumpulan tugas, dan leaderboard kuis. Hubungi pihak administrasi jika terdapat kesalahan data.
              </p>
            </div>

            {/* Keamanan Card */}
            <div style={s.actionCard} className="glass-panel">
              <div style={s.actionCardHeader}>
                <h3 style={s.actionCardTitle}>Keamanan Akun</h3>
                {!showPasswordForm && (
                  <button onClick={() => setShowPasswordForm(true)} style={s.editBtn}>
                    <Lock size={12} /><span>Ganti Password</span>
                  </button>
                )}
              </div>

              {showPasswordForm ? (
                <form onSubmit={handleChangePassword} style={s.form}>
                  <div style={s.fg}>
                    <label style={s.label}>Password Lama</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.old_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                      placeholder="Masukkan password lama..."
                      style={s.input}
                    />
                  </div>
                  <div style={s.fg}>
                    <label style={s.label}>Password Baru</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        placeholder="Min. 8 karakter (kapital, angka, simbol)"
                        style={{ ...s.input, width: '100%', paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--grey-blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div style={s.fg}>
                    <label style={s.label}>Konfirmasi Password Baru</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      placeholder="Ulangi password baru..."
                      style={s.input}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button type="button" onClick={() => { setShowPasswordForm(false); setPasswordForm({ old_password: '', new_password: '', confirm_password: '' }); }} style={s.btnGhost}>Batal</button>
                    <button type="submit" disabled={changingPassword} style={s.btnPrimary}>{changingPassword ? 'Memproses...' : 'Perbarui Password'}</button>
                  </div>
                </form>
              ) : (
                <p style={s.actionCardDesc}>
                  Untuk menjaga keamanan akun Anda, pastikan password Anda kuat dengan kombinasi huruf besar, kecil, angka, dan simbol.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '4px 0', color: '#E2E8F0' },
  pageHeader: { marginBottom: 24 },
  pageTitle: { fontSize: '1.75rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', margin: 0 },
  pageSubtitle: { fontSize: '0.85rem', color: 'var(--grey-blue)', marginTop: 4, margin: 0 },
  errorBanner: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 16px', color: '#EF4444', marginBottom: 16 },
  successBanner: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: 8, padding: '10px 16px', color: '#00C853', marginBottom: 16 },
  centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--grey-blue)', gap: 12 },
  
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
    border: '3px solid rgba(6, 113, 224, 0.3)',
  },
  avatarPlaceholder: {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #0671E0, #7C3AED)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 700,
    color: '#fff',
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
    background: 'rgba(6,113,224,0.12)',
    color: 'var(--azure)',
    border: '1px solid rgba(6,113,224,0.2)',
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
    gap: '24px',
  },
  actionCard: {
    padding: '24px',
    borderRadius: 16,
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
  form: { display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16 },
  fg: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-blue)' },
  input: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E2E8F0', padding: '9px 13px', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', width: '100%' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--azure, #0671E0)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 7, background: 'transparent', color: 'var(--grey-blue)', border: '1px solid rgba(255,255,255,0.12)', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
};
