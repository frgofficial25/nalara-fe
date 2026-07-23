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
  BookOpen, FileQuestion, Timer, Send, XCircle, Trophy, Brain, Check, Lock
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */
interface MappedQuestion {
  uuid_question: string;
  question_text: string;
  description?: string;
  image_url?: string;
  explanation?: string;
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
  uuid_pembelajaran?: string;
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

function normalizeOptionId(raw: any, index: number): string {
  if (raw && typeof raw === 'object') {
    if (raw.id) return String(raw.id);
    if (raw.option_id) return String(raw.option_id);
    if (raw.key) return String(raw.key);
    if (raw.label) return String(raw.label);
  }
  return String.fromCharCode(65 + index);
}

function normalizeQuestionOptions(rawOptions: any): { id: string; text: string; is_correct: boolean }[] {
  if (Array.isArray(rawOptions)) {
    return rawOptions.map((o: any, idx: number) => {
      if (typeof o === 'string') {
        return {
          id: String.fromCharCode(65 + idx),
          text: o,
          is_correct: false,
        };
      }

      return {
        id: normalizeOptionId(o, idx),
        text: String(o?.text ?? o?.option_text ?? o?.label ?? o?.value ?? ''),
        is_correct: !!(o?.is_correct ?? o?.correct),
      };
    });
  }

  if (rawOptions && typeof rawOptions === 'object') {
    const entries = Object.entries(rawOptions).filter(([k]) => k !== 'answer' && k !== 'correct' && k !== 'correct_answer');
    return entries.map(([key, value], idx) => ({
      id: key || String.fromCharCode(65 + idx),
      text: String(value ?? ''),
      is_correct: false,
    }));
  }

  return [];
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <Button
                  id="btn-start-quiz"
                  onClick={onStart}
                  variant="primary"
                  disabled={detail.questions.length === 0}
                  style={{
                    padding: '16px 48px',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'linear-gradient(135deg, var(--azure), var(--navy))',
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(65, 150, 240, 0.3)',
                    opacity: detail.questions.length === 0 ? 0.55 : 1,
                    cursor: detail.questions.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Play size={20} fill="#fff" /> Mulai Kuis Sekarang
                </Button>
                {detail.questions.length === 0 && (
                  <span style={{ fontSize: '0.8rem', color: '#FFB74D' }}>
                    Soal kuis belum tersedia. Hubungi pengajar Anda.
                  </span>
                )}
              </div>
            )}
            {status === 'Selesai' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: 'rgba(0,200,83,0.08)', color: '#00C853',
                  padding: '20px 36px', borderRadius: '16px', fontSize: '1rem',
                  fontWeight: 700, border: '1px solid rgba(0,200,83,0.25)',
                  boxShadow: '0 4px 20px rgba(0,200,83,0.1)'
                }}>
                  <Lock size={22} />
                  <span>Kuis ini sudah dikerjakan &amp; dikunci</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--grey-blue)', margin: 0 }}>
                  Lihat rekap hasil pengerjaan Anda di bawah ini.
                </p>
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
  detail, timeLeft, currentIdx, answers, onSelect, onPrev, onNext, onFinish, onGoTo
}: {
  detail: QuizDetail;
  timeLeft: number;
  currentIdx: number;
  answers: Record<string, string | string[]>;
  onSelect: (qId: string, optId: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
  onGoTo: (idx: number) => void;
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
  const answeredCount = Object.keys(answers).length;
  const typeLabel = q.type === 'MultipleChoice' ? 'Pilihan Ganda' : q.type === 'TrueFalse' ? 'Benar / Salah' : 'Pilihan Banyak';

  return (
    <>
      <style>{`
        .qwv-root { display: flex; flex-direction: column; gap: 1.5rem; animation: qwv-in 0.35s ease-out; }
        @keyframes qwv-in { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }

        .qwv-body { display: flex; gap: 2rem; align-items: flex-start; }
        .qwv-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 20px; }
        
        .qwv-sidebar {
          width: 320px; flex-shrink: 0;
          display: flex; flex-direction: column; gap: 16px;
        }

        .qwv-timer-card {
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px; padding: 16px 22px;
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .qwv-navigator-card {
          background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 18px; padding: 22px;
          display: flex; flex-direction: column; gap: 18px;
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .qwv-numgrid {
          display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;
        }

        .qwv-numbtn {
          height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem; font-weight: 700; cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.05); background: rgba(255, 255, 255, 0.03); color: var(--grey-blue);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .qwv-numbtn:hover { transform: translateY(-2px); background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.15); color: #fff; }
        .qwv-numbtn.cur { background: linear-gradient(135deg, var(--azure), #045bb5); color: #fff; border-color: transparent; box-shadow: 0 4px 14px rgba(6, 113, 224, 0.4); }
        .qwv-numbtn.ans { background: rgba(6, 113, 224, 0.12); color: var(--azure); border-color: rgba(6, 113, 224, 0.25); }

        .qwv-btn { display: flex; align-items: center; justify-content: center; padding: 12px 0; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; }
        .qwv-btn-prev { background: rgba(255,255,255,0.03); color: #fff; border: 1px solid rgba(255,255,255,0.12) !important; }
        .qwv-btn-prev:hover:not(:disabled) { background: rgba(255,255,255,0.08); transform: translateY(-1px); }
        .qwv-btn-prev:disabled { opacity: 0.25; cursor: not-allowed; }
        .qwv-btn-next { background: linear-gradient(135deg, var(--azure), #045bb5); color: #fff; box-shadow: 0 4px 14px rgba(6, 113, 224, 0.3); }
        .qwv-btn-next:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(6, 113, 224, 0.45); }
        .qwv-btn-finish { background: linear-gradient(135deg, #00C853, #009624); color: #fff; box-shadow: 0 4px 14px rgba(0, 200, 83, 0.3); }
        .qwv-btn-finish:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0, 200, 83, 0.45); }

        .qwv-card {
          background: rgba(255, 255, 255, 0.015); border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px; padding: 2.25rem 2.5rem;
          backdrop-filter: blur(16px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
        }

        .qwv-q-text { font-size: 1.45rem; font-weight: 700; color: #fff; line-height: 1.45; margin: 0 0 1.75rem; letter-spacing: -0.01em; white-space: pre-wrap; }

        .qwv-options { display: flex; flex-direction: column; gap: 0.85rem; }
        .qwv-opt {
          display: flex; align-items: center; gap: 14px;
          padding: 18px 22px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.01);
          cursor: pointer; text-align: left; color: #fff; font-size: 0.94rem;
          font-family: inherit; width: 100%;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .qwv-opt:hover { border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.03); transform: translateX(4px); }
        .qwv-opt.sel { border: 1px solid var(--azure); background: rgba(6, 113, 224, 0.08); box-shadow: 0 4px 20px rgba(6, 113, 224, 0.15); }
        .qwv-radio-circle {
          width: 20px; height: 20px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          transition: all 0.2s;
        }
        .qwv-opt.sel .qwv-radio-circle { border-color: var(--azure); background: var(--azure); }

        @media (max-width: 768px) {
          .qwv-body { flex-direction: column-reverse; gap: 1rem; align-items: stretch; }
          .qwv-sidebar { width: 100%; padding: 12px 12px 0 12px; }
          .qwv-card { padding: 1.5rem 1.25rem; border-radius: 0; border-left: none; border-right: none; }
          .qwv-q-text { font-size: 1.15rem; margin-bottom: 1.25rem; }
          .qwv-opt { padding: 14px 16px; font-size: 0.88rem; border-radius: 10px; }
          .qwv-numgrid { grid-template-columns: repeat(6, 1fr); }
        }
      `}</style>

      <div className="qwv-root">
        {/* BODY */}
        <div className="qwv-body">

          {/* Left Column: Content */}
          <div className="qwv-content">
            <div className="qwv-card">
              {/* Badges */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: 'rgba(255, 168, 38, 0.12)',
                  color: '#FFA826',
                  border: '1px solid rgba(255, 168, 38, 0.2)'
                }}>
                  Question {currentIdx + 1} of {total}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: 'rgba(65, 150, 240, 0.12)',
                  color: 'var(--azure)',
                  border: '1px solid rgba(65, 150, 240, 0.2)'
                }}>
                  {q.type === 'MultipleChoice' ? 'Multiple Choice' : q.type === 'Checkbox' ? 'Checkbox' : 'True/False'}
                </span>
              </div>

              {/* Question Text */}
              <h2 className="qwv-q-text">{q.question_text}</h2>

              {/* Question Description (Deskripsi Soal) */}
              {q.description && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  borderLeft: '3px solid rgba(65, 150, 240, 0.6)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  marginBottom: '24px',
                  fontSize: '0.95rem',
                  lineHeight: 1.65,
                  color: '#E2E8F0',
                  whiteSpace: 'pre-wrap',
                  fontFamily: /[{};()=>]/.test(q.description) ? 'Consolas, Monaco, "Courier New", monospace' : 'inherit'
                }}>
                  {q.description}
                </div>
              )}

              {/* Question Image */}
              {q.image_url && (
                <div style={{
                  marginBottom: '24px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(0,0,0,0.2)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <img
                    src={q.image_url}
                    alt="Gambar Soal"
                    style={{ maxWidth: '100%', maxHeight: '400px', display: 'block', objectFit: 'contain' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Options */}
              <div className="qwv-options">
                {q.options.map((opt) => {
                  const isSel = q.type === 'Checkbox'
                    ? Array.isArray(currentAnswer) && currentAnswer.includes(opt.id)
                    : currentAnswer === opt.id;

                  const isCode = /[{};()=>]/.test(opt.text);

                  return (
                    <button key={opt.id} onClick={() => onSelect(q.uuid_question, opt.id)}
                      className={`qwv-opt${isSel ? ' sel' : ''}`}
                      style={{ alignItems: 'flex-start' }}
                    >
                      <span className="qwv-radio-circle" style={{ borderRadius: q.type === 'Checkbox' ? '4px' : '50%', marginTop: '2px', flexShrink: 0 }}>
                        {isSel && <Check size={11} color="#fff" strokeWidth={3} />}
                      </span>
                      <span style={{
                        whiteSpace: 'pre-wrap',
                        textAlign: 'left',
                        fontFamily: isCode ? 'Consolas, Monaco, "Courier New", monospace' : 'inherit',
                        fontSize: isCode ? '0.88rem' : '0.94rem',
                        lineHeight: 1.6,
                        flex: 1,
                        minWidth: 0,
                      }}>{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="qwv-sidebar">
            {/* Time Remaining */}
            {timeLeft !== null && (
              <div className="qwv-timer-card">
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--grey-blue)' }}>Time Remaining</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 700, color: isLowTime ? '#FF5252' : '#FFA826' }}>
                  {fmtTime(timeLeft)}
                </span>
              </div>
            )}

            {/* Question Navigator */}
            <div className="qwv-navigator-card">
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Question Navigator</h4>
              <div className="qwv-numgrid">
                {detail.questions.map((item, idx) => (
                  <button key={idx} onClick={() => onGoTo(idx)}
                    className={`qwv-numbtn${idx === currentIdx ? ' cur' : answers[item.uuid_question] ? ' ans' : ''}`}>
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={onPrev} disabled={currentIdx === 0} className="qwv-btn qwv-btn-prev" style={{ flex: 1 }}>
                Previous
              </button>
              {currentIdx === total - 1 ? (
                <button onClick={onFinish} className="qwv-btn qwv-btn-finish" style={{ flex: 1 }}>
                  Submit
                </button>
              ) : (
                <button onClick={onNext} className="qwv-btn qwv-btn-next" style={{ flex: 1 }}>
                  Next
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
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
            description: q.description || undefined,
            image_url: q.image_url || undefined,
            explanation: q.explanation || undefined,
            type: q.tipe_soal || q.type || 'MultipleChoice',
            options: normalizeQuestionOptions(q.opsi_jawaban || q.options || [])
          })),
          uuid_pembelajaran: d.uuid_pembelajaran || '',
        };
        setDetail(mapped);

        // 2) Try to fetch rekap — backend now returns uuid_quiz in each attempt record
        try {
          const rekapRes = await apiGet<any>('/api/quiz/rekap', { token: auth.token, headers: auth.headers });
          const rekapList: any[] = Array.isArray(rekapRes) ? rekapRes : (rekapRes?.data || []);
          // Match by uuid_quiz (backend fix ensures this field is present)
          const match = rekapList.find((r: any) => r.uuid_quiz === quizId);
          if (match) {
            setRekap({
              uuid_quiz: match.uuid_quiz,
              skor: match.score ?? match.skor,
              benar: match.benar,
              salah: match.salah,
              status: match.is_passed ? 'Selesai' : 'Tidak Lulus',
            });
          }
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
    if (rekap) {
      setError('Kuis ini telah Anda selesaikan.');
      return;
    }
    if (!detail.questions.length) {
      setError('Kuis belum memiliki soal yang valid. Silakan hubungi pengajar Anda.');
      return;
    }

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
    const courseId = searchParams.get('courseId') || detail?.uuid_pembelajaran;
    if (courseId) {
      router.push(`/student/kelas/detail?id=${courseId}`);
    } else {
      router.push('/student/kelas');
    }
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
    <div 
      className="quiz-page-container"
      style={{
        minHeight: '100vh',
        backgroundColor: '#070a13',
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(6, 113, 224, 0.12) 0px, transparent 50%),
          radial-gradient(at 50% 0%, rgba(124, 58, 237, 0.08) 0px, transparent 50%),
          radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.06) 0px, transparent 50%)
        `,
        backgroundAttachment: 'fixed',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <style>{`
        .quiz-page-container { padding: 2.5rem 1.5rem; }
        @media (max-width: 768px) {
          .quiz-page-container { padding: 0 !important; }
        }
      `}</style>
      <main style={{ maxWidth: view === 'quiz' ? '1200px' : '900px', margin: '0 auto' }}>
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
            onGoTo={(idx) => setCurrentIdx(idx)}
            onFinish={handleSubmit}
          />
        )}

        {view === 'result' && result && (
          <ResultView result={result} quizTitle={detail.nama_quiz} onBack={goBack} />
        )}
      </main>
    </div>
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
