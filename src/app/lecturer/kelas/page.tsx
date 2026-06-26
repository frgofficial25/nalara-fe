"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, Loader2, AlertCircle, Plus, X, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

interface ClassItem {
  id: string;
  name: string;
  created_at?: string;
  modules_count?: number;
}

export default function KelasListPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = getStoredToken();
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    const headers: Record<string, string> = {};
    if (apiKey) headers['x-api-key'] = apiKey;
    else if (token) headers['x-api-key'] = token;
    return { token: token || undefined, headers };
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const auth = getAuthHeaders();
      const res = await apiGet<ClassItem[] | { success: boolean; data: ClassItem[] }>('/api/classes', {
        token: auth.token,
        headers: auth.headers,
      });
      let list: ClassItem[] = [];
      if (Array.isArray(res)) list = res;
      else if (res && 'data' in res && Array.isArray(res.data)) list = res.data;
      setClasses(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <div style={s.container}>
      <div style={s.topHeader}>
        <div>
          <h1 style={s.title}>Kelas</h1>
          <p style={s.subtitle}>Kelola kelas yang kamu buat</p>
        </div>
        <button onClick={() => router.push('/lecturer/kelas/create')} style={s.createBtn}>
          <Plus size={16} />
          <span>Buat Kelas</span>
        </button>
      </div>

      {error && (
        <div style={s.errorAlert}>
          <AlertCircle size={20} color="#FF5252" />
          <span style={s.errorMsg}>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={s.loadingWrap}>
          <Loader2 size={36} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ marginTop: 12, color: 'var(--grey-blue)' }}>Memuat kelas...</span>
        </div>
      ) : classes.length === 0 ? (
        <div style={s.emptyState}>
          <BookOpen size={48} color="var(--grey)" />
          <h3 style={{ marginTop: 16, fontSize: '1.1rem', color: '#fff' }}>Belum ada kelas</h3>
          <p style={{ color: 'var(--grey-blue)', fontSize: '0.85rem' }}>Buat kelas baru untuk memulai.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {classes.map((c) => (
            <div key={c.id} className="glass-panel" style={s.card} onClick={() => router.push(`/lecturer/kelas/${c.id}`)}>
              <div style={s.cardHeader}>
                <h3 style={s.classTitle}>{c.name}</h3>
                <span style={s.modulesBadge}>Modul: {c.modules_count ?? 0}</span>
              </div>
              <div style={s.cardBody}>
                <span style={s.createdAt}>Dibuat: {c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}</span>
              </div>
              <div style={s.cardFooter}>
                <button style={s.detailBtn} onClick={(e) => { e.stopPropagation(); router.push(`/lecturer/kelas/${c.id}`); }}>
                  Lihat Detail
                  <X size={14} style={{ marginLeft: 4 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { padding: '12px 0 40px 0', maxWidth: '1200px', margin: '0 auto' },
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
  title: { fontSize: '1.75rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-display)', letterSpacing: '-0.5px', margin: 0 },
  subtitle: { fontSize: '0.9rem', color: '#9CA3AF', margin: 0 },
  createBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, var(--navy), var(--m-blue))', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' },
  errorAlert: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', background: 'rgba(244, 67, 54, 0.08)', border: '1px solid rgba(244, 67, 54, 0.2)', borderRadius: '8px', marginBottom: '20px' },
  errorMsg: { color: '#FF5252' },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', background: 'rgba(30,30,30,0.3)', border: '1px dashed var(--border-color)', borderRadius: '16px', textAlign: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  card: { padding: '24px', background: 'rgba(30,30,30,0.45)', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  classTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 },
  modulesBadge: { fontSize: '0.75rem', color: '#94A3B8', background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: '6px' },
  cardBody: { flex: 1 },
  createdAt: { fontSize: '0.85rem', color: '#94A3B8' },
  cardFooter: { marginTop: '12px' },
  detailBtn: { display: 'flex', alignItems: 'center', background: '#3B82F6', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' },
};
