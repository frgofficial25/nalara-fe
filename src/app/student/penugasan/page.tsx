"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  ClipboardList, Upload, CheckCircle2, AlertCircle, Loader2,
  FileText, Brain, X, Info, Calendar, ChevronRight,
  ExternalLink, Clock, Play, Check
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import { useRouter } from 'next/navigation';
import Portal from '@/components/common/Portal';

// ─── Types ────────────────────────────────────────────────────────────────────
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
  tugas?: { title: string; type: string; pembelajaran?: { title: string }; modul?: { title: string } };
  ipynb_url?: string;
  pdf_url?: string;
  student_notes?: string;
  ai_score?: number;
  lecture_status?: string;
  mentor_status?: string;
  released_score?: number;
  is_released?: boolean;
  submitted_at?: string;
}

interface QuizListItem {
  id: string;
  title: string;
  description?: string;
  time_limit?: number;
  deadline?: string;
  is_published: boolean;
  courseId?: string;
  moduleTitle: string;
  questionCount: number;
}

interface QuizQuestion {
  uuid_question: string;
  question_text: string;
  type: 'MultipleChoice' | 'TrueFalse' | 'Checkbox';
  options: { id: string; text: string }[];
}

interface QuizDetail {
  id: string;
  title: string;
  description?: string;
  time_limit?: number;
  questions: QuizQuestion[];
}

interface QuizResult {
  correct: number;
  wrong: number;
  score: number;
  isPassed: boolean;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function getAuthHeaders() {
  const token = getStoredToken();
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) headers['x-api-key'] = apiKey;
  else if (token) headers['x-api-key'] = token;
  return { token: token || undefined, headers };
}

function getUserId(): string {
  const raw = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info') || '';
  try { const p = JSON.parse(raw); return p.id || p.uuid_user || ''; } catch { return ''; }
}

