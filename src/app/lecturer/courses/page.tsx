"use client";

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Trash2, Edit2, Sparkles, X, 
  Loader2, Globe, AlertCircle, CheckCircle2, ChevronRight, Eye, EyeOff, Archive, Users, Search,
  Calendar, Layers
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import Portal from '@/components/common/Portal';

interface Course {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  status?: 'published' | 'draft' | 'archived';
  createdAt?: string;
  created_at?: string;
  modulesCount?: number;
}

interface Student {
  id: string;
  full_name: string;
  username: string;
  email: string;
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals/Forms State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [form, setForm] = useState({ title: '', description: '' });

  // Publish & Assign Modal State
  const [publishCourseId, setPublishCourseId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // AI Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTitle, setAiTitle] = useState('');
  const [aiLang, setAiLang] = useState<'id' | 'en'>('id');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');

  // Detail Kelas Popup/Modal State
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [detailModuls, setDetailModuls] = useState<any[]>([]);
  const [detailTugasMap, setDetailTugasMap] = useState<Record<string, any[]>>({});
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Course Schedule State
  const [courseSchedules, setCourseSchedules] = useState<Record<string, { scheduledAt: string; studentIds: string[] }>>({});
  const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now');
  const [scheduleDatetime, setScheduleDatetime] = useState('');

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

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const auth = getAuthHeaders();
      const response = await apiGet<Course[] | { success: boolean; data: Course[] }>('/api/pembelajaran', {
        token: auth.token,
        headers: auth.headers
      });

      let list: Course[] = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        list = response.data;
      }

      let publishedIds: string[] = [];
      try {
        const storedPub = localStorage.getItem('nalara_published_courses');
        if (storedPub) publishedIds = JSON.parse(storedPub);
      } catch {}

      // Add default statuses just like nalara_lite if not present
      const baseCourses = list.map((c: any) => {
        const courseId = c.uuid_pembelajaran || c.id;
        const isPublished = publishedIds.includes(courseId);
        return {
          ...c,
          id: courseId,
          title: c.nama_pembelajaran || c.title || '',
          description: c.deskripsi || c.description || '',
          createdAt: c.tanggal_dibuat || c.createdAt || c.created_at,
          created_at: c.tanggal_dibuat || c.created_at || c.createdAt,
          status: c.status || (isPublished ? 'published' : 'draft')
        };
      });

      // Fetch moduls count for each course
      const coursesWithModules = await Promise.all(baseCourses.map(async (c) => {
        try {
          const modulRes = await apiGet<any[] | { data?: any[] }>(
            `/api/modul`, { token: auth.token, headers: auth.headers }
          );
          const modulList = Array.isArray(modulRes)
            ? modulRes
            : (modulRes as any).data ?? [];
          const filtered = modulList.filter((m: any) => m.uuid_pembelajaran === c.id);
          return {
            ...c,
            modulesCount: filtered.length
          };
        } catch (e) {
          return {
            ...c,
            modulesCount: 0
          };
        }
      }));

