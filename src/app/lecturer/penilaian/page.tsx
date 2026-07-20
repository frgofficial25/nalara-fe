"use client";

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Award, Search, BookOpen, Brain,
  CheckCircle2, Loader2, X, RefreshCw,
  FileText, AlertCircle, ChevronRight, PenLine, Star,
} from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GradeAttempt {
  quizTitle: string;
  courseTitle: string;
  courseId?: string;
  score: number;
  passingScore: number;
  isPassed: boolean;
  date: string;
}

interface GradeRow {
  studentName: string;
  studentEmail: string;
  completedCount: number;
  averageScore: number;
  status: 'Passed' | 'Failed';
  attempts: GradeAttempt[];
}

interface StudyCaseSubmission {
  id: string;
  student: { full_name: string; email: string };
  tugas: { title: string; uuid_pembelajaran?: string };
  pembelajaran?: { title: string; uuid_pembelajaran?: string };
  modul?: { title: string; uuid_pembelajaran?: string };
  student_notes?: string;
  ipynb_url?: string;
  pdf_url?: string;
  ai_score?: number;
  ai_reason?: string;
  ai_feedback?: {
    strengths?: string[];
    deductions?: { section: string; points_lost: number; reason: string; suggestion: string }[];
    improvement_summary?: string;
  };
  lecture_status: 'Pending' | 'Verified';
  mentor_status: 'Pending' | 'Verified';
  lecture_notes?: string;
  mentor_notes?: string;
  released_score?: number;
  released_reason?: string;
  is_released: boolean;
  submitted_at?: string;
}

