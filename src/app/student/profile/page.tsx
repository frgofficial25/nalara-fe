"use client";

import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Edit2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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
      setProfile({
        id: d.uuid_user || d.id || '',
        full_name: d.full_name || '',
        username: d.username || '',
        email: d.email || '',
        role: d.role || 'User',
        avatar_url: d.avatar_url,
        created_at: d.created_at || d.tanggal_bergabung,
      });
      setForm({ full_name: d.full_name || '', username: d.username || '' });
    } catch (e: any) { setError(e.message || 'Gagal memuat profil.'); }
    finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const auth = getAuthHeaders();
      await apiPut('/api/profile', { full_name: form.full_name, username: form.username }, { token: auth.token, headers: auth.headers });
      setSaved(true); setEditing(false);
      fetchProfile();
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setError(e.message || 'Gagal menyimpan profil.'); }
    finally { setSaving(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const initials = profile?.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div style={s.page}>
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
        <div style={s.card} className="glass-panel">
          {/* Avatar & basic info */}
          <div style={s.avatarRow}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" style={s.avatar} />
            ) : (
              <div style={s.avatarFallback}>{initials}</div>
            )}
            <div>
              <h2 style={s.name}>{profile.full_name}</h2>
              <span style={s.roleBadge}>{profile.role}</span>
            </div>
          </div>

          {/* Info rows */}
          <div style={s.infoGrid}>
            {[
              { icon: <User size={15} color="var(--azure)" />, label: 'Username', value: `@${profile.username}` },
              { icon: <Mail size={15} color="var(--azure)" />, label: 'Email', value: profile.email },
              { icon: <Shield size={15} color="var(--azure)" />, label: 'Role', value: profile.role },
              profile.created_at && { icon: null, label: 'Bergabung', value: new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) },
            ].filter(Boolean).map((item: any) => (
              <div key={item.label} style={s.infoRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
                  {item.icon}
                  <span style={s.infoLabel}>{item.label}</span>
                </div>
                <span style={s.infoValue}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Edit */}
          {!editing ? (
            <button onClick={() => setEditing(true)} style={s.btnEdit}>
              <Edit2 size={14} /><span>Edit Profil</span>
            </button>
          ) : (
            <form onSubmit={handleSave} style={s.form}>
              <div style={s.fg}>
                <label style={s.label}>Nama Lengkap</label>
                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} style={s.input} required />
              </div>
              <div style={s.fg}>
                <label style={s.label}>Username</label>
                <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} style={s.input} required />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setEditing(false)} style={s.btnGhost}>Batal</button>
                <button type="submit" disabled={saving} style={s.btnPrimary}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          )}
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
  card: { borderRadius: 16, padding: 28, maxWidth: 580, display: 'flex', flexDirection: 'column', gap: 24 },
  avatarRow: { display: 'flex', alignItems: 'center', gap: 18 },
  avatar: { width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(6,113,224,0.3)' },
  avatarFallback: { width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #0671E0, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#fff' },
  name: { fontSize: '1.3rem', fontWeight: 700, color: '#fff', margin: '0 0 6px' },
  roleBadge: { fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: 'rgba(6,113,224,0.12)', color: 'var(--azure)', border: '1px solid rgba(6,113,224,0.2)' },
  infoGrid: { display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20 },
  infoRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  infoLabel: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--grey-blue)' },
  infoValue: { fontSize: '0.9rem', color: '#fff' },
  btnEdit: { display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(6,113,224,0.1)', border: '1px solid rgba(6,113,224,0.2)', color: 'var(--azure)', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', alignSelf: 'flex-start' },
  form: { display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16 },
  fg: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-blue)' },
  input: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E2E8F0', padding: '9px 13px', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--azure, #0671E0)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 7, background: 'transparent', color: 'var(--grey-blue)', border: '1px solid rgba(255,255,255,0.12)', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
};
