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
  tugas: { title: string };
  pembelajaran?: { title: string };
  modul?: { title: string };
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

interface EssayReviewItem {
  uuid_attempt: string;
  uuid_question: string;
  question_text: string;
  student_name: string;
  student_email: string;
  quiz_title: string;
  answer_text: string;
  max_weight: number;
  submitted_at: string;
  // earned_score yang sudah diisi (jika ada)
  earned_score?: number;
  feedback?: string;
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
  const [tab, setTab] = useState<'quiz' | 'studycase' | 'essay'>('quiz');

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

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 1 — QUIZ GRADE CENTER
  // API: GET /api/grade-center/students
  // ─────────────────────────────────────────────────────────────────────────
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizSearch, setQuizSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
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
      setCourses(Array.isArray(cRes) ? cRes : (cRes?.data ?? []));
      const list: any[] = Array.isArray(gRes) ? gRes : (gRes?.data ?? []);
      setGrades(list.map(g => ({
        studentName: g.studentName || g.full_name || 'Unknown',
        studentEmail: g.studentEmail || g.email || '-',
        completedCount: g.completedCount ?? 0,
        averageScore: g.averageScore ?? 0,
        status: (g.status === 'Passed' || g.status === 'Lulus') ? 'Passed' : 'Failed',
        attempts: (g.attempts ?? []).map((a: any) => ({
          quizTitle: a.quizTitle || a.title || '-',
          courseTitle: a.courseTitle || '-',
          score: a.score ?? 0,
          passingScore: a.passingScore ?? 70,
          isPassed: a.isPassed || a.status === 'Passed',
          date: a.date ? new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
        })),
      })));
    } catch (e: any) {
      setQuizError(e.message || 'Gagal memuat data nilai kuis.');
    } finally {
      setQuizLoading(false);
      setRefreshing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 2 — STUDY CASE VERIFICATION
  // API: GET  /api/study-case-submissions/review-queue
  //      PATCH /api/study-case-submissions/:id/verify
  // ─────────────────────────────────────────────────────────────────────────
  const [submissions, setSubmissions] = useState<StudyCaseSubmission[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);

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
      const res = await apiGet<any>('/api/study-case-submissions/review-queue', {
        token: auth.token,
        headers: auth.headers,
      });
      const raw: any[] = Array.isArray(res) ? res : (res?.data ?? []);
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
    }
  };

  // PATCH /api/study-case-submissions/:id/verify
  // Body: { verifier_role, notes?, score_override?, reason_override? }
  const handleVerify = async () => {
    if (!modal) return;
    setVerifying(true);
    try {
      const auth = getAuth();
      const body: Record<string, any> = { verifier_role: userRole };
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

      await apiPatch<any>(
        `/api/study-case-submissions/${modal.id}/verify`,
        body,
        { token: auth.token, headers: auth.headers },
      );

      showToast(`Verifikasi berhasil disimpan! Nilai dirilis ke siswa.`, 'success');
      setModal(null);
      setModalNotes(''); setModalScore(''); setModalReason('');
      await fetchQueue();
    } catch (e: any) {
      showToast(`Gagal melakukan verifikasi: ${e.message}`, 'error');
    } finally {
      setVerifying(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 3 — ESSAY MANUAL REVIEW
  // API: GET  /api/grade-center/review-queue
  //      POST /api/grade-center/review/:attemptId/:questionId
  // ─────────────────────────────────────────────────────────────────────────
  const [essayQueue, setEssayQueue]     = useState<EssayReviewItem[]>([]);
  const [essayLoading, setEssayLoading] = useState(false);
  const [essayError, setEssayError]     = useState<string | null>(null);
  const [essaySearch, setEssaySearch]   = useState('');

  // Modal penilaian essay
  const [essayModal, setEssayModal]         = useState<EssayReviewItem | null>(null);
  const [essayScore, setEssayScore]         = useState('');
  const [essayFeedback, setEssayFeedback]   = useState('');
  const [essaySubmitting, setEssaySubmitting] = useState(false);

  const fetchEssayQueue = async () => {
    setEssayLoading(true);
    setEssayError(null);
    try {
      const auth = getAuth();
      const res = await apiGet<any>('/api/grade-center/review-queue', {
        token: auth.token,
        headers: auth.headers,
      });
      const raw: any[] = Array.isArray(res) ? res : (res?.data ?? []);
      setEssayQueue(raw.map(item => ({
        uuid_attempt:   item.uuid_attempt,
        uuid_question:  item.uuid_question,
        question_text:  item.question_text,
        student_name:   item.student_name,
        student_email:  item.student_email,
        quiz_title:     item.quiz_title,
        answer_text:    item.answer_text,
        max_weight:     item.max_weight ?? 1,
        submitted_at:   item.submitted_at,
        earned_score:   item.earned_score,
        feedback:       item.feedback,
      })));
    } catch (e: any) {
      setEssayError(e.message || 'Gagal memuat antrian essay.');
    } finally {
      setEssayLoading(false);
    }
  };

  // POST /api/grade-center/review/:attemptId/:questionId
  // Body: { earned_score: number (0-1), feedback?: string }
  const handleEssaySubmit = async () => {
    if (!essayModal) return;
    const score = parseFloat(essayScore);
    if (isNaN(score) || score < 0 || score > 1) {
      showToast('Nilai harus antara 0 dan 1 (misal: 0.8 = 80%)', 'error');
      return;
    }
    setEssaySubmitting(true);
    try {
      const auth = getAuth();
      await apiPost<any>(
        `/api/grade-center/review/${essayModal.uuid_attempt}/${essayModal.uuid_question}`,
        { earned_score: score, feedback: essayFeedback.trim() || undefined },
        { token: auth.token, headers: auth.headers },
      );
      showToast('Penilaian essay berhasil disimpan!', 'success');
      setEssayModal(null);
      setEssayScore('');
      setEssayFeedback('');
      await fetchEssayQueue();
    } catch (e: any) {
      showToast(`Gagal menyimpan nilai: ${e.message}`, 'error');
    } finally {
      setEssaySubmitting(false);
    }
  };

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab === 'quiz') fetchQuiz();
    else if (tab === 'studycase') fetchQueue();
    else fetchEssayQueue();
  }, [tab]);

  // ── Quiz derived data ─────────────────────────────────────────────────────
  const graded = grades.filter(g => g.completedCount > 0);
  const passRate = graded.length > 0 ? Math.round(graded.filter(g => g.status === 'Passed').length / graded.length * 100) : 0;
  const classAvg = graded.length > 0 ? Math.round(graded.reduce((s, g) => s + g.averageScore, 0) / graded.length) : 0;

  const filteredGrades = grades.filter(g => {
    const q = quizSearch.toLowerCase();
    const nameMatch = g.studentName.toLowerCase().includes(q) || g.studentEmail.toLowerCase().includes(q);
    if (selectedCourse === 'all') return nameMatch;
    const course = courses.find((c: any) => (c.uuid_pembelajaran || c.id) === selectedCourse);
    return nameMatch && (!course || g.attempts.some(a => a.courseTitle === course.title));
  });

  const getLetter = (s: number) => s >= 85 ? 'A' : s >= 75 ? 'B' : s >= 60 ? 'C' : s > 0 ? 'D' : '-';

  // ── Open verify modal ─────────────────────────────────────────────────────
  const openModal = (sub: StudyCaseSubmission) => {
    setModal(sub);
    setModalNotes('');
    setModalScore(sub.ai_score !== undefined ? String(sub.ai_score) : '');
    setModalReason('');
  };

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Penilaian</h1>
          <p style={s.subtitle}>Pantau nilai kuis & verifikasi studi kasus siswa</p>
        </div>
        <button
          onClick={() => { setRefreshing(true); if (tab === 'quiz') fetchQuiz(); else fetchQueue(); }}
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
          { key: 'essay',     label: 'Penilaian Essay',        icon: <PenLine size={15} /> },
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
          </div>

          {quizError && <div style={s.errBanner}><AlertCircle size={16} /><span>{quizError}</span></div>}

          {quizLoading ? (
            <div style={s.centered}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /><p>Memuat nilai kuis...</p></div>
          ) : filteredGrades.length === 0 ? (
            <div style={s.empty}>
              <Award size={48} color="var(--border-color)" />
              <h3>Belum Ada Data</h3>
              <p>Belum ada siswa yang menyelesaikan kuis.</p>
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

          {subError && <div style={s.errBanner}><AlertCircle size={16} /><span>{subError}</span></div>}

          {subLoading ? (
            <div style={s.centered}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /><p>Memuat antrian review...</p></div>
          ) : submissions.length === 0 ? (
            <div style={s.empty}>
              <CheckCircle2 size={48} color="#00C853" />
              <h3>Antrian Kosong</h3>
              <p>Belum ada pengumpulan studi kasus yang menunggu verifikasi.</p>
            </div>
          ) : (
            <div style={s.subGrid}>
              {submissions.map(sub => {
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
                        {verifiedByMe ? `✓ Terverifikasi (${userRole})` : `⏳ Menunggu (${userRole})`}
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
                          <FileText size={12} /><span>Laporan PDF</span>
                        </a>
                      )}
                    </div>

                    {/* AI Feedback toggle */}
                    {sub.ai_feedback && (
                      <button
                        onClick={() => setExpandedAI(expandedAI === sub.id ? null : sub.id)}
                        style={s.btnView}
                      >
                        <span>{expandedAI === sub.id ? 'Sembunyikan' : 'Lihat'} Feedback AI</span>
                        <ChevronRight size={13} style={{ transform: expandedAI === sub.id ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                      </button>
                    )}
                    {expandedAI === sub.id && sub.ai_feedback && (
                      <div style={{ background: 'rgba(6,113,224,0.04)', border: '1px solid rgba(6,113,224,0.12)', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {sub.ai_reason && <p style={{ margin: 0, color: '#CBD5E1' }}>{sub.ai_reason}</p>}
                        {sub.ai_feedback.strengths && sub.ai_feedback.strengths.length > 0 && (
                          <div>
                            <strong style={{ color: '#00C853' }}>Kelebihan:</strong>
                            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                              {sub.ai_feedback.strengths.map((s2, i) => <li key={i} style={{ color: '#CBD5E1' }}>{s2}</li>)}
                            </ul>
                          </div>
                        )}
                        {sub.ai_feedback.deductions && sub.ai_feedback.deductions.length > 0 && (
                          <div>
                            <strong style={{ color: '#FF5252' }}>Pemotongan:</strong>
                            {sub.ai_feedback.deductions.map((d, i) => (
                              <div key={i} style={{ marginTop: 4, color: '#CBD5E1' }}>
                                <strong>{d.section}</strong> (-{d.points_lost} poin): {d.reason}
                              </div>
                            ))}
                          </div>
                        )}
                        {sub.ai_feedback.improvement_summary && (
                          <p style={{ margin: 0, color: 'var(--grey-blue)', fontStyle: 'italic' }}>{sub.ai_feedback.improvement_summary}</p>
                        )}
                      </div>
                    )}

                    {/* Dual verification status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.74rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
                      <span style={{ color: sub.lecture_status === 'Verified' ? '#00C853' : 'var(--grey-blue)' }}>
                        {sub.lecture_status === 'Verified' ? '✓ Dosen terverifikasi' : '○ Dosen belum verifikasi'}
                        {sub.lecture_notes && <em style={{ marginLeft: 6, color: 'var(--grey-blue)' }}>— {sub.lecture_notes}</em>}
                      </span>
                      <span style={{ color: sub.mentor_status === 'Verified' ? '#00C853' : 'var(--grey-blue)' }}>
                        {sub.mentor_status === 'Verified' ? '✓ Mentor terverifikasi' : '○ Mentor belum verifikasi'}
                        {sub.mentor_notes && <em style={{ marginLeft: 6, color: 'var(--grey-blue)' }}>— {sub.mentor_notes}</em>}
                      </span>
                    </div>

                    {/* Released score */}
                    {sub.is_released && sub.released_score !== undefined && (
                      <div style={{ background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', color: '#00C853' }}>
                        ✓ Nilai Dirilis ke Siswa: <strong>{sub.released_score}/100</strong>
                        {sub.released_reason && <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#CBD5E1' }}>{sub.released_reason}</p>}
                      </div>
                    )}

                    {/* Verify button */}
                    <button
                      onClick={() => openModal(sub)}
                      disabled={verifiedByMe}
                      style={{
                        border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: '0.88rem', fontWeight: 600,
                        width: '100%', marginTop: 4, cursor: verifiedByMe ? 'not-allowed' : 'pointer',
                        opacity: verifiedByMe ? 0.5 : 1,
                        background: verifiedByMe ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #1a2744, #0671E0)',
                        color: verifiedByMe ? 'var(--grey-blue)' : '#fff',
                      }}
                    >
                      {verifiedByMe ? `Sudah Diverifikasi (${userRole})` : `Verifikasi sebagai ${userRole}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════
          TAB 3: ESSAY MANUAL REVIEW
          GET  /api/grade-center/review-queue
          POST /api/grade-center/review/:attemptId/:questionId
      ═══════════════════════════════════════════════ */}
      {tab === 'essay' && (
        <>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: 'var(--azure)' }}>
            <PenLine size={15} />
            <span>Soal essay yang perlu dinilai manual oleh Anda. Berikan nilai antara <strong>0</strong> (0%) dan <strong>1</strong> (100%).</span>
          </div>

          {/* Search */}
          <div className="glass-panel" style={{ ...s.filterRow, marginBottom: 18 }}>
            <div style={s.searchWrap}>
              <Search size={15} color="var(--grey)" />
              <input
                type="text"
                placeholder="Cari nama siswa atau judul kuis..."
                value={essaySearch}
                onChange={e => setEssaySearch(e.target.value)}
                style={s.searchInput}
              />
            </div>
          </div>

          {essayError && <div style={s.errBanner}><AlertCircle size={16} /><span>{essayError}</span></div>}

          {essayLoading ? (
            <div style={s.centered}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /><p>Memuat antrian essay...</p></div>
          ) : essayQueue.filter(e => {
              const q = essaySearch.toLowerCase();
              return e.student_name.toLowerCase().includes(q) || e.quiz_title.toLowerCase().includes(q);
            }).length === 0 ? (
            <div style={s.empty}>
              <CheckCircle2 size={48} color="#00C853" />
              <h3>Antrian Kosong</h3>
              <p>Tidak ada soal essay yang perlu dinilai saat ini.</p>
            </div>
          ) : (
            <div style={s.subGrid}>
              {essayQueue
                .filter(e => {
                  const q = essaySearch.toLowerCase();
                  return e.student_name.toLowerCase().includes(q) || e.quiz_title.toLowerCase().includes(q);
                })
                .map((item, i) => (
                  <div key={i} className="glass-panel" style={s.subCard}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        display: 'inline-flex', padding: '3px 10px', borderRadius: 12, fontSize: '0.74rem', fontWeight: 600,
                        background: item.earned_score !== undefined ? 'rgba(0,200,83,0.1)' : 'rgba(255,178,64,0.1)',
                        color: item.earned_score !== undefined ? '#00C853' : '#FFB240',
                      }}>
                        {item.earned_score !== undefined ? `✓ Sudah Dinilai (${(item.earned_score * 100).toFixed(0)}%)` : '⏳ Menunggu Penilaian'}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--grey-blue)' }}>
                        Bobot: <strong style={{ color: '#fff' }}>{item.max_weight}</strong>
                      </span>
                    </div>

                    {/* Student & Quiz */}
                    <div>
                      <span style={{ fontSize: '0.76rem', color: 'var(--azure)', fontWeight: 600 }}>
                        {item.student_name} — {item.student_email}
                      </span>
                      <h3 style={{ margin: '4px 0 2px', fontSize: '0.92rem', fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>
                        {item.question_text}
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--grey-blue)' }}>
                        Kuis: {item.quiz_title} •{' '}
                        {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </p>
                    </div>

                    {/* Jawaban siswa */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: '#CBD5E1', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {item.answer_text || <em style={{ color: 'var(--grey-blue)' }}>Siswa tidak mengisi jawaban.</em>}
                    </div>

                    {/* Nilai & Feedback yang sudah ada */}
                    {item.earned_score !== undefined && item.feedback && (
                      <div style={{ background: 'rgba(0,200,83,0.05)', border: '1px solid rgba(0,200,83,0.15)', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem', color: '#CBD5E1' }}>
                        <strong style={{ color: '#00C853' }}>Feedback:</strong> {item.feedback}
                      </div>
                    )}

                    {/* Action */}
                    <button
                      onClick={() => { setEssayModal(item); setEssayScore(item.earned_score !== undefined ? String(item.earned_score) : ''); setEssayFeedback(item.feedback || ''); }}
                      style={{
                        border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: '0.88rem', fontWeight: 600,
                        width: '100%', marginTop: 4, cursor: 'pointer',
                        background: item.earned_score !== undefined
                          ? 'rgba(255,255,255,0.05)'
                          : 'linear-gradient(135deg, #1a2744, #0671E0)',
                        color: '#fff',
                      }}
                    >
                      {item.earned_score !== undefined ? (
                        <><PenLine size={14} style={{ marginRight: 6 }} />Ubah Penilaian</>
                      ) : (
                        <><Star size={14} style={{ marginRight: 6 }} />Beri Nilai</>
                      )}
                    </button>
                  </div>
                ))}
            </div>
          )}

          {/* Essay Review Modal */}
          {essayModal && (
            <div style={s.overlay}>
              <div style={{ ...s.modal, maxWidth: 520 }} className="glass-panel">
                <div style={s.modalHead}>
                  <div>
                    <h3 style={{ margin: 0 }}>Penilaian Soal Essay</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--grey-blue)' }}>
                      {essayModal.student_name} — {essayModal.quiz_title}
                    </span>
                  </div>
                  <button onClick={() => setEssayModal(null)} style={s.closeBtn}><X size={18} /></button>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: '70vh' }}>
                  {/* Soal */}
                  <div style={{ background: 'rgba(6,113,224,0.06)', border: '1px solid rgba(6,113,224,0.14)', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', color: 'var(--azure)' }}>
                    <strong>Soal:</strong><br />
                    <span style={{ color: '#E2E8F0' }}>{essayModal.question_text}</span>
                  </div>

                  {/* Jawaban siswa */}
                  <div>
                    <p style={{ ...s.formLabel, marginBottom: 6 }}>Jawaban Siswa:</p>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 14px', fontSize: '0.83rem', color: '#CBD5E1', whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 160, overflowY: 'auto' }}>
                      {essayModal.answer_text || <em>Tidak ada jawaban.</em>}
                    </div>
                  </div>

                  {/* Input nilai */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={s.formLabel}>
                      Nilai <span style={{ fontWeight: 400, color: 'var(--grey)' }}>(0 = 0% hingga 1 = 100%, bobot soal: {essayModal.max_weight})</span>
                    </label>
                    <input
                      type="number" min="0" max="1" step="0.01"
                      value={essayScore}
                      onChange={e => setEssayScore(e.target.value)}
                      placeholder="Contoh: 0.85"
                      style={s.input}
                    />
                    {essayScore !== '' && !isNaN(parseFloat(essayScore)) && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--azure)' }}>
                        = {(parseFloat(essayScore) * 100).toFixed(0)}% dari bobot {essayModal.max_weight}
                      </span>
                    )}
                  </div>

                  {/* Feedback */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={s.formLabel}>Feedback untuk Siswa <span style={{ fontWeight: 400, color: 'var(--grey)' }}>(opsional)</span></label>
                    <textarea
                      rows={3}
                      value={essayFeedback}
                      onChange={e => setEssayFeedback(e.target.value)}
                      placeholder="Tuliskan feedback untuk siswa..."
                      style={s.textarea}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                    <button onClick={() => setEssayModal(null)} style={s.btnGhost} disabled={essaySubmitting}>Batal</button>
                    <button onClick={handleEssaySubmit} disabled={essaySubmitting} style={s.btnPrimary}>
                      {essaySubmitting
                        ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /><span>Menyimpan...</span></>
                        : <><CheckCircle2 size={14} /><span>Simpan Penilaian</span></>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {/* ═══════════════════════════════════════════════
          VERIFY MODAL
          PATCH /api/study-case-submissions/:id/verify
          Body: { verifier_role, notes?, score_override?, reason_override? }
      ═══════════════════════════════════════════════ */}
      {modal && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, maxWidth: 520 }} className="glass-panel">
            <div style={s.modalHead}>
              <div>
                <h3 style={{ margin: 0 }}>Verifikasi Studi Kasus</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--grey-blue)' }}>
                  {modal.student.full_name} — {modal.tugas.title}
                </span>
              </div>
              <button onClick={() => setModal(null)} style={s.closeBtn}><X size={18} /></button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Info */}
              <div style={{ background: 'rgba(6,113,224,0.07)', border: '1px solid rgba(6,113,224,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: 'var(--azure)' }}>
                Anda login sebagai <strong>{userRole}</strong>. Verifikasi ini akan mencatat
                <code style={{ margin: '0 4px' }}>{userRole === 'Lecturer' ? 'lecture_status' : 'mentor_status'} = "Verified"</code>
                pada submission. Nilai dirilis ke siswa setelah Lecturer atau Mentor memverifikasi.
              </div>

              {/* Score override */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={s.formLabel}>
                  Masukkan Nilai <span style={{ fontWeight: 400, color: 'var(--grey)' }}>(Maksimal 100)</span>
                </label>
                <input
                  type="number" min="0" max="100"
                  value={modalScore}
                  onChange={e => setModalScore(e.target.value)}
                  placeholder="Masukkan nilai (0-100)"
                  style={s.input}
                />
              </div>

              {/* Notes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={s.formLabel}>Catatan / Feedback ke Siswa <span style={{ fontWeight: 400, color: 'var(--grey)' }}>(opsional)</span></label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                  placeholder="Tuliskan catatan untuk siswa..."
                  style={s.textarea}
                />
              </div>

              {/* Reason override */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={s.formLabel}>Alasan Override Nilai <span style={{ fontWeight: 400, color: 'var(--grey)' }}>(opsional)</span></label>
                <input
                  type="text"
                  value={modalReason}
                  onChange={e => setModalReason(e.target.value)}
                  placeholder="Mengapa Anda mengubah nilai dari skor AI?"
                  style={s.input}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                <button onClick={() => setModal(null)} style={s.btnGhost} disabled={verifying}>Batal</button>
                <button onClick={handleVerify} disabled={verifying} style={s.btnPrimary}>
                  {verifying
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /><span>Menyimpan...</span></>
                    : <><CheckCircle2 size={14} /><span>Konfirmasi Verifikasi</span></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: toast.type === 'success' ? '#00C853' : '#FF5252',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600,
          fontSize: '0.88rem',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', marginLeft: 8, lineHeight: 1 }}>×</button>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { padding: '4px 0', color: '#E2E8F0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  title: { fontSize: '1.75rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', margin: 0 },
  subtitle: { fontSize: '0.85rem', color: 'var(--grey-blue)', marginTop: 4, margin: 0 },
  tabBar: { display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 1, marginBottom: 22 },
  tabBtn: { display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', borderBottom: '2px solid transparent', color: 'var(--grey-blue)', padding: '9px 18px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  tabActive: { borderBottom: '2px solid var(--azure)', color: 'var(--azure)' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 },
  kpiCard: { borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 },
  kpiLabel: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--grey-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  kpiVal: { fontSize: '2rem', fontWeight: 700 },
  filterRow: { display: 'flex', alignItems: 'center', gap: 16, padding: '12px 18px', borderRadius: 10, marginBottom: 18, flexWrap: 'wrap' },
  searchWrap: { display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 },
  searchInput: { background: 'none', border: 'none', outline: 'none', color: '#E2E8F0', fontSize: '0.88rem', width: '100%' },
  select: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#E2E8F0', padding: '6px 12px', fontSize: '0.85rem', outline: 'none' },
  errBanner: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 16px', color: '#EF4444', marginBottom: 16 },
  centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--grey-blue)', gap: 12 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.08)', borderRadius: 14, gap: 10 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--grey-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.04)' },
  td: { padding: '13px 16px', fontSize: '0.88rem', verticalAlign: 'middle' },
  pill: { display: 'inline-flex', padding: '3px 10px', borderRadius: 12, fontSize: '0.76rem', fontWeight: 600, background: 'rgba(255,255,255,0.07)', color: 'var(--grey-blue)' },
  pillGreen: { display: 'inline-flex', padding: '3px 10px', borderRadius: 12, fontSize: '0.76rem', fontWeight: 600, background: 'rgba(0,200,83,0.1)', color: '#00C853' },
  pillRed: { display: 'inline-flex', padding: '3px 10px', borderRadius: 12, fontSize: '0.76rem', fontWeight: 600, background: 'rgba(255,82,82,0.1)', color: '#FF5252' },
  pillGrey: { display: 'inline-flex', padding: '3px 10px', borderRadius: 12, fontSize: '0.76rem', fontWeight: 600, background: 'rgba(255,255,255,0.04)', color: 'var(--grey)' },
  btnView: { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(6,113,224,0.08)', border: '1px solid rgba(6,113,224,0.15)', color: 'var(--azure)', borderRadius: 7, padding: '5px 12px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' },
  subGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 },
  subCard: { borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 },
  noteBox: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: '#CBD5E1', fontStyle: 'italic' },
  fileLink: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--azure)', textDecoration: 'none' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 },
  modal: { width: '100%', maxWidth: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: 16 },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--grey-blue)', cursor: 'pointer' },
  formLabel: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-blue)' },
  input: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E2E8F0', padding: '9px 13px', fontSize: '0.88rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  textarea: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E2E8F0', padding: '9px 13px', fontSize: '0.88rem', outline: 'none', width: '100%', resize: 'vertical', boxSizing: 'border-box' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 7, background: '#0671E0', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 7, background: 'transparent', color: 'var(--grey-blue)', border: '1px solid rgba(255,255,255,0.12)', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
};
