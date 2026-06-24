"use client";

import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Trash2, Edit2, X, Loader2, AlertCircle,
  Video, BookOpenCheck, FlaskConical, PencilLine, Filter, Eye
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import type {
  Tugas, TugasType, Pembelajaran, Modul,
} from '@/types/lecturer.types';

export default function TugasPage() {
  const [tugasList, setTugasList] = useState<Tugas[]>([]);
  const [courses, setCourses] = useState<Pembelajaran[]>([]);
  const [modules, setModules] = useState<Modul[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterModuleId, setFilterModuleId] = useState('');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentTugas, setCurrentTugas] = useState<Tugas | null>(null);
  const [form, setForm] = useState({
    title: '',
    type: 'Reading' as TugasType,
    youtube_link: '',
    content_text: '', // Simplified content input for Reading
    uuid_pembelajaran: '',
    uuid_modul: '',
  });
  const [submitting, setSubmitting] = useState(false);

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

  // Fetch courses for dropdown
  const fetchCourses = async () => {
    try {
      const auth = getAuthHeaders();
      const response = await apiGet<Pembelajaran[] | { success: boolean; data: Pembelajaran[] }>('/api/pembelajaran', {
        token: auth.token,
        headers: auth.headers
      });
      if (Array.isArray(response)) {
        setCourses(response.map((c: any) => ({ ...c, id: c.uuid_pembelajaran || c.id })));
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        setCourses(response.data.map((c: any) => ({ ...c, id: c.uuid_pembelajaran || c.id })));
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  // Fetch modules for dropdown
  const fetchModules = async () => {
    try {
      const auth = getAuthHeaders();
      const response = await apiGet<Modul[] | { success: boolean; data: Modul[] }>('/api/modul', {
        token: auth.token,
        headers: auth.headers
      });
      if (Array.isArray(response)) {
        setModules(response.map((m: any) => ({ ...m, id: m.uuid_modul || m.id })));
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        setModules(response.data.map((m: any) => ({ ...m, id: m.uuid_modul || m.id })));
      }
    } catch (err) {
      console.error('Failed to fetch modules:', err);
    }
  };

  // Fetch tugas list with optional filters
  const fetchTugas = async () => {
    try {
      setLoading(true);
      setError(null);
      const auth = getAuthHeaders();

      let path = '/api/tugas';
      const params = new URLSearchParams();
      if (filterCourseId) params.set('uuid_pembelajaran', filterCourseId);
      if (filterModuleId) params.set('uuid_modul', filterModuleId);
      const qs = params.toString();
      if (qs) path += `?${qs}`;

      const response = await apiGet<Tugas[] | { success: boolean; data: Tugas[] }>(path, {
        token: auth.token,
        headers: auth.headers
      });

      let list: any[] = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        list = response.data;
      }

      list = list
        .filter((t: any) => (!filterCourseId || t.uuid_pembelajaran === filterCourseId) && (!filterModuleId || t.uuid_modul === filterModuleId))
        .map((t: any) => ({
          ...t,
          id: t.uuid_tugas || t.id,
        }));

      setTugasList(list);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar tugas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchModules();
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('course_id');
    const moduleId = params.get('module_id');
    if (courseId) setFilterCourseId(courseId);
    if (moduleId) setFilterModuleId(moduleId);
  }, []);

  useEffect(() => {
    fetchTugas();
  }, [filterCourseId, filterModuleId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.uuid_pembelajaran || !form.uuid_modul) return;

    setSubmitting(true);
    try {
      setError(null);
      const auth = getAuthHeaders();
      const payload: Record<string, unknown> = {
        title: form.title,
        type: form.type,
        uuid_pembelajaran: form.uuid_pembelajaran,
        uuid_modul: form.uuid_modul,
      };
      if (form.type === 'Video' && form.youtube_link) {
        payload.youtube_link = form.youtube_link;
      }
      if (form.type === 'Reading' && form.content_text) {
        payload.content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: form.content_text }] }] };
      }

      await apiPost('/api/tugas', payload, {
        token: auth.token,
        headers: auth.headers
      });

      setShowCreateModal(false);
      resetForm();
      fetchTugas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat tugas.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTugas || !form.title) return;

    setSubmitting(true);
    try {
      setError(null);
      const auth = getAuthHeaders();
      const payload: Record<string, unknown> = {
        title: form.title,
        type: form.type,
      };
      if (form.type === 'Video') {
        payload.youtube_link = form.youtube_link;
      }
      if (form.type === 'Reading' && form.content_text) {
        payload.content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: form.content_text }] }] };
      }
      if (form.uuid_pembelajaran) payload.uuid_pembelajaran = form.uuid_pembelajaran;
      if (form.uuid_modul) payload.uuid_modul = form.uuid_modul;

      await apiPut(`/api/tugas/${currentTugas.id}`, payload, {
        token: auth.token,
        headers: auth.headers
      });

      setShowEditModal(false);
      setCurrentTugas(null);
      resetForm();
      fetchTugas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui tugas.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return;

    try {
      setError(null);
      const auth = getAuthHeaders();
      await apiDelete(`/api/tugas/${id}`, {
        token: auth.token,
        headers: auth.headers
      });
      fetchTugas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus tugas.');
    }
  };

  const handleViewDetail = async (tugas: Tugas) => {
    try {
      const auth = getAuthHeaders();
      const response = await apiGet<Tugas | { success: boolean; data: Tugas }>(`/api/tugas/${tugas.id}`, {
        token: auth.token,
        headers: auth.headers
      });

      let detail: Tugas;
      if ('data' in response && (response as { data: Tugas }).data) {
        detail = (response as { data: Tugas }).data;
      } else {
        detail = response as Tugas;
      }
      setCurrentTugas(detail);
      setShowDetailModal(true);
    } catch {
      // Fallback to what we have
      setCurrentTugas(tugas);
      setShowDetailModal(true);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      type: 'Reading',
      youtube_link: '',
      content_text: '',
      uuid_pembelajaran: '',
      uuid_modul: '',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (tugas: Tugas) => {
    setCurrentTugas(tugas);
    setForm({
      title: tugas.title,
      type: tugas.type,
      youtube_link: tugas.youtube_link || '',
      content_text: tugas.content ? JSON.stringify(tugas.content) : '',
      uuid_pembelajaran: tugas.uuid_pembelajaran || '',
      uuid_modul: tugas.uuid_modul || '',
    });
    setShowEditModal(true);
  };

  // Get filtered modules based on selected course in form
  const getFormModules = () => {
    if (!form.uuid_pembelajaran) return modules;
    return modules.filter(m => m.uuid_pembelajaran === form.uuid_pembelajaran);
  };

  const typeIcons: Record<TugasType, React.ReactNode> = {
    Reading: <BookOpenCheck size={18} color="#4196F0" />,
    Video: <Video size={18} color="#E040FB" />,
    CaseStudy: <FlaskConical size={18} color="#FF9100" />,
    Practice: <PencilLine size={18} color="#00C853" />,
  };

  const typeColors: Record<TugasType, { bg: string; text: string; border: string }> = {
    Reading: { bg: 'rgba(65, 150, 240, 0.1)', text: '#4196F0', border: 'rgba(65, 150, 240, 0.2)' },
    Video: { bg: 'rgba(224, 64, 251, 0.1)', text: '#E040FB', border: 'rgba(224, 64, 251, 0.2)' },
    CaseStudy: { bg: 'rgba(255, 145, 0, 0.1)', text: '#FF9100', border: 'rgba(255, 145, 0, 0.2)' },
    Practice: { bg: 'rgba(0, 200, 83, 0.1)', text: '#00C853', border: 'rgba(0, 200, 83, 0.2)' },
  };

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.topHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={s.title}>Assignment Management</h1>
          </div>
          <p style={s.subtitle}>Create and manage lessons, videos, case studies, and practice assignments</p>
        </div>
        <button onClick={openCreateModal} style={s.createBtn}>
          <Plus size={16} />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div style={s.filterBar}>
        <Filter size={16} color="var(--grey-blue)" />
        <div style={{ ...s.filterSelect as React.CSSProperties, display: 'flex', alignItems: 'center' }}>
          {courses.find(c => (c.id || (c as any).uuid_pembelajaran) === filterCourseId)?.title || 'All Courses'}
        </div>
        <div style={{ ...s.filterSelect as React.CSSProperties, display: 'flex', alignItems: 'center' }}>
          {modules.find(m => (m.id || (m as any).uuid_modul) === filterModuleId)?.title || 'All Modules'}
        </div>
      </div>

      {error && (
        <div style={s.errorAlert}>
          <AlertCircle size={20} color="#FF5252" />
          <span style={s.errorMsg}>{error}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={s.loadingWrap}>
          <Loader2 size={36} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ marginTop: 12, color: 'var(--grey-blue)' }}>Loading assignments...</span>
        </div>
      ) : tugasList.length === 0 ? (
        <div style={s.emptyState}>
          <FileText size={48} color="var(--grey)" />
          <h3 style={{ marginTop: 16, fontSize: '1.1rem', color: '#fff' }}>No Assignments Found</h3>
          <p style={{ color: 'var(--grey-blue)', fontSize: '0.85rem' }}>
            {filterCourseId || filterModuleId
              ? 'No assignments match the selected filters.'
              : 'Create an assignment to get started.'}
          </p>
        </div>
      ) : (
        <div style={s.grid}>
          {tugasList.map((tugas) => {
            const tc = typeColors[tugas.type] || typeColors.Reading;
            return (
              <div key={tugas.id} className="glass-panel" style={s.card}>
                <div style={s.cardHeader}>
                  <div style={{ ...s.typeIconBox, background: tc.bg }}>
                    {typeIcons[tugas.type] || typeIcons.Reading}
                  </div>
                  <span style={{
                    ...s.typeBadge,
                    background: tc.bg,
                    color: tc.text,
                    border: `1px solid ${tc.border}`,
                  }}>
                    {tugas.type}
                  </span>
                </div>
                <div style={s.cardBody}>
                  <h3 style={s.tugasTitle}>{tugas.title}</h3>
                  {tugas.pembelajaran?.title && (
                    <span style={s.metaBadge}>📚 {tugas.pembelajaran.title}</span>
                  )}
                  {tugas.modul?.title && (
                    <span style={s.metaBadge}>📦 {tugas.modul.title}</span>
                  )}
                  {tugas.slug && <span style={s.slugBadge}>/{tugas.slug}</span>}
                </div>
                <div style={s.actionsRow}>
                  <button onClick={() => handleViewDetail(tugas)} style={s.viewBtn} title="View Detail">
                    <Eye size={12} />
                    <span>Detail</span>
                  </button>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEditModal(tugas)} style={s.iconBtn} title="Edit">
                      <Edit2 size={12} color="var(--grey-blue)" />
                    </button>
                    <button onClick={() => handleDelete(tugas.id)} style={s.iconBtn} title="Delete">
                      <Trash2 size={12} color="#FF5252" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent} className="glass-panel">
            <div style={s.modalHeader}>
              <h3>Create New Assignment</h3>
              <button onClick={() => setShowCreateModal(false)} style={s.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} style={s.form}>
              <div style={s.formGroup}>
                <label style={s.label}>Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Tugas Membaca Bab 1"
                  style={s.input}
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Type</label>
                <div style={s.typeGrid}>
                  {(['Reading', 'Video', 'CaseStudy', 'Practice'] as TugasType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      style={{
                        ...s.typeOption,
                        ...(form.type === t ? { border: `1px solid ${typeColors[t].text}`, background: typeColors[t].bg } : {}),
                      }}
                    >
                      {typeIcons[t]}
                      <span style={{ fontSize: '0.78rem', color: form.type === t ? '#fff' : 'var(--grey-blue)' }}>{t}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Course (Pembelajaran)</label>
                <select
                  required
                  value={form.uuid_pembelajaran}
                  onChange={(e) => setForm({ ...form, uuid_pembelajaran: e.target.value, uuid_modul: '' })}
                  style={s.select}
                >
                  <option value="" style={{ background: '#191919', color: '#fff' }}>Select course...</option>
                  {courses.map((c, idx) => (
                    <option key={c.id || (c as any).uuid_pembelajaran || idx} value={c.id || (c as any).uuid_pembelajaran} style={{ background: '#191919', color: '#fff' }}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Module</label>
                <select
                  required
                  value={form.uuid_modul}
                  onChange={(e) => setForm({ ...form, uuid_modul: e.target.value })}
                  style={s.select}
                >
                  <option value="" style={{ background: '#191919', color: '#fff' }}>Select module...</option>
                  {getFormModules().map((m, idx) => (
                    <option key={m.id || (m as any).uuid_modul || idx} value={m.id || (m as any).uuid_modul} style={{ background: '#191919', color: '#fff' }}>{m.title}</option>
                  ))}
                </select>
              </div>
              {form.type === 'Video' && (
                <div style={s.formGroup}>
                  <label style={s.label}>YouTube Link</label>
                  <input
                    type="url"
                    value={form.youtube_link}
                    onChange={(e) => setForm({ ...form, youtube_link: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    style={s.input}
                  />
                </div>
              )}
              {form.type === 'Reading' && (
                <div style={s.formGroup}>
                  <label style={s.label}>Content</label>
                  <textarea
                    value={form.content_text}
                    onChange={(e) => setForm({ ...form, content_text: e.target.value })}
                    placeholder="Enter the reading content..."
                    style={{ ...s.input, minHeight: 100, resize: 'vertical' as const }}
                  />
                </div>
              )}
              <div style={s.modalFooter}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={s.cancelBtn}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ ...s.submitBtn, opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent} className="glass-panel">
            <div style={s.modalHeader}>
              <h3>Edit Assignment</h3>
              <button onClick={() => { setShowEditModal(false); setCurrentTugas(null); }} style={s.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEdit} style={s.form}>
              <div style={s.formGroup}>
                <label style={s.label}>Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={s.input}
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Type</label>
                <div style={s.typeGrid}>
                  {(['Reading', 'Video', 'CaseStudy', 'Practice'] as TugasType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      style={{
                        ...s.typeOption,
                        ...(form.type === t ? { border: `1px solid ${typeColors[t].text}`, background: typeColors[t].bg } : {}),
                      }}
                    >
                      {typeIcons[t]}
                      <span style={{ fontSize: '0.78rem', color: form.type === t ? '#fff' : 'var(--grey-blue)' }}>{t}</span>
                    </button>
                  ))}
                </div>
              </div>
              {form.type === 'Video' && (
                <div style={s.formGroup}>
                  <label style={s.label}>YouTube Link</label>
                  <input
                    type="url"
                    value={form.youtube_link}
                    onChange={(e) => setForm({ ...form, youtube_link: e.target.value })}
                    style={s.input}
                  />
                </div>
              )}
              {form.type === 'Reading' && (
                <div style={s.formGroup}>
                  <label style={s.label}>Content</label>
                  <textarea
                    value={form.content_text}
                    onChange={(e) => setForm({ ...form, content_text: e.target.value })}
                    style={{ ...s.input, minHeight: 100, resize: 'vertical' as const }}
                  />
                </div>
              )}
              <div style={s.modalFooter}>
                <button type="button" onClick={() => { setShowEditModal(false); setCurrentTugas(null); }} style={s.cancelBtn}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ ...s.submitBtn, opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && currentTugas && (
        <div style={s.modalOverlay}>
          <div style={{ ...s.modalContent, maxWidth: 600 }} className="glass-panel">
            <div style={s.modalHeader}>
              <h3>Assignment Detail</h3>
              <button onClick={() => { setShowDetailModal(false); setCurrentTugas(null); }} style={s.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Title</span>
                <span style={s.detailValue}>{currentTugas.title}</span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Type</span>
                <span style={{
                  ...s.typeBadge,
                  background: typeColors[currentTugas.type]?.bg,
                  color: typeColors[currentTugas.type]?.text,
                  border: `1px solid ${typeColors[currentTugas.type]?.border}`,
                }}>
                  {currentTugas.type}
                </span>
              </div>
              {currentTugas.slug && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>Slug</span>
                  <span style={s.slugBadge}>/{currentTugas.slug}</span>
                </div>
              )}
              {currentTugas.pembelajaran?.title && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>Course</span>
                  <span style={s.detailValue}>{currentTugas.pembelajaran.title}</span>
                </div>
              )}
              {currentTugas.modul?.title && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>Module</span>
                  <span style={s.detailValue}>{currentTugas.modul.title}</span>
                </div>
              )}
              {currentTugas.youtube_link && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>YouTube</span>
                  <a href={currentTugas.youtube_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--azure)', fontSize: '0.85rem' }}>
                    {currentTugas.youtube_link}
                  </a>
                </div>
              )}
              {currentTugas.content && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>Content</span>
                  <div style={s.contentPreview}>
                    {JSON.stringify(currentTugas.content, null, 2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
    marginBottom: '20px',
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
  createBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, var(--navy), var(--m-blue))',
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(6, 99, 199, 0.3)',
    transition: 'all var(--transition-fast)',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '12px 16px',
    flexWrap: 'wrap',
  },
  filterSelect: {
    flex: 1,
    minWidth: '160px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#fff',
    fontSize: '0.85rem',
    outline: 'none',
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
  errorMsg: {
    flex: 1,
  },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    background: 'rgba(30, 30, 30, 0.3)',
    border: '1px dashed var(--border-color)',
    borderRadius: '16px',
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  card: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '220px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  typeIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  tugasTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
  },
  metaBadge: {
    fontSize: '0.75rem',
    color: 'var(--grey-blue)',
  },
  slugBadge: {
    fontSize: '0.72rem',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--grey-blue)',
    padding: '3px 8px',
    borderRadius: '4px',
    alignSelf: 'flex-start',
    fontFamily: 'monospace',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  },
  viewBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    background: 'rgba(255,255,255,0.02)',
    color: 'var(--grey-blue)',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '20px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '540px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '16px',
    marginBottom: '20px',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--grey-blue)',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
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
    transition: 'border-color 0.2s',
  },
  select: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  typeOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '12px 8px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'rgba(255,255,255,0.02)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '16px',
  },
  cancelBtn: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--silver)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, var(--navy), var(--m-blue))',
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  detailRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--grey)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  detailValue: {
    fontSize: '0.92rem',
    color: '#ffffff',
    fontWeight: 500,
  },
  contentPreview: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '0.78rem',
    color: 'var(--grey-blue)',
    fontFamily: 'monospace',
    maxHeight: '200px',
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
};
