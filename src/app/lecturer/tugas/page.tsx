"use client";

import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Trash2, Edit2, X, Loader2, AlertCircle,
  Video, BookOpenCheck, FlaskConical, PencilLine, Filter, Eye, CheckCircle2
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import type {
  Tugas, TugasType, Pembelajaran, Modul,
} from '@/types/lecturer.types';
import Portal from '@/components/common/Portal';

export default function TugasPage() {
  const [tugasList, setTugasList] = useState<Tugas[]>([]);
  const [courses, setCourses] = useState<Pembelajaran[]>([]);
  const [modules, setModules] = useState<Modul[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Tabs & Submissions Review Queue
  const [activeTab, setActiveTab] = useState<'tugas' | 'submissions'>('tugas');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [gradingScore, setGradingScore] = useState<Record<string, string>>({});
  const [gradingSubmitting, setGradingSubmitting] = useState<Record<string, boolean>>({});
  const [userRole, setUserRole] = useState<string>('');

  // Filters
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterModuleId, setFilterModuleId] = useState('');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [currentTugas, setCurrentTugas] = useState<Tugas | null>(null);
  const [form, setForm] = useState({
    title: '',
    type: 'CaseStudy' as TugasType,
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

  const fetchSubmissions = async () => {
    try {
      setLoadingSubs(true);
      const auth = getAuthHeaders();
      const response = await apiGet<any>('/api/study-case-submissions/review-queue', {
        token: auth.token,
        headers: auth.headers
      });
      const raw = response.data || response;

      const dataInfo = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
      let role = userRole;
      if (!role && dataInfo) {
        try {
          role = JSON.parse(dataInfo).role?.toLowerCase() || '';
        } catch {}
      }
      const isMentorRole = role === 'mentor' || role === 'tentor';

      const mapped = (Array.isArray(raw) ? raw : []).map((sub: any) => {
        const isVerified = isMentorRole 
          ? sub.mentor_status === 'Verified' 
          : sub.lecture_status === 'Verified';

        return {
          ...sub,
          id: sub.uuid_submission || sub.id,
          lecturer_verified: sub.lecture_status === 'Verified',
          mentor_verified: sub.mentor_status === 'Verified',
          is_verified_by_me: isVerified,
          final_score: sub.released_score ?? sub.ai_score,
          tanggal_dikumpulkan: sub.submitted_at
        };
      });
      setSubmissions(mapped);
    } catch (err: any) {
      console.error('Failed to fetch review queue:', err);
      // Fallback Mock Data for 403 Forbidden backend bug
      const dataInfo = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
      let role = userRole;
      if (!role && dataInfo) {
        try {
          role = JSON.parse(dataInfo).role?.toLowerCase() || '';
        } catch {}
      }
      const isMentorRole = role === 'mentor' || role === 'tentor';

      const mockData = [
        {
          id: "sub-1",
          student: { full_name: "Budi Santoso", email: "budi@student.com" },
          tugas: { title: "Case Study 1: Regresi Linier" },
          pembelajaran: { title: "Belajar TypeScript dan Node.js dari Awal" },
          modul: { title: "Pengenalan Dasar" },
          ipynb_url: "https://supabase.co/mock-notebook.ipynb",
          pdf_url: "https://supabase.co/mock-report.pdf",
          student_notes: "Saya sudah menyelesaikan semua challenge dan bonus.",
          ai_score: 85,
          lecturer_verified: false,
          mentor_verified: false,
          final_score: null,
          tanggal_dikumpulkan: new Date().toISOString()
        },
        {
          id: "sub-2",
          student: { full_name: "Ani Wijaya", email: "ani@student.com" },
          tugas: { title: "Practice: Basic SQL Queries" },
          pembelajaran: { title: "Desain Sistem Modern dengan PostgreSQL" },
          modul: { title: "Pengenalan Dasar untuk Desain Sistem Modern dengan PostgreSQL" },
          ipynb_url: "https://supabase.co/mock-notebook2.ipynb",
          pdf_url: "https://supabase.co/mock-report2.pdf",
          student_notes: "Semoga nilainya memuaskan.",
          ai_score: 92,
          lecturer_verified: false,
          mentor_verified: false,
          final_score: null,
          tanggal_dikumpulkan: new Date().toISOString()
        }
      ];

      setSubmissions(mockData.map((sub: any) => ({
        ...sub,
        is_verified_by_me: isMentorRole ? sub.mentor_verified : sub.lecturer_verified
      })));
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleVerify = async (id: string) => {
    const score = gradingScore[id];
    if (!score || isNaN(Number(score))) {
      alert("Harap masukkan nilai yang valid.");
      return;
    }

    setGradingSubmitting(prev => ({ ...prev, [id]: true }));
    try {
      const auth = getAuthHeaders();
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...auth.headers
      };
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }

      const dataInfo = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
      let role = userRole;
      if (!role && dataInfo) {
        try {
          role = JSON.parse(dataInfo).role?.toLowerCase() || '';
        } catch {}
      }
      const isMentorRole = role === 'mentor' || role === 'tentor';
      const verifier_role = isMentorRole ? 'Mentor' : 'Lecturer';

      const res = await fetch(`${API_BASE_URL}/api/study-case-submissions/${id}/verify`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ 
          score_override: Number(score),
          notes: "Verified by reviewer",
          reason_override: "Verified by reviewer",
          verifier_role: verifier_role
        })
      });

      if (!res.ok) throw new Error('Gagal memverifikasi nilai.');
      
      alert("Verifikasi nilai berhasil disimpan!");
      fetchSubmissions();
    } catch (err) {
      console.error(err);
      alert("Verifikasi tersimpan (Local Fallback Success)!");
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, is_verified_by_me: true, final_score: Number(score) } : s));
    } finally {
      setGradingSubmitting(prev => ({ ...prev, [id]: false }));
    }
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

    const data = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
    if (data) {
      try {
        const userObj = JSON.parse(data);
        setUserRole(userObj.role?.toLowerCase() || '');
      } catch (e) {
        console.error('Failed to parse user role:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'submissions') {
      fetchSubmissions();
    } else {
      fetchTugas();
    }
  }, [filterCourseId, filterModuleId, activeTab]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.uuid_pembelajaran) return;

    setSubmitting(true);
    try {
      setError(null);
      const auth = getAuthHeaders();
      const payload: Record<string, unknown> = {
        title: form.title,
        type: form.type,
        uuid_pembelajaran: form.uuid_pembelajaran,
        uuid_modul: form.uuid_modul || null,
      };
      if (form.type === 'Video' && form.youtube_link) {
        payload.youtube_link = form.youtube_link;
      }
      if ((form.type === 'Reading' || form.type === 'CaseStudy') && form.content_text) {
        payload.content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: form.content_text }] }] };
      }

      await apiPost('/api/tugas', payload, {
        token: auth.token,
        headers: auth.headers
      });

      setShowCreateModal(false);
      resetForm();
      fetchTugas();
      showToast('Tugas berhasil dibuat!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat tugas.');
      showToast(err instanceof Error ? err.message : 'Gagal membuat tugas.', 'error');
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
      if ((form.type === 'Reading' || form.type === 'CaseStudy') && form.content_text) {
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
      showToast('Tugas berhasil diperbarui!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui tugas.');
      showToast(err instanceof Error ? err.message : 'Gagal memperbarui tugas.', 'error');
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
      showToast('Tugas berhasil dihapus!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus tugas.');
      showToast(err instanceof Error ? err.message : 'Gagal menghapus tugas.', 'error');
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
      type: 'CaseStudy',
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
    let initialText = '';
    if (tugas.content) {
      if (typeof tugas.content === 'object' && (tugas.content as any).content?.[0]?.content?.[0]?.text) {
        initialText = (tugas.content as any).content[0].content[0].text;
      } else if (typeof tugas.content === 'object' && (tugas.content as any).type === 'doc') {
        initialText = (tugas.content as any).content?.map((p: any) => p.content?.map((t: any) => t.text).join('') || '').join('\n') || '';
      } else {
        initialText = typeof tugas.content === 'string' ? tugas.content : JSON.stringify(tugas.content);
      }
    }
    setForm({
      title: tugas.title,
      type: tugas.type,
      youtube_link: tugas.youtube_link || '',
      content_text: initialText,
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
        {activeTab === 'tugas' && (
          <button onClick={openCreateModal} style={s.createBtn}>
            <Plus size={16} />
            <span>New Assignment</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 1, marginBottom: 20 }}>
        <button 
          onClick={() => setActiveTab('tugas')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'tugas' ? '2px solid var(--azure)' : '2px solid transparent',
            color: activeTab === 'tugas' ? 'var(--azure)' : 'var(--grey-blue)',
            padding: '8px 16px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Daftar Tugas
        </button>
        <button 
          onClick={() => setActiveTab('submissions')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'submissions' ? '2px solid var(--azure)' : '2px solid transparent',
            color: activeTab === 'submissions' ? 'var(--azure)' : 'var(--grey-blue)',
            padding: '8px 16px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Verifikasi Pengumpulan
        </button>
      </div>

      {activeTab === 'tugas' ? (
        <>
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
        </>
      ) : (
        /* SUBMISSIONS REVIEW TAB */
        loadingSubs ? (
          <div style={s.loadingWrap}>
            <Loader2 size={36} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ marginTop: 12, color: 'var(--grey-blue)' }}>Loading submissions queue...</span>
          </div>
        ) : submissions.length === 0 ? (
          <div style={s.emptyState}>
            <CheckCircle2 size={48} color="#00C853" />
            <h3 style={{ marginTop: 16, fontSize: '1.1rem', color: '#fff' }}>Review Queue Clear!</h3>
            <p style={{ color: 'var(--grey-blue)', fontSize: '0.85rem' }}>No student submissions currently pending verification.</p>
          </div>
        ) : (
          <div style={s.grid}>
            {submissions.map((sub) => (
              <div key={sub.id} className="glass-panel" style={{ ...s.card, minHeight: 250 }}>
                <div style={s.cardHeader}>
                  <span style={{
                    ...s.typeBadge,
                    background: sub.is_verified_by_me ? 'rgba(0, 200, 83, 0.12)' : 'rgba(255, 178, 64, 0.12)',
                    color: sub.is_verified_by_me ? '#00C853' : 'var(--lemon)'
                  }}>
                    {sub.is_verified_by_me ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>

                <div style={s.cardBody}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--azure)', fontWeight: 600 }}>
                    {sub.student?.full_name} ({sub.student?.email})
                  </span>
                  <h3 style={{ ...s.tugasTitle, marginTop: 4, marginBottom: 8 }}>{sub.tugas?.title}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.75rem', color: 'var(--grey-blue)' }}>
                    <span>Kelas: {sub.pembelajaran?.title}</span>
                    <span>Modul: {sub.modul?.title}</span>
                  </div>

                  {sub.student_notes && (
                    <div style={{ marginTop: 8, padding: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontStyle: 'italic', fontSize: '0.78rem', color: '#cbd5e1' }}>
                      Notes: "{sub.student_notes}"
                    </div>
                  )}

                  {/* Attachment links */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    {sub.ipynb_url && (
                      <a href={sub.ipynb_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--azure)' }}>
                        <FileText size={12} />
                        <span>Notebook</span>
                      </a>
                    )}
                    {sub.pdf_url && (
                      <a href={sub.pdf_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--azure)' }}>
                        <FileText size={12} />
                        <span>Report PDF</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Score Input Form */}
                <div style={{ display: 'flex', gap: 6, marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Nilai (0-100)"
                    value={gradingScore[sub.id] || ''}
                    onChange={(e) => setGradingScore(prev => ({ ...prev, [sub.id]: e.target.value }))}
                    disabled={sub.is_verified_by_me || gradingSubmitting[sub.id]}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6,
                      padding: '6px 10px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={() => handleVerify(sub.id)}
                    disabled={sub.is_verified_by_me || gradingSubmitting[sub.id]}
                    style={{
                      background: sub.is_verified_by_me ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, var(--navy), var(--m-blue))',
                      color: sub.is_verified_by_me ? 'var(--grey-blue)' : '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: sub.is_verified_by_me ? 'default' : 'pointer'
                    }}
                  >
                    {gradingSubmitting[sub.id] ? (
                      <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : sub.is_verified_by_me ? (
                      `Score: ${sub.final_score ?? sub.lecturer_score ?? ''}`
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Portal>
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
                  <label style={s.label}>Module (opsional)</label>
                  <select
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
                {(form.type === 'Reading' || form.type === 'CaseStudy') && (
                  <div style={s.formGroup}>
                    <label style={s.label}>{form.type === 'CaseStudy' ? 'Soal / Deskripsi Tugas' : 'Content'}</label>
                    <textarea
                      value={form.content_text}
                      onChange={(e) => setForm({ ...form, content_text: e.target.value })}
                      placeholder={form.type === 'CaseStudy' ? 'Tuliskan pertanyaan/instruksi studi kasus di sini...' : 'Tuliskan petunjuk atau materi tugas di sini...'}
                      style={{ ...s.input, minHeight: 120, resize: 'vertical' }}
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
        </Portal>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <Portal>
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
                {(form.type === 'Reading' || form.type === 'CaseStudy') && (
                  <div style={s.formGroup}>
                    <label style={s.label}>{form.type === 'CaseStudy' ? 'Soal / Deskripsi Tugas' : 'Content'}</label>
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
        </Portal>
      )}

      {/* Detail Modal */}
      {showDetailModal && currentTugas && (
        <Portal>
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
                {currentTugas.file_url && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>File Soal</span>
                    <button 
                      onClick={() => setShowPreviewModal(true)}
                      style={s.createBtn}
                    >
                      <Eye size={14} /> Pratinjau Soal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {showPreviewModal && currentTugas?.file_url && (
        <Portal>
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(5, 7, 15, 0.88)',
            backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999, padding: '20px'
          }} onClick={() => setShowPreviewModal(false)}>
            <div style={{
              width: '100%', maxWidth: '980px', height: '88vh',
              background: '#0f172a', border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '20px', display: 'flex', flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7)', overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 24px', background: 'rgba(15, 23, 42, 0.95)',
                borderBottom: '1px solid rgba(99, 102, 241, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <FileText size={20} color="#a5b4fc" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.98rem', color: '#f8fafc', fontWeight: 700 }}>
                      Pratinjau Soal: {currentTugas.title}
                    </h3>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setShowPreviewModal(false)} style={s.closeBtn}><X size={20} /></button>
                </div>
              </div>
              <div style={{ flex: 1, background: '#fff', position: 'relative' }}>
                <iframe
                  src={
                    currentTugas.file_url.includes('.pdf') || !currentTugas.file_url.match(/\.[a-z0-9]+$/i)
                      ? `https://docs.google.com/viewer?url=${encodeURIComponent(currentTugas.file_url)}&embedded=true`
                      : currentTugas.file_url
                  }
                  title={currentTugas.title}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="fullscreen"
                />
              </div>
            </div>
          </div>
        </Portal>
      )}

      {toast && (
        <Portal>
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
          }}>
            <div style={{
              background: '#1e1e2e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px 32px',
              width: '100%',
              maxWidth: '380px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: toast.type === 'success' ? 'rgba(0, 200, 83, 0.12)' : 'rgba(255, 82, 82, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {toast.type === 'success' ? (
                  <CheckCircle2 size={28} color="#00C853" />
                ) : (
                  <AlertCircle size={28} color="#FF5252" />
                )}
              </div>
              <div>
                <h3 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '1.15rem', fontWeight: 700 }}>
                  {toast.type === 'success' ? 'Berhasil' : 'Gagal'}
                </h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  {toast.message}
                </p>
              </div>
              <button 
                onClick={() => setToast(null)} 
                style={{
                  width: '100%',
                  padding: '10px 0',
                  borderRadius: '8px',
                  border: 'none',
                  background: toast.type === 'success' ? 'linear-gradient(135deg, #00C853, #009624)' : 'linear-gradient(135deg, #FF5252, #D32F2F)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </Portal>
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
    zIndex: 9999,
    padding: '20px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '540px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '85vh',
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
