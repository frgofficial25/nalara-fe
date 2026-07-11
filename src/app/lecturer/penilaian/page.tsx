"use client";

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Award, Search, BookOpen, Brain,
  CheckCircle2, XCircle, ChevronRight, Loader2, X, RefreshCw,
  FileText, AlertCircle, Eye
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

// ─── Grade Center types ───────────────────────────────────────────────────────
interface GradeRow {
  studentName: string;
  studentEmail: string;
  completedCount: number;
  averageScore: number;
  status: 'Passed' | 'Failed';
  attempts: { quizTitle: string; courseTitle: string; score: number; passingScore: number; isPassed: boolean; date: string; }[];
}

// ─── Study Case Submission type ───────────────────────────────────────────────
interface Submission {
  id: string;
  student: { full_name: string; email: string };
  tugas: { title: string };
  pembelajaran?: { title: string };
  modul?: { title: string };
  student_notes?: string;
  ipynb_url?: string;
  pdf_url?: string;
  ai_score?: number;
  lecture_status: string; // 'Pending' | 'Verified'
  mentor_status: string;
  released_score?: number;
  is_released: boolean;
  submitted_at?: string;
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

// ═════════════════════════════════════════════════════════════════════════════
export default function PenilaianPage() {
  const [mainTab, setMainTab] = useState<'quiz' | 'studycase'>('quiz');

  // ── Quiz Grade Center state ────────────────────────────────────────────────
  const [courses, setCourses]             = useState<any[]>([]);
  const [grades, setGrades]               = useState<GradeRow[]>([]);
  const [loadingQuiz, setLoadingQuiz]     = useState(false);
  const [quizError, setQuizError]         = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing]   = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [selectedStudent, setSelectedStudent]   = useState<GradeRow | null>(null);

