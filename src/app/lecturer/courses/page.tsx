"use client";

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Trash2, Edit2, Sparkles, X, 
  Loader2, Globe, AlertCircle, CheckCircle2, ChevronRight, Eye, EyeOff, Archive, Users, Search
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

interface Course {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  status?: 'published' | 'draft' | 'archived';
  createdAt?: string;
}

interface Student {
  id: string;
  full_name: string;
  username: string;
  email: string;
}

export default function CoursesPage() {
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

      // Add default statuses just like nalara_lite if not present
      setCourses(list.map(c => ({
        ...c,
        status: c.status || 'draft'
      })));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar pembelajaran.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat pembelajaran.');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCourse || !form.title) return;

    try {
      setError(null);
      const auth = getAuthHeaders();
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://103.127.139.237:1000';
      const headers = {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui pembelajaran.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pembelajaran ini?')) return;

    try {
      setError(null);
      const auth = getAuthHeaders();
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://103.127.139.237:1000';
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus pembelajaran.');
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
    if (selectedStudents.length === 0) {
      alert("Harap pilih minimal satu mahasiswa untuk diberikan akses kelas.");
      return;
    }

    setPublishing(true);
    try {
      const auth = getAuthHeaders();
      await apiPost('/api/enroll', {
        course_id: publishCourseId,
        student_ids: selectedStudents
      }, {
        token: auth.token,
        headers: auth.headers
      });

      // Update local course status dynamically to published
      setCourses(prev => prev.map(c => c.id === publishCourseId ? { ...c, status: 'published' } : c));
      setPublishCourseId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal memberikan akses kelas.');
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
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://103.127.139.237:1000';
      const headers = {
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
            <span style={s.apiBadge}>Consuming API</span>
          </div>
          <p style={s.subtitle}>Create and manage courses, and generate smart lesson materials via AI</p>
        </div>
        <div style={s.headerActions}>
          <button onClick={() => setShowAiModal(true)} style={s.aiBtn}>
            <Sparkles size={16} color="var(--lemon)" />
            <span>AI Lesson Creator</span>
          </button>
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
            <div key={course.id} className="glass-panel" style={s.card}>
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
              </div>
              <div style={s.actionsRow}>
                <button 
                  onClick={() => handleOpenPublishModal(course.id)} 
                  disabled={course.status === 'published'}
                  style={{
                    ...s.publishBtn,
                    opacity: course.status === 'published' ? 0.6 : 1
                  }}
                >
                  <Eye size={12} />
                  <span>Publish & Assign</span>
                </button>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEditModal(course)} style={s.iconBtn}>
                    <Edit2 size={12} color="var(--grey-blue)" />
                  </button>
                  <button onClick={() => handleDelete(course.id)} style={s.iconBtn}>
                    <Trash2 size={12} color="#FF5252" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish & Assign Modal */}
      {publishCourseId && (
        <div style={s.modalOverlay}>
          <div style={{ ...s.modalContent, maxWidth: 540 }} className="glass-panel">
            <div style={s.modalHeader}>
              <h3>Publish & Assign Course</h3>
              <button onClick={() => setPublishCourseId(null)} style={s.closeBtn}>
                <X size={18} />
              </button>
            </div>
            {loadingStudents ? (
              <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
                <Loader2 size={24} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={s.searchBar}>
                  <Search size={14} color="var(--grey)" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={s.searchBarInput}
                  />
                </div>
                <div style={s.studentsList}>
                  {filteredStudents.map(student => (
                    <label key={student.id} style={s.studentItem}>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleToggleStudent(student.id)}
                        style={s.checkbox}
                      />
                      <div>
                        <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{student.full_name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--grey-blue)', display: 'block' }}>{student.email}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <div style={s.modalFooter}>
                  <button onClick={() => setPublishCourseId(null)} style={s.cancelBtn}>Cancel</button>
                  <button onClick={submitPublish} disabled={publishing} style={s.submitBtn}>
                    {publishing ? 'Publishing...' : 'Publish & Enroll'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
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
      )}

      {/* Edit Modal */}
      {showEditModal && (
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
      )}

      {/* AI Lesson Creator Modal */}
      {showAiModal && (
        <div style={s.modalOverlay}>
          <div style={{ ...s.modalContent, maxWidth: 900 }} className="glass-panel">
            <div style={s.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="var(--lemon)" />
                <h3>AI Reading Lesson Generator</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} style={s.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <div style={s.modalBody}>
              <div style={s.aiGrid}>
                <div style={s.aiInputs}>
                  <div style={s.formGroup}>
                    <label style={s.label}>Lesson Title</label>
                    <input
                      type="text"
                      value={aiTitle}
                      onChange={(e) => setAiTitle(e.target.value)}
                      placeholder="e.g., Konsep Aset & Liabilitas"
                      style={s.input}
                    />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Language</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setAiLang('id')}
                        style={{ ...s.langBtn, ...(aiLang === 'id' ? s.langBtnActive : {}) }}
                      >
                        Indonesian
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiLang('en')}
                        style={{ ...s.langBtn, ...(aiLang === 'en' ? s.langBtnActive : {}) }}
                      >
                        English
                      </button>
                    </div>
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>AI Writing Prompt / Topic Guidance</label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g., Jelaskan pengertian aset lancar dan aset tetap dengan contoh riil..."
                      style={{ ...s.input, minHeight: 140, resize: 'vertical' }}
                    />
                  </div>
                  <button
                    onClick={handleGenerateAiReading}
                    disabled={aiGenerating || !aiPrompt || !aiTitle}
                    style={{
                      ...s.generateBtn,
                      opacity: (aiGenerating || !aiPrompt || !aiTitle) ? 0.6 : 1
                    }}
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Generate Lesson Content</span>
                      </>
                    )}
                  </button>
                </div>

                <div style={s.aiPreview}>
                  <h4 style={s.previewLabel}>Generated HTML Output</h4>
                  <div style={s.previewArea}>
                    {generatedHtml ? (
                      <div 
                        style={s.htmlContent}
                        dangerouslySetInnerHTML={{ __html: generatedHtml }}
                      />
                    ) : (
                      <div style={s.previewPlaceholder}>
                        {aiGenerating ? 'AI is drafting your lesson content...' : 'Generated lesson preview will appear here.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
    minHeight: '220px',
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
