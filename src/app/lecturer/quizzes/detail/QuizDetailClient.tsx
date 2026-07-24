'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Brain, BookOpen, Clock, Calendar, FileQuestion,
  CheckCircle, XCircle, ChevronDown, ChevronUp, Eye,
  Loader2, AlertCircle, Globe, Lock
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

interface QuizOption {
  id: string;
  text: string;
  is_correct: boolean;
}

interface QuizQuestion {
  uuid_question: string;
  question_text: string;
  description?: string;
  image_url?: string;
  explanation?: string;
  type: 'MultipleChoice' | 'TrueFalse' | 'Checkbox';
  options: QuizOption[];
  stats?: { benar: number; salah: number; tidak_menjawab: number };
}

interface QuizDetail {
  uuid_quiz: string;
  title: string;
  description?: string;
  time_limit?: number;
  deadline?: string;
  is_published: boolean;
  uuid_pembelajaran: string;
  uuid_modul?: string;
  pembelajaran?: { title: string };
  modul?: { title: string };
  questions: QuizQuestion[];
}

function getAuthHeaders() {
  const token = getStoredToken();
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) headers['x-api-key'] = apiKey;
  else if (token) headers['x-api-key'] = token;
  return { token: token || undefined, headers };
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return iso; }
}

function typeLabel(type: string) {
  if (type === 'MultipleChoice') return 'Pilihan Ganda';
  if (type === 'TrueFalse') return 'Benar / Salah';
  return 'Multi Jawaban';
}

function typeColor(type: string) {
  if (type === 'Checkbox') return { bg: 'rgba(224,64,251,0.1)', text: '#E040FB', border: 'rgba(224,64,251,0.2)' };
  if (type === 'TrueFalse') return { bg: 'rgba(0,200,83,0.1)', text: '#00C853', border: 'rgba(0,200,83,0.2)' };
  return { bg: 'rgba(65,150,240,0.1)', text: 'var(--azure)', border: 'rgba(65,150,240,0.2)' };
}

