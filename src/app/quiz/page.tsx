'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Card from '../../components/quiz/Card';
import Button from '../../components/quiz/Button';
import { Quiz, QuizQuestion, DifficultyLevel, QuestionType } from '../../types/quiz.types';
import { apiGet, apiPost } from '../../lib/api';
import { getStoredToken } from '../../services/auth';
import {
  Loader2, AlertCircle, Calendar, Clock, Award, ShieldAlert,
  CheckCircle, Play, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight,
  BookOpen, FileQuestion, Timer, Send, XCircle, Trophy
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */
interface MappedQuestion {
  uuid_question: string;
  question_text: string;
  type: 'MultipleChoice' | 'TrueFalse' | 'Checkbox';
  options: { id: string; text: string; is_correct: boolean }[];
}

interface QuizDetail {
  uuid_quiz: string;
  nama_quiz: string;
  description?: string;
  asal_pembelajaran: string;
  asal_modul?: string;
  waktu_pengerjaan: number;       // minutes
  tenggat_pengerjaan: string;     // ISO date
  is_published: boolean;
  questions: MappedQuestion[];
}

interface RekapResult {
  uuid_quiz: string;
  skor?: number;
  benar?: number;
  salah?: number;
  status?: string;
}

interface SubmitResult {
  benar: number;
  salah: number;
  skor: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
   AUTH HELPER
   ═══════════════════════════════════════════════════════════════════════════ */
function getAuthHeaders(): { token?: string; headers: Record<string, string> } {
  const token = getStoredToken();
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) headers['x-api-key'] = apiKey;
  else if (token) headers['x-api-key'] = token;
  return { token: token || undefined, headers };
}

/* ═══════════════════════════════════════════════════════════════════════════
   TIMER PERSISTENCE
   ═══════════════════════════════════════════════════════════════════════════ */
const TIMER_KEY_PREFIX = 'nalara_quiz_end_';

function getPersistedEndTime(quizId: string): number | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(TIMER_KEY_PREFIX + quizId);
  return v ? Number(v) : null;
}

function setPersistedEndTime(quizId: string, endMs: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TIMER_KEY_PREFIX + quizId, String(endMs));
}

function clearPersistedEndTime(quizId: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TIMER_KEY_PREFIX + quizId);
}

/* ═══════════════════════════════════════════════════════════════════════════
   FORMAT HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return iso; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DETAIL QUIZ PAGE  (view = 'home')
   ═══════════════════════════════════════════════════════════════════════════ */
