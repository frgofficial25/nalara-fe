"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  ClipboardList, Upload, CheckCircle2, AlertCircle, Loader2,
  FileText, Brain, X, Info, Calendar, ChevronRight,
  ExternalLink, Clock, Play, Check, Users, Lock, Crown, Eye, Download
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import { useRouter } from 'next/navigation';
import Portal from '@/components/common/Portal';
import { downloadFile, openInNewTab } from '@/lib/download';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UrgentTask {
  id_tugas: string;
  nama_tugas: string;
  nama_pembelajaran: string;
  nama_modul: string;
  tipe: 'CaseStudy' | 'Practice' | 'Reading' | 'Video';
  is_group_project?: boolean;
  group_count?: number;
  file_url?: string | null;
  content?: any;
  youtube_link?: string | null;
  published_at?: string | null;
  deadline_at?: string | null;
  group_info?: {
    group_name: string;
    is_leader: boolean;
  } | null;
}

interface Submission {
  id: string;
  uuid_tugas: string;
  tugas?: { title: string; type: string; pembelajaran?: { title: string }; modul?: { title: string } };
  ipynb_url?: string;
  pdf_url?: string;
  student_notes?: string;
  ai_score?: number;
  ai_reason?: string;
  ai_feedback?: any;
  lecture_status?: string;
  mentor_status?: string;
  lecture_notes?: string;
  mentor_notes?: string;
  released_score?: number;
  released_reason?: string;
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

function renderContent(content: any): React.ReactNode {
  if (!content) return null;
  if (typeof content === 'string') return <span>{content}</span>;
  if (content.type === 'doc' && Array.isArray(content.content)) {
    return content.content.map((block: any, idx: number) => {
      if (block.type === 'paragraph' && Array.isArray(block.content)) {
        return (
          <p key={idx} style={{ margin: '0 0 8px 0', lineHeight: 1.6, color: '#e2e8f0' }}>
            {block.content.map((span: any, sIdx: number) => span.text || '')}
          </p>
        );
      }
      if (block.type === 'heading') {
        const level = block.attrs?.level || 2;
        const text = block.content?.map((s: any) => s.text || '').join('');
        return <p key={idx} style={{ fontWeight: 700, fontSize: level <= 2 ? '1rem' : '0.9rem', margin: '10px 0 4px', color: '#f8fafc' }}>{text}</p>;
      }
      if (block.type === 'bulletList' && Array.isArray(block.content)) {
        return (
          <ul key={idx} style={{ paddingLeft: 18, margin: '0 0 8px' }}>
            {block.content.map((item: any, iIdx: number) => (
              <li key={iIdx} style={{ color: '#cbd5e1', lineHeight: 1.6, marginBottom: 4 }}>
                {item.content?.map((p: any) => p.content?.map((s: any) => s.text || '').join('')).join('')}
              </li>
            ))}
          </ul>
        );
      }
      return null;
    });
  }
  return <span style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{JSON.stringify(content, null, 2)}</span>;
}

function TaskQuestionCard({
  task,
  onOpenPreview
}: {
  task: { file_url?: string | null; content?: any; nama_tugas?: string; tipe?: string };
  onOpenPreview: (url: string, title: string) => void;
}) {
  const fileUrl = task.file_url;
  const content = task.content;

  if (!fileUrl && !content) return null;

  const cleanUrl = fileUrl ? fileUrl.split('?')[0].split('#')[0].toLowerCase() : '';
  const urlExt = cleanUrl.match(/\.([a-z0-9]+)$/i)?.[1]?.toUpperCase() || 'PDF';
  const isPDF = urlExt === 'PDF' || cleanUrl.endsWith('.pdf');

  return (
    <div style={{
      marginTop: 16,
      marginBottom: 8,
      padding: '18px 20px',
      borderRadius: 16,
      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
      border: '1px solid rgba(99, 102, 241, 0.22)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }}>
      {content && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={14} color="#818cf8" />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Instruksi & Detail Soal
            </span>
          </div>
          <div style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.6, background: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
            {renderContent(content)}
          </div>
        </div>
      )}

      {fileUrl && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={14} color="#818cf8" />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Berkas Soal Terlampir
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            gap: 16,
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 220 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: isPDF ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                border: `1px solid ${isPDF ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <FileText size={22} color={isPDF ? '#fca5a5' : '#a5b4fc'} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {task.nama_tugas ? `${task.nama_tugas}_Soal.${urlExt.toLowerCase() || 'pdf'}` : 'File_Soal.pdf'}
                </p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: '0.68rem', color: isPDF ? '#fca5a5' : '#93c5fd', background: isPDF ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)', padding: '2px 8px', borderRadius: 4, fontWeight: 700, border: `1px solid ${isPDF ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
                    {urlExt}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    Dokumen Berkas Soal
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => onOpenPreview(fileUrl, task.nama_tugas || 'Soal Penugasan')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.25))',
                  color: '#c7d2fe', border: '1px solid rgba(99, 102, 241, 0.4)',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)'
                }}
              >
                <Eye size={14} /> Pratinjau Soal
              </button>