// ─── Auth helper ──────────────────────────────────────────────────────────────
function getAuth() {
  const token = getStoredToken();
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) headers['x-api-key'] = apiKey;
  else if (token) headers['x-api-key'] = token;
  return { token: token || undefined, headers };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PenilaianPage() {
  // ── Tab state ────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<'quiz' | 'studycase'>('quiz');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── User role (Lecturer / Mentor) ────────────────────────────────────────
  const [userRole, setUserRole] = useState<'Lecturer' | 'Mentor'>('Lecturer');
  useEffect(() => {
    const raw = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
    if (!raw) return;
    try {
      const r = JSON.parse(raw).role?.toLowerCase();
      setUserRole(r === 'mentor' || r === 'tentor' ? 'Mentor' : 'Lecturer');
    } catch {}
  }, []);

  // Shared courses list across tabs
  const [courses, setCourses] = useState<any[]>([]);

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 1 — QUIZ GRADE CENTER
  // ─────────────────────────────────────────────────────────────────────────
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  
  // Tab 1 Filters
  const [quizSearch, setQuizSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [quizStatusFilter, setQuizStatusFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<GradeRow | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuiz = async () => {
    setQuizLoading(true);
    setQuizError(null);
    try {
      const auth = getAuth();
      const [cRes, gRes] = await Promise.all([
        apiGet<any>('/api/pembelajaran', { token: auth.token, headers: auth.headers }),
        apiGet<any>('/api/grade-center/students', { token: auth.token, headers: auth.headers }),
      ]);
      const fetchedCourses = Array.isArray(cRes) ? cRes : (cRes?.data ?? []);
      setCourses(fetchedCourses);

      // Create lookup map for course title by ID
      const courseMap = new Map<string, string>();
      fetchedCourses.forEach((c: any) => {
        const id = c.uuid_pembelajaran || c.id;
        if (id) courseMap.set(id, c.title || c.nama_pembelajaran || '');
      });

      // Backend returns flat array of QuizAttempt records — group by student
      const rawAttempts: any[] = Array.isArray(gRes) ? gRes : (gRes?.data ?? []);
      const byUser = new Map<string, any>();
      rawAttempts.forEach(attempt => {
        const userId = attempt.user?.uuid_user || attempt.uuid_user || attempt.user?.email || '';
        if (!byUser.has(userId)) {
          byUser.set(userId, {
            studentName: attempt.user?.full_name || attempt.user?.username || 'Unknown',
            studentEmail: attempt.user?.email || '-',
            attempts: [],
          });
        }
        byUser.get(userId).attempts.push(attempt);
      });

      const grouped: GradeRow[] = Array.from(byUser.values()).map(u => {
        const attempts = u.attempts;
        const avg = attempts.length > 0
          ? Math.round(attempts.reduce((sum: number, a: any) => sum + (a.score ?? 0), 0) / attempts.length)
          : 0;
        const anyPassed = attempts.some((a: any) => a.is_passed);
        return {
          studentName: u.studentName,
          studentEmail: u.studentEmail,
          completedCount: attempts.length,
          averageScore: avg,
          status: anyPassed ? 'Passed' : 'Failed',
          attempts: attempts.map((a: any) => {
            const cId = a.quiz?.uuid_pembelajaran || a.uuid_pembelajaran || '';
            const cTitle = courseMap.get(cId) || a.quiz?.pembelajaran?.title || a.pembelajaran?.title || '-';
            return {
              quizTitle: a.quiz?.title || '-',
              courseTitle: cTitle,
              courseId: cId,
              score: a.score ?? 0,
              passingScore: 75,
              isPassed: !!a.is_passed,
              date: a.completed_at
                ? new Date(a.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                : a.started_at
                ? new Date(a.started_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                : '-',
            };
          }),
        };
      });
      setGrades(grouped);
    } catch (e: any) {
      setQuizError(e.message || 'Gagal memuat data nilai kuis.');
    } finally {
      setQuizLoading(false);
      setRefreshing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 2 — STUDY CASE VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────
  const [submissions, setSubmissions] = useState<StudyCaseSubmission[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);

  // Tab 2 Filters
  const [subSearch, setSubSearch] = useState('');
  const [subSelectedCourse, setSubSelectedCourse] = useState('all');
  const [subStatusFilter, setSubStatusFilter] = useState<'all' | 'pending' | 'verified'>('all');

  // Verify modal state
  const [modal, setModal] = useState<StudyCaseSubmission | null>(null);
  const [modalNotes, setModalNotes] = useState('');
  const [modalScore, setModalScore] = useState('');
  const [modalReason, setModalReason] = useState('');
  const [verifying, setVerifying] = useState(false);

  // AI feedback expanded
  const [expandedAI, setExpandedAI] = useState<string | null>(null);

  const fetchQueue = async () => {
    setSubLoading(true);
    setSubError(null);
    try {
      const auth = getAuth();
      const [cRes, sRes] = await Promise.all([
        apiGet<any>('/api/pembelajaran', { token: auth.token, headers: auth.headers }),
        apiGet<any>('/api/study-case-submissions/review-queue', { token: auth.token, headers: auth.headers }),
      ]);
      const fetchedCourses = Array.isArray(cRes) ? cRes : (cRes?.data ?? []);
      setCourses(fetchedCourses);

      const raw: any[] = Array.isArray(sRes) ? sRes : (sRes?.data ?? []);
      setSubmissions(raw.map(s => ({
        id: s.uuid_submission,
        student: s.student ?? { full_name: 'Unknown', email: '-' },
        tugas: s.tugas ?? { title: '-' },
        pembelajaran: s.tugas?.pembelajaran ?? s.pembelajaran,
        modul: s.tugas?.modul ?? s.modul,
        student_notes: s.student_notes,
        ipynb_url: s.ipynb_url,
        pdf_url: s.pdf_url,
        ai_score: s.ai_score,
        ai_reason: s.ai_reason,
        ai_feedback: s.ai_feedback,
        lecture_status: s.lecture_status ?? 'Pending',
        mentor_status: s.mentor_status ?? 'Pending',
        lecture_notes: s.lecture_notes,
        mentor_notes: s.mentor_notes,
        released_score: s.released_score,
        released_reason: s.released_reason,
        is_released: !!s.is_released,
        submitted_at: s.submitted_at,
      })));
    } catch (e: any) {
      setSubError(e.message || 'Gagal memuat antrian review studi kasus.');
    } finally {
      setSubLoading(false);
      setRefreshing(false);
    }
  };

  const handleVerify = async () => {
    if (!modal) return;
    setVerifying(true);
    try {
      const auth = getAuth();
      const verifierRole = userRole === 'Mentor' ? 'mentor' : 'lecturer';
      const body: Record<string, any> = { verifier_role: verifierRole };
      if (modalNotes.trim()) body.notes = modalNotes.trim();
      if (modalScore !== '') {
        const scoreNum = Number(modalScore);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
          showToast('Nilai tidak boleh lebih dari 100 atau kurang dari 0', 'error');
          setVerifying(false);
          return;
        }
        body.score_override = scoreNum;
      }
      if (modalReason.trim()) body.reason_override = modalReason.trim();

      const result = await apiPatch<any>(
        `/api/study-case-submissions/${modal.id}/verify`,
        body,
        { token: auth.token, headers: auth.headers },
      );

      const msg = result?.message ||
        (body.score_override !== undefined
          ? 'Verifikasi & nilai berhasil disimpan!'
          : 'Verifikasi berhasil disimpan!');
      showToast(msg, 'success');
      setModal(null);
      setModalNotes(''); setModalScore(''); setModalReason('');
      await fetchQueue();
    } catch (e: any) {
      showToast(`Gagal melakukan verifikasi: ${e.message}`, 'error');
    } finally {
      setVerifying(false);
    }
  };

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab === 'quiz') fetchQuiz();
    else if (tab === 'studycase') fetchQueue();
  }, [tab]);

  // ── Quiz derived data & filter ───────────────────────────────────────────
  const graded = grades.filter(g => g.completedCount > 0);
  const passRate = graded.length > 0 ? Math.round(graded.filter(g => g.status === 'Passed').length / graded.length * 100) : 0;
  const classAvg = graded.length > 0 ? Math.round(graded.reduce((s, g) => s + g.averageScore, 0) / graded.length) : 0;

  const filteredGrades = grades.filter(g => {
    // 1. Search filter
    const q = quizSearch.toLowerCase().trim();
    const nameMatch = !q || g.studentName.toLowerCase().includes(q) || g.studentEmail.toLowerCase().includes(q);
    
    // 2. Course filter
    let courseMatch = true;
    if (selectedCourse !== 'all') {
      const courseObj = courses.find((c: any) => (c.uuid_pembelajaran || c.id) === selectedCourse);
      courseMatch = g.attempts.some((a: any) => 
        a.courseId === selectedCourse || 
        (courseObj && (a.courseTitle === courseObj.title || a.courseTitle === courseObj.nama_pembelajaran))
      );
    }

    // 3. Status filter
    let statusMatch = true;
    if (quizStatusFilter !== 'all') {
      statusMatch = g.status === quizStatusFilter;
    }

    return nameMatch && courseMatch && statusMatch;
  });

  // ── Study case derived data & filter ─────────────────────────────────────
  const filteredSubmissions = submissions.filter(sub => {
    // 1. Search filter
    const q = subSearch.toLowerCase().trim();
    const nameMatch = !q || 
      (sub.student?.full_name || '').toLowerCase().includes(q) || 
      (sub.student?.email || '').toLowerCase().includes(q) ||
      (sub.tugas?.title || '').toLowerCase().includes(q);

    // 2. Course filter
    let courseMatch = true;
    if (subSelectedCourse !== 'all') {
      const subCourseId = sub.pembelajaran?.uuid_pembelajaran || sub.tugas?.uuid_pembelajaran || sub.modul?.uuid_pembelajaran;
      const subCourseTitle = sub.pembelajaran?.title;
      const courseObj = courses.find((c: any) => (c.uuid_pembelajaran || c.id) === subSelectedCourse);
      courseMatch = subCourseId === subSelectedCourse || (courseObj && subCourseTitle === (courseObj.title || courseObj.nama_pembelajaran));
    }

    // 3. Status filter
    let statusMatch = true;
    if (subStatusFilter !== 'all') {
      const isVerified = userRole === 'Mentor'
        ? sub.mentor_status === 'Verified'
        : sub.lecture_status === 'Verified';
      if (subStatusFilter === 'verified') statusMatch = isVerified;
      if (subStatusFilter === 'pending') statusMatch = !isVerified;
    }

    return nameMatch && courseMatch && statusMatch;
  });

  // Grade letter thresholds
  const getLetter = (s: number) =>
    s >= 85 ? 'A' : s >= 80 ? 'B+' : s >= 70 ? 'B' : s >= 65 ? 'C+' : s >= 55 ? 'C' : s >= 45 ? 'D' : s > 0 ? 'E' : '-';

  const openModal = (sub: StudyCaseSubmission) => {
    setModal(sub);
    setModalNotes('');
    setModalScore(sub.ai_score !== undefined ? String(sub.ai_score) : '');
    setModalReason('');
  };

  return (
    <div style={s.page}>
      {/* Toast Banner */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 8,
          background: toast.type === 'success' ? '#00C853' : '#FF5252', color: '#fff', fontWeight: 600,
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Penilaian</h1>
          <p style={s.subtitle}>Pantau nilai kuis & verifikasi studi kasus siswa</p>
        </div>
        <button
          onClick={() => { 
            setRefreshing(true); 
            if (tab === 'quiz') fetchQuiz(); 
            else if (tab === 'studycase') fetchQueue();
          }}
          disabled={quizLoading || subLoading}
          style={s.btnGhost}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={s.tabBar}>
        {([
          { key: 'quiz',      label: 'Nilai Kuis',            icon: <Brain size={15} /> },
          { key: 'studycase', label: 'Verifikasi Studi Kasus', icon: <FileText size={15} /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ ...s.tabBtn, ...(tab === t.key ? s.tabActive : {}) }}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════
          TAB 1: QUIZ GRADE CENTER
      ═══════════════════════════════════════════════ */}
      {tab === 'quiz' && (
        <>
          {/* KPI */}
          <div style={s.kpiGrid}>
            {[
              { label: 'Total Siswa', val: grades.length, color: '#fff' },
              { label: 'Rata-rata Kelas', val: quizLoading ? '...' : `${classAvg}%`, color: 'var(--azure)' },
              { label: 'Tingkat Lulus', val: quizLoading ? '...' : `${passRate}%`, color: '#00C853' },
            ].map(k => (
              <div key={k.label} className="glass-panel" style={s.kpiCard}>
                <span style={s.kpiLabel}>{k.label}</span>
                <span style={{ ...s.kpiVal, color: k.color }}>{k.val}</span>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="glass-panel" style={s.filterRow}>
            <div style={s.searchWrap}>
              <Search size={15} color="var(--grey)" />
              <input
                type="text"
                placeholder="Cari nama / email siswa..."
                value={quizSearch}
                onChange={e => setQuizSearch(e.target.value)}
                style={s.searchInput}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={15} color="var(--grey-blue)" />
                <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} style={s.select}>
                  <option value="all">Semua Kelas</option>
                  {courses.map((c: any) => (
                    <option key={c.uuid_pembelajaran || c.id} value={c.uuid_pembelajaran || c.id}>
                      {c.title || c.nama_pembelajaran}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={15} color="var(--grey-blue)" />
                <select value={quizStatusFilter} onChange={e => setQuizStatusFilter(e.target.value)} style={s.select}>
                  <option value="all">Semua Status</option>
                  <option value="Passed">Lulus</option>
                  <option value="Failed">Tidak Lulus</option>
                </select>
              </div>
            </div>
          </div>

          {quizError && <div style={s.errBanner}><AlertCircle size={16} /><span>{quizError}</span></div>}

          {quizLoading ? (
            <div style={s.centered}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /><p>Memuat nilai kuis...</p></div>
          ) : filteredGrades.length === 0 ? (
            <div style={s.empty}>
              <Award size={48} color="var(--border-color)" />
              <h3>Data Tidak Ditemukan</h3>
              <p>Tidak ada data siswa yang cocok dengan filter yang dipilih.</p>
            </div>
          ) : (
            <div className="glass-panel" style={{ borderRadius: 12, overflow: 'hidden' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Siswa', 'Kuis Selesai', 'Rata-rata', 'Grade', 'Status', ''].map(h => (
                      <th key={h} style={{ ...s.th, ...(h === '' ? { textAlign: 'right' } : {}) }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredGrades.map((row, i) => (
                    <tr key={i} style={s.tr}>
                      <td style={s.td}>
                        <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{row.studentName}</strong>
                        <span style={{ display: 'block', fontSize: '0.76rem', color: 'var(--grey-blue)' }}>{row.studentEmail}</span>
                      </td>
                      <td style={s.td}><span style={s.pill}>{row.completedCount} kuis</span></td>
                      <td style={s.td}>
                        <strong style={{ color: row.averageScore >= 60 ? 'var(--azure)' : '#FF5252' }}>
                          {row.completedCount > 0 ? `${row.averageScore}%` : '-'}
                        </strong>
                      </td>
                      <td style={s.td}><span style={{ fontWeight: 700, fontSize: '1rem' }}>{getLetter(row.averageScore)}</span></td>
                      <td style={s.td}>
                        {row.completedCount === 0
                          ? <span style={s.pillGrey}>Belum ada</span>
                          : row.status === 'Passed'
                          ? <span style={s.pillGreen}>Lulus</span>
                          : <span style={s.pillRed}>Tidak Lulus</span>}
                      </td>
                      <td style={{ ...s.td, textAlign: 'right' }}>
                        <button onClick={() => setSelectedStudent(row)} style={s.btnView}>
                          <span>Rekap</span><ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Student Recap Modal */}
          {selectedStudent && (
            <div style={s.overlay}>
              <div style={s.modal} className="glass-panel">
                <div style={s.modalHead}>
                  <div>
                    <h3 style={{ margin: 0 }}>{selectedStudent.studentName}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--grey-blue)' }}>{selectedStudent.studentEmail}</span>
                  </div>
                  <button onClick={() => setSelectedStudent(null)} style={s.closeBtn}><X size={18} /></button>
                </div>
                <div style={{ padding: '18px 24px', overflowY: 'auto', maxHeight: '60vh' }}>
                  <h4 style={{ marginTop: 0, fontSize: '0.85rem', color: 'var(--grey-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Riwayat Kuis</h4>
                  {selectedStudent.attempts.length === 0 ? (
                    <p style={{ color: 'var(--grey-blue)', fontSize: '0.85rem' }}>Siswa ini belum mengerjakan kuis apapun.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {selectedStudent.attempts.map((a, i) => (
                        <div key={i} className="glass-panel" style={{ borderRadius: 10, padding: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Brain size={15} color="var(--azure)" />
                              <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{a.quizTitle}</span>
                            </div>
                            <span style={{ fontSize: '0.75rem', padding: '3px 9px', borderRadius: 12, background: a.isPassed ? 'rgba(0,200,83,0.1)' : 'rgba(255,82,82,0.1)', color: a.isPassed ? '#00C853' : '#FF5252' }}>
                              {a.isPassed ? 'Lulus' : 'Tidak Lulus'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--grey-blue)', marginBottom: 8 }}>
                            Kelas: <strong>{a.courseTitle}</strong>&nbsp;•&nbsp;{a.date}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                            <span>Nilai</span>
                            <strong style={{ color: a.score >= a.passingScore ? 'var(--azure)' : '#FF5252' }}>{a.score}%</strong>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 6 }}>
                            <div style={{ width: `${Math.min(a.score, 100)}%`, background: a.score >= a.passingScore ? 'var(--azure)' : '#FF5252', height: '100%', borderRadius: 4, transition: 'width 0.5s' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════
          TAB 2: STUDY CASE VERIFICATION
      ═══════════════════════════════════════════════ */}
      {tab === 'studycase' && (
        <>
          {/* Info badge role */}
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: 'var(--azure)' }}>
            <TrendingUp size={15} />
            <span>Login sebagai <strong>{userRole}</strong> — tombol verifikasi aktif sesuai role Anda.</span>
          </div>

          {/* Filters for Tab 2 */}
          <div className="glass-panel" style={s.filterRow}>
            <div style={s.searchWrap}>
              <Search size={15} color="var(--grey)" />
              <input
                type="text"
                placeholder="Cari nama, email, atau judul studi kasus..."
                value={subSearch}
                onChange={e => setSubSearch(e.target.value)}
                style={s.searchInput}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={15} color="var(--grey-blue)" />
                <select value={subSelectedCourse} onChange={e => setSubSelectedCourse(e.target.value)} style={s.select}>
                  <option value="all">Semua Kelas</option>
                  {courses.map((c: any) => (
                    <option key={c.uuid_pembelajaran || c.id} value={c.uuid_pembelajaran || c.id}>
                      {c.title || c.nama_pembelajaran}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={15} color="var(--grey-blue)" />
                <select value={subStatusFilter} onChange={e => setSubStatusFilter(e.target.value as any)} style={s.select}>
                  <option value="all">Semua Status</option>
                  <option value="pending">Menunggu Verifikasi</option>
                  <option value="verified">Terverifikasi</option>
                </select>
              </div>
            </div>
          </div>

          {subError && <div style={s.errBanner}><AlertCircle size={16} /><span>{subError}</span></div>}

          {subLoading ? (
            <div style={s.centered}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /><p>Memuat antrian review...</p></div>
          ) : filteredSubmissions.length === 0 ? (
            <div style={s.empty}>
              <CheckCircle2 size={48} color="#00C853" />
              <h3>Tidak Ada Data</h3>
              <p>Tidak ada pengumpulan studi kasus yang cocok dengan filter yang dipilih.</p>
            </div>
          ) : (
            <div style={s.subGrid}>
              {filteredSubmissions.map(sub => {
                const verifiedByMe = userRole === 'Mentor'
                  ? sub.mentor_status === 'Verified'
                  : sub.lecture_status === 'Verified';

                return (
                  <div key={sub.id} className="glass-panel" style={s.subCard}>
                    {/* Top: status badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        display: 'inline-flex', padding: '3px 10px', borderRadius: 12, fontSize: '0.74rem', fontWeight: 600,
                        background: verifiedByMe ? 'rgba(0,200,83,0.1)' : 'rgba(255,178,64,0.1)',
                        color: verifiedByMe ? '#00C853' : '#FFB240',
                      }}>
                        {verifiedByMe ? `Terverifikasi (${userRole})` : `Menunggu (${userRole})`}
                      </span>
                    </div>

                    {/* Student & tugas info */}
                    <div>
                      <span style={{ fontSize: '0.76rem', color: 'var(--azure)', fontWeight: 600 }}>
                        {sub.student.full_name} — {sub.student.email}
                      </span>
                      <h3 style={{ margin: '4px 0 2px', fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{sub.tugas.title}</h3>
                      <div style={{ fontSize: '0.74rem', color: 'var(--grey-blue)', display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {sub.pembelajaran?.title && <span>Kelas: {sub.pembelajaran.title}</span>}
                        {sub.modul?.title && <span>Modul: {sub.modul.title}</span>}
                        {sub.submitted_at && (
                          <span>Dikumpulkan: {new Date(sub.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        )}
                      </div>
                    </div>

                    {/* Student notes */}
                    {sub.student_notes && (
                      <div style={s.noteBox}>
                        <em>"{sub.student_notes}"</em>
                      </div>
                    )}

                    {/* File links */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {sub.ipynb_url && (
                        <a href={sub.ipynb_url} target="_blank" rel="noopener noreferrer" style={s.fileLink}>
                          <FileText size={12} /><span>Notebook (.ipynb)</span>
                        </a>
                      )}
                      {sub.pdf_url && (
                        <a href={sub.pdf_url} target="_blank" rel="noopener noreferrer" style={s.fileLink}>
                          <FileText size={12} /><span>Laporan (.pdf)</span>
                        </a>
                      )}
                    </div>

                    {/* AI Evaluation Box */}
                    {sub.ai_score !== undefined && (
                      <div style={s.aiBox}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Brain size={14} color="var(--lemon)" />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--lemon)' }}>Penilaian Otomatis AI</span>
                          </div>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: sub.ai_score >= 75 ? '#00C853' : '#FFB240' }}>
                            {sub.ai_score}/100
                          </span>
                        </div>
                        {sub.ai_reason && (
                          <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--grey-blue)', lineHeight: 1.4 }}>
                            {sub.ai_reason}
                          </p>
                        )}
                        {sub.ai_feedback && (
                          <button
                            onClick={() => setExpandedAI(expandedAI === sub.id ? null : sub.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--azure)', fontSize: '0.72rem', cursor: 'pointer', padding: 0, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <span>{expandedAI === sub.id ? 'Sembunyikan Detail AI' : 'Lihat Detail Feedback AI'}</span>
                            <ChevronRight size={12} style={{ transform: expandedAI === sub.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                          </button>
                        )}
                        {expandedAI === sub.id && sub.ai_feedback && (
                          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.74rem', color: 'var(--grey-blue)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {sub.ai_feedback.strengths && sub.ai_feedback.strengths.length > 0 && (
                              <div>
                                <strong style={{ color: '#00C853' }}>Keunggulan:</strong>
                                <ul style={{ margin: '2px 0 0 16px', padding: 0 }}>
                                  {sub.ai_feedback.strengths.map((st, k) => <li key={k}>{st}</li>)}
                                </ul>
                              </div>
                            )}
                            {sub.ai_feedback.deductions && sub.ai_feedback.deductions.length > 0 && (
                              <div>
                                <strong style={{ color: '#FF5252' }}>Pengurangan Nilai:</strong>
                                <ul style={{ margin: '2px 0 0 16px', padding: 0 }}>
                                  {sub.ai_feedback.deductions.map((d, k) => (
                                    <li key={k}>[{d.section}] -{d.points_lost} poin: {d.reason}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Existing verification notes */}
                    {(sub.lecture_notes || sub.mentor_notes) && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--grey-blue)', background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6 }}>
                        {sub.lecture_notes && <div><strong>Dosen:</strong> {sub.lecture_notes}</div>}
                        {sub.mentor_notes && <div><strong>Mentor:</strong> {sub.mentor_notes}</div>}
                      </div>
                    )}

                    {/* Action Button */}
                    <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                      <button
                        onClick={() => openModal(sub)}
                        style={{
                          ...s.btnVerify,
                          background: verifiedByMe ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, var(--navy), var(--m-blue))',
                          border: verifiedByMe ? '1px solid var(--border-color)' : 'none',
                        }}
                      >
                        <PenLine size={14} />
                        <span>{verifiedByMe ? 'Edit Verifikasi' : `Verifikasi Sebagai ${userRole}`}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Verify Modal */}
          {modal && (
            <div style={s.overlay}>
              <div style={s.modal} className="glass-panel">
                <div style={s.modalHead}>
                  <div>
                    <h3 style={{ margin: 0 }}>Verifikasi Studi Kasus</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--azure)' }}>
                      {modal.student.full_name} — {modal.tugas.title}
                    </span>
                  </div>
                  <button onClick={() => setModal(null)} style={s.closeBtn}><X size={18} /></button>
                </div>

                <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--grey-blue)', background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 6 }}>
                    Role Anda: <strong style={{ color: '#fff' }}>{userRole}</strong>.
                    Nilai AI bawaan: <strong style={{ color: 'var(--lemon)' }}>{modal.ai_score ?? '-'}</strong>.
                    Jika Anda memasukkan nilai baru, nilai tersebut akan dipasang sebagai <em>released_score</em> untuk siswa.
                  </div>

                  <div>
                    <label style={s.label}>Catatan Verifikasi ({userRole})</label>
                    <textarea
                      placeholder="Masukkan umpan balik atau catatan tambahan..."
                      value={modalNotes}
                      onChange={e => setModalNotes(e.target.value)}
                      style={s.textarea}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                    <div>
                      <label style={s.label}>Override Nilai (Opsional)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder={String(modal.ai_score ?? 80)}
                        value={modalScore}
                        onChange={e => setModalScore(e.target.value)}
                        style={s.input}
                      />
                    </div>
                    <div>
                      <label style={s.label}>Alasan Override Nilai</label>
                      <input
                        type="text"
                        placeholder="Contoh: Kualitas kode baik tetapi penulisan laporan kurang rapi"
                        value={modalReason}
                        onChange={e => setModalReason(e.target.value)}
                        style={s.input}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                    <button onClick={() => setModal(null)} style={s.btnGhost}>Batal</button>
                    <button onClick={handleVerify} disabled={verifying} style={s.btnPrimary}>
                      {verifying ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={15} />}
                      <span>Simpan Verifikasi</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    padding: '28px 32px',
    maxWidth: 1280,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: 800,
    color: '#fff',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--grey-blue)',
    marginTop: 4,
  },
  btnGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-color)',
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 18px',
    borderRadius: 8,
    background: 'linear-gradient(135deg, var(--navy), var(--m-blue))',
    border: 'none',
    color: '#fff',
    fontSize: '0.84rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  tabBar: {
    display: 'flex',
    gap: 4,
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: 1,
    marginBottom: 22,
  },
  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--grey-blue)',
    padding: '9px 18px',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    borderBottom: '2px solid var(--azure)',
    color: 'var(--azure)',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    marginBottom: 20,
  },
  kpiCard: {
    padding: '16px 20px',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  kpiLabel: {
    fontSize: '0.78rem',
    color: 'var(--grey-blue)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  kpiVal: {
    fontSize: '1.6rem',
    fontWeight: 800,
  },
  filterRow: {
    padding: '12px 16px',
    borderRadius: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 220,
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '0.85rem',
    outline: 'none',
    width: '100%',
  },
  select: {
    background: '#18181b',
    border: '1px solid var(--border-color)',
    borderRadius: 6,
    color: '#fff',
    fontSize: '0.8rem',
    padding: '6px 12px',
    outline: 'none',
    cursor: 'pointer',
  },
  errBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    borderRadius: 8,
    background: 'rgba(255,82,82,0.1)',
    border: '1px solid rgba(255,82,82,0.3)',
    color: '#FF5252',
    fontSize: '0.83rem',
    marginBottom: 16,
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
    gap: 12,
    color: 'var(--grey-blue)',
    fontSize: '0.85rem',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
    gap: 8,
    color: 'var(--grey-blue)',
    textAlign: 'center',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '0.76rem',
    color: 'var(--grey-blue)',
    borderBottom: '1px solid var(--border-color)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  td: {
    padding: '12px 16px',
    verticalAlign: 'middle',
  },
  pill: {
    fontSize: '0.76rem',
    padding: '3px 8px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--grey-blue)',
  },
  pillGrey: {
    fontSize: '0.74rem',
    padding: '3px 9px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--grey-blue)',
  },
  pillGreen: {
    fontSize: '0.74rem',
    padding: '3px 9px',
    borderRadius: 12,
    background: 'rgba(0,200,83,0.1)',
    color: '#00C853',
    fontWeight: 600,
  },
  pillRed: {
    fontSize: '0.74rem',
    padding: '3px 9px',
    borderRadius: 12,
    background: 'rgba(255,82,82,0.1)',
    color: '#FF5252',
    fontWeight: 600,
  },
  btnView: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 10px',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-color)',
    color: 'var(--azure)',
    fontSize: '0.76rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  subGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16,
  },
  subCard: {
    padding: 18,
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  noteBox: {
    fontSize: '0.78rem',
    color: 'var(--grey-blue)',
    background: 'rgba(255,255,255,0.03)',
    padding: 8,
    borderRadius: 6,
    borderLeft: '2px solid var(--azure)',
  },
  fileLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: '0.74rem',
    color: 'var(--azure)',
    textDecoration: 'none',
    background: 'rgba(6,113,224,0.08)',
    padding: '4px 8px',
    borderRadius: 6,
  },
  aiBox: {
    background: 'rgba(255,168,38,0.05)',
    border: '1px solid rgba(255,168,38,0.2)',
    borderRadius: 8,
    padding: 10,
  },
  btnVerify: {
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 12px',
    borderRadius: 8,
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 540,
    borderRadius: 14,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHead: {
    padding: '16px 24px',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--grey-blue)',
    cursor: 'pointer',
  },
  label: {
    display: 'block',
    fontSize: '0.78rem',
    color: 'var(--grey-blue)',
    marginBottom: 4,
    fontWeight: 600,
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 6,
    background: '#18181b',
    border: '1px solid var(--border-color)',
    color: '#fff',
    fontSize: '0.83rem',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    height: 70,
    padding: '8px 12px',
    borderRadius: 6,
    background: '#18181b',
    border: '1px solid var(--border-color)',
    color: '#fff',
    fontSize: '0.83rem',
    outline: 'none',
    resize: 'none',
  },
};
