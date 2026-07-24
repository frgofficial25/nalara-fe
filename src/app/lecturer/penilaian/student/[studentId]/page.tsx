'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import {
  ArrowLeft, Loader2, AlertCircle, Brain, XCircle,
  BookOpen, User, ChevronRight, Award, Calendar, Check, BookOpenCheck
} from 'lucide-react';

function getAuth() {
  const token = getStoredToken();
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) headers['x-api-key'] = apiKey;
  else if (token) headers['x-api-key'] = token;
  return { token: token || undefined, headers };
}

interface AnswerItem {
  uuid_question: string;
  question_text: string;
  description?: string;
  image_url?: string;
  type: string;
  submitted_answer: any;
  is_correct: boolean;
  correct_answer: any[];
  explanation?: string;
}

interface QuizAttempt {
  uuid_attempt: string;
  uuid_quiz: string;
  score: number;
  is_passed: boolean;
  completed_at?: string;
  started_at?: string;
  answers: AnswerItem[] | string | any;
  quiz?: { title?: string; nama_quiz?: string; description?: string; uuid_pembelajaran?: string; asal_pembelajaran?: string };
}

function AnswerCard({ item, idx }: { item: AnswerItem; idx: number }) {
  const correctIds: string[] = Array.isArray(item.correct_answer)
    ? item.correct_answer.map((c: any) => String(c.id ?? c).trim().toLowerCase())
    : [];
  const noAnswer = item.submitted_answer === null || item.submitted_answer === undefined;
  const submittedIds: string[] = noAnswer
    ? []
    : Array.isArray(item.submitted_answer)
      ? item.submitted_answer.map((s: any) => String(s).trim().toLowerCase())
      : [String(item.submitted_answer).trim().toLowerCase()];

  const allOptionMap = new Map<string, { id: string; text: string }>();
  if (Array.isArray(item.correct_answer)) {
    item.correct_answer.forEach((c: any) => {
      if (c.id != null) allOptionMap.set(String(c.id).trim().toLowerCase(), { id: String(c.id), text: c.text || String(c.id) });
    });
  }
  submittedIds.forEach(sid => { if (!allOptionMap.has(sid)) allOptionMap.set(sid, { id: sid, text: sid }); });
  const mergedOptions = Array.from(allOptionMap.values());
  const hasOptions = mergedOptions.length > 0 && item.type !== 'Essay';

  return (
    <div style={{
      borderRadius: 16,
      border: `1px solid ${item.is_correct ? 'rgba(0,200,83,0.3)' : 'rgba(255,82,82,0.3)'}`,
      background: 'rgba(255,255,255,0.02)',
      padding: '1.5rem',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: item.is_correct ? 'rgba(0,200,83,0.15)' : 'rgba(255,82,82,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: item.is_correct ? '#00C853' : '#FF5252', fontWeight: 800, fontSize: '0.85rem',
        }}>
          {idx + 1}
        </div>
        <p style={{ flex: 1, margin: 0, fontSize: '1rem', color: '#E2E8F0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {item.question_text}
        </p>
        <span style={{
          flexShrink: 0, fontSize: '0.75rem', padding: '4px 12px', borderRadius: 20, fontWeight: 700,
          background: item.is_correct ? 'rgba(0,200,83,0.12)' : 'rgba(255,82,82,0.12)',
          color: item.is_correct ? '#00C853' : '#FF5252',
        }}>
          {item.is_correct ? '✓ Benar' : '✗ Salah'}
        </span>
      </div>

      {item.description && (
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: 8, fontSize: '0.9rem', color: '#CBD5E0', whiteSpace: 'pre-wrap', fontFamily: /[{};()=>]/.test(item.description) ? 'monospace' : 'inherit' }}>
          {item.description}
        </div>
      )}

      {item.image_url && (
        <div style={{ display: 'flex' }}>
          <img src={item.image_url} alt="Gambar Soal" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8, objectFit: 'contain' }} />
        </div>
      )}

      {hasOptions && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {mergedOptions.map(opt => {
            const optIdLower = String(opt.id).trim().toLowerCase();
            const isCorrectOpt = correctIds.includes(optIdLower);
            const isSubmittedOpt = submittedIds.includes(optIdLower);
            let border = '1px solid rgba(255,255,255,0.06)';
            let bg = 'rgba(255,255,255,0.01)';
            let textColor = 'var(--grey-blue)';
            if (isCorrectOpt) { border = '1px solid rgba(0,200,83,0.35)'; bg = 'rgba(0,200,83,0.07)'; textColor = '#00C853'; }
            if (isSubmittedOpt && !isCorrectOpt) { border = '1px solid rgba(255,82,82,0.35)'; bg = 'rgba(255,82,82,0.07)'; textColor = '#FF5252'; }
            return (
              <div key={opt.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, border, background: bg, color: textColor }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSubmittedOpt ? (isCorrectOpt ? '#00C853' : '#FF5252') : (isCorrectOpt ? 'rgba(0,200,83,0.2)' : 'rgba(255,255,255,0.06)'), color: isSubmittedOpt ? '#fff' : (isCorrectOpt ? '#00C853' : 'var(--grey-blue)'), fontSize: '0.72rem', fontWeight: 800 }}>
                  {item.type === 'TrueFalse' ? '' : opt.id.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.9rem', flex: 1, whiteSpace: 'pre-wrap', fontFamily: /[{};()=>]/.test(opt.text) ? 'monospace' : 'inherit' }}>
                  {opt.text}
                </span>
                {isCorrectOpt && !isSubmittedOpt && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#00C853', flexShrink: 0 }}>(Kunci)</span>}
                {isSubmittedOpt && isCorrectOpt && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#00C853', flexShrink: 0 }}>✓ Benar</span>}
                {isSubmittedOpt && !isCorrectOpt && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FF5252', flexShrink: 0 }}>✗ Salah</span>}
              </div>
            );
          })}
        </div>
      )}

      {item.type === 'Essay' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 10 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--grey)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Jawaban Student</div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: noAnswer ? 'var(--grey)' : (item.is_correct ? '#00E676' : '#FF5252'), whiteSpace: 'pre-wrap' }}>
              {noAnswer ? 'Tidak dijawab' : String(item.submitted_answer)}
            </p>
          </div>
          <div style={{ background: 'rgba(0,200,83,0.05)', padding: '12px 14px', borderRadius: 10 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--grey)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Jawaban Benar</div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#00E676', whiteSpace: 'pre-wrap' }}>
              {Array.isArray(item.correct_answer) ? item.correct_answer.map((c: any) => c.text || c.id).join(', ') : '-'}
            </p>
          </div>
        </div>
      )}

      {item.explanation && (
        <div style={{ borderLeft: '3px solid var(--azure)', background: 'rgba(65,150,240,0.07)', padding: '10px 14px', borderRadius: '0 8px 8px 0' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--azure)', marginBottom: 4, textTransform: 'uppercase' }}>Pembahasan</div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#CBD5E0', whiteSpace: 'pre-wrap' }}>{item.explanation}</p>
        </div>
      )}
    </div>
  );
}

