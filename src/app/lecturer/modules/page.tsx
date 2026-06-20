"use client";

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Edit2, X, Loader2, AlertCircle } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

interface Course {
  id: string;
  title: string;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  difficulty?: string;
  uuid_user?: string;
}

export default function ModulesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals/Forms State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [form, setForm] = useState({ title: '', description: '', difficulty: 'Beginner' });

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

  // Fetch all courses for the selector
  const fetchCourses = async () => {
    try {
      const auth = getAuthHeaders();
      const response = await apiGet<Course[] | { success: boolean; data: Course[] }>('/api/pembelajaran', {
        token: auth.token,
        headers: auth.headers
      });

      if (Array.isArray(response)) {
        setCourses(response);
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        setCourses(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const fetchModules = async () => {
    if (!selectedCourseId) {
      setModules([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const auth = getAuthHeaders();
      const response = await apiGet<Module[] | { success: boolean; data: Module[] }>('/api/modul', {
        token: auth.token,
        headers: auth.headers
      });

      let list: Module[] = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        list = response.data;
      }

      setModules(list);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar modul.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchModules();
  }, [selectedCourseId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !selectedCourseId) return;

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

      await apiPost('/api/modul', {
        title: form.title,
        description: form.description,
        difficulty: form.difficulty,
        uuid_user: userUuid
      }, {
        token: auth.token,
        headers: auth.headers
      });

      setShowCreateModal(false);
      setForm({ title: '', description: '', difficulty: 'Beginner' });
      fetchModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat modul.');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentModule || !form.title) return;

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

      const res = await fetch(`${API_BASE_URL}/api/modul/${currentModule.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          difficulty: form.difficulty
        })
      });

      if (!res.ok) throw new Error('Gagal memperbarui modul.');

      setShowEditModal(false);
      setCurrentModule(null);
      setForm({ title: '', description: '', difficulty: 'Beginner' });
      fetchModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui modul.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus modul ini?')) return;

    try {
      setError(null);
      const auth = getAuthHeaders();
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://103.127.139.237:1000';
      const headers = { ...auth.headers };
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/modul/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) throw new Error('Gagal menghapus modul.');
      fetchModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus modul.');
    }
  };

  const openCreateModal = () => {
    setForm({ title: '', description: '', difficulty: 'Beginner' });
    setShowCreateModal(true);
  };

  const openEditModal = (mod: Module) => {
    setCurrentModule(mod);
    setForm({
      title: mod.title,
      description: mod.description || '',
      difficulty: mod.difficulty || 'Beginner'
    });
    setShowEditModal(true);
  };

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.topHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={s.title}>Module Management</h1>
            <span style={s.apiBadge}>Consuming API</span>
          </div>
          <p style={s.subtitle}>Organize and manage learning modules for your courses</p>
        </div>
        {selectedCourseId && (
          <button onClick={openCreateModal} style={s.createBtn}>
            <Plus size={16} />
            <span>New Module</span>
          </button>
        )}
      </div>

      {/* Course Selector */}
      <div style={s.selectorRow}>
        <label style={s.selectorLabel}>Select Course:</label>
        <select 
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          style={s.courseSelect}
        >
          <option value="">Choose a course...</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {error && (
        <div style={s.errorAlert}>
          <AlertCircle size={20} color="#FF5252" />
          <span style={s.errorMsg}>{error}</span>
        </div>
      )}

      {/* Main Grid */}
      {!selectedCourseId ? (
        <div style={s.emptyState}>
          <Layers size={48} color="var(--grey)" />
          <h3 style={{ marginTop: 16, fontSize: '1.1rem', color: '#fff' }}>Select a Course</h3>
          <p style={{ color: 'var(--grey-blue)', fontSize: '0.85rem' }}>
            Choose a course from the dropdown above to view and manage its modules.
          </p>
        </div>
      ) : loading ? (
        <div style={s.loadingWrap}>
          <Loader2 size={36} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ marginTop: 12, color: 'var(--grey-blue)' }}>Loading modules...</span>
        </div>
      ) : modules.length === 0 ? (
        <div style={s.emptyState}>
          <Layers size={48} color="var(--grey)" />
          <h3 style={{ marginTop: 16, fontSize: '1.1rem', color: '#fff' }}>No Modules Found</h3>
          <p style={{ color: 'var(--grey-blue)', fontSize: '0.85rem' }}>Create a module to get started.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {modules.map((mod) => (
            <div key={mod.id} className="glass-panel" style={s.card}>
              <div style={s.cardHeader}>
                <div style={s.bookIconBox}>
                  <Layers size={18} color="var(--lemon)" />
                </div>
                <div style={s.cardActions}>
                  <button onClick={() => openEditModal(mod)} style={s.iconBtn} title="Edit Module">
                    <Edit2 size={14} color="var(--grey-blue)" />
                  </button>
                  <button onClick={() => handleDelete(mod.id)} style={s.iconBtn} title="Delete Module">
                    <Trash2 size={14} color="#FF5252" />
                  </button>
                </div>
              </div>
              <div style={s.cardBody}>
                <h3 style={s.moduleTitle}>{mod.title}</h3>
                <p style={s.moduleDesc}>{mod.description || 'No description provided.'}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {mod.difficulty && (
                    <span style={{ ...s.slugBadge, background: 'rgba(65, 150, 240, 0.15)', color: 'var(--azure)' }}>
                      {mod.difficulty}
                    </span>
                  )}
                  {mod.slug && <span style={s.slugBadge}>/{mod.slug}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent} className="glass-panel">
            <div style={s.modalHeader}>
              <h3>Create New Module</h3>
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
                  placeholder="e.g., Siklus Akuntansi Dasar"
                  style={s.input}
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Difficulty</label>
                <select 
                  value={form.difficulty} 
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  style={s.select}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the module outcomes and topics..."
                  style={{ ...s.input, minHeight: 100, resize: 'vertical' }}
                />
              </div>
              <div style={s.modalFooter}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={s.cancelBtn}>Cancel</button>
                <button type="submit" style={s.submitBtn}>Create Module</button>
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
              <h3>Edit Module</h3>
              <button onClick={() => setShowEditModal(false)} style={s.closeBtn}>
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
                <label style={s.label}>Difficulty</label>
                <select 
                  value={form.difficulty} 
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  style={s.select}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
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
                  setCurrentModule(null);
                }} style={s.cancelBtn}>Cancel</button>
                <button type="submit" style={s.submitBtn}>Save Changes</button>
              </div>
            </form>
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
  selectorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '28px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '12px 16px',
    maxWidth: '400px',
  },
  selectorLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--grey-blue)',
  },
  courseSelect: {
    flex: 1,
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
    minHeight: '180px',
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
    background: 'rgba(255, 178, 64, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
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
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  moduleTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
  },
  moduleDesc: {
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
  }
};
