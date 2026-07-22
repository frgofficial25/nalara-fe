"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, Upload, CheckCircle2, AlertCircle, Loader2, Calendar, 
  ExternalLink, MessageSquare, ClipboardList, Info, HelpCircle, X
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import Portal from '@/components/common/Portal';

interface UrgentTask {
  id_tugas: string;
  nama_tugas: string;
  nama_pembelajaran: string;
  nama_modul: string;
  tipe: 'CaseStudy' | 'Practice' | 'Reading' | 'Video';
}

interface Submission {
  id: string;
  uuid_tugas: string;
  tugas?: {
    title: string;
    type: string;
    pembelajaran?: { title: string };
    modul?: { title: string };
  };
  ipynb_url?: string;
  pdf_url?: string;
  student_notes?: string;
  ai_score?: number;
  lecturer_verified?: boolean;
  lecturer_score?: number;
  mentor_verified?: boolean;
  mentor_score?: number;
  is_released?: boolean;
  final_score?: number;
  created_at?: string;
  tanggal_dikumpulkan?: string;
}

export default function StudyCaseSubmissionsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted'>('pending');
  const [tasks, setTasks] = useState<UrgentTask[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Submit Modal State
  const [submittingTask, setSubmittingTask] = useState<UrgentTask | null>(null);
  const [ipynbFile, setIpynbFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Detail Modal State
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const auth = getAuthHeaders();
      
      // Get current user id from local storage
      let userId = '';
      const localUser = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
      if (localUser) {
        try {
          const parsed = JSON.parse(localUser);
          if (parsed.id) userId = parsed.id;
        } catch {}
      }

      if (!userId) {
        throw new Error('Informasi pengguna tidak ditemukan. Sesi Anda mungkin telah kedaluwarsa.');
      }

      // Fetch urgent tasks (unsubmitted tasks)
      const tasksRes = await apiGet<{ success: boolean; data: UrgentTask[] } | UrgentTask[]>(
        `/api/students/${userId}/urgent-tasks`,
        { token: auth.token, headers: auth.headers }
      );
      const rawTasks = Array.isArray(tasksRes) ? tasksRes : (tasksRes as any).data || [];
      // Filter only CaseStudy and Practice types
      const filteredTasks = rawTasks.filter((t: any) => t.tipe === 'CaseStudy' || t.tipe === 'Practice');
      setTasks(filteredTasks);

      // Fetch submissions
      const subsRes = await apiGet<any>(
        '/api/study-case-submissions/me',
        { token: auth.token, headers: auth.headers }
      );
      const rawSubs = subsRes.data || subsRes;
      const mappedSubs = (Array.isArray(rawSubs) ? rawSubs : []).map((sub: any) => ({
        ...sub,
        id: sub.uuid_submission || sub.id,
        lecturer_verified: sub.lecture_status === 'Verified',
        mentor_verified: sub.mentor_status === 'Verified',
        final_score: sub.score,
        tanggal_dikumpulkan: sub.submitted_at
      }));
      setSubmissions(mappedSubs);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data tugas dan pengumpulan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openSubmitModal = (task: UrgentTask) => {
    setSubmittingTask(task);
    setIpynbFile(null);
    setPdfFile(null);
    setNotes('');
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingTask || !ipynbFile || !pdfFile) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const auth = getAuthHeaders();
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

      const headers: Record<string, string> = {
        ...auth.headers
      };
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }

      const formData = new FormData();
      formData.append('ipynb', ipynbFile);
      formData.append('pdf', pdfFile);
      if (notes) {
        formData.append('student_notes', notes);
      }

      const response = await fetch(`${API_BASE_URL}/api/study-case-submissions/${submittingTask.id_tugas}`, {
        method: 'POST',
        headers,
        body: formData
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.message || 'Gagal mengirimkan tugas.');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmittingTask(null);
        fetchData();
      }, 1500);

    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Tugas & Study Case</h1>
          <p style={s.subtitle}>Kumpulkan hasil pengerjaan notebook (.ipynb) dan laporan PDF Anda di sini.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button 
          onClick={() => setActiveTab('pending')}
          style={{ ...s.tab, ...(activeTab === 'pending' ? s.activeTab : {}) }}
        >
          Belum Dikerjakan ({tasks.length})
        </button>
        <button 
          onClick={() => setActiveTab('submitted')}
          style={{ ...s.tab, ...(activeTab === 'submitted' ? s.activeTab : {}) }}
        >
          Sudah Dikumpulkan ({submissions.length})
        </button>
      </div>

      {error && (
        <div style={s.errorAlert}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={s.loaderWrap}>
          <Loader2 size={36} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ marginTop: 12, color: 'var(--grey-blue)' }}>Memuat data...</span>
        </div>
      ) : activeTab === 'pending' ? (
        /* PENDING TASKS LIST */
        tasks.length === 0 ? (
          <div style={s.emptyState}>
            <CheckCircle2 size={48} color="#00C853" />
            <h3 style={{ marginTop: 16, color: '#fff', fontSize: '1.05rem' }}>Semua Tugas Selesai!</h3>
            <p style={{ color: 'var(--grey-blue)', fontSize: '0.85rem' }}>Tidak ada tugas mendesak yang perlu dikumpulkan.</p>
          </div>
        ) : (
          <div style={s.list}>
            {tasks.map(task => (
              <div key={task.id_tugas} style={s.card} className="glass-panel">
                <div>
                  <div style={s.cardHeader}>
                    <span style={s.typeBadge}>{task.tipe}</span>
                    <span style={s.courseLabel}>{task.nama_pembelajaran}</span>
                  </div>
                  <h3 style={s.taskTitle}>{task.nama_tugas}</h3>
                </div>
                <button onClick={() => openSubmitModal(task)} style={s.submitBtn}>
                  <Upload size={14} />
                  <span>Kumpulkan Tugas</span>
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        /* SUBMITTED LIST */
        submissions.length === 0 ? (
          <div style={s.emptyState}>
            <FileText size={48} color="var(--grey)" />
            <h3 style={{ marginTop: 16, color: '#fff', fontSize: '1.05rem' }}>Belum ada pengumpulan</h3>
            <p style={{ color: 'var(--grey-blue)', fontSize: '0.85rem' }}>Tugas yang sudah Anda kumpulkan akan muncul di sini.</p>
          </div>
        ) : (
          <div style={s.list}>
            {submissions.map(sub => (
              <div key={sub.id} style={s.card} className="glass-panel">
                <div>
                  <div style={s.cardHeader}>
                    <span style={{ 
                      ...s.statusBadge, 
                      background: sub.is_released ? 'rgba(0, 200, 83, 0.12)' : 'rgba(255, 178, 64, 0.12)',
                      color: sub.is_released ? '#00C853' : 'var(--lemon)'
                    }}>
                      {sub.is_released ? 'Nilai Dirilis' : 'Proses Verifikasi'}
                    </span>
                    <span style={s.courseLabel}>
                      {sub.tugas?.pembelajaran?.title || 'Course'}
                    </span>
                  </div>
                  <h3 style={s.taskTitle}>{sub.tugas?.title || 'Tugas Study Case'}</h3>
                  <div style={s.metaRow}>
                    <Calendar size={12} />
                    <span>Harga: </span>
                    <span>Dikumpulkan: {sub.tanggal_dikumpulkan ? new Date(sub.tanggal_dikumpulkan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : (sub.created_at ? new Date(sub.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-')}</span>
                  </div>
                  
                  {/* Scores */}
                  <div style={s.scoreBox}>
                    <div style={s.scoreItem}>
                      <span style={s.scoreLabelText}>AI Auto Score</span>
                      <span style={s.scoreVal}>{sub.ai_score ?? '-'}</span>
                    </div>
                    <div style={s.scoreItem}>
                      <span style={s.scoreLabelText}>Verified Score</span>
                      <span style={{ ...s.scoreVal, color: 'var(--azure)' }}>{sub.final_score ?? '-'}</span>
                    </div>
                  </div>
                </div>
                
                <button onClick={() => setSelectedSub(sub)} style={s.detailBtn}>
                  <Info size={14} />
                  <span>Detail & Feedback</span>
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Submit Assignment Modal */}
      {submittingTask && (
        <Portal>
          <div style={s.overlay}>
            <div style={{ ...s.modal, padding: '24px' }} className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Kumpulkan Tugas</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--grey-blue)' }}>{submittingTask.nama_tugas}</p>
              </div>
              <button onClick={() => setSubmittingTask(null)} style={{ background: 'none', border: 'none', color: 'var(--grey-blue)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {submitError && (
              <div style={s.submitErrorAlert}>
                <AlertCircle size={15} />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess ? (
              <div style={s.successBox}>
                <CheckCircle2 size={36} color="#00C853" style={{ animation: 'pulse 1s infinite' }} />
                <span style={{ marginTop: 8, color: '#fff', fontWeight: 600 }}>Berhasil Dikumpulkan!</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--grey-blue)' }}>Sistem sedang menilai kode Anda...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={s.form}>
                <div style={s.formGroup}>
                  <label style={s.label}>1. File Jupyter Notebook (.ipynb) <span style={{ color: '#FF5252' }}>*</span></label>
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                  }}>
                    <input 
                      type="file" 
                      required 
                      accept=".ipynb"
                      onChange={(e) => setIpynbFile(e.target.files?.[0] || null)}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }} 
                    />
                    <span style={{ fontSize: '0.88rem', color: ipynbFile ? '#fff' : 'var(--grey)' }}>
                      {ipynbFile ? ipynbFile.name : 'Pilih file Jupyter Notebook...'}
                    </span>
                  </div>
                  {ipynbFile && <span style={s.fileHint}>File terpilih: {ipynbFile.name} ({Math.round(ipynbFile.size / 1024)} KB)</span>}
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>2. Laporan Latihan (PDF) <span style={{ color: '#FF5252' }}>*</span></label>
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                  }}>
                    <input 
                      type="file" 
                      required 
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }} 
                    />
                    <span style={{ fontSize: '0.88rem', color: pdfFile ? '#fff' : 'var(--grey)' }}>
                      {pdfFile ? pdfFile.name : 'Pilih file Laporan PDF...'}
                    </span>
                  </div>
                  {pdfFile && <span style={s.fileHint}>File terpilih: {pdfFile.name} ({Math.round(pdfFile.size / 1024)} KB)</span>}
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Catatan Tambahan (Opsional)</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tuliskan catatan pengerjaan jika ada..."
                    style={s.textarea} 
                  />
                </div>

                <div style={{ ...s.modalFooter, borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', marginTop: '12px' }}>
                  <button type="button" onClick={() => setSubmittingTask(null)} style={s.cancelBtn}>Batal</button>
                  <button type="submit" disabled={submitting} style={s.submitActionBtn}>
                    {submitting ? (
                      <>
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>Kirim Tugas</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        </Portal>
      )}

      {/* Detail Modal */}
      {selectedSub && (
        <Portal>
          <div style={s.overlay}>
            <div style={{ ...s.modal, maxWidth: 520 }} className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Detail Pengumpulan</h3>
              <button onClick={() => setSelectedSub(null)} style={{ background: 'none', border: 'none', color: 'var(--grey-blue)', cursor: 'pointer' }}>Close</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <span style={s.detailLabel}>Nama Tugas:</span>
                <p style={{ fontSize: '0.9rem', color: '#fff', margin: '4px 0 0 0', fontWeight: 600 }}>{selectedSub.tugas?.title}</p>
              </div>

              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <span style={s.detailLabel}>File Pengumpulan:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {selectedSub.ipynb_url && (
                      <a href={selectedSub.ipynb_url} target="_blank" rel="noopener noreferrer" style={s.fileLink}>
                        <FileText size={14} />
                        <span>Notebook</span>
                      </a>
                    )}
                    {selectedSub.pdf_url && (
                      <a href={selectedSub.pdf_url} target="_blank" rel="noopener noreferrer" style={s.fileLink}>
                        <FileText size={14} />
                        <span>PDF Report</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {selectedSub.student_notes && (
                <div>
                  <span style={s.detailLabel}>Catatan Anda:</span>
                  <p style={s.detailNotesVal}>"{selectedSub.student_notes}"</p>
                </div>
              )}

              <hr style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

              <div>
                <span style={s.detailLabel}>Status Evaluasi & Verifikasi:</span>
                <div style={s.statusGrid}>
                  <div style={s.statusItem}>
                    <span>Status Verifikasi</span>
                    <strong style={{ color: (selectedSub.lecturer_verified || selectedSub.mentor_verified) ? '#00C853' : 'var(--lemon)' }}>
                      {(selectedSub.lecturer_verified || selectedSub.mentor_verified) ? 'Verified' : 'Pending'}
                    </strong>
                  </div>
                  <div style={s.statusItem}>
                    <span>Skor Rilis Akhir</span>
                    <strong style={{ color: 'var(--azure)', fontSize: '1.05rem' }}>{selectedSub.final_score ?? '-'}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ ...s.modalFooter, marginTop: 24 }}>
              <button onClick={() => setSelectedSub(null)} style={{ ...s.cancelBtn, width: '100%' }}>Tutup</button>
            </div>
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
          background: rgba(255, 255, 255, 0.01) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
        }
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    padding: '4px 0',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--grey-blue)',
    marginTop: 4,
    margin: 0,
  },
  tabs: {
    display: 'flex',
    gap: 8,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 1,
    marginBottom: 20,
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--grey-blue)',
    padding: '8px 16px',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  activeTab: {
    color: 'var(--azure)',
    borderBottom: '2px solid var(--azure)',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(244, 67, 54, 0.08)',
    border: '1px solid rgba(244, 67, 54, 0.2)',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#FF5252',
    fontSize: '0.82rem',
    marginBottom: 20,
  },
  loaderWrap: {
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
    background: 'rgba(255,255,255,0.01)',
    border: '1px dashed rgba(255,255,255,0.08)',
    borderRadius: 14,
    textAlign: 'center',
  },
  list: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 20,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 180,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 4,
    background: 'rgba(65, 150, 240, 0.1)',
    color: 'var(--azure)',
    border: '1px solid rgba(65, 150, 240, 0.2)',
  },
  statusBadge: {
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 4,
  },
  courseLabel: {
    fontSize: '0.72rem',
    color: 'var(--grey-blue)',
    fontWeight: 500,
  },
  taskTitle: {
    fontSize: '0.98rem',
    fontWeight: 700,
    color: '#fff',
    margin: '0 0 6px 0',
    lineHeight: 1.4,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '0.78rem',
    color: 'var(--grey-blue)',
    marginBottom: 14,
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, var(--navy), var(--m-blue))',
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(6, 99, 199, 0.25)',
  },
  detailBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.02)',
    color: '#e2e8f0',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  scoreBox: {
    display: 'flex',
    gap: 16,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: '8px 12px',
    marginBottom: 14,
  },
  scoreItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  scoreLabelText: {
    fontSize: '0.65rem',
    color: 'var(--grey-blue)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  scoreVal: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: '#fff',
    marginTop: 2,
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    padding: 16,
  },
  modal: {
    maxWidth: 540,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: 16,
    padding: 24,
    background: 'rgba(20, 20, 20, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(16px)',
  },
  modalTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#fff',
    margin: '0 0 6px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#cbd5e1',
  },
  fileInput: {
    fontSize: '0.8rem',
    color: 'var(--grey-blue)',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    outline: 'none',
  },
  fileHint: {
    fontSize: '0.72rem',
    color: 'var(--azure)',
    fontWeight: 500,
  },
  textarea: {
    fontSize: '0.85rem',
    color: '#fff',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    minHeight: 80,
    resize: 'vertical',
    outline: 'none',
  },
  submitErrorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(244, 67, 54, 0.08)',
    border: '1px solid rgba(244, 67, 54, 0.2)',
    borderRadius: 8,
    padding: '8px 12px',
    color: '#FF5252',
    fontSize: '0.78rem',
    marginBottom: 14,
  },
  successBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 0',
  },
  modalFooter: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelBtn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#cbd5e1',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitActionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 18px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, var(--navy), var(--m-blue))',
    color: '#fff',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  detailLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--grey-blue)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  fileLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '0.8rem',
    color: 'var(--azure)',
    textDecoration: 'none',
    background: 'rgba(65, 150, 240, 0.08)',
    border: '1px solid rgba(65, 150, 240, 0.15)',
    padding: '6px 12px',
    borderRadius: 6,
    fontWeight: 500,
  },
  detailNotesVal: {
    fontSize: '0.85rem',
    color: '#e2e8f0',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    padding: '8px 12px',
    borderRadius: 8,
    margin: '4px 0 0 0',
    fontStyle: 'italic',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginTop: 6,
  },
  statusItem: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    padding: '8px 12px',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    fontSize: '0.72rem',
    color: 'var(--grey-blue)',
  },
};