function DetailQuizView({
  detail, status, rekap, onStart, onBack
}: {
  detail: QuizDetail;
  status: 'Ditugaskan' | 'Terlambat' | 'Selesai';
  rekap: RekapResult | null;
  onStart: () => void;
  onBack: () => void;
}) {
  const statusColor = status === 'Selesai' ? '#00C853' : status === 'Terlambat' ? '#FF5252' : '#FFA826';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Main detail card */}
      <Card glow style={{ padding: '2.5rem' }}>
        {/* Title + Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--azure)', marginBottom: '0.5rem' }}>Detail Quiz</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.25 }}>{detail.nama_quiz}</h2>
          </div>
          <span style={{
            background: `${statusColor}18`, color: statusColor, fontWeight: 700,
            fontSize: '0.8rem', padding: '6px 16px', borderRadius: '8px', whiteSpace: 'nowrap'
          }}>
            {status}
          </span>
        </div>

        {/* Info grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1.25rem', marginBottom: '2rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1.75rem'
        }}>
          <InfoItem icon={<BookOpen size={18} color="var(--azure)" />} label="Kelas Asal" value={detail.asal_pembelajaran} />
          {detail.asal_modul && (
            <InfoItem icon={<Award size={18} color="#FFD700" />} label="Modul Asal" value={detail.asal_modul} />
          )}
          <InfoItem icon={<Timer size={18} color="#E040FB" />} label="Waktu Pengerjaan" value={`${detail.waktu_pengerjaan} Menit`} />
          <InfoItem icon={<Calendar size={18} color="#FF9100" />} label="Tenggat Pengerjaan" value={fmtDate(detail.tenggat_pengerjaan)} />
        </div>

        {/* Preparation & Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
              🎯 Persiapan untuk Anda
            </h4>
            <p style={{ color: 'var(--grey-blue)', fontSize: '0.88rem', lineHeight: 1.65, margin: 0 }}>
              Pastikan koneksi internet stabil dan Anda berada di ruang belajar yang tenang.
              Bacalah setiap soal dengan saksama sebelum menjawab. Persiapan mental yang baik akan membantu Anda memperoleh hasil terbaik.
            </p>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
              📋 Aturan Quiz
            </h4>
            <ul style={{ color: 'var(--grey-blue)', fontSize: '0.88rem', lineHeight: 1.75, margin: 0, paddingLeft: '1.2rem' }}>
              <li>Quiz ini terdiri dari <strong style={{ color: '#fff' }}>{detail.questions.length} soal</strong> dengan batas waktu <strong style={{ color: '#fff' }}>{detail.waktu_pengerjaan} menit</strong>.</li>
              <li>Setiap quiz hanya dapat dikerjakan <strong style={{ color: '#fff' }}>satu kali</strong>.</li>
              <li>Timer akan <strong style={{ color: '#fff' }}>terus berjalan</strong> meskipun Anda berpindah halaman atau menutup browser.</li>
              <li>Jawaban yang belum disubmit setelah melewati tenggat pengerjaan <strong style={{ color: '#fff' }}>tidak akan disimpan</strong>.</li>
              <li>Nilai kelulusan minimum adalah <strong style={{ color: '#fff' }}>75</strong>.</li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {status === 'Terlambat' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,82,82,0.1)', color: '#FF5252', padding: '14px 28px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600 }}>
              <ShieldAlert size={18} /> Tenggat pengerjaan telah lewat. Anda tidak bisa mengerjakan quiz ini.
            </div>
          )}
          {status === 'Ditugaskan' && (
            <Button id="btn-start-quiz" onClick={onStart} variant="primary" style={{ padding: '14px 40px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Play size={18} fill="#fff" /> Mulai Kerjakan Quiz
            </Button>
          )}
          {status === 'Selesai' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,200,83,0.08)', color: '#00C853', padding: '14px 28px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600 }}>
              <CheckCircle size={18} /> Quiz ini sudah Anda selesaikan.
            </div>
          )}
        </div>
      </Card>

      {/* Rekap Hasil Quiz */}
      {status === 'Selesai' && rekap && (
        <Card style={{ padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,200,83,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Trophy size={28} color="#FFD700" />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: 0 }}>Rekap Hasil Quiz</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', maxWidth: '520px', margin: '0 auto' }}>
            <RekapCard label="Nilai Quiz" value={`${rekap.skor ?? 0}`} color="var(--lemon)" />
            <RekapCard label="Jumlah Benar" value={`${rekap.benar ?? 0}`} color="#00C853" />
            <RekapCard label="Jumlah Salah" value={`${rekap.salah ?? 0}`} color="#FF5252" />
          </div>
        </Card>
      )}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      {icon}
      <div>
        <div style={{ fontSize: '0.72rem', color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
        <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{value}</strong>
      </div>
    </div>
  );
}

function RekapCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--grey)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <strong style={{ fontSize: '2rem', color, fontWeight: 800 }}>{value}</strong>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PENGERJAAN QUIZ PAGE  (view = 'quiz')
   ═══════════════════════════════════════════════════════════════════════════ */