export default function QuizDetailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const quizId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [showAllAnswers, setShowAllAnswers] = useState(false);

  useEffect(() => {
    if (!quizId) { setError('Quiz ID tidak ditemukan di URL'); setLoading(false); return; }

    (async () => {
      try {
        setLoading(true);
        const auth = getAuthHeaders();
        const res = await apiGet<any>(`/api/quiz/${quizId}`, { token: auth.token, headers: auth.headers });
        const d = res.data || res;

        const mapped: QuizDetail = {
          uuid_quiz: d.uuid_quiz || d.id || quizId,
          title: d.nama_quiz || d.title || 'Kuis',
          description: d.deskripsi || d.description || '',
          time_limit: d.waktu_pengerjaan || d.time_limit,
          deadline: d.tenggat_pengerjaan || d.deadline,
          is_published: d.is_published ?? false,
          uuid_pembelajaran: d.uuid_pembelajaran || '',
          uuid_modul: d.uuid_modul,
          pembelajaran: d.pembelajaran,
          modul: d.modul,
          questions: (d.daftar_soal || d.questions || []).map((q: any) => ({
            uuid_question: q.uuid_question || q.id,
            question_text: q.detail_soal || q.question_text || '',
            description: q.description || undefined,
            image_url: q.image_url || undefined,
            explanation: q.explanation || undefined,
            type: q.tipe_soal || q.type || 'MultipleChoice',
            options: (q.opsi_jawaban || q.options || []).map((o: any) => ({
              id: o.id || '',
              text: o.text || o.option_text || '',
              is_correct: !!o.is_correct,
            })),
            stats: q.stats || undefined,
          })),
        };
        setQuiz(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat detail kuis');
      } finally {
        setLoading(false);
      }
    })();
  }, [quizId]);

  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllExpanded = () => {
    if (!quiz) return;
    if (expandedQuestions.size === quiz.questions.length) {
      setExpandedQuestions(new Set());
    } else {
      setExpandedQuestions(new Set(quiz.questions.map(q => q.uuid_question)));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <Loader2 size={40} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--grey-blue)' }}>Memuat detail kuis...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <AlertCircle size={40} color="#FF5252" />
        <span style={{ color: '#FF5252', fontWeight: 600 }}>{error || 'Kuis tidak ditemukan'}</span>
        <button onClick={() => router.push('/lecturer/evaluasi')} style={s.backBtn}>
          <ArrowLeft size={16} /> Kembali ke Quiz Bank
        </button>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const allExpanded = expandedQuestions.size === quiz.questions.length && quiz.questions.length > 0;

  return (
    <div style={s.container}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Top Bar */}
      <div style={s.topBar}>
        <button onClick={() => router.push('/lecturer/evaluasi')} style={s.backBtn}>
          <ArrowLeft size={16} />
          <span>Quiz Bank</span>
        </button>
        <button
          onClick={() => setShowAllAnswers(v => !v)}
          style={{
            ...s.toggleBtn,
            background: showAllAnswers ? 'rgba(0,200,83,0.12)' : 'rgba(255,255,255,0.04)',
            borderColor: showAllAnswers ? 'rgba(0,200,83,0.3)' : 'var(--border-color)',
            color: showAllAnswers ? '#00C853' : 'var(--grey-blue)'
          }}
        >
          <Eye size={14} />
          <span>{showAllAnswers ? 'Sembunyikan Kunci Jawaban' : 'Tampilkan Kunci Jawaban'}</span>
        </button>
      </div>

      {/* Quiz Info Card */}
      <div className="glass-panel" style={s.infoCard}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, var(--azure), #B388FF)', borderRadius: '12px 12px 0 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={s.iconWrap}>
                <Brain size={18} color="var(--lemon)" />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--grey-blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Detail Kuis
              </span>
            </div>
            <h1 style={s.quizTitle}>{quiz.title}</h1>
            {quiz.description && (
              <p style={s.quizDesc}>{quiz.description}</p>
            )}
          </div>

          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 12, fontWeight: 700, fontSize: '0.8rem',
            background: quiz.is_published ? 'rgba(0,200,83,0.12)' : 'rgba(255,168,38,0.1)',
            color: quiz.is_published ? '#00C853' : 'var(--lemon)',
            border: `1px solid ${quiz.is_published ? 'rgba(0,200,83,0.25)' : 'rgba(255,168,38,0.25)'}`,
            flexShrink: 0,
          }}>
            {quiz.is_published ? <Globe size={13} /> : <Lock size={13} />}
            {quiz.is_published ? 'Published' : 'Draft'}
          </span>
        </div>

        <div style={s.metaGrid}>
          {(quiz.pembelajaran?.title || quiz.uuid_pembelajaran) && (
            <MetaItem icon={<BookOpen size={16} color="var(--azure)" />} label="Kelas" value={quiz.pembelajaran?.title || quiz.uuid_pembelajaran} />
          )}
          {quiz.modul?.title && (
            <MetaItem icon={<FileQuestion size={16} color="#B388FF" />} label="Modul" value={quiz.modul.title} />
          )}
          {quiz.time_limit && (
            <MetaItem icon={<Clock size={16} color="#FF9100" />} label="Waktu Pengerjaan" value={`${quiz.time_limit} Menit`} />
          )}
          {quiz.deadline && (
            <MetaItem icon={<Calendar size={16} color="#FF5252" />} label="Deadline" value={fmtDate(quiz.deadline)} />
          )}
          <MetaItem icon={<Brain size={16} color="var(--lemon)" />} label="Total Soal" value={`${quiz.questions.length} Soal`} />
        </div>
      </div>

      {/* Questions Section */}
      <div style={s.questionsSection}>
        <div style={s.questionsSectionHeader}>
          <div>
            <h2 style={s.sectionTitle}>Daftar Soal</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--grey-blue)' }}>
              {quiz.questions.length} soal tersedia
            </span>
          </div>
          <button onClick={toggleAllExpanded} style={s.toggleBtn}>
            {allExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{allExpanded ? 'Tutup Semua' : 'Buka Semua'}</span>
          </button>
        </div>

        {quiz.questions.length === 0 ? (
          <div style={s.emptyQuestions}>
            <FileQuestion size={40} color="var(--grey)" />
            <p style={{ color: 'var(--grey-blue)', marginTop: 12, margin: '12px 0 0' }}>Kuis ini belum memiliki soal.</p>
          </div>
        ) : (
          <div style={s.questionList}>
            {quiz.questions.map((q, idx) => {
              const isExpanded = expandedQuestions.has(q.uuid_question);
              const colors = typeColor(q.type);
              const correctCount = q.options.filter(o => o.is_correct).length;
              return (
                <div key={q.uuid_question} className="glass-panel" style={s.questionCard}>
                  <div style={s.questionHeader} onClick={() => toggleQuestion(q.uuid_question)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
                      <div style={s.qNumber}>{idx + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                            padding: '3px 8px', borderRadius: 6,
                            background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`
                          }}>
                            {typeLabel(q.type)}
                          </span>
                        </div>
                        <p style={s.questionText}>{q.question_text}</p>

                        {/* Stats Analytics */}
                        {q.stats ? (
                          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '0.71rem', fontWeight: 700, color: '#00C853',
                              background: 'rgba(0,200,83,0.1)', padding: '3px 10px', borderRadius: 20,
                              border: '1px solid rgba(0,200,83,0.25)', display: 'inline-flex', alignItems: 'center', gap: 5
                            }}>
                              <CheckCircle size={10} /> Benar: {q.stats.benar}
                            </span>
                            <span style={{
                              fontSize: '0.71rem', fontWeight: 700, color: '#FF5252',
                              background: 'rgba(255,82,82,0.1)', padding: '3px 10px', borderRadius: 20,
                              border: '1px solid rgba(255,82,82,0.25)', display: 'inline-flex', alignItems: 'center', gap: 5
                            }}>
                              <XCircle size={10} /> Salah: {q.stats.salah}
                            </span>
                            <span style={{
                              fontSize: '0.71rem', fontWeight: 700, color: 'var(--grey-blue)',
                              background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 20,
                              border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                              Tidak Menjawab: {q.stats.tidak_menjawab}
                            </span>
                            <span style={{
                              fontSize: '0.71rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)',
                              background: 'rgba(255,255,255,0.03)', padding: '3px 10px', borderRadius: 20,
                              border: '1px solid rgba(255,255,255,0.07)'
                            }}>
                              Total: {q.stats.benar + q.stats.salah + q.stats.tidak_menjawab} peserta
                            </span>
                          </div>
                        ) : (
                          <p style={{ margin: '8px 0 0', fontSize: '0.71rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Belum ada peserta yang mengerjakan</p>
                        )}

                        {/* Question Description */}
                        {q.description && (
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.07)',
                            borderRadius: 8,
                            padding: '12px 14px',
                            marginTop: 10,
                            fontSize: '0.85rem',
                            lineHeight: 1.55,
                            color: '#CBD5E1',
                            whiteSpace: 'pre-wrap',
                            fontFamily: q.description.includes('const') || q.description.includes('let') || q.description.includes('function') || q.description.includes('{') ? 'Consolas, Monaco, monospace' : 'inherit'
                          }}>
                            {q.description}
                          </div>
                        )}

                        {/* Question Image */}
                        {q.image_url && (
                          <div style={{ marginTop: 10, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', display: 'inline-block' }}>
                            <img src={q.image_url} alt="Question Graphic" style={{ maxHeight: 150, maxWidth: '100%', display: 'block' }} />
                          </div>
                        )}
                      </div>
                    </div>
                    {isExpanded
                      ? <ChevronUp size={16} color="var(--grey-blue)" style={{ flexShrink: 0 }} />
                      : <ChevronDown size={16} color="var(--grey-blue)" style={{ flexShrink: 0 }} />}
                  </div>

                  {isExpanded && (
                    <div style={s.optionsWrapper}>
                      <div style={s.optionsDivider} />
                      <div style={s.optionsList}>
                        {q.options.map((opt) => {
                          const isCorrect = opt.is_correct;
                          return (
                            <div
                              key={opt.id}
                              style={{
                                ...s.optionRow,
                                background: showAllAnswers && isCorrect ? 'rgba(0,200,83,0.07)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${showAllAnswers && isCorrect ? 'rgba(0,200,83,0.2)' : 'rgba(255,255,255,0.05)'}`,
                              }}
                            >
                              <div style={{
                                ...s.optionId,
                                background: showAllAnswers && isCorrect ? 'rgba(0,200,83,0.15)' : 'rgba(255,255,255,0.06)',
                                color: showAllAnswers && isCorrect ? '#00C853' : 'var(--grey-blue)',
                              }}>
                                {opt.id}
                              </div>
                              <span style={{ flex: 1, color: showAllAnswers && isCorrect ? '#fff' : 'var(--grey-blue)', fontSize: '0.88rem', whiteSpace: 'pre-wrap', fontFamily: opt.text.includes('const') || opt.text.includes('let') || opt.text.includes('function') || opt.text.includes('{') ? 'Consolas, Monaco, monospace' : 'inherit' }}>
                                {opt.text}
                              </span>
                              {showAllAnswers && isCorrect && <CheckCircle size={15} color="#00C853" style={{ flexShrink: 0 }} />}
                              {showAllAnswers && !isCorrect && <XCircle size={15} color="rgba(255,255,255,0.15)" style={{ flexShrink: 0 }} />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Question Explanation */}
                      {q.explanation && (
                        <div style={{
                          marginTop: 16,
                          marginLeft: 20,
                          marginRight: 20,
                          padding: '12px 16px',
                          borderRadius: 8,
                          background: 'rgba(6, 113, 224, 0.06)',
                          border: '1px solid rgba(6, 113, 224, 0.15)',
                        }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--azure)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                            Pembahasan Jawaban:
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#E2E8F0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                            {q.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', padding: 8, borderRadius: 8, display: 'flex' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.68rem', color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
        <strong style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600 }}>{value}</strong>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { padding: '4px 0', display: 'flex', flexDirection: 'column', gap: 24 },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '9px 16px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--grey-blue)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
  },
  toggleBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 8,
    border: '1px solid var(--border-color)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--grey-blue)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
  },
  infoCard: { padding: 28, position: 'relative', overflow: 'hidden', borderRadius: 12 },
  iconWrap: {
    width: 32, height: 32, borderRadius: 8, background: 'rgba(255,168,38,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  quizTitle: { fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 },
  quizDesc: { color: 'var(--grey-blue)', fontSize: '0.9rem', marginTop: 8, marginBottom: 0, lineHeight: 1.6 },
  metaGrid: { display: 'flex', flexWrap: 'wrap', gap: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' },
  questionsSection: { display: 'flex', flexDirection: 'column', gap: 16 },
  questionsSectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 },
  sectionTitle: { fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0, marginBottom: 4 },
  emptyQuestions: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 },
  questionList: { display: 'flex', flexDirection: 'column', gap: 10 },
  questionCard: { borderRadius: 12, overflow: 'hidden' },
  questionHeader: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 20px', cursor: 'pointer', userSelect: 'none' },
  qNumber: {
    width: 28, height: 28, borderRadius: 8, background: 'rgba(65,150,240,0.12)',
    color: 'var(--azure)', fontSize: '0.8rem', fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  questionText: { color: '#fff', fontSize: '0.92rem', fontWeight: 500, lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap' },
  optionsWrapper: { paddingBottom: 16 },
  optionsDivider: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 20px 16px' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: 8, padding: '0 20px' },
  optionRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, transition: 'all 0.2s' },
  optionId: { width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, flexShrink: 0 },
};