function StudentRecapContent() {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();

  let studentId = (routeParams?.studentId as string) || '';
  if ((!studentId || studentId === 'undefined') && typeof window !== 'undefined') {
    const segments = window.location.pathname.split('/');
    const studentIdx = segments.indexOf('student');
    if (studentIdx !== -1 && segments[studentIdx + 1]) {
      studentId = segments[studentIdx + 1];
    } else {
      studentId = segments[segments.length - 1] || '';
    }
  }

  const studentName = searchParams.get('name') || 'Student';
  const studentEmail = searchParams.get('email') || '';
  const courseIdParam = searchParams.get('courseId') || 'all';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<QuizAttempt[]>([]);
  const [selectedQuizAttempt, setSelectedQuizAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    if (!studentId || studentId === 'undefined') return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const auth = getAuth();
        
        // Selalu ambil seluruh kuis dari kelas manapun agar kuis tidak lulus di kelas lain juga tampil
        const url = `/api/students/${studentId}/quiz-rekap`;
        const res = await apiGet<any>(url, { token: auth.token, headers: auth.headers });
        const dataList: any[] = Array.isArray(res) ? res : (res?.data || []);

        const mapped: QuizAttempt[] = dataList.map((item: any) => ({
          uuid_attempt: item.uuid_attempt,
          uuid_quiz: item.uuid_quiz,
          score: item.score ?? item.skor ?? 0,
          is_passed: item.is_passed ?? (item.score >= 75),
          completed_at: item.completed_at || item.updated_at,
          started_at: item.started_at || item.created_at,
          answers: item.answers || [],
          quiz: {
            title: item.quiz_title || item.quiz?.title || item.quiz?.nama_quiz || 'Kuis',
            nama_quiz: item.quiz?.nama_quiz || item.quiz?.title || 'Kuis',
            description: item.quiz?.description || item.quiz?.deskripsi || '',
            uuid_pembelajaran: courseIdParam !== 'all' ? courseIdParam : undefined,
            asal_pembelajaran: 'Kuis'
          }
        }));

        mapped.sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime());
        setQuizzes(mapped);
      } catch (e: any) {
        setError(e.message || 'Gagal memuat riwayat kuis.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId, courseIdParam]);

  const totalPassed = quizzes.filter(q => q.is_passed).length;
  const avgScore = quizzes.length > 0 ? Math.round(quizzes.reduce((s, q) => s + (q.score || 0), 0) / quizzes.length) : 0;

  if (selectedQuizAttempt) {
    let answers: AnswerItem[] = [];
    if (selectedQuizAttempt.answers) {
      if (typeof selectedQuizAttempt.answers === 'string') {
        try { const p = JSON.parse(selectedQuizAttempt.answers); answers = Array.isArray(p) ? p : (p.answers || []); } catch {}
      } else if (Array.isArray(selectedQuizAttempt.answers)) {
        answers = selectedQuizAttempt.answers as AnswerItem[];
      }
    }

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          
          <button
            type="button"
            onClick={() => setSelectedQuizAttempt(null)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 18px', color: '#E2E8F0', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', marginBottom: '2rem' }}
          >
            <ArrowLeft size={16} /> Kembali ke Daftar Kuis
          </button>

          <div style={{ borderRadius: 20, border: '1px solid rgba(255,168,38,0.2)', background: 'rgba(255,168,38,0.03)', padding: '1.5rem 2rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <span style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#FFA826', background: 'rgba(255,168,38,0.1)', padding: '6px 12px', borderRadius: '20px', marginBottom: '0.8rem' }}>Pembahasan Kuis</span>
                <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{selectedQuizAttempt.quiz?.title}</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--grey-blue)' }}>Siswa: {studentName} ({studentEmail})</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: selectedQuizAttempt.is_passed ? '#00C853' : '#FF5252' }}>{selectedQuizAttempt.score}%</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--grey-blue)', fontWeight: 600, textTransform: 'uppercase' }}>Skor Akhir</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {answers.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--grey-blue)', textAlign: 'center', padding: '2rem 0' }}>Detail jawaban tidak tersedia.</p>
            ) : (
              answers.map((item, idx) => <AnswerCard key={item.uuid_question || idx} item={item} idx={idx} />)
            )}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <button
          type="button"
          onClick={() => router.back()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 18px', color: '#E2E8F0', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', marginBottom: '2rem' }}
        >
          <ArrowLeft size={16} /> Kembali ke Penilaian
        </button>

        <div style={{ borderRadius: 20, border: '1px solid rgba(65,150,240,0.2)', background: 'rgba(65,150,240,0.05)', padding: '1.5rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, rgba(65,150,240,0.3), rgba(65,150,240,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={26} color="var(--azure)" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{studentName}</h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--grey-blue)' }}>{studentEmail}</p>
          </div>
          {!loading && quizzes.length > 0 && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { val: quizzes.length, label: 'Kuis Selesai', color: 'var(--azure)', bg: 'rgba(65,150,240,0.08)' },
                { val: totalPassed, label: 'Lulus', color: '#00C853', bg: 'rgba(0,200,83,0.06)' },
                { val: `${avgScore}%`, label: 'Rata-rata', color: avgScore >= 75 ? 'var(--azure)' : '#FF5252', bg: 'rgba(255,255,255,0.04)' },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center', background: stat.bg, borderRadius: 12, padding: '10px 18px', minWidth: 80 }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stat.color }}>{stat.val}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--grey-blue)', textTransform: 'uppercase', fontWeight: 600 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: 16 }}>
            <Loader2 size={40} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--grey-blue)', margin: 0 }}>Memuat daftar kuis student...</p>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: 12 }}>
            <AlertCircle size={40} color="#FF5252" />
            <p style={{ color: '#FF5252', margin: 0 }}>{error}</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: 16 }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpenCheck size={32} color="var(--grey-blue)" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '1.1rem' }}>Belum Ada Kuis Selesai</h3>
              <p style={{ color: 'var(--grey-blue)', margin: 0, fontSize: '0.9rem' }}>Student ini belum menyelesaikan kuis apapun di kelas ini.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Brain size={18} color="var(--azure)" />
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                Kuis yang Sudah Dikerjakan ({quizzes.length})
              </h2>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--grey-blue)' }}>
              Klik tombol Lihat Jawaban di samping kanan kuis untuk meninjau detail jawaban kuis student.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {quizzes.map((quiz) => (
                <div key={quiz.uuid_attempt} className="glass-panel" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  padding: '1.25rem 1.5rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.015)'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <Brain size={14} color="var(--azure)" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--grey-blue)' }}>{quiz.quiz?.asal_pembelajaran || 'Kuis'}</span>
                      <span style={{
                        fontSize: '0.72rem', padding: '3px 10px', borderRadius: 12, fontWeight: 700,
                        background: quiz.is_passed ? 'rgba(0,200,83,0.12)' : 'rgba(255,82,82,0.12)',
                        color: quiz.is_passed ? '#00C853' : '#FF5252'
                      }}>{quiz.is_passed ? 'Lulus' : 'Tidak Lulus'}</span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{quiz.quiz?.title}</h3>
                    <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: '0.76rem', color: 'var(--grey-blue)' }}>
                      <span>Skor: <strong style={{ color: quiz.is_passed ? '#00E676' : '#FF5252' }}>{quiz.score}%</strong></span>
                      {quiz.completed_at && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={11} /> {new Date(quiz.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedQuizAttempt(quiz)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700,
                      background: 'rgba(6,113,224,0.1)', color: 'var(--azure)',
                      border: '1px solid rgba(6,113,224,0.3)', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Award size={13} />
                    <span>Lihat Jawaban</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function StudentRecapPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} color="var(--azure)" />
      </div>
    }>
      <StudentRecapContent />
    </Suspense>
  );
}