// ═════════════════════════════════════════════════════════════════════════════
export default function PenugasanPage() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<'studycase' | 'quiz'>('studycase');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Study Case state ───────────────────────────────────────────────────────
  const [scTab, setScTab]             = useState<'pending' | 'submitted'>('pending');
  const [tasks, setTasks]             = useState<UrgentTask[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSc, setLoadingSc]     = useState(true);
  const [scError, setScError]         = useState<string | null>(null);

  // Submit modal
  const [uploadTask, setUploadTask]   = useState<UrgentTask | null>(null);
  const [ipynbFile, setIpynbFile]     = useState<File | null>(null);
  const [pdfFile, setPdfFile]         = useState<File | null>(null);
  const [notes, setNotes]             = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Detail modal
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  // ── Quiz state ─────────────────────────────────────────────────────────────
  const [quizzes, setQuizzes]           = useState<QuizListItem[]>([]);
  const [loadingQuiz, setLoadingQuiz]   = useState(false);
  const [quizError, setQuizError]       = useState<string | null>(null);
  const [quizTab, setQuizTab]           = useState<'pending' | 'submitted'>('pending');

  // Quiz session
  const [activeQuiz, setActiveQuiz]         = useState<QuizDetail | null>(null);
  const [loadingQuizDetail, setLoadingQuizDetail] = useState(false);
  const [answers, setAnswers]               = useState<Record<string, string | string[]>>({});
  const [quizResult, setQuizResult]         = useState<QuizResult | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [timeLeft, setTimeLeft]             = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Rekap my quizzes
  const [myQuizRekap, setMyQuizRekap] = useState<any[]>([]);

  // ── Fetch Study Case data ──────────────────────────────────────────────────
  const fetchScData = async () => {
    try {
      setLoadingSc(true); setScError(null);
      const auth = getAuthHeaders();
      const userId = getUserId();

      if (!userId) throw new Error('Sesi login tidak ditemukan. Silakan login ulang.');

      const [tasksRes, subsRes] = await Promise.all([
        apiGet<any>(`/api/students/${userId}/urgent-tasks`, { token: auth.token, headers: auth.headers }),
        apiGet<any>('/api/study-case-submissions/me', { token: auth.token, headers: auth.headers }),
      ]);

      const rawSubs = Array.isArray(subsRes) ? subsRes : (subsRes?.data || []);
      const mappedSubs: Submission[] = rawSubs.map((s: any) => ({
        id: s.uuid_submission || s.id,
        uuid_tugas: s.uuid_tugas,
        tugas: s.tugas,
        ipynb_url: s.ipynb_url,
        pdf_url: s.pdf_url,
        student_notes: s.student_notes,
        ai_score: s.ai_score,
        lecture_status: s.lecture_status,
        mentor_status: s.mentor_status,
        released_score: s.score,
        is_released: s.is_released,
        submitted_at: s.submitted_at,
      }));
      setSubmissions(mappedSubs);

      // Set uuid_tugas yang sudah dikumpulkan
      const submittedTugasIds = new Set(mappedSubs.map(sub => sub.uuid_tugas));

      const rawTasks = Array.isArray(tasksRes) ? tasksRes : (tasksRes?.data || []);
      // Hanya tampilkan tugas CaseStudy/Practice yang belum dikumpulkan
      setTasks(
        rawTasks.filter((t: any) =>
          (t.tipe === 'CaseStudy' || t.tipe === 'Practice') &&
          !submittedTugasIds.has(t.id_tugas)
        )
      );
    } catch (e: any) { setScError(e.message || 'Gagal memuat data tugas.'); }
    finally { setLoadingSc(false); }
  };

  // ── Fetch Quiz list + rekap ────────────────────────────────────────────────
  const fetchQuizData = async () => {
    try {
      setLoadingQuiz(true); setQuizError(null);
      const auth = getAuthHeaders();

      const [quizRes, rekapRes] = await Promise.all([
        apiGet<any>('/api/quiz', { token: auth.token, headers: auth.headers }),
        apiGet<any>('/api/quiz/rekap', { token: auth.token, headers: auth.headers }),
      ]);

      const quizList = Array.isArray(quizRes) ? quizRes : (quizRes?.data || []);
      // Backend /api/quiz returns: uuid_quiz, nama_quiz, asal_pembelajaran, asal_modul, waktu_pengerjaan, tenggat_pengerjaan
      const mapped: QuizListItem[] = quizList.map((q: any) => ({
        id: q.uuid_quiz || q.id,
        title: q.nama_quiz || q.title || 'Untitled Quiz',
        description: q.description || q.deskripsi || '',
        time_limit: q.time_limit || q.waktu_pengerjaan || null,
        deadline: q.deadline || q.tenggat_pengerjaan || null,
        is_published: true, // not in list response; assume published since API only returns published
        courseId: q.uuid_pembelajaran || q.course_id || q.courseId || undefined,
        moduleTitle: q.asal_modul || q.asal_pembelajaran || '-',
        questionCount: q.question_count || q.questions?.length || q._count?.questions || 0,
      }));

      const finalized = await Promise.all(mapped.map(async (quiz: QuizListItem) => {
        if (quiz.questionCount > 0) return quiz;
        try {
          const detailRes = await apiGet<any>(`/api/quiz/${quiz.id}`, { token: auth.token, headers: auth.headers });
          const d = detailRes?.data || detailRes;
          const detailCount = (d.questions || d.daftar_soal || []).length || 0;
          return { ...quiz, questionCount: detailCount };
        } catch {
          return quiz;
        }
      }));

      setQuizzes(finalized);

      const rekapList = Array.isArray(rekapRes) ? rekapRes : (rekapRes?.data || []);
      // Backend returns: uuid_attempt, uuid_quiz, quiz_title, score, is_passed, etc.
      setMyQuizRekap(rekapList);
    } catch (e: any) { setQuizError(e.message || 'Gagal memuat kuis.'); }
    finally { setLoadingQuiz(false); }
  };

  useEffect(() => {
    if (mainTab === 'studycase') fetchScData();
    else fetchQuizData();
  }, [mainTab]);

  // ── Submit Study Case ──────────────────────────────────────────────────────
  const handleSubmitSc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTask || !ipynbFile || !pdfFile) return;
    setSubmitting(true); setSubmitError(null);
    try {
      const auth = getAuthHeaders();
      const token = getStoredToken();
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL as string;
      const headers: Record<string, string> = { ...auth.headers };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const fd = new FormData();
      fd.append('ipynb', ipynbFile);
      fd.append('pdf', pdfFile);
      if (notes) fd.append('student_notes', notes);

      const res = await fetch(`${API_BASE}/api/study-case-submissions/${uploadTask.id_tugas}`, {
        method: 'POST', headers, body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal mengirimkan tugas.');

      setSubmitSuccess(true);
      setTimeout(() => { setUploadTask(null); fetchScData(); }, 1800);
    } catch (e: any) { setSubmitError(e.message || 'Terjadi kesalahan.'); }
    finally { setSubmitting(false); }
  };

  // ── Open Quiz ──────────────────────────────────────────────────────────────
  const openQuiz = async (quiz: QuizListItem) => {
    // Check if already attempted
    const already = myQuizRekap.find((r: any) => (r.uuid_quiz || r.quiz_id) === quiz.id);
    if (already) { 
      showToast('Kamu sudah pernah mengerjakan kuis ini. Hanya boleh dikerjakan 1 kali.', 'info'); 
      return; 
    }

    const isExpired = !!quiz.deadline && new Date(quiz.deadline) < new Date();
    if (isExpired) {
      showToast('Kuis sudah kedaluwarsa.', 'info');
      return;
    }

    setLoadingQuizDetail(true);
    const courseQuery = quiz.courseId ? `&courseId=${encodeURIComponent(quiz.courseId)}` : '';
    router.push(`/quiz?id=${encodeURIComponent(quiz.id)}${courseQuery}`);
  };

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || !activeQuiz) return;
    if (timeLeft <= 0) { submitQuizAnswers(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => (t ?? 1) - 1), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timeLeft, activeQuiz]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Answer handlers ────────────────────────────────────────────────────────
  const setAnswer = (qid: string, val: string, type: string) => {
    if (type === 'Checkbox') {
      setAnswers(prev => {
        const cur = (prev[qid] as string[]) || [];
        const next = cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val];
        return { ...prev, [qid]: next };
      });
    } else {
      setAnswers(prev => ({ ...prev, [qid]: val }));
    }
  };

  // ── Submit Quiz ────────────────────────────────────────────────────────────
  const submitQuizAnswers = async () => {
    if (!activeQuiz) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setSubmittingQuiz(true);
    try {
      const auth = getAuthHeaders();
      const token = getStoredToken();
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL as string;
      const headers: Record<string, string> = { 'Content-Type': 'application/json', ...auth.headers };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const answersPayload = activeQuiz.questions.map(q => ({
        uuid_question: q.uuid_question,
        submitted_answer: answers[q.uuid_question] ?? '',
      }));

      const res = await fetch(`${API_BASE}/api/quiz/${activeQuiz.id}/submit`, {
        method: 'POST', headers, body: JSON.stringify({ answers: answersPayload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal submit jawaban.');

      const d = json.data || json;
      setQuizResult({
        correct: d.correct ?? 0,
        wrong: d.wrong ?? 0,
        score: d.score ?? 0,
        isPassed: (d.score ?? 0) >= 75,
      });
      setTimeLeft(null);
      showToast('Kuis berhasil dikirim!', 'success');
      fetchQuizData(); // refresh rekap
    } catch (e: any) { 
      showToast(e.message || 'Gagal submit kuis.', 'error'); 
    }
    finally { setSubmittingQuiz(false); }
  };

  // Match attempt to quiz by uuid_quiz (backend now includes uuid_quiz in rekap response)
  const getAttempt = (quizId: string) => myQuizRekap.find((r: any) => r.uuid_quiz === quizId);

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Penugasan</h1>
          <p style={s.pageSubtitle}>Kerjakan studi kasus dan kuis yang ditugaskan oleh dosen</p>
        </div>
      </div>

      {/* Main Tabs */}
      <div style={s.tabBar}>
        {(['studycase', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setMainTab(tab)} style={{ ...s.tabBtn, ...(mainTab === tab ? s.tabBtnActive : {}) }}>
            {tab === 'studycase' ? <><FileText size={15} /><span>Studi Kasus</span></> : <><Brain size={15} /><span>Kuis</span></>}
          </button>
        ))}
      </div>

      {/* ═══════════════ STUDY CASE TAB ═══════════════ */}
      {mainTab === 'studycase' && (
        <>
          {/* Sub-tabs */}
          <div style={s.subTabBar}>
            <button onClick={() => setScTab('pending')} style={{ ...s.subTab, ...(scTab === 'pending' ? s.subTabActive : {}) }}>
              Belum Dikerjakan ({tasks.length})
            </button>
            <button onClick={() => setScTab('submitted')} style={{ ...s.subTab, ...(scTab === 'submitted' ? s.subTabActive : {}) }}>
              Sudah Dikumpulkan ({submissions.length})
            </button>
          </div>

          {scError && <div style={s.errorBanner}><AlertCircle size={16} /><span>{scError}</span></div>}

          {loadingSc ? (
            <div style={s.centered}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /><p>Memuat...</p></div>
          ) : scTab === 'pending' ? (
            tasks.length === 0 ? (
              <div style={s.emptyState}><CheckCircle2 size={48} color="#00C853" /><h3>Semua Tugas Selesai! 🎉</h3><p>Tidak ada studi kasus yang perlu dikumpulkan.</p></div>
            ) : (
              <div style={s.cardList}>
                {tasks.map(task => (
                  <div key={task.id_tugas} className="glass-panel" style={s.taskCard}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={s.typeBadge}>{task.tipe}</span>
                        <span style={s.courseLabel}>{task.nama_pembelajaran}</span>
                      </div>
                      <h3 style={s.taskTitle}>{task.nama_tugas}</h3>
                      <p style={s.taskMeta}>Modul: {task.nama_modul}</p>
                    </div>
                    <button onClick={() => { setUploadTask(task); setIpynbFile(null); setPdfFile(null); setNotes(''); setSubmitError(null); setSubmitSuccess(false); }} style={s.btnUpload}>
                      <Upload size={14} /><span>Kumpulkan Tugas</span>
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            submissions.length === 0 ? (
              <div style={s.emptyState}><FileText size={48} color="var(--border-color)" /><h3>Belum ada pengumpulan</h3><p>Tugas yang sudah dikumpulkan akan tampil di sini.</p></div>
            ) : (
              <div style={s.cardList}>
                {submissions.map(sub => (
                  <div key={sub.id} className="glass-panel" style={s.taskCard}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ ...s.statusBadge, background: sub.is_released ? 'rgba(0,200,83,0.12)' : 'rgba(255,178,64,0.12)', color: sub.is_released ? '#00C853' : '#FFB240' }}>
                          {sub.is_released ? '✓ Nilai Dirilis' : '⏳ Proses Verifikasi'}
                        </span>
                        <span style={s.courseLabel}>{sub.tugas?.pembelajaran?.title || '-'}</span>
                      </div>
                      <h3 style={s.taskTitle}>{sub.tugas?.title || 'Study Case'}</h3>
                      {sub.submitted_at && <p style={s.taskMeta}><Calendar size={11} /> {new Date(sub.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                      <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                        <div style={s.scoreItem}><span style={s.scoreLabel}>Final Score</span><span style={{ ...s.scoreVal, color: sub.is_released ? 'var(--azure)' : 'var(--grey-blue)' }}>{sub.released_score ?? '-'}</span></div>
                        <div style={s.scoreItem}>
                          <span style={s.scoreLabel}>Status Verifikasi</span>
                          <span style={{ fontSize: '0.78rem', color: (sub.lecture_status === 'Verified' || sub.mentor_status === 'Verified') ? '#00C853' : 'var(--grey-blue)' }}>
                            {(sub.lecture_status === 'Verified' || sub.mentor_status === 'Verified') ? '✓ Diverifikasi' : '○ Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedSub(sub)} style={s.btnDetail}>
                      <Info size={14} /><span>Detail</span>
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* ═══════════════ QUIZ TAB ═══════════════ */}
      {mainTab === 'quiz' && (
        <>
          {/* Sub-tabs */}
          <div style={s.subTabBar}>
            <button onClick={() => setQuizTab('pending')} style={{ ...s.subTab, ...(quizTab === 'pending' ? s.subTabActive : {}) }}>
              Belum Dikerjakan ({quizzes.filter(quiz => !getAttempt(quiz.id)).length})
            </button>
            <button onClick={() => setQuizTab('submitted')} style={{ ...s.subTab, ...(quizTab === 'submitted' ? s.subTabActive : {}) }}>
              Sudah Dikerjakan ({quizzes.filter(quiz => getAttempt(quiz.id)).length})
            </button>
          </div>

          {quizError && <div style={s.errorBanner}><AlertCircle size={16} /><span>{quizError}</span></div>}

          {loadingQuiz ? (
            <div style={s.centered}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /><p>Memuat kuis...</p></div>
          ) : quizTab === 'pending' ? (
            quizzes.filter(quiz => !getAttempt(quiz.id)).length === 0 ? (
              <div style={s.emptyState}><CheckCircle2 size={48} color="#00C853" /><h3>Semua Kuis Selesai! 🎉</h3><p>Tidak ada kuis yang belum dikerjakan.</p></div>
            ) : (
              <div style={s.cardList}>
                {quizzes.filter(quiz => !getAttempt(quiz.id)).map(quiz => {
                  const isExpired = !!(quiz.deadline && new Date(quiz.deadline) < new Date());
                  return (
                    <div key={quiz.id} className="glass-panel" style={s.quizCard}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <Brain size={16} color="var(--azure)" />
                          <span style={s.courseLabel}>{quiz.moduleTitle}</span>
                          {isExpired && <span style={{ ...s.statusBadge, background: 'rgba(255,82,82,0.08)', color: '#FF5252' }}>Kedaluwarsa</span>}
                        </div>
                        <h3 style={s.taskTitle}>{quiz.title}</h3>
                        {quiz.description && <p style={s.taskMeta}>{quiz.description}</p>}
                        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.78rem', color: 'var(--grey-blue)', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span>{quiz.questionCount} soal</span>
                          {quiz.time_limit && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={12} /> {quiz.time_limit} menit
                            </span>
                          )}
                          {quiz.deadline && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Calendar size={12} /> {new Date(quiz.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => openQuiz(quiz)} 
                        disabled={loadingQuizDetail || quiz.questionCount === 0 || isExpired} 
                        style={{ ...s.btnStart, opacity: (loadingQuizDetail || quiz.questionCount === 0 || isExpired) ? 0.6 : 1, cursor: (loadingQuizDetail || quiz.questionCount === 0 || isExpired) ? 'not-allowed' : 'pointer' }}
                      >
                        <Play size={14} fill="var(--azure)" /><span>Mulai Kuis</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            quizzes.filter(quiz => getAttempt(quiz.id)).length === 0 ? (
              <div style={s.emptyState}><Brain size={48} color="var(--border-color)" /><h3>Belum ada kuis yang selesai</h3><p>Kuis yang sudah Anda kerjakan akan tampil di sini.</p></div>
            ) : (
              <div style={s.cardList}>
                {quizzes.filter(quiz => getAttempt(quiz.id)).map(quiz => {
                  const attempt = getAttempt(quiz.id)!;
                  const finalScore = attempt.score ?? attempt.skor ?? 0;
                  const isPassed = attempt.is_passed ?? attempt.isPassed ?? (finalScore >= 75);
                  return (
                    <div key={quiz.id} className="glass-panel" style={s.quizCard}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <Brain size={16} color="var(--azure)" />
                          <span style={s.courseLabel}>{quiz.moduleTitle}</span>
                          <span style={{ 
                            ...s.statusBadge, 
                            background: isPassed ? 'rgba(0,200,83,0.12)' : 'rgba(255,82,82,0.12)', 
                            color: isPassed ? '#00C853' : '#FF5252' 
                          }}>
                            {isPassed ? 'Lulus' : 'Tidak Lulus'}
                          </span>
                        </div>
                        <h3 style={s.taskTitle}>{quiz.title}</h3>
                        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.78rem', color: 'var(--grey-blue)', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span>Skor Akhir: <strong style={{ color: isPassed ? '#00C853' : '#FF5252' }}>{finalScore}%</strong></span>
                          {attempt.completed_at && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Calendar size={12} /> {new Date(attempt.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => openQuiz(quiz)} style={s.btnDetail}>
                        <Info size={14} /><span>Lihat Rekap</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODALS */}

      {uploadTask && (
        <Portal>
          <div style={s.overlay}>
            <div style={{ ...s.modal, padding: '24px' }} className="glass-panel">
            <div style={s.modalHead}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Kumpulkan Tugas</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--grey-blue)' }}>{uploadTask.nama_tugas}</p>
              </div>
              <button onClick={() => setUploadTask(null)} style={s.closeBtn}><X size={18} /></button>
            </div>
            <div>
              {submitError && <div style={{ ...s.errorBanner, marginBottom: 16 }}><AlertCircle size={15} /><span>{submitError}</span></div>}
              {submitSuccess ? (
                <div style={s.successBox}>
                  <CheckCircle2 size={40} color="#00C853" />
                  <strong style={{ color: '#fff', marginTop: 8 }}>Berhasil Dikumpulkan!</strong>
                  <span style={{ fontSize: '0.82rem', color: 'var(--grey-blue)' }}>Sistem sedang menilai kode Anda dengan AI...</span>
                </div>
              ) : (
                <form onSubmit={handleSubmitSc} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={s.fg}>
                    <label style={s.label}>1. Jupyter Notebook (.ipynb) <span style={{ color: '#FF5252' }}>*</span></label>
                    <div style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: ipynbFile ? '1px solid var(--azure)' : '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}>
                      <FileText size={16} color={ipynbFile ? 'var(--azure)' : 'var(--grey-blue)'} />
                      <input 
                        type="file" 
                        required 
                        accept=".ipynb" 
                        onChange={e => setIpynbFile(e.target.files?.[0] || null)} 
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer'
                        }} 
                      />
                      <span style={{ fontSize: '0.88rem', color: ipynbFile ? '#fff' : 'var(--grey-blue)' }}>
                        {ipynbFile ? ipynbFile.name : 'Pilih file Jupyter Notebook...'}
                      </span>
                    </div>
                  </div>
                  <div style={s.fg}>
                    <label style={s.label}>2. Laporan PDF <span style={{ color: '#FF5252' }}>*</span></label>
                    <div style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: pdfFile ? '1px solid var(--azure)' : '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}>
                      <FileText size={16} color={pdfFile ? 'var(--azure)' : 'var(--grey-blue)'} />
                      <input 
                        type="file" 
                        required 
                        accept=".pdf" 
                        onChange={e => setPdfFile(e.target.files?.[0] || null)} 
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
                  <div style={s.fg}>
                    <label style={s.label}>Catatan (Opsional)</label>
                    <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan pengerjaan..." style={s.textarea} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 16 }}>
                    <button type="button" onClick={() => setUploadTask(null)} style={s.btnGhost}>Batal</button>
                    <button type="submit" disabled={submitting} style={s.btnPrimary}>
                      {submitting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /><span>Mengirim...</span></> : <><Upload size={14} /><span>Kirim Sekarang</span></>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
        </Portal>
      )}

      {selectedSub && (
        <Portal>
          <div style={s.overlay}>
            <div style={{ ...s.modal, maxWidth: 520 }} className="glass-panel">
            <div style={s.modalHead}>
              <h3 style={{ margin: 0 }}>{selectedSub.tugas?.title || 'Detail Pengumpulan'}</h3>
              <button onClick={() => setSelectedSub(null)} style={s.closeBtn}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Status', value: selectedSub.is_released ? '✓ Nilai Dirilis' : '⏳ Menunggu Verifikasi' },
                { label: 'Kelas', value: selectedSub.tugas?.pembelajaran?.title || '-' },
                { label: 'Modul', value: selectedSub.tugas?.modul?.title || '-' },
                { label: 'Final Score', value: selectedSub.released_score ?? (selectedSub.is_released ? 0 : '-') },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10 }}>
                  <span style={{ minWidth: 100, fontSize: '0.8rem', color: 'var(--grey-blue)', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: '0.88rem', color: '#fff' }}>{String(value)}</span>
                </div>
              ))}
              {selectedSub.student_notes && (
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: '#CBD5E1', fontStyle: 'italic' }}>
                  "{selectedSub.student_notes}"
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                {selectedSub.ipynb_url && <a href={selectedSub.ipynb_url} target="_blank" rel="noopener noreferrer" style={s.attachLink}><FileText size={13} /><span>Notebook</span></a>}
                {selectedSub.pdf_url && <a href={selectedSub.pdf_url} target="_blank" rel="noopener noreferrer" style={s.attachLink}><FileText size={13} /><span>PDF Report</span></a>}
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {activeQuiz && (
        <Portal>
          <div style={s.overlay}>
            <div style={{ ...s.modal, maxWidth: 780, maxHeight: '95vh' }} className="glass-panel">
            <div style={s.modalHead}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{activeQuiz.title}</h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--grey-blue)' }}>{activeQuiz.questions.length} soal</p>
              </div>
              {timeLeft !== null && (
                <div style={{ background: timeLeft < 60 ? 'rgba(255,82,82,0.15)' : 'rgba(6,113,224,0.1)', border: `1px solid ${timeLeft < 60 ? 'rgba(255,82,82,0.3)' : 'rgba(6,113,224,0.2)'}`, borderRadius: 8, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} color={timeLeft < 60 ? '#FF5252' : 'var(--azure)'} />
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: timeLeft < 60 ? '#FF5252' : 'var(--azure)' }}>{formatTime(timeLeft)}</span>
                </div>
              )}
              {quizResult && <button onClick={() => setActiveQuiz(null)} style={s.closeBtn}><X size={18} /></button>}
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {quizResult ? (
                /* Result Screen */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '30px 0' }}>
                  <div style={{ fontSize: '4rem' }}>{quizResult.isPassed ? '🎉' : '📚'}</div>
                  <h2 style={{ margin: 0, color: quizResult.isPassed ? '#00C853' : '#FF5252' }}>
                    {quizResult.isPassed ? 'Selamat, Kamu Lulus!' : 'Belum Lulus'}
                  </h2>
                  <div style={{ display: 'flex', gap: 24, textAlign: 'center' }}>
                    <div><div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--azure)' }}>{quizResult.score}</div><div style={{ fontSize: '0.8rem', color: 'var(--grey-blue)' }}>Skor</div></div>
                    <div><div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#00C853' }}>{quizResult.correct}</div><div style={{ fontSize: '0.8rem', color: 'var(--grey-blue)' }}>Benar</div></div>
                    <div><div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#FF5252' }}>{quizResult.wrong}</div><div style={{ fontSize: '0.8rem', color: 'var(--grey-blue)' }}>Salah</div></div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--grey-blue)' }}>Passing score: <strong>75</strong></div>
                  <button onClick={() => setActiveQuiz(null)} style={s.btnPrimary}>Tutup</button>
                </div>
              ) : (
                /* Question List */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {activeQuiz.questions.map((q, qi) => (
                    <div key={q.uuid_question} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                        <span style={{ minWidth: 26, height: 26, borderRadius: 8, background: 'rgba(6,113,224,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'var(--azure)' }}>{qi + 1}</span>
                        <p style={{ margin: 0, fontSize: '0.92rem', color: '#E2E8F0', lineHeight: 1.6 }}>{q.question_text}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {q.options.map(opt => {
                          const cur = answers[q.uuid_question];
                          const selected = q.type === 'Checkbox' ? (Array.isArray(cur) && cur.includes(opt.id)) : cur === opt.id;
                          return (
                            <button key={opt.id} type="button" onClick={() => setAnswer(q.uuid_question, opt.id, q.type)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `1px solid ${selected ? 'var(--azure)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, background: selected ? 'rgba(6,113,224,0.12)' : 'transparent', cursor: 'pointer', textAlign: 'left', color: '#E2E8F0', fontSize: '0.88rem', transition: 'all 0.15s' }}>
                              <span style={{ width: 20, height: 20, borderRadius: q.type === 'Checkbox' ? 5 : '50%', border: `2px solid ${selected ? 'var(--azure)' : 'rgba(255,255,255,0.2)'}`, background: selected ? 'var(--azure)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {selected && <Check size={11} color="#fff" />}
                              </span>
                              <span>{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
                    <button type="button" onClick={() => { if (confirm('Yakin ingin keluar dari kuis? Jawaban tidak akan tersimpan.')) { setActiveQuiz(null); setTimeLeft(null); } }} style={s.btnGhost}>Keluar</button>
                    <button type="button" onClick={submitQuizAnswers} disabled={submittingQuiz} style={s.btnPrimary}>
                      {submittingQuiz ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /><span>Mengirim...</span></> : <><Check size={14} /><span>Submit Jawaban</span></>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: toast.type === 'success' ? '#00C853' : toast.type === 'error' ? '#FF5252' : '#0671E0',
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
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : toast.type === 'error' ? <AlertCircle size={16} /> : <Info size={16} />}
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
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontSize: '1.75rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', margin: 0 },
  pageSubtitle: { fontSize: '0.85rem', color: 'var(--grey-blue)', marginTop: 4, margin: 0 },
  tabBar: { display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 1, marginBottom: 22 },
  tabBtn: { display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', borderBottom: '2px solid transparent', color: 'var(--grey-blue)', padding: '9px 18px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  tabBtnActive: { borderBottom: '2px solid var(--azure)', color: 'var(--azure)' },
  subTabBar: { display: 'flex', gap: 0, marginBottom: 18 },
  subTab: { background: 'none', border: 'none', borderBottom: '2px solid transparent', color: 'var(--grey-blue)', padding: '7px 16px', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  subTabActive: { borderBottom: '2px solid rgba(6,113,224,0.7)', color: 'var(--azure)' },
  errorBanner: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 16px', color: '#EF4444', marginBottom: 16 },
  centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--grey-blue)', gap: 12 },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.08)', borderRadius: 14 },
  cardList: { display: 'flex', flexDirection: 'column', gap: 14 },
  taskCard: { borderRadius: 12, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  quizCard: { borderRadius: 12, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 },
  typeBadge: { display: 'inline-flex', padding: '3px 10px', borderRadius: 12, fontSize: '0.73rem', fontWeight: 700, background: 'rgba(255,145,0,0.12)', color: '#FF9100' },
  statusBadge: { display: 'inline-flex', padding: '3px 10px', borderRadius: 12, fontSize: '0.73rem', fontWeight: 700 },
  courseLabel: { fontSize: '0.78rem', color: 'var(--grey-blue)', fontWeight: 500 },
  taskTitle: { fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '0 0 4px' },
  taskMeta: { fontSize: '0.78rem', color: 'var(--grey-blue)', display: 'flex', alignItems: 'center', gap: 5, margin: 0 },
  scoreItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  scoreLabel: { fontSize: '0.68rem', fontWeight: 600, color: 'var(--grey-blue)', textTransform: 'uppercase' },
  scoreVal: { fontSize: '1rem', fontWeight: 700, color: '#fff' },
  btnUpload: { display: 'inline-flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg, #1a2744, #0671E0)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  btnDetail: { display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--grey-blue)', padding: '7px 14px', borderRadius: 8, fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  btnStart: { display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(6,113,224,0.15)', border: '1px solid rgba(6,113,224,0.3)', color: 'var(--azure)', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  successBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '30px 0' },
  attachLink: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--azure)', textDecoration: 'none', padding: '6px 12px', background: 'rgba(6,113,224,0.08)', border: '1px solid rgba(6,113,224,0.15)', borderRadius: 7 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 },
  modal: { 
    width: '100%', 
    maxWidth: 540, 
    maxHeight: '90vh', 
    display: 'flex', 
    flexDirection: 'column', 
    borderRadius: 16,
    background: 'rgba(20, 20, 20, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(16px)',
  },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '20px' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--grey-blue)', cursor: 'pointer' },
  fg: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--grey-blue)' },
  fileInput: { background: 'rgba(0,0,0,0.3)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 8, color: '#E2E8F0', padding: '10px', fontSize: '0.85rem', cursor: 'pointer' },
  fileHint: { fontSize: '0.75rem', color: '#00C853' },
  textarea: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E2E8F0', padding: '9px 13px', fontSize: '0.88rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--azure, #0671E0)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 7, background: 'transparent', color: 'var(--grey-blue)', border: '1px solid rgba(255,255,255,0.12)', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
};