function QuizWorkView({
  detail, timeLeft, currentIdx, answers, onSelect, onPrev, onNext, onFinish
}: {
  detail: QuizDetail;
  timeLeft: number;
  currentIdx: number;
  answers: Record<string, string | string[]>;
  onSelect: (qId: string, optId: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
}) {
  const q = detail.questions[currentIdx];
  const total = detail.questions.length;
  const progress = ((currentIdx + 1) / total) * 100;
  const isLowTime = timeLeft < 60;
  const currentAnswer = answers[q.uuid_question];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top bar: quiz info + timer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: '1rem', flexWrap: 'wrap',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '14px', padding: '16px 20px'
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--grey-blue)', marginBottom: '4px' }}>{detail.nama_quiz}</div>
          <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}>
            Soal {currentIdx + 1} <span style={{ color: 'var(--grey)', fontWeight: 400 }}>dari {total}</span>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '10px',
          background: isLowTime ? 'rgba(255,82,82,0.12)' : 'rgba(65,150,240,0.1)',
          border: `1px solid ${isLowTime ? 'rgba(255,82,82,0.3)' : 'rgba(65,150,240,0.2)'}`,
          transition: 'all 0.3s',
          ...(isLowTime ? { animation: 'pulse-timer 1s infinite' } : {})
        }}>
          <Clock size={16} color={isLowTime ? '#FF5252' : 'var(--azure)'} />
          <span style={{
            fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem',
            color: isLowTime ? '#FF5252' : '#fff'
          }}>
            {fmtTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--navy), var(--azure))', transition: 'width 0.35s ease' }} />
      </div>

      {/* Question card */}
      <Card style={{ padding: '2rem' }}>
        {/* Question type badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <span style={{
            fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '4px 12px', borderRadius: '6px',
            background: q.type === 'Checkbox' ? 'rgba(224,64,251,0.1)' : 'rgba(65,150,240,0.1)',
            color: q.type === 'Checkbox' ? '#E040FB' : 'var(--azure)'
          }}>
            {q.type === 'MultipleChoice' ? 'Pilihan Ganda' : q.type === 'TrueFalse' ? 'Benar / Salah' : 'Pilihan Banyak'}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--grey-blue)' }}>
            Pertanyaan {currentIdx + 1}/{total}
          </span>
        </div>

        {/* Question text */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', lineHeight: 1.5, margin: '0 0 1.75rem 0' }}>
          {q.question_text}
        </h2>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {q.options.map((opt) => {
            let isSelected = false;
            if (q.type === 'Checkbox') {
              isSelected = Array.isArray(currentAnswer) && currentAnswer.includes(opt.id);
            } else {
              isSelected = currentAnswer === opt.id;
            }

            return (
              <button
                key={opt.id}
                onClick={() => onSelect(q.uuid_question, opt.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 18px', borderRadius: '12px',
                  border: isSelected ? '1px solid var(--azure)' : '1px solid rgba(255,255,255,0.06)',
                  background: isSelected ? 'rgba(65,150,240,0.08)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer', textAlign: 'left', color: '#fff',
                  fontSize: '0.95rem', transition: 'all 0.2s', width: '100%',
                  fontFamily: 'inherit'
                }}
              >
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
                  background: isSelected ? 'var(--azure)' : 'rgba(255,255,255,0.05)',
                  color: isSelected ? '#fff' : 'var(--grey-blue)',
                  fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s'
                }}>
                  {q.type === 'Checkbox' ? (isSelected ? '✓' : '') : opt.id}
                </span>
                <span style={{ flex: 1, lineHeight: 1.45 }}>{opt.text}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <Button
          id="btn-prev"
          onClick={onPrev}
          variant={currentIdx === 0 ? 'disabled' : 'secondary'}
          disabled={currentIdx === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
        >
          <ChevronLeft size={16} /> Sebelumnya
        </Button>

        {currentIdx === total - 1 ? (
          <Button
            id="btn-finish"
            onClick={onFinish}
            variant="primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: '#00C853', borderColor: '#00C853' }}
          >
            <Send size={16} /> Selesai
          </Button>
        ) : (
          <Button
            id="btn-next"
            onClick={onNext}
            variant="primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
          >
            Selanjutnya <ChevronRight size={16} />
          </Button>
        )}
      </div>

      {/* Question navigation dots */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center',
        padding: '16px 20px', background: 'rgba(255,255,255,0.01)',
        border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px'
      }}>
        {detail.questions.map((_, idx) => {
          const qId = detail.questions[idx].uuid_question;
          const hasAnswer = !!answers[qId];
          const isCurrent = idx === currentIdx;
          return (
            <span key={idx} style={{
              width: '28px', height: '28px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.72rem', fontWeight: 700,
              background: isCurrent ? 'var(--azure)' : hasAnswer ? 'rgba(0,200,83,0.15)' : 'rgba(255,255,255,0.04)',
              color: isCurrent ? '#fff' : hasAnswer ? '#00C853' : 'var(--grey)',
              border: isCurrent ? '1px solid var(--azure)' : hasAnswer ? '1px solid rgba(0,200,83,0.3)' : '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.2s'
            }}>
              {idx + 1}
            </span>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse-timer { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESULT VIEW  (view = 'result')
   ═══════════════════════════════════════════════════════════════════════════ */
function ResultView({ result, quizTitle, onBack }: { result: SubmitResult; quizTitle: string; onBack: () => void }) {
  const passed = result.skor >= 75;
  return (
    <Card style={{ padding: '3.5rem', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: passed ? 'rgba(0,200,83,0.1)' : 'rgba(255,82,82,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
        {passed ? <Trophy size={36} color="#FFD700" /> : <XCircle size={36} color="#FF5252" />}
      </div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem 0' }}>
        {passed ? 'Selamat, Quiz Selesai!' : 'Quiz Selesai'}
      </h2>
      <p style={{ color: 'var(--grey-blue)', fontSize: '0.9rem', margin: '0 0 2rem 0' }}>{quizTitle}</p>

      <div style={{ fontSize: '4.5rem', fontWeight: 900, color: passed ? '#00C853' : '#FF5252', marginBottom: '0.5rem', fontFamily: 'Georgia, serif' }}>
        {result.skor}
      </div>
      <div style={{
        display: 'inline-block', padding: '6px 18px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem',
        background: passed ? 'rgba(0,200,83,0.1)' : 'rgba(255,82,82,0.1)',
        color: passed ? '#00C853' : '#FF5252'
      }}>
        {passed ? '✅ LULUS' : '❌ TIDAK LULUS'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '360px', margin: '2rem auto 2.5rem' }}>
        <RekapCard label="Jumlah Benar" value={`${result.benar}`} color="#00C853" />
        <RekapCard label="Jumlah Salah" value={`${result.salah}`} color="#FF5252" />
      </div>

      <Button id="btn-back-result" onClick={onBack} variant="secondary" style={{ padding: '12px 32px' }}>
        Kembali ke Kelas
      </Button>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN QUIZ ORCHESTRATOR
   ═══════════════════════════════════════════════════════════════════════════ */
function QuizPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const quizId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<QuizDetail | null>(null);
  const [rekap, setRekap] = useState<RekapResult | null>(null);
  const [view, setView] = useState<'home' | 'quiz' | 'result'>('home');

  // Quiz work state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmittedRef = useRef(false);

  /* ─── Fetch quiz detail + rekap ──────────────────────────────────────── */
  useEffect(() => {
    if (!quizId) { setError('Quiz ID tidak ditemukan di URL'); setLoading(false); return; }

    (async () => {
      try {
        setLoading(true);
        const auth = getAuthHeaders();

        // 1) Fetch quiz detail with questions
        const res = await apiGet<any>(`/api/quiz/${quizId}`, { token: auth.token, headers: auth.headers });
        const d = res.data || res;

        const mapped: QuizDetail = {
          uuid_quiz: d.uuid_quiz || d.id || quizId,
          nama_quiz: d.nama_quiz || d.title || 'Kuis',
          description: d.description || '',
          asal_pembelajaran: d.asal_pembelajaran || d.nama_pembelajaran || d.uuid_pembelajaran || '',
          asal_modul: d.asal_modul || d.nama_modul || d.uuid_modul || undefined,
          waktu_pengerjaan: d.waktu_pengerjaan || d.time_limit || 30,
          tenggat_pengerjaan: d.tenggat_pengerjaan || d.deadline || '',
          is_published: d.is_published ?? true,
          questions: (d.questions || []).map((q: any) => ({
            uuid_question: q.uuid_question || q.id,
            question_text: q.question_text || q.question || '',
            type: q.type || 'MultipleChoice',
            options: (q.options || []).map((o: any) => ({
              id: o.id || '',
              text: o.text || o.option_text || '',
              is_correct: !!o.is_correct
            }))
          })),
        };
        setDetail(mapped);

        // 2) Try to fetch rekap
        try {
          const rekapRes = await apiGet<any>('/api/quiz/rekap', { token: auth.token, headers: auth.headers });
          const rekapList = Array.isArray(rekapRes) ? rekapRes : (rekapRes.data || []);
          const match = rekapList.find((r: any) => r.uuid_quiz === quizId);
          if (match) setRekap(match);
        } catch { /* silently ignore */ }

        // 3) Check if there's a persisted timer (user was doing the quiz before)
        const persisted = getPersistedEndTime(quizId);
        if (persisted) {
          const remaining = Math.max(0, Math.floor((persisted - Date.now()) / 1000));
          if (remaining > 0) {
            // Resume quiz
            setTimeLeft(remaining);
            setView('quiz');
          } else {
            // Timer expired while away → can't attempt
            clearPersistedEndTime(quizId);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data kuis');
      } finally {
        setLoading(false);
      }
    })();
  }, [quizId]);

  /* ─── Timer effect ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (view !== 'quiz') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (!autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view]);

  /* ─── Status computation ─────────────────────────────────────────────── */
  const getStatus = (): 'Ditugaskan' | 'Terlambat' | 'Selesai' => {
    if (rekap) return 'Selesai';
    if (detail?.tenggat_pengerjaan) {
      const deadline = new Date(detail.tenggat_pengerjaan).getTime();
      if (Date.now() > deadline) return 'Terlambat';
    }
    return 'Ditugaskan';
  };

  /* ─── Start quiz ─────────────────────────────────────────────────────── */
  const handleStart = () => {
    if (!detail || !quizId) return;
    const endMs = Date.now() + detail.waktu_pengerjaan * 60 * 1000;
    setPersistedEndTime(quizId, endMs);
    setTimeLeft(detail.waktu_pengerjaan * 60);
    setCurrentIdx(0);
    setAnswers({});
    autoSubmittedRef.current = false;
    setView('quiz');
  };

  /* ─── Select answer ──────────────────────────────────────────────────── */
  const handleSelect = (qId: string, optId: string) => {
    if (!detail) return;
    const q = detail.questions.find(x => x.uuid_question === qId);
    if (!q) return;

    if (q.type === 'Checkbox') {
      setAnswers(prev => {
        const current = (prev[qId] as string[]) || [];
        const next = current.includes(optId) ? current.filter(id => id !== optId) : [...current, optId];
        return { ...prev, [qId]: next };
      });
    } else {
      setAnswers(prev => ({ ...prev, [qId]: optId }));
    }
  };

  /* ─── Submit quiz ────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!detail || !quizId || submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    clearPersistedEndTime(quizId);

    // Build answers payload per Swagger: { answers: [{ uuid_question, submitted_answer }] }
    const payload = {
      answers: detail.questions.map(q => {
        const ans = answers[q.uuid_question];
        return {
          uuid_question: q.uuid_question,
          submitted_answer: ans || ''
        };
      })
    };

    try {
      const auth = getAuthHeaders();
      const res = await apiPost<any>(`/api/quiz/${quizId}/submit`, payload, { token: auth.token, headers: auth.headers });
      const d = res.data || res;
      setResult({
        benar: d.benar ?? 0,
        salah: d.salah ?? 0,
        skor: d.skor ?? 0
      });
      setRekap({
        uuid_quiz: quizId,
        benar: d.benar ?? 0,
        salah: d.salah ?? 0,
        skor: d.skor ?? 0
      });
    } catch (err) {
      console.warn('Server submit failed, computing locally:', err);
      // Fallback: compute client-side
      let benar = 0;
      let salah = 0;
      detail.questions.forEach(q => {
        const ans = answers[q.uuid_question];
        const correct = q.options.filter(o => o.is_correct).map(o => o.id);
        let isCorrect = false;
        if (q.type === 'Checkbox') {
          const sel = (ans as string[]) || [];
          isCorrect = correct.length === sel.length && correct.every(id => sel.includes(id));
        } else {
          isCorrect = correct.includes(ans as string);
        }
        if (isCorrect) benar++; else salah++;
      });
      const skor = Math.round((benar / detail.questions.length) * 100);
      setResult({ benar, salah, skor });
      setRekap({ uuid_quiz: quizId, benar, salah, skor });
    } finally {
      setSubmitting(false);
      setView('result');
    }
  };

  /* ─── Navigation ─────────────────────────────────────────────────────── */
  const goBack = () => {
    router.push('/student/courses');
  };

  /* ─── Render ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <Loader2 size={36} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--grey-blue)' }}>Memuat data kuis...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <main style={{ padding: '2rem 1.5rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <Card style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <AlertCircle size={48} color="#FF5252" />
          <h2 style={{ fontSize: '1.5rem', color: '#fff' }}>Kuis Gagal Dimuat</h2>
          <p style={{ color: 'var(--grey-blue)' }}>{error || 'Kuis tidak ditemukan.'}</p>
          <Button onClick={goBack} variant="secondary">Kembali ke Kelas</Button>
        </Card>
      </main>
    );
  }

  const status = getStatus();

  return (
    <main style={{ padding: '2rem 1.5rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {view !== 'quiz' && (
        <button onClick={goBack} style={{ background: 'none', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '1.5rem', color: 'var(--azure)', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Kembali ke Kelas
        </button>
      )}

      {view === 'home' && (
        <DetailQuizView detail={detail} status={status} rekap={rekap} onStart={handleStart} onBack={goBack} />
      )}

      {view === 'quiz' && (
        <QuizWorkView
          detail={detail} timeLeft={timeLeft} currentIdx={currentIdx}
          answers={answers} onSelect={handleSelect}
          onPrev={() => setCurrentIdx(i => Math.max(0, i - 1))}
          onNext={() => setCurrentIdx(i => Math.min(detail.questions.length - 1, i + 1))}
          onFinish={handleSubmit}
        />
      )}

      {view === 'result' && result && (
        <ResultView result={result} quizTitle={detail.nama_quiz} onBack={goBack} />
      )}
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEFAULT EXPORT WITH SUSPENSE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function QuizPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <Loader2 size={36} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--grey-blue)' }}>Loading...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <QuizPageInner />
    </Suspense>
  );
}
