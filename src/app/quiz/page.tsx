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
        .qwv-root { display:flex; flex-direction:column; gap:1rem; animation:qwv-in 0.35s ease-out; }
        @keyframes qwv-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes qwv-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,82,82,0.5)} 60%{box-shadow:0 0 0 8px rgba(255,82,82,0)} }
        @keyframes qwv-opt-in { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes qwv-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* TOP BAR */
        .qwv-topbar {
          display:flex; justify-content:space-between; align-items:center;
          gap:1rem; flex-wrap:wrap;
          background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
          border-radius:18px; padding:14px 22px;
          backdrop-filter:blur(12px); box-shadow:0 4px 24px rgba(0,0,0,0.15);
        }
        .qwv-quiz-name { font-size:0.7rem; color:var(--grey); text-transform:uppercase; letter-spacing:0.08em; font-weight:600; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:260px; }
        .qwv-soal-counter { color:#fff; font-size:1rem; font-weight:700; }
        .qwv-soal-counter span { color:var(--grey); font-weight:400; font-size:0.85rem; }
        .qwv-timer { display:flex; align-items:center; gap:10px; padding:10px 18px; border-radius:12px; transition:all 0.3s; white-space:nowrap; }
        .qwv-timer.normal { background:rgba(65,150,240,0.1); border:1px solid rgba(65,150,240,0.2); }
        .qwv-timer.danger { background:rgba(255,82,82,0.12); border:1px solid rgba(255,82,82,0.3); animation:qwv-pulse 1.2s infinite; }
        .qwv-timer-text { font-family:"SF Mono","Roboto Mono",monospace; font-weight:800; font-size:1.25rem; letter-spacing:2px; }

        /* PROGRESS */
        .qwv-progress-track { height:4px; border-radius:4px; background:rgba(255,255,255,0.07); overflow:hidden; }
        .qwv-progress-fill {
          height:100%; border-radius:4px;
          background:linear-gradient(90deg,var(--azure),#B388FF,#E040FB,var(--azure));
          background-size:300% 100%;
          transition:width 0.5s cubic-bezier(0.4,0,0.2,1);
          animation:qwv-shimmer 3s linear infinite;
        }

        /* BODY */
        .qwv-body { display:flex; gap:1.25rem; align-items:flex-start; }

        /* SIDEBAR */
        .qwv-sidebar {
          width:192px; flex-shrink:0;
          background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.07);
          border-radius:18px; padding:18px;
          position:sticky; top:76px; backdrop-filter:blur(12px);
          box-shadow:0 4px 20px rgba(0,0,0,0.1);
        }
        .qwv-sidebar-title { font-size:0.62rem; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:var(--grey); padding-bottom:10px; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.07); }
        .qwv-legend { display:flex; flex-direction:column; gap:5px; margin-bottom:14px; }
        .qwv-legend-item { display:flex; align-items:center; gap:7px; font-size:0.63rem; color:var(--grey); }
        .qwv-legend-dot { width:8px; height:8px; border-radius:2px; flex-shrink:0; }
        .qwv-numgrid { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; }
        .qwv-numgrid.cols5 { grid-template-columns:repeat(5,1fr); }
        .qwv-numbtn {
          aspect-ratio:1; border-radius:7px; display:flex; align-items:center; justify-content:center;
          font-size:0.7rem; font-weight:700; cursor:pointer;
          border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); color:var(--grey);
          transition:all 0.15s; font-family:inherit;
        }
        .qwv-numbtn:hover { transform:scale(1.1); border-color:rgba(255,255,255,0.22); color:#fff; background:rgba(255,255,255,0.08); }
        .qwv-numbtn.cur { background:linear-gradient(135deg,var(--azure),#7C3AED); color:#fff; border-color:rgba(100,160,255,0.5); box-shadow:0 3px 12px rgba(65,150,240,0.4); }
        .qwv-numbtn.ans { background:rgba(0,200,83,0.14); color:#00C853; border-color:rgba(0,200,83,0.35); }
        .qwv-sidebar-stat { margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.06); text-align:center; }
        .qwv-sidebar-stat-num { font-size:1.15rem; font-weight:900; color:#00C853; line-height:1.1; }
        .qwv-sidebar-stat-num span { color:var(--grey); font-weight:400; font-size:0.9rem; }
        .qwv-sidebar-stat-label { font-size:0.62rem; color:var(--grey); margin-top:2px; }

        /* CONTENT */
        .qwv-content { flex:1; min-width:0; }
        .qwv-card {
          background:rgba(255,255,255,0.028); border:1px solid rgba(255,255,255,0.08);
          border-radius:20px; padding:2rem 2.25rem;
          position:relative; overflow:hidden;
          backdrop-filter:blur(16px); box-shadow:0 8px 40px rgba(0,0,0,0.18);
        }
        .qwv-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--azure),#B388FF,#E040FB); }
        .qwv-card-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:10px; }
        .qwv-card-hd-left { display:flex; align-items:center; gap:12px; }
        .qwv-q-badge {
          width:44px; height:44px; border-radius:13px; flex-shrink:0;
          background:linear-gradient(135deg,var(--azure),#7C3AED);
          display:flex; align-items:center; justify-content:center;
          font-weight:900; font-size:1.05rem; color:#fff;
          box-shadow:0 6px 18px rgba(65,150,240,0.35);
        }
        .qwv-chip { font-size:0.67rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; padding:5px 12px; border-radius:8px; display:flex; align-items:center; gap:5px; }
        .qwv-chip-mc { background:rgba(65,150,240,0.1); color:var(--azure); border:1px solid rgba(65,150,240,0.2); }
        .qwv-chip-cb { background:rgba(224,64,251,0.1); color:#E040FB; border:1px solid rgba(224,64,251,0.2); }
        .qwv-chip-tf { background:rgba(255,168,38,0.1); color:#FFA826; border:1px solid rgba(255,168,38,0.2); }
        .qwv-q-pos { font-size:0.75rem; color:var(--grey); font-weight:500; }

        /* QUESTION TEXT */
        .qwv-q-text { font-size:1.15rem; font-weight:600; color:#fff; line-height:1.78; margin:0 0 1.75rem; letter-spacing:0.01em; }

        /* OPTIONS */
        .qwv-options { display:flex; flex-direction:column; gap:0.75rem; }
        .qwv-opt {
          display:flex; align-items:center; gap:14px;
          padding:14px 18px; border-radius:13px;
          border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.03);
          cursor:pointer; text-align:left; color:#fff; font-size:0.95rem;
          font-family:inherit; width:100%;
          transition:border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s;
          animation:qwv-opt-in 0.25s ease both;
          position:relative; overflow:hidden;
        }
        .qwv-opt:hover { border-color:rgba(255,255,255,0.2); transform:translateX(3px); background:rgba(255,255,255,0.045); }
        .qwv-opt.sel { border:1.5px solid rgba(65,150,240,0.7); background:rgba(65,150,240,0.1); box-shadow:0 4px 20px rgba(65,150,240,0.14), inset 0 1px 0 rgba(255,255,255,0.06); transform:translateX(0); }
        .qwv-opt-key {
          display:flex; align-items:center; justify-content:center;
          width:36px; height:36px; border-radius:10px; flex-shrink:0;
          background:rgba(255,255,255,0.07); color:var(--grey-blue);
          font-weight:800; font-size:0.88rem; transition:all 0.2s; position:relative; z-index:1;
        }
        .qwv-opt.sel .qwv-opt-key { background:linear-gradient(135deg,var(--azure),#7C3AED); color:#fff; box-shadow:0 3px 10px rgba(65,150,240,0.3); }
        .qwv-opt-txt { flex:1; line-height:1.55; position:relative; z-index:1; }

        /* NAV */
        .qwv-nav { display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-top:2rem; padding-top:1.5rem; border-top:1px solid rgba(255,255,255,0.07); }
        .qwv-btn { display:flex; align-items:center; gap:8px; padding:12px 24px; border-radius:12px; font-size:0.9rem; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.2s; border:none; }
        .qwv-btn-prev { background:rgba(255,255,255,0.06); color:var(--grey-blue); border:1px solid rgba(255,255,255,0.1) !important; }
        .qwv-btn-prev:hover:not(:disabled) { background:rgba(255,255,255,0.11); color:#fff; transform:translateX(-2px); }
        .qwv-btn-prev:disabled { opacity:0.32; cursor:not-allowed; }
        .qwv-btn-next { background:linear-gradient(135deg,var(--azure),#5E35B1); color:#fff; box-shadow:0 4px 16px rgba(65,150,240,0.3); }
        .qwv-btn-next:hover { box-shadow:0 6px 24px rgba(65,150,240,0.45); transform:translateY(-1px); }
        .qwv-btn-finish { background:linear-gradient(135deg,#00C853,#00BCD4); color:#fff; box-shadow:0 4px 16px rgba(0,200,83,0.35); }
        .qwv-btn-finish:hover { box-shadow:0 6px 24px rgba(0,200,83,0.5); transform:translateY(-1px); }

        /* MOBILE NUMBER STRIP */
        .qwv-mob-strip {
          display:none; overflow-x:auto; gap:5px; align-items:center;
          background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.07);
          border-radius:12px; padding:10px 12px; scrollbar-width:none;
        }
        .qwv-mob-strip::-webkit-scrollbar { display:none; }
        .qwv-mob-btn {
          flex-shrink:0; width:32px; height:32px; border-radius:8px;
          display:flex; align-items:center; justify-content:center;
          font-size:0.72rem; font-weight:700; cursor:pointer;
          border:1px solid rgba(255,255,255,0.09); color:var(--grey);
          background:rgba(255,255,255,0.04); font-family:inherit; transition:all 0.15s;
        }
        .qwv-mob-btn.cur { background:linear-gradient(135deg,var(--azure),#7C3AED); color:#fff; border-color:transparent; box-shadow:0 2px 8px rgba(65,150,240,0.35); }
        .qwv-mob-btn.ans { background:rgba(0,200,83,0.14); color:#00C853; border-color:rgba(0,200,83,0.35); }

        /* RESPONSIVE */
        @media (max-width:700px) {
          .qwv-sidebar { display:none !important; }
          .qwv-mob-strip { display:flex; }
          .qwv-body { display:block; }
          .qwv-card { padding:1.25rem 1rem; border-radius:16px; }
          .qwv-q-text { font-size:1rem; margin-bottom:1.25rem; }
          .qwv-opt { padding:12px 14px; font-size:0.9rem; }
          .qwv-opt-key { width:32px; height:32px; font-size:0.8rem; }
          .qwv-btn { padding:10px 16px; font-size:0.85rem; }
          .qwv-topbar { padding:12px 16px; border-radius:14px; }
          .qwv-quiz-name { max-width:160px; }
          .qwv-timer-text { font-size:1.1rem; }
        }
        @media (max-width:400px) {
          .qwv-btn { padding:9px 12px; font-size:0.8rem; gap:5px; }
          .qwv-card { padding:1rem 0.85rem; }
        }
      `}</style>

      <div className="qwv-root">
        {/* TOP BAR */}
        <div className="qwv-topbar">
          <div>
            <div className="qwv-quiz-name">{detail.nama_quiz}</div>
            <div className="qwv-soal-counter">Soal {currentIdx + 1} <span>dari {total}</span></div>
          </div>
          <div className={`qwv-timer ${isLowTime ? 'danger' : 'normal'}`}>
            <Clock size={17} color={isLowTime ? '#FF5252' : 'var(--azure)'} />
            <span className="qwv-timer-text" style={{ color: isLowTime ? '#FF5252' : '#fff' }}>{fmtTime(timeLeft)}</span>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="qwv-progress-track">
          <div className="qwv-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* MOBILE STRIP */}
        <div className="qwv-mob-strip">
          {detail.questions.map((item, idx) => (
            <button key={idx} onClick={() => onGoTo(idx)}
              className={`qwv-mob-btn${idx === currentIdx ? ' cur' : answers[item.uuid_question] ? ' ans' : ''}`}>
              {idx + 1}
            </button>
          ))}
        </div>

        {/* BODY */}
        <div className="qwv-body">

          {/* SIDEBAR */}
          <div className="qwv-sidebar">
            <div className="qwv-sidebar-title">Navigasi Soal</div>
            <div className="qwv-legend">
              <div className="qwv-legend-item">
                <div className="qwv-legend-dot" style={{ background: 'linear-gradient(135deg,var(--azure),#7C3AED)' }} />
                Dikerjakan
              </div>
              <div className="qwv-legend-item">
                <div className="qwv-legend-dot" style={{ background: 'rgba(0,200,83,0.3)', border: '1px solid rgba(0,200,83,0.5)' }} />
                Dijawab
              </div>
              <div className="qwv-legend-item">
                <div className="qwv-legend-dot" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)' }} />
                Belum dijawab
              </div>
            </div>
            <div className={`qwv-numgrid${total > 20 ? ' cols5' : ''}`}>
              {detail.questions.map((item, idx) => (
                <button key={idx} onClick={() => onGoTo(idx)} title={`Soal ${idx + 1}`}
                  className={`qwv-numbtn${idx === currentIdx ? ' cur' : answers[item.uuid_question] ? ' ans' : ''}`}>
                  {idx + 1}
                </button>
              ))}
            </div>
            <div className="qwv-sidebar-stat">
              <div className="qwv-sidebar-stat-num">{answeredCount}<span>/{total}</span></div>
              <div className="qwv-sidebar-stat-label">soal dijawab</div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="qwv-content">
            <div className="qwv-card">
              {/* Header */}
              <div className="qwv-card-hd">
                <div className="qwv-card-hd-left">
                  <div className="qwv-q-badge">{currentIdx + 1}</div>
                  <span className={`qwv-chip ${q.type === 'Checkbox' ? 'qwv-chip-cb' : q.type === 'TrueFalse' ? 'qwv-chip-tf' : 'qwv-chip-mc'}`}>
                    <FileQuestion size={11} />{typeLabel}
                  </span>
                </div>
                <span className="qwv-q-pos">{currentIdx + 1} / {total}</span>
              </div>

              {/* Question */}
              <p className="qwv-q-text">{q.question_text}</p>

              {/* Options */}
              <div className="qwv-options">
                {q.options.map((opt, oi) => {
                  const isSel = q.type === 'Checkbox'
                    ? Array.isArray(currentAnswer) && currentAnswer.includes(opt.id)
                    : currentAnswer === opt.id;
                  return (
                    <button key={opt.id} onClick={() => onSelect(q.uuid_question, opt.id)}
                      className={`qwv-opt${isSel ? ' sel' : ''}`}
                      style={{ animationDelay: `${oi * 0.04}s` }}>
                      <span className="qwv-opt-key">
                        {q.type === 'Checkbox' ? (isSel ? '✓' : <span style={{ opacity: 0.25, fontWeight: 400 }}>□</span>) : opt.id}
                      </span>
                      <span className="qwv-opt-txt">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="qwv-nav">
                <button id="btn-prev" onClick={onPrev} disabled={currentIdx === 0} className="qwv-btn qwv-btn-prev">
                  <ChevronLeft size={17} /> Sebelumnya
                </button>
                {currentIdx === total - 1
                  ? <button id="btn-finish" onClick={onFinish} className="qwv-btn qwv-btn-finish"><Send size={15} /> Selesai Kuis</button>
                  : <button id="btn-next" onClick={onNext} className="qwv-btn qwv-btn-next">Selanjutnya <ChevronRight size={17} /></button>
                }
              </div>
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
            type: q.tipe_soal || q.type || 'MultipleChoice',
            options: normalizeQuestionOptions(q.opsi_jawaban || q.options || [])
          })),
          uuid_pembelajaran: d.uuid_pembelajaran || '',
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
    <main style={{ padding: '2rem 1.5rem', maxWidth: view === 'quiz' ? '1140px' : '900px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
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