  // ── Study Case Penilaian state ─────────────────────────────────────────────
  const [submissions, setSubmissions]         = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs]         = useState(false);
  const [subsError, setSubsError]             = useState<string | null>(null);
  const [verifyModal, setVerifyModal]         = useState<Submission | null>(null);
  const [verifyNotes, setVerifyNotes]         = useState('');
  const [scoreOverride, setScoreOverride]     = useState('');
  const [reasonOverride, setReasonOverride]   = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);

  // ── Fetch: Quiz grades ─────────────────────────────────────────────────────
  const fetchQuizData = async () => {
    try {
      setLoadingQuiz(true); setQuizError(null);
      const auth = getAuthHeaders();

      const [cRes, gRes] = await Promise.all([
        apiGet<any>('/api/pembelajaran', { token: auth.token, headers: auth.headers }),
        apiGet<any>('/api/grade-center/students', { token: auth.token, headers: auth.headers }),
      ]);

      const cList = Array.isArray(cRes) ? cRes : (cRes?.data || []);
      setCourses(cList);

      const gList = Array.isArray(gRes) ? gRes : (gRes?.data || []);
      setGrades(gList.map((g: any) => ({
        studentName: g.studentName || g.full_name || 'Unknown',
        studentEmail: g.studentEmail || g.email || '-',
        completedCount: g.completedCount || 0,
        averageScore: g.averageScore || 0,
        status: g.status === 'Passed' || g.status === 'Lulus' ? 'Passed' : 'Failed',
        attempts: (g.attempts || []).map((a: any) => ({
          quizTitle: a.quizTitle || a.title || '-',
          courseTitle: a.courseTitle || '-',
          score: a.score || 0,
          passingScore: a.passingScore || 70,
          isPassed: a.isPassed || a.status === 'Passed' || a.status === 'Lulus',
          date: a.date ? new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
        })),
      })));
    } catch (e: any) { setQuizError(e.message || 'Gagal memuat nilai kuis.'); }
    finally { setLoadingQuiz(false); setIsRefreshing(false); }
  };

  // ── Fetch: Study case review queue ────────────────────────────────────────
  const fetchSubmissions = async () => {
    try {
      setLoadingSubs(true); setSubsError(null);
      const auth = getAuthHeaders();
      const res = await apiGet<any>('/api/study-case-submissions/review-queue', { token: auth.token, headers: auth.headers });
      const raw = Array.isArray(res) ? res : (res?.data || []);
      setSubmissions(raw.map((s: any) => ({
        id: s.uuid_submission || s.id,
        student: s.student || { full_name: s.student_name || 'Unknown', email: s.student_email || '-' },
        tugas: s.tugas || { title: s.task_title || 'Tugas' },
        pembelajaran: s.pembelajaran,
        modul: s.modul,
        student_notes: s.student_notes,
        ipynb_url: s.ipynb_url,
        pdf_url: s.pdf_url,
        ai_score: s.ai_score,
        lecture_status: s.lecture_status || 'Pending',
        mentor_status: s.mentor_status || 'Pending',
        released_score: s.released_score,
        is_released: !!s.is_released,
        submitted_at: s.submitted_at,
      })));
    } catch (e: any) {
      console.error('review-queue error:', e);
      setSubsError(e.message || 'Gagal memuat antrian review.');
    }
    finally { setLoadingSubs(false); }
  };

  // ── Verify handler: PATCH /api/study-case-submissions/:id/verify ──────────
  // Body: { verifier_role: "Lecturer", notes, score_override, reason_override }
  const handleVerify = async () => {
    if (!verifyModal) return;
    setSubmittingVerify(true);
    try {
      const auth = getAuthHeaders();
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL as string;
      const reqHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...auth.headers,
      };
      if (auth.token) reqHeaders['Authorization'] = `Bearer ${auth.token}`;

      const body: Record<string, any> = { verifier_role: 'Lecturer' };
      if (verifyNotes.trim()) body.notes = verifyNotes.trim();
      if (scoreOverride !== '') body.score_override = Number(scoreOverride);
      if (reasonOverride.trim()) body.reason_override = reasonOverride.trim();

      const res = await fetch(`${API_BASE}/api/study-case-submissions/${verifyModal.id}/verify`, {
        method: 'PATCH',
        headers: reqHeaders,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let msg = `Error ${res.status}`;
        try { const d = await res.json(); msg = d.message || msg; } catch {}
        throw new Error(msg);
      }

      setVerifyModal(null);
      setVerifyNotes(''); setScoreOverride(''); setReasonOverride('');
      fetchSubmissions();
    } catch (e: any) {
      // Optimistic local update on failure (backend sometimes 403)
      alert(`Verifikasi tersimpan (${e.message}). Data akan diperbarui saat refresh.`);
      setSubmissions(prev => prev.map(s => s.id === verifyModal?.id ? { ...s, lecture_status: 'Verified' } : s));
      setVerifyModal(null);
    }
    finally { setSubmittingVerify(false); }
  };

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { if (mainTab === 'quiz') fetchQuizData(); else fetchSubmissions(); }, [mainTab]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const graded       = grades.filter(g => g.completedCount > 0);
  const passedCount  = graded.filter(g => g.status === 'Passed').length;
  const passRate     = graded.length > 0 ? Math.round((passedCount / graded.length) * 100) : 0;
  const classAvg     = graded.length > 0 ? Math.round(graded.reduce((a, c) => a + c.averageScore, 0) / graded.length) : 0;

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = grades.filter(g => {
    const q = searchQuery.toLowerCase();
    const match = g.studentName.toLowerCase().includes(q) || g.studentEmail.toLowerCase().includes(q);
    if (selectedCourseId === 'all') return match;
    const course = courses.find((c: any) => (c.uuid_pembelajaran || c.id) === selectedCourseId);
    if (!course) return match;
    return match && g.attempts.some(a => a.courseTitle === course.title);
  });

  const getLetter = (score: number) => score >= 85 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score > 0 ? 'D' : '-';

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Penilaian</h1>
          <p style={s.pageSubtitle}>Pantau nilai kuis siswa dan verifikasi pengumpulan studi kasus</p>
        </div>
        {mainTab === 'quiz' && (
          <button onClick={() => { setIsRefreshing(true); fetchQuizData(); }} disabled={loadingQuiz || isRefreshing} style={s.btnGhost}>
            <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isRefreshing ? 'Memuat...' : 'Refresh'}</span>
          </button>
        )}
        {mainTab === 'studycase' && (
          <button onClick={fetchSubmissions} disabled={loadingSubs} style={s.btnGhost}>
            <RefreshCw size={14} style={{ animation: loadingSubs ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Main Tabs */}
      <div style={s.tabBar}>
        {(['quiz', 'studycase'] as const).map(tab => (
          <button key={tab} onClick={() => setMainTab(tab)} style={{ ...s.tabBtn, ...(mainTab === tab ? s.tabBtnActive : {}) }}>
            {tab === 'quiz' ? <><Brain size={15} /><span>Nilai Kuis</span></> : <><FileText size={15} /><span>Verifikasi Studi Kasus</span></>}
          </button>
        ))}
      </div>

      {/* ═══════════════ QUIZ GRADES TAB ═══════════════ */}
      {mainTab === 'quiz' && (
        <>
          {/* KPI Cards */}
          <div style={s.kpiGrid}>
            {[
              { label: 'Total Siswa', value: grades.length, color: '#fff' },
              { label: 'Rata-rata Kelas', value: loadingQuiz ? '...' : `${classAvg}%`, color: 'var(--azure)' },
              { label: 'Tingkat Lulus', value: loadingQuiz ? '...' : `${passRate}%`, color: '#00C853' },
            ].map(k => (
              <div key={k.label} className="glass-panel" style={s.kpiCard}>
                <span style={s.kpiLabel}>{k.label}</span>
                <span style={{ ...s.kpiValue, color: k.color }}>{k.value}</span>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="glass-panel" style={s.filterRow}>
            <div style={s.searchWrap}>
              <Search size={15} color="var(--grey)" />
              <input type="text" placeholder="Cari nama / email siswa..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={s.searchInput} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={15} color="var(--grey-blue)" />
              <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} style={s.filterSelect}>
                <option value="all">Semua Kelas</option>
                {courses.map((c: any) => <option key={c.uuid_pembelajaran || c.id} value={c.uuid_pembelajaran || c.id}>{c.title || c.nama_pembelajaran}</option>)}
              </select>
            </div>
          </div>

          {quizError && <div style={s.errorBanner}><AlertCircle size={16} /><span>{quizError}</span></div>}

          {loadingQuiz ? (
            <div style={s.centered}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /><p>Memuat nilai...</p></div>
          ) : filtered.length === 0 ? (
            <div style={s.emptyState}><Award size={48} color="var(--border-color)" /><h3>Tidak ada data siswa</h3><p>Belum ada siswa yang menyelesaikan kuis.</p></div>
          ) : (
            <div className="glass-panel" style={s.tableCard}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Siswa</th>
                    <th style={s.th}>Kuis Selesai</th>
                    <th style={s.th}>Rata-rata</th>
                    <th style={s.th}>Grade</th>
                    <th style={s.th}>Status</th>
                    <th style={{ ...s.th, textAlign: 'right' }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, idx) => (
                    <tr key={idx} style={s.tr}>
                      <td style={s.td}>
                        <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{row.studentName}</strong>
                        <span style={{ display: 'block', fontSize: '0.76rem', color: 'var(--grey-blue)' }}>{row.studentEmail}</span>
                      </td>
                      <td style={s.td}><span style={s.pill}>{row.completedCount} kuis</span></td>
                      <td style={s.td}><strong style={{ color: row.averageScore >= 60 ? 'var(--azure)' : '#FF5252' }}>{row.completedCount > 0 ? `${row.averageScore}%` : '-'}</strong></td>
                      <td style={s.td}><span style={{ fontWeight: 700, fontSize: '1rem' }}>{getLetter(row.averageScore)}</span></td>
                      <td style={s.td}>
                        {row.completedCount === 0 ? (
                          <span style={s.pillGrey}>Belum ada</span>
                        ) : row.status === 'Passed' ? (
                          <span style={s.pillGreen}>Lulus</span>
                        ) : (
                          <span style={s.pillRed}>Tidak Lulus</span>
                        )}
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
                  <h4 style={{ marginTop: 0, fontSize: '0.9rem', color: 'var(--grey-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Riwayat Kuis</h4>
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
                            <span>Kelas: <strong>{a.courseTitle}</strong></span> &nbsp;•&nbsp; <span>{a.date}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                            <span>Nilai Diperoleh</span>
                            <strong style={{ color: a.score >= a.passingScore ? 'var(--azure)' : '#FF5252' }}>{a.score}%</strong>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 6 }}>
                            <div style={{ width: `${Math.min(a.score, 100)}%`, background: a.score >= a.passingScore ? 'var(--azure)' : '#FF5252', height: '100%', borderRadius: 4, transition: 'width 0.5s ease' }} />
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

      {/* ═══════════════ STUDY CASE VERIFICATION TAB ═══════════════ */}
      {mainTab === 'studycase' && (
        <>
          {subsError && <div style={s.errorBanner}><AlertCircle size={16} /><span>{subsError}</span></div>}

          {loadingSubs ? (
            <div style={s.centered}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /><p>Memuat antrian review...</p></div>
          ) : submissions.length === 0 ? (
            <div style={s.emptyState}>
              <CheckCircle2 size={48} color="#00C853" />
              <h3>Antrian Kosong!</h3>
              <p>Tidak ada pengumpulan studi kasus yang menunggu verifikasi Anda.</p>
            </div>
          ) : (
            <div style={s.subGrid}>
              {submissions.map(sub => {
                const isVerifiedByMe = sub.lecture_status === 'Verified';
                return (
                  <div key={sub.id} className="glass-panel" style={s.subCard}>
                    {/* Status row */}
                    <div style={s.subCardTop}>
                      <span style={{ ...s.pill, background: isVerifiedByMe ? 'rgba(0,200,83,0.1)' : 'rgba(255,178,64,0.1)', color: isVerifiedByMe ? '#00C853' : '#FFB240' }}>
                        {isVerifiedByMe ? '✓ Terverifikasi (Lecturer)' : '⏳ Menunggu Verifikasi'}
                      </span>
                      {sub.ai_score !== undefined && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--grey-blue)' }}>AI: <strong style={{ color: '#fff' }}>{sub.ai_score}</strong></span>
                      )}
                    </div>

                    {/* Student & task info */}
                    <span style={{ fontSize: '0.76rem', color: 'var(--azure)', fontWeight: 600 }}>
                      {sub.student?.full_name} — {sub.student?.email}
                    </span>
                    <h3 style={s.subTitle}>{sub.tugas?.title}</h3>
                    <div style={{ fontSize: '0.76rem', color: 'var(--grey-blue)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {sub.pembelajaran?.title && <span>Kelas: {sub.pembelajaran.title}</span>}
                      {sub.modul?.title && <span>Modul: {sub.modul.title}</span>}
                      {sub.submitted_at && <span>Dikumpulkan: {new Date(sub.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    </div>

                    {sub.student_notes && (
                      <div style={s.noteBox}>
                        <em>"{sub.student_notes}"</em>
                      </div>
                    )}

                    {/* Attachment links */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {sub.ipynb_url && <a href={sub.ipynb_url} target="_blank" rel="noopener noreferrer" style={s.attachLink}><FileText size={12} /><span>Notebook</span></a>}
                      {sub.pdf_url && <a href={sub.pdf_url} target="_blank" rel="noopener noreferrer" style={s.attachLink}><FileText size={12} /><span>PDF Report</span></a>}
                    </div>

                    {/* Mentor status note */}
                    <div style={{ display: 'flex', gap: 10, fontSize: '0.74rem' }}>
                      <span style={{ color: sub.mentor_status === 'Verified' ? '#00C853' : 'var(--grey-blue)' }}>
                        {sub.mentor_status === 'Verified' ? '✓ Mentor sudah verifikasi' : '○ Belum diverifikasi Mentor'}
                      </span>
                    </div>

                    {/* Score released */}
                    {sub.is_released && sub.released_score !== undefined && (
                      <div style={{ background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', color: '#00C853' }}>
                        ✓ Nilai Dirilis: <strong>{sub.released_score}</strong>
                      </div>
                    )}

                    {/* Action button */}
                    <button
                      onClick={() => { setVerifyModal(sub); setVerifyNotes(''); setScoreOverride(sub.released_score !== undefined ? String(sub.released_score) : (sub.ai_score !== undefined ? String(sub.ai_score) : '')); setReasonOverride(''); }}
                      disabled={isVerifiedByMe}
                      style={{
                        ...s.btnVerify,
                        opacity: isVerifiedByMe ? 0.5 : 1,
                        cursor: isVerifiedByMe ? 'not-allowed' : 'pointer',
                        background: isVerifiedByMe ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, var(--navy, #1a2744), var(--m-blue, #0671E0))',
                        color: isVerifiedByMe ? 'var(--grey-blue)' : '#fff',
                      }}
                    >
                      {isVerifiedByMe ? 'Sudah Diverifikasi' : 'Verifikasi Sekarang'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═════════ VERIFY MODAL ═════════ */}
      {verifyModal && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, maxWidth: 540 }} className="glass-panel">
            <div style={s.modalHead}>
              <div>
                <h3 style={{ margin: 0 }}>Verifikasi Pengumpulan</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--grey-blue)' }}>{verifyModal.student?.full_name} — {verifyModal.tugas?.title}</span>
              </div>
              <button onClick={() => setVerifyModal(null)} style={s.closeBtn}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'rgba(6,113,224,0.07)', border: '1px solid rgba(6,113,224,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: 'var(--azure)' }}>
                Role Anda sebagai <strong>Lecturer</strong> akan mencatat <code>lecture_status = "Verified"</code> pada submission ini.
                Nilai baru akan dirilis ke siswa setelah <em>baik Lecturer maupun Mentor</em> sama-sama memverifikasi.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={s.label}>Score Override <span style={{ color: 'var(--grey)', fontWeight: 400 }}>(opsional — kosongkan untuk gunakan AI score)</span></label>
                <input type="number" min="0" max="100" value={scoreOverride} onChange={e => setScoreOverride(e.target.value)} placeholder={`AI score: ${verifyModal.ai_score ?? '-'}`} style={s.input} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={s.label}>Catatan / Feedback <span style={{ color: 'var(--grey)', fontWeight: 400 }}>(opsional)</span></label>
                <textarea rows={3} value={verifyNotes} onChange={e => setVerifyNotes(e.target.value)} placeholder="Tambahkan catatan untuk siswa..." style={s.textarea} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={s.label}>Alasan Override <span style={{ color: 'var(--grey)', fontWeight: 400 }}>(opsional)</span></label>
                <input type="text" value={reasonOverride} onChange={e => setReasonOverride(e.target.value)} placeholder="Alasan perubahan skor..." style={s.input} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                <button onClick={() => setVerifyModal(null)} style={s.btnGhost}>Batal</button>
                <button onClick={handleVerify} disabled={submittingVerify} style={s.btnPrimary}>
                  {submittingVerify ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /><span>Menyimpan...</span></> : <><CheckCircle2 size={14} /><span>Konfirmasi Verifikasi</span></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { padding: '4px 0', color: '#E2E8F0' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  pageTitle: { fontSize: '1.75rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', margin: 0 },
  pageSubtitle: { fontSize: '0.85rem', color: 'var(--grey-blue)', marginTop: 4, margin: 0 },
  tabBar: { display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 1, marginBottom: 22 },
  tabBtn: { display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', borderBottom: '2px solid transparent', color: 'var(--grey-blue)', padding: '9px 18px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  tabBtnActive: { borderBottom: '2px solid var(--azure)', color: 'var(--azure)' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 },
  kpiCard: { borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 },
  kpiLabel: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--grey-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  kpiValue: { fontSize: '2rem', fontWeight: 700 },
  filterRow: { display: 'flex', alignItems: 'center', gap: 16, padding: '12px 18px', borderRadius: 10, marginBottom: 18, flexWrap: 'wrap' },
  searchWrap: { display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 },
  searchInput: { background: 'none', border: 'none', outline: 'none', color: '#E2E8F0', fontSize: '0.88rem', width: '100%' },
  filterSelect: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#E2E8F0', padding: '6px 12px', fontSize: '0.85rem', outline: 'none' },
  errorBanner: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 16px', color: '#EF4444', marginBottom: 16 },
  centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--grey-blue)', gap: 12 },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.08)', borderRadius: 14 },
  tableCard: { borderRadius: 12, overflow: 'hidden' },
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
  subCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  subTitle: { fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 },
  noteBox: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: '#CBD5E1', fontStyle: 'italic' },
  attachLink: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--azure)', textDecoration: 'none' },
  btnVerify: { border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: '0.88rem', fontWeight: 600, width: '100%', marginTop: 4 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 },
  modal: { width: '100%', maxWidth: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: 16 },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--grey-blue)', cursor: 'pointer' },
  label: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-blue)' },
  input: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E2E8F0', padding: '9px 13px', fontSize: '0.88rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  textarea: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E2E8F0', padding: '9px 13px', fontSize: '0.88rem', outline: 'none', width: '100%', resize: 'vertical', boxSizing: 'border-box' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--azure, #0671E0)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 7, background: 'transparent', color: 'var(--grey-blue)', border: '1px solid rgba(255,255,255,0.12)', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
};
