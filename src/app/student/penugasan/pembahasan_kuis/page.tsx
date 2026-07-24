'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import {
  ArrowLeft, Loader2, AlertCircle, Brain, XCircle,
  Calendar, Check, Trophy
} from 'lucide-react';

function getAuth() {
  const token = getStoredToken();
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) headers['x-api-key'] = apiKey;
  else if (token) headers['x-api-key'] = token;
  return { token: token || undefined, headers };
}

interface Option {
  id: string;
  text: string;
}

interface QuestionItem {
  uuid_question: string;
  question_text: string;
  description?: string;
  image_url?: string;
  type: string;
  options: Option[];
}

interface AnswerDetail {
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

interface QuizDetail {
  uuid_quiz: string;
  title: string;
  description?: string;
  asal_pembelajaran: string;
  waktu_pengerjaan: number;
  questions: QuestionItem[];
}

interface RekapResult {
  uuid_attempt: string;
  uuid_quiz: string;
  score: number;
  benar: number;
  salah: number;
  is_passed: boolean;
  completed_at?: string;
  answers: AnswerDetail[];
}

function AnswerCard({ item, questions }: { item: AnswerDetail; questions: QuestionItem[] }) {
  const originalQ = questions.find(q => q.uuid_question === item.uuid_question);
  
  const rawOptionsList = (item as any).options && (item as any).options.length > 0
    ? (item as any).options
    : (originalQ?.options || []);
    
  // Sort options alphabetically by ID so they appear as A, B, C, D regardless of backend shuffling
  const optionsList: Option[] = [...rawOptionsList].sort((a, b) => {
    return String(a.id).localeCompare(String(b.id));
  });

  const correctIds: string[] = Array.isArray(item.correct_answer)
    ? item.correct_answer.map((c: any) => String(c.id ?? c).trim().toLowerCase())
    : [];

  const noAnswer = item.submitted_answer === null || item.submitted_answer === undefined;
  const submittedIds: string[] = noAnswer
    ? []
    : Array.isArray(item.submitted_answer)
      ? item.submitted_answer.map((s: any) => String(s).trim().toLowerCase())
      : [String(item.submitted_answer).trim().toLowerCase()];

  // Resolve full text for display
  let displaySubmitted = 'Tidak dijawab';
  if (!noAnswer) {
    if (originalQ?.type === 'Essay') {
      displaySubmitted = String(item.submitted_answer);
    } else {
      const selectedIndices = optionsList
        .map((o, idx) => ({ o, idx }))
        .filter(({ o }) => submittedIds.includes(String(o.id).trim().toLowerCase()));
      if (selectedIndices.length > 0) {
        displaySubmitted = selectedIndices.map(({ o, idx }) => 
          originalQ?.type === 'TrueFalse' ? o.text : `${String.fromCharCode(65 + idx)}. ${o.text}`
        ).join('\n');
      } else {
        displaySubmitted = String(item.submitted_answer);
      }
    }
  }

  let displayCorrect = '-';
  if (Array.isArray(item.correct_answer)) {
    const correctIndices = optionsList
      .map((o, idx) => ({ o, idx }))
      .filter(({ o }) => correctIds.includes(String(o.id).trim().toLowerCase()));
    if (correctIndices.length > 0) {
      displayCorrect = correctIndices.map(({ o, idx }) => 
        originalQ?.type === 'TrueFalse' ? o.text : `${String.fromCharCode(65 + idx)}. ${o.text}`
      ).join('\n');
    } else {
      displayCorrect = item.correct_answer.map((c: any) => c.text || c.id || c).join('\n');
    }
  }

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
          {item.is_correct ? '✓' : '✗'}
        </div>
        <p style={{ flex: 1, margin: 0, fontSize: '1rem', color: '#E2E8F0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {item.question_text}
        </p>
        <span style={{
          flexShrink: 0, fontSize: '0.75rem', padding: '4px 12px', borderRadius: 20, fontWeight: 700,
          background: item.is_correct ? 'rgba(0,200,83,0.12)' : 'rgba(255,82,82,0.12)',
          color: item.is_correct ? '#00C853' : '#FF5252',
        }}>
          {item.is_correct ? 'Benar' : 'Salah'}
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

      {optionsList.length > 0 && originalQ?.type !== 'Essay' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {optionsList.map(opt => {
            const optIdLower = String(opt.id).trim().toLowerCase();
            const isSubmittedOpt = submittedIds.includes(optIdLower);
            
            // Hanya warnai hijau jika itu jawaban siswa dan benar, merah jika jawaban siswa dan salah.
            // Opsi lain yang benar tetapi tidak dipilih siswa tetap berwarna abu-abu biasa (tidak dibocorkan).
            let border = '1px solid rgba(255,255,255,0.06)';
            let bg = 'rgba(255,255,255,0.01)';
            let textColor = 'var(--grey-blue)';
            
            if (isSubmittedOpt) {
              if (item.is_correct) {
                border = '1px solid rgba(0,200,83,0.35)';
                bg = 'rgba(0,200,83,0.07)';
                textColor = '#00C853';
              } else {
                border = '1px solid rgba(255,82,82,0.35)';
                bg = 'rgba(255,82,82,0.07)';
                textColor = '#FF5252';
              }
            }

            return (
              <div key={opt.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, border, background: bg, color: textColor }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSubmittedOpt ? (item.is_correct ? '#00C853' : '#FF5252') : 'rgba(255,255,255,0.06)', color: isSubmittedOpt ? '#fff' : 'var(--grey-blue)', fontSize: '0.72rem', fontWeight: 800 }}>
                  {originalQ?.type === 'TrueFalse' ? '' : opt.id.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.9rem', flex: 1, whiteSpace: 'pre-wrap', fontFamily: /[{};()=>]/.test(opt.text) ? 'monospace' : 'inherit' }}>
                  {opt.text}
                </span>
                {isSubmittedOpt && item.is_correct && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#00C853', flexShrink: 0 }}>✓ Jawaban Anda Benar</span>}
                {isSubmittedOpt && !item.is_correct && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FF5252', flexShrink: 0 }}>✗ Jawaban Anda Salah</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Hanya tampilkan Jawaban Anda, hapus Jawaban Benar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '0.5rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--grey)', marginBottom: '4px', fontWeight: 600 }}>Jawaban Anda:</div>
          <strong style={{ color: noAnswer ? 'var(--grey)' : (item.is_correct ? '#00E676' : '#FF5252'), fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
            {displaySubmitted}
          </strong>
        </div>
      </div>
    </div>
  );
}

function PembahasanKuisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizDetail, setQuizDetail] = useState<QuizDetail | null>(null);
  const [rekap, setRekap] = useState<RekapResult | null>(null);

  useEffect(() => {
    if (!quizId) {
      setError('Quiz ID tidak ditemukan');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const auth = getAuth();

        // 1. Ambil detail kuis
        const qRes = await apiGet<any>(`/api/quiz/${quizId}`, { token: auth.token, headers: auth.headers });
        const qData = qRes.data || qRes;

        const detailObj: QuizDetail = {
          uuid_quiz: qData.uuid_quiz || quizId,
          title: qData.nama_quiz || qData.title || 'Kuis',
          description: qData.deskripsi || qData.description,
          asal_pembelajaran: qData.asal_pembelajaran || qData.nama_pembelajaran || '',
          waktu_pengerjaan: qData.waktu_pengerjaan || 30,
          questions: (qData.daftar_soal || qData.questions || []).map((q: any) => ({
            uuid_question: q.uuid_question || q.id,
            question_text: q.detail_soal || q.question_text || '',
            description: q.description,
            image_url: q.image_url,
            type: q.tipe_soal || q.type || 'MultipleChoice',
            options: (q.opsi_jawaban || q.options || []).map((o: any) => ({
              id: o.uuid_opsi || o.id || o.label || '',
              text: o.detail_opsi || o.text || o.option_text || ''
            }))
          }))
        };
        setQuizDetail(detailObj);

        const attemptId = searchParams.get('attempt');
        const userStr = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
        const userObj = userStr ? JSON.parse(userStr) : null;
        const studentId = userObj?.uuid_user || userObj?.id;

        if (studentId) {
          const rekapRes = await apiGet<any>(`/api/students/${studentId}/quiz-rekap`, { token: auth.token, headers: auth.headers });
          const rekapList: any[] = Array.isArray(rekapRes) ? rekapRes : (rekapRes?.data || []);

          // Match by attemptId, or fallback to matching quiz_title with the detailObj.title
          const match = rekapList.find((att: any) =>
            (attemptId && att.uuid_attempt === attemptId) ||
            (att.quiz_title && att.quiz_title.trim().toLowerCase() === detailObj.title.trim().toLowerCase())
          );

          if (match) {
            let answers: AnswerDetail[] = [];
            if (match.answers) {
              if (typeof match.answers === 'string') {
                try { const p = JSON.parse(match.answers); answers = Array.isArray(p) ? p : (p.answers || []); } catch { }
              } else if (Array.isArray(match.answers)) {
                answers = match.answers as AnswerDetail[];
              }
            }
            setRekap({
              uuid_attempt: match.uuid_attempt,
              uuid_quiz: match.uuid_quiz || quizId,
              score: match.score ?? match.skor ?? 0,
              benar: answers.filter(a => a.is_correct).length,
              salah: answers.filter(a => !a.is_correct).length,
              is_passed: match.is_passed ?? (match.score >= 75),
              completed_at: match.completed_at || match.updated_at,
              answers
            });
          }
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat pembahasan kuis.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [quizId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
        <Loader2 size={40} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--grey-blue)' }}>Memuat pembahasan kuis...</p>
      </div>
    );
  }

  if (error || !quizDetail || !rekap) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12, padding: '2rem' }}>
        <AlertCircle size={40} color="#FF5252" />
        <p style={{ color: '#FF5252', textAlign: 'center' }}>{error || 'Riwayat pengerjaan kuis tidak ditemukan.'}</p>
        <button onClick={() => router.back()} style={{ marginTop: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 18px', color: '#fff', cursor: 'pointer' }}>Kembali</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <button
          type="button"
          onClick={() => router.push('/student/penugasan')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 18px', color: '#E2E8F0', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', marginBottom: '2rem' }}
        >
          <ArrowLeft size={16} /> Kembali ke Penugasan
        </button>

        {/* Result Header Card */}
        <div style={{ borderRadius: 20, border: `1px solid ${rekap.is_passed ? 'rgba(0,200,83,0.3)' : 'rgba(255,82,82,0.3)'}`, background: 'rgba(255,255,255,0.02)', padding: '2.5rem 2rem', textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: rekap.is_passed ? 'rgba(0,200,83,0.1)' : 'rgba(255,82,82,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Trophy size={40} color="#00E676" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
            {rekap.is_passed ? 'Kuis Selesai - Lulus KKM!' : 'Kuis Selesai - Di Bawah KKM'}
          </h2>
          <p style={{ color: 'var(--grey-blue)', fontSize: '0.92rem', margin: '0 0 1.5rem' }}>{quizDetail.title}</p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {[
              { val: `${rekap.score}%`, label: 'Skor Kuis', color: rekap.is_passed ? '#00E676' : '#FF5252' },
              { val: rekap.benar, label: 'Benar', color: '#00E676' },
              { val: rekap.salah, label: 'Salah', color: '#FF5252' },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 24px', minWidth: 100 }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: item.color }}>{item.val}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--grey-blue)', textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Answers List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {rekap.answers.map((item, idx) => (
            <AnswerCard key={item.uuid_question || idx} item={item} questions={quizDetail.questions} />
          ))}
        </div>

      </div>
      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function PembahasanKuisPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} color="var(--azure)" />
      </div>
    }>
      <PembahasanKuisContent />
    </Suspense>
  );
}