      setCourses(coursesWithModules);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar pembelajaran.');
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = async (course: Course) => {
    setDetailCourse(course);
    setLoadingDetail(true);
    setDetailModuls([]);
    setDetailTugasMap({});
    try {
      const auth = getAuthHeaders();
      const opts = { token: auth.token, headers: auth.headers };

      // Fetch moduls for this course
      const modulRes = await apiGet<any[] | { data?: any[] }>(
        `/api/modul`, opts
      );
      let modulList: any[] = Array.isArray(modulRes)
        ? modulRes
        : (modulRes as any).data ?? [];
      
      // Filter modules belonging to this course
      modulList = modulList
        .filter(m => m.uuid_pembelajaran === course.id)
        .map(m => ({ ...m, id: m.uuid_modul || m.id }));
      
      setDetailModuls(modulList);

      // Fetch materi for each modul
      const newTugasMap: Record<string, any[]> = {};
      await Promise.all(
        modulList.map(async (m) => {
          const materiRes = await apiGet<any>(
            `/api/materi?uuid_modul=${m.id}`, opts
          );
          let materiList: any[] = [];
          if (materiRes && materiRes.data && Array.isArray(materiRes.data.materi)) {
            materiList = materiRes.data.materi;
          } else if (Array.isArray(materiRes)) {
            materiList = materiRes;
          } else if (materiRes && 'data' in materiRes && Array.isArray(materiRes.data)) {
            materiList = materiRes.data;
          }
          const tugasList = materiList.map((t: any) => ({
            ...t,
            id: t.uuid_materi || t.id,
            title: t.nama_materi || t.title || '',
            type: t.tipe || t.type || 'Reading',
          }));
          newTugasMap[m.id] = tugasList;
        })
      );
      setDetailTugasMap(newTugasMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    // Load saved schedules
    try {
      const stored = localStorage.getItem('nalara_course_schedules');
      if (stored) setCourseSchedules(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Background schedule checker for courses
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date();
      const updated = { ...courseSchedules };
      let changed = false;
      for (const [courseId, schedule] of Object.entries(updated)) {
        if (new Date(schedule.scheduledAt) <= now) {
          // Time to publish — enroll students
          try {
            const auth = getAuthHeaders();
            await apiPost('/api/enroll', {
              course_id: courseId,
              student_ids: schedule.studentIds
            }, { token: auth.token, headers: auth.headers });
            setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: 'published' } : c));
            try {
              const storedPub = localStorage.getItem('nalara_published_courses');
              const publishedIds = storedPub ? JSON.parse(storedPub) : [];
              if (!publishedIds.includes(courseId)) {
                publishedIds.push(courseId);
                localStorage.setItem('nalara_published_courses', JSON.stringify(publishedIds));
              }
            } catch {}
          } catch (err) {
            console.error('Auto-publish failed for course:', courseId, err);
          }
          delete updated[courseId];
          changed = true;
        }
      }
      if (changed) {
        setCourseSchedules(updated);
        localStorage.setItem('nalara_course_schedules', JSON.stringify(updated));
      }
    }, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [courseSchedules]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;

    try {
      setError(null);
      const auth = getAuthHeaders();
      let userUuid = "550e8400-e29b-41d4-a716-446655440000"; 
      const localUser = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
      if (localUser) {
        try {
          const parsed = JSON.parse(localUser);
          if (parsed.id) userUuid = parsed.id;
        } catch {}
      }

      await apiPost('/api/pembelajaran', {
        title: form.title,
        description: form.description,
        uuid_user: userUuid
      }, {
        token: auth.token,
        headers: auth.headers
      });

      setShowCreateModal(false);
      setForm({ title: '', description: '' });
      fetchCourses();
      showToast('Kelas berhasil dibuat!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat pembelajaran.');
      showToast(err instanceof Error ? err.message : 'Gagal membuat pembelajaran.', 'error');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCourse || !form.title) return;

    try {
      setError(null);
      const auth = getAuthHeaders();
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...auth.headers
      };
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/pembelajaran/${currentCourse.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          title: form.title,
          description: form.description
        })
      });

      if (!res.ok) throw new Error('Gagal memperbarui pembelajaran.');

      setShowEditModal(false);
      setCurrentCourse(null);
      setForm({ title: '', description: '' });
      fetchCourses();
      showToast('Kelas berhasil diperbarui!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui pembelajaran.');
      showToast(err instanceof Error ? err.message : 'Gagal memperbarui pembelajaran.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pembelajaran ini?')) return;

    try {
      setError(null);
      const auth = getAuthHeaders();
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;
      const headers = { ...auth.headers };
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/pembelajaran/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) throw new Error('Gagal menghapus pembelajaran.');
      fetchCourses();
      showToast('Kelas berhasil dihapus!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus pembelajaran.');
      showToast(err instanceof Error ? err.message : 'Gagal menghapus pembelajaran.', 'error');
    }
  };

  // Publish & Assign Modal Open
  const handleOpenPublishModal = async (courseId: string) => {
    setPublishCourseId(courseId);
    setLoadingStudents(true);
    setSelectedStudents([]);
    setSearchQuery('');
    try {
      const auth = getAuthHeaders();
      const response = await apiGet<Student[] | { success: boolean; data: Student[] }>('/api/enroll', {
        token: auth.token,
        headers: auth.headers
      });

      let list: Student[] = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        list = response.data;
      }
      setStudents(list);
    } catch (err) {
      console.error(err);
      // Mock fallback if API fails
      setStudents([
        { id: 'student-1', full_name: 'Ahmad Fauzi', username: 'ahmad', email: 'ahmad@example.com' },
        { id: 'student-2', full_name: 'Budi Santoso', username: 'budi', email: 'budi@example.com' }
      ]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const submitPublish = async () => {
    if (!publishCourseId) return;

    if (scheduleMode === 'schedule') {
      if (!scheduleDatetime) {
        alert("Harap pilih tanggal dan waktu untuk penjadwalan.");
        return;
      }
      // Save schedule to localStorage
      const updated = { ...courseSchedules };
      updated[publishCourseId] = {
        scheduledAt: new Date(scheduleDatetime).toISOString(),
        studentIds: [],
      };
      setCourseSchedules(updated);
      localStorage.setItem('nalara_course_schedules', JSON.stringify(updated));
      setPublishCourseId(null);
      setScheduleMode('now');
      setScheduleDatetime('');
      return;
    }

    setPublishing(true);
    try {
      const auth = getAuthHeaders();
      await apiPost('/api/enroll', {
        course_id: publishCourseId,
        student_ids: []
      }, {
        token: auth.token,
        headers: auth.headers
      });

      // Update local course status dynamically to published
      setCourses(prev => prev.map(c => c.id === publishCourseId ? { ...c, status: 'published' } : c));
      try {
        const storedPub = localStorage.getItem('nalara_published_courses');
        const publishedIds = storedPub ? JSON.parse(storedPub) : [];
        if (!publishedIds.includes(publishCourseId)) {
          publishedIds.push(publishCourseId);
          localStorage.setItem('nalara_published_courses', JSON.stringify(publishedIds));
        }
      } catch {}
      // Remove any existing schedule for this course
      const updated = { ...courseSchedules };
      delete updated[publishCourseId];
      setCourseSchedules(updated);
      localStorage.setItem('nalara_course_schedules', JSON.stringify(updated));
      setPublishCourseId(null);
      showToast('Kelas berhasil dipublish!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal memberikan akses kelas.');
      showToast(err instanceof Error ? err.message : 'Gagal memberikan akses kelas.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleGenerateAiReading = async () => {
    if (!aiPrompt || !aiTitle) return;
    setAiGenerating(true);
    setGeneratedHtml('');
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

      const response = await fetch(`${API_BASE_URL}/api/ai/generate-reading`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: aiPrompt,
          language: aiLang,
          lessonTitle: aiTitle,
          refineMode: false,
          existingContent: ""
        })
      });

      if (!response.ok) throw new Error('Gagal menggunakan layanan AI.');
      const text = await response.text();
      setGeneratedHtml(text);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error generating content');
    } finally {
      setAiGenerating(false);
    }
  };

  const openCreateModal = () => {
    setForm({ title: '', description: '' });
    setShowCreateModal(true);
  };

  const openEditModal = (course: Course) => {
    setCurrentCourse(course);
    setForm({ title: course.title, description: course.description || '' });
    setShowEditModal(true);
  };

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.topHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={s.title}>Course Management</h1>
          </div>
          <p style={s.subtitle}>Create and manage courses, and generate smart lesson materials via AI</p>
        </div>
        <div style={s.headerActions}>
          <button onClick={openCreateModal} style={s.createBtn}>
            <Plus size={16} />
            <span>New Course</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={s.errorAlert}>
          <AlertCircle size={20} color="#FF5252" />
          <span style={s.errorMsg}>{error}</span>
        </div>
      )}

      {/* Course List */}
      {loading ? (
        <div style={s.loadingWrap}>
          <Loader2 size={36} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ marginTop: 12, color: 'var(--grey-blue)' }}>Loading courses...</span>
        </div>
      ) : courses.length === 0 ? (
        <div style={s.emptyState}>
          <BookOpen size={48} color="var(--grey)" />
          <h3 style={{ marginTop: 16, fontSize: '1.1rem', color: '#fff' }}>No Courses Found</h3>
          <p style={{ color: 'var(--grey-blue)', fontSize: '0.85rem' }}>Create a course to get started.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {courses.map((course) => (
            <div 
              key={course.id} 
              className="glass-panel" 
              style={{ ...s.card as React.CSSProperties, cursor: 'pointer' }}
              onClick={() => router.push(`/lecturer/kelas/detail?id=${course.id}`)}
            >
              <div style={s.cardHeader}>
                <div style={s.bookIconBox}>
                  <BookOpen size={18} color="var(--azure)" />
                </div>
                <span style={{
                  ...s.statusBadge,
                  background: course.status === 'published' ? 'rgba(0, 200, 83, 0.12)' : 'rgba(255, 178, 64, 0.12)',
                  color: course.status === 'published' ? '#00C853' : 'var(--lemon)',
                  border: course.status === 'published' ? '1px solid rgba(0, 200, 83, 0.25)' : '1px solid rgba(255, 178, 64, 0.25)'
                }}>
                  {course.status}
                </span>
              </div>
              <div style={s.cardBody}>
                <h3 style={s.courseTitle}>{course.title}</h3>
                <p style={s.courseDesc}>{course.description || 'No description provided.'}</p>
                {course.slug && <span style={s.slugBadge}>/{course.slug}</span>}
                <div style={s.cardMeta}>
                  <div style={s.metaItem}>
                    <Calendar size={13} color="var(--grey-blue)" />
                    <span>
                      {course.created_at ? new Date(course.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : (course.createdAt ? new Date(course.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : '-')}
                    </span>
                  </div>
                  <div style={s.metaItem}>
                    <Layers size={13} color="var(--grey-blue)" />
                    <span>{course.modulesCount ?? 0} Modul</span>
                  </div>
                </div>
              </div>
              <div style={s.actionsRow}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenPublishModal(course.id); }} 
                    disabled={course.status === 'published'}
                    className="action-btn-publish"
                    style={{
                      ...s.publishBtn as React.CSSProperties,
                      opacity: course.status === 'published' ? 0.6 : 1
                    }}
                  >
                    <Eye size={12} />
                    <span>Publish</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openDetailModal(course); }}
                    className="action-btn-detail"
                    style={s.detailBtn}
                  >
                    Detail Kelas
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); openEditModal(course); }} 
                    className="action-btn-edit"
                    style={s.editActionBtn}
                  >
                    <Edit2 size={13} color="var(--azure)" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }} 
                    className="action-btn-delete"
                    style={s.deleteActionBtn}
                  >
                    <Trash2 size={13} color="#FF5252" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish & Assign Modal */}
      {publishCourseId && (
        <Portal>
          <div style={s.modalOverlay}>
            <div style={{ ...s.modalContent, maxWidth: 440 }} className="glass-panel">
              <div style={s.modalHeader}>
                <h3>Publish Course</h3>
                <button onClick={() => setPublishCourseId(null)} style={s.closeBtn}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Schedule Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0' }}>
                  <label style={s.label}>Waktu Publikasi Kelas</label>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input
                        type="radio"
                        name="publishMode"
                        checked={scheduleMode === 'now'}
                        onChange={() => setScheduleMode('now')}
                      />
                      Publish Sekarang
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input
                        type="radio"
                        name="publishMode"
                        checked={scheduleMode === 'schedule'}
                        onChange={() => setScheduleMode('schedule')}
                      />
                      Jadwalkan Publikasi
                    </label>
                  </div>

                  {scheduleMode === 'schedule' && (
                    <div style={{ marginTop: 8 }}>
                      <input
                        type="datetime-local"
                        value={scheduleDatetime}
                        onChange={(e) => setScheduleDatetime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        style={s.input}
                      />
                    </div>
                  )}
                </div>

                <div style={s.modalFooter}>
                  <button onClick={() => setPublishCourseId(null)} style={s.cancelBtn}>Cancel</button>
                  <button onClick={submitPublish} disabled={publishing} style={s.submitBtn}>
                    {publishing ? 'Processing...' : scheduleMode === 'schedule' ? 'Jadwalkan' : 'Publish Kelas'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Portal>
          <div style={s.modalOverlay}>
            <div style={s.modalContent} className="glass-panel">
              <div style={s.modalHeader}>
                <h3>Create New Course</h3>
                <button onClick={() => setShowCreateModal(false)} style={s.closeBtn}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreate} style={s.form}>
                <div style={s.formGroup}>
                  <label style={s.label}>Course Title</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Akuntansi Pengantar I"
                    style={s.input}
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the course outcomes and topics..."
                    style={{ ...s.input, minHeight: 100, resize: 'vertical' }}
                  />
                </div>
                <div style={s.modalFooter}>
                  <button type="button" onClick={() => setShowCreateModal(false)} style={s.cancelBtn}>Cancel</button>
                  <button type="submit" style={s.submitBtn}>Create Course</button>
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
                <h3>Edit Course</h3>
                <button onClick={() => setShowEditModal(false)} style={s.closeBtn}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleEdit} style={s.form}>
                <div style={s.formGroup}>
                  <label style={s.label}>Course Title</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    style={s.input}
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ ...s.input, minHeight: 100, resize: 'vertical' }}
                  />
                </div>
                <div style={s.modalFooter}>
                  <button type="button" onClick={() => {
                    setShowEditModal(false);
                    setCurrentCourse(null);
                  }} style={s.cancelBtn}>Cancel</button>
                  <button type="submit" style={s.submitBtn}>Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}



      {/* Detail Kelas Modal */}
      {detailCourse && (
        <Portal>
          <div style={s.modalOverlay}>
            <div style={{ ...s.modalContent, maxWidth: 640 }} className="glass-panel">
              <div style={s.modalHeader}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>{detailCourse.title}</h3>
                <button onClick={() => setDetailCourse(null)} style={s.closeBtn}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--grey-blue)', fontWeight: 600, marginBottom: 6 }}>Deskripsi Kelas</h4>
                  <p style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.5, margin: 0 }}>
                    {detailCourse.description || 'Tidak ada deskripsi.'}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--grey-blue)', fontWeight: 600, marginBottom: 12 }}>Modul & Materi</h4>
                  {loadingDetail ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                      <Loader2 size={24} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : detailModuls.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--grey)', fontStyle: 'italic', margin: 0 }}>
                      Belum ada modul di kelas ini.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {detailModuls.map((m) => (
                        <div key={m.id} style={{
                          padding: 14,
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: 8
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <h5 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', margin: 0 }}>{m.title}</h5>
                            {m.difficulty && (
                              <span style={{
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                borderRadius: 4,
                                background: m.difficulty === 'Beginner' ? 'rgba(0, 200, 83, 0.1)' : m.difficulty === 'Intermediate' ? 'rgba(255, 178, 64, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: m.difficulty === 'Beginner' ? '#00C853' : m.difficulty === 'Intermediate' ? 'var(--lemon)' : '#ff4d4d',
                                border: `1px solid ${m.difficulty === 'Beginner' ? 'rgba(0, 200, 83, 0.2)' : m.difficulty === 'Intermediate' ? 'rgba(255, 178, 64, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                              }}>{m.difficulty}</span>
                            )}
                          </div>
                          {m.description && (
                            <p style={{ fontSize: '0.82rem', color: 'var(--grey-blue)', margin: '0 0 10px 0', lineHeight: 1.4 }}>{m.description}</p>
                          )}
                          
                          {/* Section / Tugas List per modul */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, paddingLeft: 10, borderLeft: '2px solid rgba(255, 255, 255, 0.1)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--grey)' }}>Materi / Tugas:</span>
                            {!detailTugasMap[m.id] || detailTugasMap[m.id].length === 0 ? (
                              <span style={{ fontSize: '0.78rem', color: 'var(--grey)', fontStyle: 'italic' }}>Belum ada materi</span>
                            ) : (
                              detailTugasMap[m.id].map(t => (
                                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--azure)' }} />
                                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{t.title}</span>
                                  {t.type && (
                                    <span style={{
                                      fontSize: '0.65rem',
                                      color: 'var(--grey-blue)',
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      padding: '1px 5px',
                                      borderRadius: 3
                                    }}>{t.type}</span>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={s.modalFooter}>
                <button onClick={() => setDetailCourse(null)} style={s.cancelBtn}>Tutup</button>
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
        .glass-panel {
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease, border-color 0.22s ease !important;
        }
        .glass-panel:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 12px 30px rgba(99, 102, 241, 0.12) !important;
          border-color: rgba(99, 102, 241, 0.3) !important;
        }
        .action-btn-edit, .action-btn-delete, .action-btn-detail, .action-btn-publish {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .action-btn-edit:hover {
          background: rgba(65, 150, 240, 0.18) !important;
          border-color: rgba(65, 150, 240, 0.4) !important;
          transform: scale(1.05);
        }
        .action-btn-delete:hover {
          background: rgba(255, 82, 82, 0.18) !important;
          border-color: rgba(255, 82, 82, 0.4) !important;
          transform: scale(1.05);
        }
        .action-btn-detail:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
        .action-btn-publish:hover {
          background: rgba(65, 150, 240, 0.2) !important;
          border-color: rgba(65, 150, 240, 0.4) !important;
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
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  aiBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 168, 38, 0.25)',
    background: 'rgba(255, 168, 38, 0.06)',
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
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
    minHeight: '230px',
    borderRadius: '14px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.18)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  bookIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(65, 150, 240, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
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
  courseTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
  },
  courseDesc: {
    fontSize: '0.85rem',
    color: 'var(--grey-blue)',
    margin: 0,
    lineHeight: 1.5,
  },
  slugBadge: {
    fontSize: '0.72rem',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--grey-blue)',
    padding: '3px 8px',
    borderRadius: '4px',
    alignSelf: 'flex-start',
    fontFamily: 'monospace',
    marginTop: '6px',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: '14px',
    marginTop: '14px',
  },
  publishBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(65, 150, 240, 0.1)',
    border: '1px solid rgba(65, 150, 240, 0.25)',
    color: 'var(--azure)',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  detailBtn: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#ffffff',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  editActionBtn: {
    background: 'rgba(65, 150, 240, 0.06)',
    border: '1px solid rgba(65, 150, 240, 0.2)',
    borderRadius: '6px',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  deleteActionBtn: {
    background: 'rgba(255, 82, 82, 0.06)',
    border: '1px solid rgba(255, 82, 82, 0.2)',
    borderRadius: '6px',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.78rem',
    color: 'var(--grey-blue)',
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
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
  },
  aiGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    alignItems: 'stretch',
  },
  aiInputs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  aiPreview: {
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
    paddingLeft: '24px',
  },
  previewLabel: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--grey-blue)',
    marginBottom: '8px',
  },
  previewArea: {
    flex: 1,
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '16px',
    overflowY: 'auto',
    maxHeight: '400px',
    minHeight: '300px',
  },
  previewPlaceholder: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: '0.82rem',
    color: 'var(--grey)',
  },
  langBtn: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    background: 'rgba(255,255,255,0.02)',
    color: 'var(--grey-blue)',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  langBtnActive: {
    border: '1px solid var(--azure)',
    background: 'rgba(65, 150, 240, 0.1)',
    color: '#ffffff',
  },
  generateBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 18px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, var(--lemon), var(--d-yellow))',
    color: 'var(--bg-dark)',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '8px',
  },
  htmlContent: {
    fontSize: '0.88rem',
    color: '#e0e0e0',
    lineHeight: 1.6,
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  searchBarInput: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '0.82rem',
    outline: 'none',
    width: '100%',
  },
  studentsList: {
    maxHeight: '260px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    background: 'rgba(0,0,0,0.1)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '12px',
  },
  studentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    padding: '6px 8px',
    borderRadius: '6px',
    transition: 'background 0.2s',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    accentColor: 'var(--navy)',
  }
};