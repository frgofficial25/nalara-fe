'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Card from '@/components/quiz/Card';
import Button from '@/components/quiz/Button';
import { Quiz, QuizQuestion, DifficultyLevel, QuestionType } from '@/types/quiz.types';
import { apiGet, apiPost } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import {
  Loader2, AlertCircle, Calendar, Clock, Award, ShieldAlert,
  CheckCircle, Play, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight,
  BookOpen, FileQuestion, Timer, Send, XCircle, Trophy, Brain
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
  const statusBg = status === 'Selesai' ? 'rgba(0, 200, 83, 0.15)' : status === 'Terlambat' ? 'rgba(255, 82, 82, 0.15)' : 'rgba(255, 168, 38, 0.15)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Main detail card */}
      <Card glow style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative background blur */}
        <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(65, 150, 240, 0.1) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Title + Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff', background: 'linear-gradient(90deg, var(--azure), #B388FF)', padding: '6px 12px', borderRadius: '20px', marginBottom: '1rem' }}>Informasi Kuis</div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>{detail.nama_quiz}</h2>
            </div>
            <span style={{
              background: statusBg, color: statusColor, fontWeight: 700,
              fontSize: '0.85rem', padding: '8px 20px', borderRadius: '12px', whiteSpace: 'nowrap',
              border: `1px solid ${statusColor}40`, boxShadow: `0 4px 12px ${statusBg}`
            }}>
              {status}
            </span>
          </div>

          {/* Info grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1.5rem', marginBottom: '2.5rem',
            background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '1.5rem', borderRadius: '16px'
          }}>
            <InfoItem icon={<BookOpen size={20} color="var(--azure)" />} label="Kelas Asal" value={detail.asal_pembelajaran} />
            {detail.asal_modul && (
              <InfoItem icon={<Award size={20} color="#FFD700" />} label="Modul Asal" value={detail.asal_modul} />
            )}
            <InfoItem icon={<Timer size={20} color="#E040FB" />} label="Waktu Pengerjaan" value={`${detail.waktu_pengerjaan} Menit`} />
            <InfoItem icon={<Calendar size={20} color="#FF9100" />} label="Tenggat Pengerjaan" value={fmtDate(detail.tenggat_pengerjaan)} />
          </div>

          {/* Preparation & Rules */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
            <div style={{ background: 'rgba(65, 150, 240, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(65, 150, 240, 0.1)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--azure)', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
                <Brain size={18} /> Persiapan
              </h4>
              <p style={{ color: 'var(--grey-blue)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
                Pastikan koneksi internet Anda stabil. Kuis ini dirancang untuk menguji pemahaman Anda, jadi luangkan waktu untuk membaca setiap pertanyaan dengan saksama.
              </p>
            </div>
            <div style={{ background: 'rgba(255, 145, 0, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 145, 0, 0.1)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF9100', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
                <ShieldAlert size={18} /> Aturan Pengerjaan
              </h4>
              <ul style={{ color: 'var(--grey-blue)', fontSize: '0.9rem', lineHeight: 1.8, margin: 0, paddingLeft: '1.2rem' }}>
                <li>Terdiri dari <strong style={{ color: '#fff' }}>{detail.questions.length} soal</strong>, waktu <strong style={{ color: '#fff' }}>{detail.waktu_pengerjaan} menit</strong>.</li>
                <li>Timer berjalan meski tab ditutup. Jawaban tersimpan otomatis.</li>
                <li>Hanya bisa dikerjakan <strong style={{ color: '#fff' }}>1 kali</strong>. Syarat lulus skor <strong style={{ color: '#fff' }}>75</strong>.</li>
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {status === 'Terlambat' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,82,82,0.1)', color: '#FF5252', padding: '16px 32px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, border: '1px solid rgba(255,82,82,0.2)' }}>
                <ShieldAlert size={20} /> Tenggat pengerjaan telah lewat. Anda tidak dapat mengakses kuis ini.
              </div>
            )}
            {status === 'Ditugaskan' && (
              <Button id="btn-start-quiz" onClick={onStart} variant="primary" style={{ padding: '16px 48px', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(135deg, var(--azure), var(--navy))', border: 'none', boxShadow: '0 8px 24px rgba(65, 150, 240, 0.3)' }}>
                <Play size={20} fill="#fff" /> Mulai Kuis Sekarang
              </Button>
            )}
            {status === 'Selesai' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,200,83,0.1)', color: '#00C853', padding: '16px 32px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, border: '1px solid rgba(0,200,83,0.2)' }}>
                <CheckCircle size={20} /> Kuis ini telah Anda selesaikan. Lihat rekap di bawah.
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Rekap Hasil Quiz */}
      {status === 'Selesai' && rekap && (
        <Card style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #00C853, var(--azure))' }} />
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: '20px', background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,145,0,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 8px 24px rgba(255,215,0,0.15)' }}>
              <Trophy size={32} color="#FFD700" />
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: 0 }}>Rekapitulasi Hasil</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
            <RekapCard label="Nilai Akhir" value={`${rekap.skor ?? 0}`} color="#FFD700" />
            <RekapCard label="Jawaban Benar" value={`${rekap.benar ?? 0}`} color="#00C853" />
            <RekapCard label="Jawaban Salah" value={`${rekap.salah ?? 0}`} color="#FF5252" />
          </div>
        </Card>
      )}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</div>
        <strong style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>{value}</strong>
      </div>
    </div>
  );
}

function RekapCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', padding: '1.75rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', transition: 'transform 0.2s', cursor: 'default' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--grey)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
      <strong style={{ fontSize: '2.5rem', color, fontWeight: 900, textShadow: `0 4px 20px ${color}30` }}>{value}</strong>
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

  if (!q || total === 0) {
    return (
      <Card style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(255,82,82,0.1)', padding: '16px', borderRadius: '50%' }}>
            <AlertCircle size={40} color="#FF5252" />
          </div>
        </div>
        <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Data Tidak Valid</h3>
        <p style={{ color: 'var(--grey-blue)' }}>Tidak ada soal yang tersedia untuk quiz ini. Silakan hubungi pengajar Anda.</p>
      </Card>
    );
  }

  const progress = ((currentIdx + 1) / total) * 100;
  const isLowTime = timeLeft < 60;
  const currentAnswer = answers[q.uuid_question];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
      {/* Top bar: quiz info + timer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: '1rem', flexWrap: 'wrap',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px', padding: '16px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontWeight: 600 }}>{detail.nama_quiz}</div>
          <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 800 }}>
            Soal {currentIdx + 1} <span style={{ color: 'var(--grey)', fontWeight: 400, fontSize: '0.9rem' }}>dari {total}</span>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 20px', borderRadius: '12px',
          background: isLowTime ? 'rgba(255,82,82,0.12)' : 'rgba(65,150,240,0.1)',
          border: `1px solid ${isLowTime ? 'rgba(255,82,82,0.3)' : 'rgba(65,150,240,0.2)'}`,
          boxShadow: isLowTime ? '0 0 16px rgba(255,82,82,0.2)' : 'none',
          transition: 'all 0.3s',
          ...(isLowTime ? { animation: 'pulse-timer 1s infinite' } : {})
        }}>
          <Clock size={18} color={isLowTime ? '#FF5252' : 'var(--azure)'} />
          <span style={{
            fontFamily: '"SF Mono", "Roboto Mono", monospace', fontWeight: 800, fontSize: '1.25rem',
            color: isLowTime ? '#FF5252' : '#fff', letterSpacing: '1px'
          }}>
            {fmtTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--azure), #B388FF)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '3px' }} />
      </div>

      {/* Question card */}
      <Card style={{ padding: '2.5rem', position: 'relative' }}>
        {/* Question type badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            padding: '6px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px',
            background: q.type === 'Checkbox' ? 'rgba(224,64,251,0.1)' : 'rgba(65,150,240,0.1)',
            color: q.type === 'Checkbox' ? '#E040FB' : 'var(--azure)',
            border: `1px solid ${q.type === 'Checkbox' ? 'rgba(224,64,251,0.2)' : 'rgba(65,150,240,0.2)'}`
          }}>
            <FileQuestion size={14} />
            {q.type === 'MultipleChoice' ? 'Pilihan Ganda' : q.type === 'TrueFalse' ? 'Benar / Salah' : 'Pilihan Banyak'}
          </span>
        </div>

        {/* Question text */}
        <h2 style={{ fontSize: '1.35rem', fontWeight: 600, color: '#fff', lineHeight: 1.6, margin: '0 0 2rem 0', letterSpacing: '0.01em' }}>
          {q.question_text}
        </h2>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '16px 20px', borderRadius: '14px',
                  border: isSelected ? '1px solid var(--azure)' : '1px solid rgba(255,255,255,0.08)',
                  background: isSelected ? 'rgba(65,150,240,0.12)' : 'rgba(255,255,255,0.03)',
                  boxShadow: isSelected ? '0 4px 16px rgba(65,150,240,0.1)' : 'none',
                  cursor: 'pointer', textAlign: 'left', color: '#fff',
                  fontSize: '1rem', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', width: '100%',
                  fontFamily: 'inherit',
                  transform: 'translateY(0)',
                  ...({ ':hover': { transform: 'translateY(-2px)', background: isSelected ? 'rgba(65,150,240,0.15)' : 'rgba(255,255,255,0.06)' } } as any)
                }}
              >
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: isSelected ? 'linear-gradient(135deg, var(--azure), #5E35B1)' : 'rgba(255,255,255,0.06)',
                  color: isSelected ? '#fff' : 'var(--grey-blue)',
                  fontWeight: 800, fontSize: '0.9rem', transition: 'all 0.2s'
                }}>
                  {q.type === 'Checkbox' ? (isSelected ? '✓' : '') : opt.id}
                </span>
                <span style={{ flex: 1, lineHeight: 1.5 }}>{opt.text}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '0.5rem' }}>
        <Button
          id="btn-prev"
          onClick={onPrev}
          variant={currentIdx === 0 ? 'disabled' : 'secondary'}
          disabled={currentIdx === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 28px', fontSize: '0.95rem', borderRadius: '12px' }}
        >
          <ChevronLeft size={18} /> Sebelumnya
        </Button>

        {currentIdx === total - 1 ? (
          <Button
            id="btn-finish"
            onClick={onFinish}
            variant="primary"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 36px', background: 'linear-gradient(135deg, #00C853, #00E676)', borderColor: 'transparent', boxShadow: '0 6px 20px rgba(0,200,83,0.3)', fontSize: '1rem', fontWeight: 700, borderRadius: '12px' }}
          >
            <Send size={18} /> Selesai Kuis
          </Button>
        ) : (
          <Button
            id="btn-next"
            onClick={onNext}
            variant="primary"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 28px', fontSize: '0.95rem', borderRadius: '12px', background: 'var(--azure)' }}
          >
            Selanjutnya <ChevronRight size={18} />
          </Button>
        )}
      </div>

      {/* Question navigation dots */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center',
        padding: '20px 24px', background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px',
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {detail.questions.map((_, idx) => {
          const qId = detail.questions[idx].uuid_question;
          const hasAnswer = !!answers[qId];
          const isCurrent = idx === currentIdx;
          return (
            <button key={idx} 
              onClick={() => undefined} // Non-interactive dot indicator
              style={{
              width: '34px', height: '34px', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, cursor: 'default',
              background: isCurrent ? 'linear-gradient(135deg, var(--azure), #5E35B1)' : hasAnswer ? 'rgba(0,200,83,0.15)' : 'rgba(255,255,255,0.04)',
              color: isCurrent ? '#fff' : hasAnswer ? '#00C853' : 'var(--grey)',
              border: isCurrent ? '1px solid transparent' : hasAnswer ? '1px solid rgba(0,200,83,0.4)' : '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.2s',
              boxShadow: isCurrent ? '0 4px 12px rgba(65,150,240,0.3)' : 'none'
            }}>
              {idx + 1}
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse-timer { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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
    <Card style={{ padding: '4rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', background: passed ? 'linear-gradient(90deg, #00C853, #00E676)' : 'linear-gradient(90deg, #FF5252, #FF8A80)' }} />
      
      <div style={{ 
        width: 88, height: 88, borderRadius: '24px', 
        background: passed ? 'linear-gradient(135deg, rgba(0,200,83,0.2), rgba(0,230,118,0.1))' : 'linear-gradient(135deg, rgba(255,82,82,0.2), rgba(255,138,128,0.1))', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        margin: '0 auto 1.5rem', boxShadow: passed ? '0 12px 30px rgba(0,200,83,0.2)' : '0 12px 30px rgba(255,82,82,0.2)',
        border: passed ? '1px solid rgba(0,200,83,0.3)' : '1px solid rgba(255,82,82,0.3)'
      }}>
        {passed ? <Trophy size={44} color="#00E676" /> : <XCircle size={44} color="#FF5252" />}
      </div>
      
      <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', margin: '0 0 0.75rem 0', letterSpacing: '-0.02em' }}>
        {passed ? 'Selamat, Anda Lulus!' : 'Tetap Semangat!'}
      </h2>
      <p style={{ color: 'var(--grey)', fontSize: '1rem', margin: '0 auto 2.5rem 0', maxWidth: '400px', lineHeight: 1.6 }}>
        Anda telah menyelesaikan kuis <strong>{quizTitle}</strong>.
      </p>

      <div style={{ display: 'inline-block', position: 'relative', marginBottom: '2.5rem' }}>
        <div style={{ position: 'absolute', inset: '-20px', background: passed ? 'radial-gradient(circle, rgba(0,200,83,0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255,82,82,0.15) 0%, transparent 70%)', filter: 'blur(10px)', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '6rem', fontWeight: 900, color: passed ? '#00E676' : '#FF5252', lineHeight: 1, letterSpacing: '-0.04em', textShadow: `0 8px 24px ${passed ? 'rgba(0,200,83,0.3)' : 'rgba(255,82,82,0.3)'}` }}>
            {result.skor}
          </div>
          <div style={{
            display: 'inline-block', padding: '8px 24px', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem',
            background: passed ? 'rgba(0,200,83,0.15)' : 'rgba(255,82,82,0.15)',
            color: passed ? '#00E676' : '#FF5252', border: `1px solid ${passed ? 'rgba(0,200,83,0.3)' : 'rgba(255,82,82,0.3)'}`,
            marginTop: '1rem', letterSpacing: '0.05em'
          }}>
            {passed ? 'STATUS: LULUS' : 'STATUS: TIDAK LULUS'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '420px', margin: '0 auto 3rem' }}>
        <div style={{ background: 'rgba(0,200,83,0.05)', border: '1px solid rgba(0,200,83,0.15)', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 700 }}>Jawaban Benar</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#00E676' }}>{result.benar}</div>
        </div>
        <div style={{ background: 'rgba(255,82,82,0.05)', border: '1px solid rgba(255,82,82,0.15)', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 700 }}>Jawaban Salah</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FF5252' }}>{result.salah}</div>
        </div>
      </div>

      <Button id="btn-back-result" onClick={onBack} variant="secondary" style={{ padding: '16px 40px', fontSize: '1.05rem', fontWeight: 700, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        Kembali ke Detail Kelas
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

  /* ─── Role Check ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const data = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
    if (!data) {
      router.push('/login');
      return;
    }
    try {
      const user = JSON.parse(data);
      const role = user.role?.toLowerCase() || '';
      if (role !== 'student' && role !== 'mahasiswa' && role !== 'siswa' && role !== 'user') {
        // Redirect non-student users
        router.push('/login');
      }
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

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
          description: d.deskripsi || d.description || '',
          asal_pembelajaran: d.asal_pembelajaran || d.nama_pembelajaran || d.uuid_pembelajaran || '',
          asal_modul: d.asal_modul || d.nama_modul || d.uuid_modul || undefined,
          waktu_pengerjaan: d.waktu_pengerjaan || d.time_limit || 30,
          tenggat_pengerjaan: d.tenggat_pengerjaan || d.deadline || '',
          is_published: d.is_published ?? true,
          questions: (d.daftar_soal || d.questions || []).map((q: any) => ({
            uuid_question: q.uuid_question || q.id,
            question_text: q.detail_soal || q.question_text || q.question || '',
            type: q.tipe_soal || q.type || 'MultipleChoice',
            options: (q.opsi_jawaban || q.options || []).map((o: any) => ({
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
