"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, BookOpen, Layers, Plus, Trash2, FileText,
  ChevronRight, X, AlertCircle, Loader2, Upload, Eye,
  Download, Package
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Pembelajaran {
  id: string;
  uuid_pembelajaran?: string;
  title: string;
  description?: string;
  slug?: string;
  createdAt?: string;
}

interface Modul {
  id: string;
  uuid_modul?: string;
  title: string;
  description?: string;
  difficulty?: string;
  slug?: string;
  createdAt?: string;
}

interface Tugas {
  id: string;
  uuid_tugas?: string;
  title: string;
  type?: string;
  slug?: string;
  order?: number;
  file_url?: string;
  createdAt?: string;
}

// ─── Auth Helper ──────────────────────────────────────────────────────────────
function getAuth() {
  const token = getStoredToken();
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  } else if (token) {
    headers['x-api-key'] = token;
  }
  return { token: token ?? undefined, headers };
}

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────
function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={overlay}>
      <div style={{ ...modal, maxWidth: 400 }}>
        <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Trash2 size={22} color="#ef4444" />
          </div>
          <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: '0 0 8px' }}>Konfirmasi Hapus</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ ...btnBase, flex: 1, background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>Batal</button>
          <button onClick={onConfirm} style={{ ...btnBase, flex: 1, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff' }}>Hapus</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Materi Modal ──────────────────────────────────────────────────────────
function AddMateriModal({
  modulId,
  pembelajaranId,
  onSuccess,
  onClose,
}: {
  modulId: string;
  pembelajaranId: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'Reading' | 'Video' | 'CaseStudy' | 'Practice'>('Reading');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      await apiPost('/api/tugas', {
        title,
        type,
        uuid_pembelajaran: pembelajaranId,
        uuid_modul: modulId,
      }, { token: auth.token, headers: auth.headers });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan materi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={modalHeader}>
          <h3 style={modalTitle}>Tambah Materi</h3>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>
        {error && (
          <div style={errBox}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={formGroup}>
            <label style={label}>Nama Materi</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Bacaan Bab 1 — Pengantar Akuntansi"
              style={input}
            />
          </div>
          <div style={formGroup}>
            <label style={label}>Tipe Materi</label>
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)} style={input}>
              <option value="Reading">Reading</option>
              <option value="Video">Video</option>
              <option value="CaseStudy">Case Study</option>
              <option value="Practice">Practice</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ ...btnBase, flex: 1, background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>Batal</button>
            <button type="submit" disabled={loading} style={{ ...btnBase, flex: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
              {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : 'Tambah Materi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Modul Modal ───────────────────────────────────────────────────────────
function AddModulModal({
  pembelajaranId,
  onSuccess,
  onClose,
}: {
  pembelajaranId: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      await apiPost('/api/modul', {
        title,
        description,
        difficulty,
        uuid_pembelajaran: pembelajaranId,
      }, { token: auth.token, headers: auth.headers });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat modul.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={modalHeader}>
          <h3 style={modalTitle}>Tambah Modul</h3>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>
        {error && (
          <div style={errBox}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={formGroup}>
            <label style={label}>Nama Modul</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Modul 1 — Pengantar Akuntansi"
              style={input}
            />
          </div>
          <div style={formGroup}>
            <label style={label}>Deskripsi (opsional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat modul..."
              style={{ ...input, minHeight: 80, resize: 'vertical' }}
            />
          </div>
          <div style={formGroup}>
            <label style={label}>Tingkat Kesulitan</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} style={input}>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ ...btnBase, flex: 1, background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>Batal</button>
            <button type="submit" disabled={loading} style={{ ...btnBase, flex: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
              {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : 'Buat Modul'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CourseDetailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('id') || '';

  const [course, setCourse] = useState<Pembelajaran | null>(null);
  const [moduls, setModuls] = useState<Modul[]>([]);
  const [tugasMap, setTugasMap] = useState<Record<string, Tugas[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddModul, setShowAddModul] = useState(false);
  const [addMateriForModul, setAddMateriForModul] = useState<string | null>(null);
  const [deleteModul, setDeleteModul] = useState<Modul | null>(null);
  const [deleteTugas, setDeleteTugas] = useState<{ tugas: Tugas; modulId: string } | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      setError(null);
      const auth = getAuth();
      const opts = { token: auth.token, headers: auth.headers };

      // Fetch course detail
      const courseRes = await apiGet<{ data?: Pembelajaran } | Pembelajaran>(
        `/api/pembelajaran/${courseId}`, opts
      );
      const courseData: Pembelajaran = ('data' in courseRes && courseRes.data)
        ? { ...courseRes.data, id: courseRes.data.uuid_pembelajaran || courseRes.data.id }
        : { ...(courseRes as Pembelajaran), id: (courseRes as any).uuid_pembelajaran || (courseRes as any).id };
      setCourse(courseData);

      // Fetch moduls for this course
      const modulRes = await apiGet<Modul[] | { data?: Modul[] }>(
        `/api/modul?uuid_pembelajaran=${courseId}`, opts
      );
      let modulList: Modul[] = Array.isArray(modulRes)
        ? modulRes
        : (modulRes as any).data ?? [];
      modulList = modulList.map(m => ({ ...m, id: m.uuid_modul || m.id }));
      setModuls(modulList);

      // Fetch tugas for each modul
      const newTugasMap: Record<string, Tugas[]> = {};
      await Promise.all(
        modulList.map(async (m) => {
          const tugasRes = await apiGet<Tugas[] | { data?: Tugas[] }>(
            `/api/tugas?uuid_pembelajaran=${courseId}&uuid_modul=${m.id}`, opts
          );
          let tugasList: Tugas[] = Array.isArray(tugasRes)
            ? tugasRes
            : (tugasRes as any).data ?? [];
          tugasList = tugasList.map(t => ({ ...t, id: t.uuid_tugas || t.id }));
          newTugasMap[m.id] = tugasList;
        })
      );
      setTugasMap(newTugasMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data kelas.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Delete Handlers ────────────────────────────────────────────────────────
  const confirmDeleteModul = async () => {
    if (!deleteModul) return;
    try {
      const auth = getAuth();
      await apiDelete(`/api/modul/${deleteModul.id}`, { token: auth.token, headers: auth.headers });
      setDeleteModul(null);
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus modul.');
      setDeleteModul(null);
    }
  };

  const confirmDeleteTugas = async () => {
    if (!deleteTugas) return;
    try {
      const auth = getAuth();
      await apiDelete(`/api/tugas/${deleteTugas.tugas.id}`, { token: auth.token, headers: auth.headers });
      setDeleteTugas(null);
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus materi.');
      setDeleteTugas(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={pageWrap}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
          <Loader2 size={36} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Memuat data kelas...</span>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Breadcrumb / Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <button onClick={() => router.push('/lecturer/courses')} style={backBtn}>
          <ArrowLeft size={16} />
        </button>
        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Courses</span>
        <ChevronRight size={14} color="#475569" />
        <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>{course?.title ?? '...'}</span>
      </div>

      {/* Course Header */}
      {course && (
        <div style={courseHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={courseIcon}>
              <BookOpen size={22} color="#6366f1" />
            </div>
            <div>
              <h1 style={courseTitle}>{course.title}</h1>
              {course.description && <p style={courseDesc}>{course.description}</p>}
            </div>
          </div>
          <button onClick={() => setShowAddModul(true)} style={addModulBtn}>
            <Plus size={15} />
            Tambah Modul
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={errBox}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Modules */}
      {moduls.length === 0 ? (
        <div style={emptyState}>
          <Package size={42} color="#4a5568" />
          <p style={{ color: '#94a3b8', fontWeight: 600, marginTop: 12 }}>Belum ada modul</p>
          <p style={{ color: '#64748b', fontSize: '0.82rem' }}>Tambahkan modul pertama untuk kelas ini.</p>
          <button onClick={() => setShowAddModul(true)} style={{ ...addModulBtn, marginTop: 12 }}>
            <Plus size={14} /> Tambah Modul
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {moduls.map((modul) => {
            const tugasList = tugasMap[modul.id] ?? [];
            return (
              <div key={modul.id} style={modulCard}>
                {/* Modul Header */}
                <div style={modulHeaderRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={modulIcon}>
                      <Layers size={16} color="#8b5cf6" />
                    </div>
                    <div>
                      <h2 style={modulTitle}>{modul.title}</h2>
                      {modul.difficulty && (
                        <span style={{ ...diffBadge, ...diffColor(modul.difficulty) }}>{modul.difficulty}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => setAddMateriForModul(modul.id)} style={addMateriBtn}>
                      <Plus size={13} /> Tambah Materi
                    </button>
                    <button onClick={() => setDeleteModul(modul)} style={iconDanger}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Materi List */}
                {tugasList.length === 0 ? (
                  <div style={emptyMateri}>
                    <FileText size={18} color="#4a5568" />
                    <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Belum ada materi di modul ini.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                    {tugasList.map((t, idx) => (
                      <div key={t.id} style={tugasRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={tugasOrder}>{idx + 1}</span>
                          <div>
                            <p style={tugasTitle}>{t.title}</p>
                            {t.type && <span style={typeBadge}>{t.type}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => router.push(`/lecturer/courses/materi?courseId=${courseId}&tugasId=${t.id}`)}
                            style={detailBtn}
                          >
                            <Eye size={13} /> Detail
                          </button>
                          <button
                            onClick={() => setDeleteTugas({ tugas: t, modulId: modul.id })}
                            style={iconDanger}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showAddModul && (
        <AddModulModal
          pembelajaranId={courseId}
          onSuccess={() => { setShowAddModul(false); fetchAll(); }}
          onClose={() => setShowAddModul(false)}
        />
      )}
      {addMateriForModul && (
        <AddMateriModal
          modulId={addMateriForModul}
          pembelajaranId={courseId}
          onSuccess={() => { setAddMateriForModul(null); fetchAll(); }}
          onClose={() => setAddMateriForModul(null)}
        />
      )}
      {deleteModul && (
        <ConfirmModal
          message={`Apakah yakin ingin menghapus modul "${deleteModul.title}"? Semua materi di dalamnya akan ikut terhapus.`}
          onConfirm={confirmDeleteModul}
          onCancel={() => setDeleteModul(null)}
        />
      )}
      {deleteTugas && (
        <ConfirmModal
          message={`Apakah yakin ingin menghapus materi "${deleteTugas.tugas.title}"?`}
          onConfirm={confirmDeleteTugas}
          onCancel={() => setDeleteTugas(null)}
        />
      )}
    </div>
  );
}

// ─── Shared Styles ─────────────────────────────────────────────────────────────
const pageWrap: React.CSSProperties = {
  padding: '4px 0',
  fontFamily: "'Inter', 'Outfit', sans-serif",
  color: '#e2e8f0',
  minHeight: '100vh',
};

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.75)',
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 200, padding: 20,
};

const modal: React.CSSProperties = {
  background: '#1e1e2e',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 24,
  width: '100%',
  maxWidth: 480,
};

const modalHeader: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  paddingBottom: 14, marginBottom: 18,
};

const modalTitle: React.CSSProperties = { fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 };
const closeBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' };

const formGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 7 };
const label: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' };
const input: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '9px 13px',
  color: '#e2e8f0', fontSize: '0.9rem', outline: 'none', width: '100%',
};

const btnBase: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 8, border: 'none',
  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
};

const errBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 14px', borderRadius: 8,
  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
  color: '#f87171', fontSize: '0.82rem', marginBottom: 14,
};

const backBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', color: '#e2e8f0',
};

const courseHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
  flexWrap: 'wrap', gap: 16, marginBottom: 28,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14, padding: '20px 24px',
};

const courseIcon: React.CSSProperties = {
  width: 46, height: 46, borderRadius: 12,
  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

const courseTitle: React.CSSProperties = { fontSize: '1.3rem', fontWeight: 700, color: '#fff', margin: 0 };
const courseDesc: React.CSSProperties = { color: '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0' };

const addModulBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '9px 16px', borderRadius: 8, border: 'none',
  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  color: '#fff', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer',
};

const emptyState: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', padding: '60px 24px', textAlign: 'center',
  background: 'rgba(255,255,255,0.02)',
  border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 14,
};

const modulCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14, padding: '20px 22px',
};

const modulHeaderRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  flexWrap: 'wrap', gap: 12,
};

const modulIcon: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 9,
  background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

const modulTitle: React.CSSProperties = { fontSize: '0.98rem', fontWeight: 700, color: '#e2e8f0', margin: 0 };

const diffBadge: React.CSSProperties = {
  display: 'inline-block', fontSize: '0.68rem', fontWeight: 700,
  padding: '2px 8px', borderRadius: 6, marginTop: 4, textTransform: 'capitalize',
};

function diffColor(d: string): React.CSSProperties {
  if (d === 'Beginner') return { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' };
  if (d === 'Advanced') return { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' };
  return { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' };
}

const addMateriBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '7px 13px', borderRadius: 7,
  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
  color: '#a5b4fc', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
};

const iconDanger: React.CSSProperties = {
  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
  borderRadius: 7, width: 30, height: 30,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: '#f87171',
};

const emptyMateri: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '14px 16px', marginTop: 12,
  background: 'rgba(255,255,255,0.02)',
  border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10,
};

const tugasRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '11px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
  gap: 12, flexWrap: 'wrap',
};

const tugasOrder: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 6,
  background: 'rgba(99,102,241,0.15)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '0.72rem', fontWeight: 700, color: '#a5b4fc', flexShrink: 0,
};

const tugasTitle: React.CSSProperties = { color: '#e2e8f0', fontSize: '0.88rem', fontWeight: 600, margin: 0 };

const typeBadge: React.CSSProperties = {
  display: 'inline-block', fontSize: '0.68rem', fontWeight: 600,
  padding: '2px 7px', borderRadius: 5, marginTop: 3,
  background: 'rgba(99,102,241,0.1)', color: '#a5b4fc',
  border: '1px solid rgba(99,102,241,0.2)',
};

const detailBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '6px 12px', borderRadius: 7,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
};