              <button
                type="button"
                onClick={() => openInNewTab(fileUrl, task.nama_tugas || 'Soal', urlExt)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
                  background: 'rgba(6, 113, 224, 0.15)', color: '#60a5fa',
                  border: '1px solid rgba(6, 113, 224, 0.3)', cursor: 'pointer'
                }}
              >
                <ExternalLink size={14} /> Tab Baru
              </button>

              <button
                type="button"
                onClick={() => downloadFile(fileUrl, task.nama_tugas || 'Soal')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
                  background: 'rgba(16, 185, 129, 0.15)', color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)', cursor: 'pointer'
                }}
              >
                <Download size={14} /> Unduh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskFileViewerModal({
  taskId,
  url,
  title,
  onClose
}: {
  taskId: string;
  url: string;
  title: string;
  onClose: () => void;
}) {
  const [viewMode, setViewMode] = useState<'google' | 'direct'>('google');

  let cleanUrl = url.replace('/upload/fl_attachment/', '/upload/');
  const pathOnly = cleanUrl.split('?')[0].split('#')[0].toLowerCase();
  const extMatch = pathOnly.match(/\.([a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[1] : '';

  const isPDF = ext === 'pdf' || cleanUrl.endsWith('.pdf') || !ext;
  const isDoc = ['docx', 'doc', 'ppt', 'pptx'].includes(ext);
  const isIpynb = ext === 'ipynb' || cleanUrl.endsWith('.ipynb');

  const finalUrl = cleanUrl;
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(finalUrl)}&embedded=true`;
  const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(finalUrl)}`;

  return (
    <Portal>
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(5, 7, 15, 0.88)',
        backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '20px'
      }} onClick={onClose}>
        <div style={{
          width: '100%', maxWidth: '980px', height: '88vh',
          background: '#0f172a', border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '20px', display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7)', overflow: 'hidden'
        }} className="glass-panel" onClick={e => e.stopPropagation()}>
          
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
                  Pratinjau Soal: {title}
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Dokumen Berkas Penugasan
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isPDF && (
                <button
                  onClick={() => setViewMode(v => v === 'google' ? 'direct' : 'google')}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                    background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer'
                  }}
                >
                  Mode Viewer: {viewMode === 'google' ? 'Google' : 'Direct Embed'}
                </button>
              )}

              <button
                onClick={() => openInNewTab(finalUrl, title, ext)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                  background: 'rgba(99, 102, 241, 0.18)', color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.35)', cursor: 'pointer'
                }}
              >
                <ExternalLink size={13} /> Tab Baru
              </button>

              <button
                onClick={() => downloadFile(finalUrl, title)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                  background: 'rgba(16, 185, 129, 0.15)', color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)', cursor: 'pointer'
                }}
              >
                <Download size={13} /> Unduh
              </button>

              <button onClick={onClose} style={s.closeBtn}><X size={20} /></button>
            </div>
          </div>

          <div style={{ flex: 1, background: '#fff', position: 'relative' }}>
            {isPDF ? (
              <iframe
                src={viewMode === 'google' ? googleViewerUrl : finalUrl}
                title={title}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="fullscreen"
              />
            ) : isDoc ? (
              <iframe
                src={officeUrl}
                title={title}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : isIpynb ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0f172a', color: '#f8fafc', padding: 24, textAlign: 'center', gap: 16 }}>
                <FileText size={56} color="#818cf8" />
                <div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>File Jupyter Notebook (.ipynb)</h4>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem', maxWidth: 460 }}>
                    File `.ipynb` adalah format notebook kode. Unduh file ini untuk membukanya di Jupyter Notebook atau Google Colab.
                  </p>
                </div>
                <button
                  onClick={() => downloadFile(finalUrl, `${title}.ipynb`)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 22px', borderRadius: 10, fontSize: '0.9rem', fontWeight: 600,
                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff',
                    border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.4)'
                  }}
                >
                  <Download size={16} /> Unduh Notebook (.ipynb)
                </button>
              </div>
            ) : (
              <iframe
                src={finalUrl}
                title={title}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function PenugasanPage() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<'studycase' | 'quiz'>('studycase');
  const [taskPreviewModal, setTaskPreviewModal] = useState<{ taskId: string; url: string; title: string } | null>(null);

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
        ai_reason: s.ai_reason,
        ai_feedback: s.feedback || s.ai_feedback,
        lecture_status: s.lecture_status,
        mentor_status: s.mentor_status,
        lecture_notes: s.lecture_notes,
        mentor_notes: s.mentor_notes,
        released_score: s.released_score ?? s.score,
        released_reason: s.released_reason ?? s.reason,
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
    const isExpired = !!quiz.deadline && new Date(quiz.deadline) < new Date();
    // Allow opening if it's already attempted (to view rekap)
    const already = myQuizRekap.find((r: any) => (r.uuid_quiz || r.quiz_id) === quiz.id);
    if (isExpired && !already) {
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
              <div style={s.emptyState}><CheckCircle2 size={48} color="#00C853" /><h3>Semua Tugas Selesai</h3><p>Tidak ada studi kasus yang perlu dikumpulkan.</p></div>
            ) : (
              <div style={s.cardList}>
                {tasks.map(task => {
                  const isGroupTask = task.is_group_project;
                  const isLeader = task.group_info?.is_leader === true;
                  const canSubmit = !isGroupTask || isLeader;
                  const noGroupAssigned = isGroupTask && !task.group_info;

                  return (
                  <div key={task.id_tugas} className="glass-panel" style={s.taskCard}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={s.typeBadge}>{task.tipe}</span>
                        <span style={s.courseLabel}>{task.nama_pembelajaran}</span>
                        {isGroupTask && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem',
                            background: 'rgba(123, 97, 255, 0.12)', color: '#7B61FF',
                            border: '1px solid rgba(123, 97, 255, 0.2)'
                          }}>
                            <Users size={10} /> Kelompok
                          </span>
                        )}
                        {isGroupTask && task.group_info && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem',
                            background: isLeader ? 'rgba(255,193,7,0.12)' : 'rgba(255,255,255,0.06)',
                            color: isLeader ? '#FFC107' : 'var(--grey-blue)',
                            border: `1px solid ${isLeader ? 'rgba(255,193,7,0.2)' : 'rgba(255,255,255,0.1)'}`
                          }}>
                            {isLeader ? <Crown size={10} /> : <Users size={10} />}
                            {task.group_info.group_name} {isLeader ? '(Ketua)' : '(Anggota)'}
                          </span>
                        )}
                      </div>
                      <h3 style={s.taskTitle}>{task.nama_tugas}</h3>
                      <p style={s.taskMeta}>Modul: {task.nama_modul}</p>
                      {/* Tanggal Publish & Deadline */}
                      {(task.published_at || task.deadline_at) && (
                        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                          {task.published_at && (
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '5px 12px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600,
                              background: 'rgba(16, 185, 129, 0.1)', color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.25)'
                            }}>
                              <Calendar size={11} />
                              <span>Mulai: {new Date(task.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                          )}
                          {task.deadline_at && (() => {
                            const now = new Date();
                            const dl = new Date(task.deadline_at!);
                            const diffMs = dl.getTime() - now.getTime();
                            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                            const isExpired = diffMs < 0;
                            const isUrgent = !isExpired && diffDays <= 3;
                            return (
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '5px 12px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600,
                                background: isExpired ? 'rgba(239, 68, 68, 0.08)' : isUrgent ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: isExpired ? '#f87171' : isUrgent ? '#fbbf24' : '#fca5a5',
                                border: `1px solid ${isExpired ? 'rgba(239,68,68,0.2)' : isUrgent ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.2)'}`,
                              }}>
                                <Clock size={11} />
                                <span>
                                  Deadline: {dl.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  {isExpired ? ' (Kedaluwarsa)' : isUrgent ? ` (${diffDays} hari lagi)` : ''}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      <TaskQuestionCard task={task} onOpenPreview={(url, title) => setTaskPreviewModal({ taskId: task.id_tugas, url, title })} />
                      {isGroupTask && !task.group_info && (
                        <p style={{ fontSize: '0.78rem', color: '#FFB240', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertCircle size={12} /> Anda belum ditugaskan ke kelompok manapun untuk tugas ini.
                        </p>
                      )}
                      {isGroupTask && task.group_info && !isLeader && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--grey-blue)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Lock size={12} /> Hanya ketua kelompok yang dapat mengumpulkan tugas ini.
                        </p>
                      )}
                    </div>
                    {canSubmit && !noGroupAssigned ? (
                      <button onClick={() => { setUploadTask(task); setIpynbFile(null); setPdfFile(null); setNotes(''); setSubmitError(null); setSubmitSuccess(false); }} style={s.btnUpload}>
                        <Upload size={14} /><span>Kumpulkan Tugas</span>
                      </button>
                    ) : noGroupAssigned ? (
                      <button disabled style={{ ...s.btnUpload, opacity: 0.4, cursor: 'not-allowed', background: 'rgba(255,255,255,0.05)' }}>
                        <AlertCircle size={14} /><span>Belum Ada Kelompok</span>
                      </button>
                    ) : (
                      <button disabled style={{ ...s.btnUpload, opacity: 0.4, cursor: 'not-allowed', background: 'rgba(255,255,255,0.05)' }}>
                        <Lock size={14} /><span>Hanya Ketua</span>
                      </button>
                    )}
                  </div>
                  );
                })}
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
                          {sub.is_released ? 'Nilai Dirilis' : 'Proses Verifikasi'}
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
                            {(sub.lecture_status === 'Verified' || sub.mentor_status === 'Verified') ? 'Diverifikasi' : 'Pending'}
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
              <div style={s.emptyState}><CheckCircle2 size={48} color="#00C853" /><h3>Semua Kuis Selesai</h3><p>Tidak ada kuis yang belum dikerjakan.</p></div>
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
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 14px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700,
                          background: 'rgba(0,200,83,0.08)', color: '#00C853',
                          border: '1px solid rgba(0,200,83,0.2)'
                        }}>
                          <Lock size={12} /> Terkunci (1x)
                        </div>
                      </div>
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
            <div style={{ ...s.modal, maxWidth: 540, padding: '24px', borderRadius: '16px', overflowY: 'auto' }} className="glass-panel">
            <div style={{ ...s.modalHead, paddingBottom: 16, borderBottom: '1px solid var(--border-color)', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Kumpulkan Tugas Studi Kasus</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--azure)' }}>{uploadTask.nama_tugas}</p>
              </div>
              <button onClick={() => setUploadTask(null)} style={s.closeBtn}><X size={18} /></button>
            </div>
            <div>
              {submitError && <div style={{ ...s.errorBanner, marginBottom: 16 }}><AlertCircle size={15} /><span>{submitError}</span></div>}
              {!submitSuccess && uploadTask?.is_group_project && uploadTask.group_info?.is_leader && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 16px', borderRadius: 10, marginBottom: 16,
                  background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.25)'
                }}>
                  <Crown size={18} color="#FFC107" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700, color: '#FFC107' }}>
                      Status: Ketua {uploadTask.group_info.group_name}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--grey-blue)', lineHeight: 1.4 }}>
                      File yang kamu kumpulkan akan diproses oleh AI dan nilainya otomatis didistribusikan ke seluruh anggota kelompok.
                    </p>
                  </div>
                </div>
              )}
              {uploadTask && (
                <TaskQuestionCard task={uploadTask} onOpenPreview={(url, title) => setTaskPreviewModal({ taskId: uploadTask.id_tugas, url, title })} />
              )}
              {submitSuccess ? (
                <div style={s.successBox}>
                  <CheckCircle2 size={44} color="#00C853" />
                  <strong style={{ color: '#fff', marginTop: 12, fontSize: '1.05rem' }}>Berhasil Dikumpulkan!</strong>
                  <span style={{ fontSize: '0.84rem', color: 'var(--grey-blue)', marginTop: 4 }}>Sistem sedang menganalisis & menilai kode notebook Anda dengan AI...</span>
                </div>
              ) : (
                <form onSubmit={handleSubmitSc} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={s.fg}>
                    <label style={s.label}>1. File Jupyter Notebook (.ipynb) <span style={{ color: '#FF5252' }}>*</span></label>
                    <div style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: ipynbFile ? 'rgba(6, 113, 224, 0.08)' : '#18181b',
                      border: ipynbFile ? '1px solid var(--azure)' : '1px dashed var(--border-color)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}>
                      <FileText size={20} color={ipynbFile ? 'var(--azure)' : 'var(--grey-blue)'} />
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
                          cursor: 'pointer',
                          zIndex: 10
                        }} 
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: ipynbFile ? '#fff' : 'var(--grey-blue)' }}>
                          {ipynbFile ? ipynbFile.name : 'Klik atau seret file .ipynb di sini'}
                        </span>
                        {ipynbFile && <span style={{ fontSize: '0.74rem', color: 'var(--azure)', marginTop: 2 }}>{Math.round(ipynbFile.size / 1024)} KB</span>}
                      </div>
                      <Upload size={16} color="var(--grey-blue)" />
                    </div>
                  </div>

                  <div style={s.fg}>
                    <label style={s.label}>2. File Laporan (.pdf) <span style={{ color: '#FF5252' }}>*</span></label>
                    <div style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: pdfFile ? 'rgba(6, 113, 224, 0.08)' : '#18181b',
                      border: pdfFile ? '1px solid var(--azure)' : '1px dashed var(--border-color)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}>
                      <FileText size={20} color={pdfFile ? 'var(--azure)' : 'var(--grey-blue)'} />
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
                          cursor: 'pointer',
                          zIndex: 10
                        }} 
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: pdfFile ? '#fff' : 'var(--grey-blue)' }}>
                          {pdfFile ? pdfFile.name : 'Klik atau seret file .pdf di sini'}
                        </span>
                        {pdfFile && <span style={{ fontSize: '0.74rem', color: 'var(--azure)', marginTop: 2 }}>{Math.round(pdfFile.size / 1024)} KB</span>}
                      </div>
                      <Upload size={16} color="var(--grey-blue)" />
                    </div>
                  </div>

                  <div style={s.fg}>
                    <label style={s.label}>Catatan Tambahan (Opsional)</label>
                    <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tuliskan catatan penjelasan pengerjaan..." style={s.textarea} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border-color)', paddingTop: 18, marginTop: 6 }}>
                    <button type="button" onClick={() => setUploadTask(null)} style={s.btnGhost}>Batal</button>
                    <button type="submit" disabled={submitting} style={s.btnPrimary}>
                      {submitting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /><span>Mengirim & Menilai AI...</span></> : <><Upload size={15} /><span>Kirim Sekarang</span></>}
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
          <div style={s.overlay} onClick={() => setSelectedSub(null)}>
            <div
              style={{
                ...s.modal,
                maxWidth: 580,
                padding: '24px',
                borderRadius: '16px',
                backgroundColor: 'rgba(21, 21, 23, 0.95)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
                maxHeight: '85vh',
                overflowY: 'auto',
              }}
              className="glass-panel"
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 700, lineHeight: 1.3 }}>
                    {selectedSub.tugas?.title || (selectedSub.tugas as any)?.nama_tugas || 'Detail Pengumpulan Studi Kasus'}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--azure)', marginTop: 4, display: 'inline-block' }}>
                    {selectedSub.tugas?.pembelajaran?.title || (selectedSub.tugas as any)?.nama_pembelajaran || 'Studi Kasus'} {selectedSub.tugas?.modul?.title ? `• Modul: ${selectedSub.tugas.modul.title}` : ''}
                  </span>
                </div>
                <button onClick={() => setSelectedSub(null)} style={s.closeBtn}><X size={18} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Header Status & Score Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '12px 14px' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--grey-blue)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Verifikasi</span>
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontSize: '0.84rem', fontWeight: 700,
                        color: selectedSub.is_released ? '#00C853' : '#FFB240',
                      }}>
                        {selectedSub.is_released ? 'Diverifikasi & Dirilis' : 'Menunggu Verifikasi'}
                      </span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(6,113,224,0.06)', border: '1px solid rgba(6,113,224,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--azure)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nilai Akhir</span>
                    <div style={{ marginTop: 4, fontSize: '1.4rem', fontWeight: 800, color: selectedSub.is_released ? 'var(--azure)' : 'var(--grey-blue)' }}>
                      {selectedSub.released_score ?? (selectedSub.is_released ? 0 : '-')}
                      {selectedSub.ai_score !== undefined && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--grey-blue)', fontWeight: 500, marginLeft: 8 }}>
                          (Skor AI: {selectedSub.ai_score})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Feedback Lecturer / Dosen */}
                {selectedSub.lecture_notes && (
                  <div style={{ background: 'rgba(6, 113, 224, 0.08)', border: '1px solid rgba(6, 113, 224, 0.25)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <FileText size={16} color="var(--azure)" />
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff' }}>Catatan & Umpan Balik Dosen (Lecturer)</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#E2E8F0', lineHeight: 1.5 }}>
                      {selectedSub.lecture_notes}
                    </p>
                  </div>
                )}

                {/* Feedback Tentor / Mentor */}
                {selectedSub.mentor_notes && (
                  <div style={{ background: 'rgba(123, 97, 255, 0.08)', border: '1px solid rgba(123, 97, 255, 0.25)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Users size={16} color="#7B61FF" />
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff' }}>Catatan & Umpan Balik Tentor (Mentor)</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#E2E8F0', lineHeight: 1.5 }}>
                      {selectedSub.mentor_notes}
                    </p>
                  </div>
                )}

                {/* Alasan Perubahan Nilai */}
                {selectedSub.released_reason && (
                  <div style={{ background: 'rgba(255, 193, 7, 0.06)', border: '1px solid rgba(255, 193, 7, 0.2)', borderRadius: 10, padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFC107', display: 'block', marginBottom: 4 }}>
                      Alasan / Catatan Penilaian
                    </span>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#CBD5E1', lineHeight: 1.4 }}>
                      {selectedSub.released_reason}
                    </p>
                  </div>
                )}

                {/* Analisis AI */}
                {selectedSub.ai_reason && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--grey-blue)', display: 'block', marginBottom: 4 }}>
                      Analisis Otomatis AI
                    </span>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--grey-blue)', lineHeight: 1.4 }}>
                      {selectedSub.ai_reason}
                    </p>
                  </div>
                )}

                {/* Catatan Siswa */}
                {selectedSub.student_notes && (
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--grey-blue)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Catatan Pengumpulan Anda:
                    </span>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: '#CBD5E1', fontStyle: 'italic' }}>
                      "{selectedSub.student_notes}"
                    </div>
                  </div>
                )}

                {/* File Uploaded Links */}
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--grey-blue)', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                    File Terlampir:
                  </span>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {selectedSub.ipynb_url && (
                      <button
                        type="button"
                        onClick={() => downloadFile(selectedSub.ipynb_url!, 'Pengerjaan_Notebook.ipynb')}
                        style={s.attachLink}
                      >
                        <Download size={14} /><span>Unduh Notebook (.ipynb)</span>
                      </button>
                    )}
                    {selectedSub.pdf_url && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setTaskPreviewModal({ taskId: selectedSub.uuid_tugas, url: selectedSub.pdf_url!, title: selectedSub.tugas?.title || 'Laporan Submission' })}
                          style={s.attachLink}
                        >
                          <Eye size={14} /><span>Pratinjau Laporan (.pdf)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadFile(selectedSub.pdf_url!, 'Laporan_Penugasan.pdf')}
                          style={s.attachLink}
                        >
                          <Download size={14} /><span>Unduh Laporan (.pdf)</span>
                        </button>
                      </div>
                    )}
                  </div>
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

      {taskPreviewModal && (
        <TaskFileViewerModal
          taskId={taskPreviewModal.taskId}
          url={taskPreviewModal.url}
          title={taskPreviewModal.title}
          onClose={() => setTaskPreviewModal(null)}
        />
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
