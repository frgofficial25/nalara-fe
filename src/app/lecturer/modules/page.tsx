"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Trash2, Edit2, X, Loader2, AlertCircle, Calendar, Clock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
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

interface ModuleSchedule {
  moduleId: string;
  scheduledAt: string; // ISO date string
  status: 'scheduled' | 'published';
}

export default function ModulesPage() {
  const router = useRouter();
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

  // Schedule / Publish State
  const [schedules, setSchedules] = useState<Record<string, ModuleSchedule>>({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleModuleId, setScheduleModuleId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');

  // Drag and Drop State
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItemIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    const newModules = [...modules];
    const draggedItem = newModules[draggedItemIndex];
    newModules.splice(draggedItemIndex, 1);
    newModules.splice(index, 0, draggedItem);
    
    setModules(newModules);
    setDraggedItemIndex(null);
  };

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
        setCourses(response.map((c: any) => ({ ...c, id: c.uuid_pembelajaran || c.id })));
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        setCourses(response.data.map((c: any) => ({ ...c, id: c.uuid_pembelajaran || c.id })));
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
      const response = await apiGet<Module[] | { success: boolean; data: Module[] }>(
        `/api/modul?uuid_pembelajaran=${selectedCourseId}`, {
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
        .filter((m: any) => m.uuid_pembelajaran === selectedCourseId)
        .map((m: any) => ({
          ...m,
          id: m.uuid_modul || m.id,
          title: m.nama_modul || m.title || '',
          description: m.deskripsi || m.description || '',
        }));

      setModules(list);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar modul.');
    } finally {
      setLoading(false);
    }
  };

  // Load schedules from localStorage
  const loadSchedules = useCallback(() => {
    try {
      const stored = localStorage.getItem('nalara_module_schedules');
      if (stored) {
        setSchedules(JSON.parse(stored));
      }
    } catch { /* ignore */ }
  }, []);

  const saveSchedules = (newSchedules: Record<string, ModuleSchedule>) => {
    setSchedules(newSchedules);
    localStorage.setItem('nalara_module_schedules', JSON.stringify(newSchedules));
  };

  useEffect(() => {
    fetchCourses();
    loadSchedules();
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('course_id');
    if (courseId) {
      setSelectedCourseId(courseId);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [selectedCourseId]);

  // Background schedule checker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const updated = { ...schedules };
      let changed = false;
      Object.entries(updated).forEach(([moduleId, schedule]) => {
        if (schedule.status === 'scheduled' && new Date(schedule.scheduledAt) <= now) {
          updated[moduleId] = { ...schedule, status: 'published' };
          changed = true;
        }
      });
      if (changed) {
        saveSchedules(updated);
      }
    }, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [schedules]);

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
        uuid_pembelajaran: selectedCourseId,
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
      await apiPut(`/api/modul/${currentModule.id}`, {
        title: form.title,
        description: form.description,
        difficulty: form.difficulty
      }, { token: auth.token, headers: auth.headers });

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
      await apiDelete(`/api/modul/${id}`, { token: auth.token, headers: auth.headers });
      // Also remove schedule if any
      const updated = { ...schedules };
      delete updated[id];
      saveSchedules(updated);
      fetchModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus modul.');
    }
  };

  const handleSchedule = (moduleId: string) => {
    setScheduleModuleId(moduleId);
    const existing = schedules[moduleId];
    if (existing && existing.status === 'scheduled') {
      // Pre-fill with existing schedule
      const d = new Date(existing.scheduledAt);
      const pad = (n: number) => String(n).padStart(2, '0');
      setScheduleDate(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } else {
      setScheduleDate('');
    }
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = () => {
    if (!scheduleModuleId || !scheduleDate) return;
    const updated = { ...schedules };
    updated[scheduleModuleId] = {
      moduleId: scheduleModuleId,
      scheduledAt: new Date(scheduleDate).toISOString(),
      status: 'scheduled',
    };
    saveSchedules(updated);
    setShowScheduleModal(false);
    setScheduleModuleId(null);
    setScheduleDate('');
  };

  const handlePublishNow = (moduleId: string) => {
    const updated = { ...schedules };
    updated[moduleId] = {
      moduleId,
      scheduledAt: new Date().toISOString(),
      status: 'published',
    };
    saveSchedules(updated);
  };

  const handleUnpublish = (moduleId: string) => {
    const updated = { ...schedules };
    delete updated[moduleId];
    saveSchedules(updated);
  };

  const getModuleStatus = (moduleId: string): 'draft' | 'scheduled' | 'published' => {
    const schedule = schedules[moduleId];
    if (!schedule) return 'draft';
    return schedule.status;
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
        <label style={s.selectorLabel}>Course:</label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          style={s.courseSelect as React.CSSProperties}
        >
          <option value="">— Pilih Kelas —</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>
              {(c as any).nama_pembelajaran || c.title}
            </option>
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
          {modules.map((mod, index) => (
            <div 
              key={mod.id} 
              className="glass-panel" 
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, index)}
              style={{ ...s.card as React.CSSProperties, cursor: 'grab', opacity: draggedItemIndex === index ? 0.5 : 1 }}
              onClick={() => router.push(`/lecturer/tugas?course_id=${selectedCourseId}&module_id=${mod.id}`)}
            >
              <div style={s.cardHeader}>
                <div style={s.bookIconBox}>
                  <Layers size={18} color="var(--lemon)" />
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
                  {/* Status badge */}
                  {(() => {
                    const status = getModuleStatus(mod.id);
                    if (status === 'published') return (
                      <span style={{ ...s.slugBadge, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                        <Eye size={10} style={{ marginRight: 4 }} /> Published
                      </span>
                    );
                    if (status === 'scheduled') {
                      const sch = schedules[mod.id];
                      return (
                        <span style={{ ...s.slugBadge, background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                          <Clock size={10} style={{ marginRight: 4 }} /> {new Date(sch.scheduledAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      );
                    }
                    return (
                      <span style={{ ...s.slugBadge, background: 'rgba(148,163,184,0.15)', color: '#94a3b8' }}>
                        <EyeOff size={10} style={{ marginRight: 4 }} /> Draft
                      </span>
                    );
                  })()}
                  {mod.slug && <span style={s.slugBadge}>/{mod.slug}</span>}
                </div>
              </div>
              <div style={s.cardActions}>
                {/* Publish/Schedule buttons */}
                {(() => {
                  const status = getModuleStatus(mod.id);
                  if (status === 'published') return (
                    <button onClick={(e) => { e.stopPropagation(); handleUnpublish(mod.id); }} style={{ ...s.iconBtn, background: 'rgba(16,185,129,0.1)' }} title="Unpublish">
                      <EyeOff size={14} color="#10b981" />
                    </button>
                  );
                  return (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handlePublishNow(mod.id); }} style={{ ...s.iconBtn, background: 'rgba(16,185,129,0.1)' }} title="Publish Now">
                        <Eye size={14} color="#10b981" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleSchedule(mod.id); }} style={{ ...s.iconBtn, background: 'rgba(251,191,36,0.1)' }} title="Schedule Publish">
                        <Calendar size={14} color="#fbbf24" />
                      </button>
                    </>
                  );
                })()}
                <button onClick={(e) => { e.stopPropagation(); openEditModal(mod); }} style={s.iconBtn} title="Edit Module">
                  <Edit2 size={14} color="var(--grey-blue)" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(mod.id); }} style={s.iconBtn} title="Delete Module">
                  <Trash2 size={14} color="#FF5252" />
                </button>
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

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent} className="glass-panel">
            <div style={s.modalHeader}>
              <h3>Jadwalkan Publikasi Modul</h3>
              <button onClick={() => setShowScheduleModal(false)} style={s.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <div style={s.form}>
              <div style={s.formGroup}>
                <label style={s.label}>Tanggal & Waktu Publikasi</label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  style={s.input}
                />
              </div>
              <p style={{ color: 'var(--grey-blue)', fontSize: '0.82rem', margin: 0 }}>
                Modul akan otomatis berubah status menjadi Published pada waktu yang ditentukan.
              </p>
              <div style={s.modalFooter}>
                <button type="button" onClick={() => setShowScheduleModal(false)} style={s.cancelBtn}>Batal</button>
                <button 
                  type="button" 
                  onClick={handleSaveSchedule} 
                  disabled={!scheduleDate}
                  style={{ ...s.submitBtn, opacity: scheduleDate ? 1 : 0.5, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                >
                  <Calendar size={14} style={{ marginRight: 6 }} /> Jadwalkan
                </button>
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
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    padding: '16px 24px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '20px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    margin: 0,
    gap: '16px',
    flexShrink: 0,
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
    flexShrink: 0,
    marginLeft: 'auto',
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
    gap: '4px',
    flex: 1,
    minWidth: 0,
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
