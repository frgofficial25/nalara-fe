'use client';

import React, { useState } from 'react';
import { useQuiz } from '../../hooks/useQuiz';
import Card from '../../components/quiz/Card';
import Button from '../../components/quiz/Button';
import QuestionCard from '../../components/quiz/QuestionCard';
import QuizTimer from '../../components/quiz/QuizTimer';
import { Quiz, QuizQuestion } from '../../types/quiz.types';

/* ---- Mock Data (from supabase_schema_v4_3_quiz.sql) ---- */
const MOCK_QUIZ: Quiz = {
  id: 'c0000000-0000-0000-0000-000000000001',
  module_id: 'b0000000-0000-0000-0000-000000000001',
  title: 'Quiz: Persediaan (Inventory)',
  description:
    'Uji pemahaman Anda tentang metode penilaian persediaan — FIFO, Rata-rata Tertimbang, dan LCNRV berdasarkan PSAK 14.',
  time_limit_minutes: 20,
  passing_score: 60,
  max_attempts: 3,
  difficulty_level: 'beginner',
  is_published: true,
  created_by: null,
  created_at: new Date().toISOString(),
};

const MOCK_QUESTIONS: QuizQuestion[] = [
  {
    id: 'd1', quiz_id: MOCK_QUIZ.id, order_index: 1,
    question_text: 'Dalam metode FIFO, persediaan akhir dinilai berdasarkan harga pembelian yang mana?',
    question_type: 'mcq', explanation: 'Pada FIFO, barang pertama masuk pertama keluar — persediaan akhir terdiri dari barang paling BARU dibeli.',
    points: 10, difficulty_level: 'beginner', topic_tag: 'FIFO', created_at: '',
    options: [
      { id: 'o1', question_id: 'd1', option_label: 'A', option_text: 'Harga pembelian paling lama', is_correct: false },
      { id: 'o2', question_id: 'd1', option_label: 'B', option_text: 'Harga pembelian paling baru', is_correct: true },
      { id: 'o3', question_id: 'd1', option_label: 'C', option_text: 'Harga rata-rata semua pembelian', is_correct: false },
      { id: 'o4', question_id: 'd1', option_label: 'D', option_text: 'Harga pasar saat ini', is_correct: false },
    ],
  },
  {
    id: 'd2', quiz_id: MOCK_QUIZ.id, order_index: 2,
    question_text: 'PT Maju: Saldo awal 100 unit @Rp10.000, Beli 200 unit @Rp12.000. Dijual 150 unit. HPP metode FIFO?',
    question_type: 'numeric', explanation: 'FIFO: 100×10.000 + 50×12.000 = 1.600.000',
    points: 10, difficulty_level: 'intermediate', topic_tag: 'FIFO', created_at: '',
  },
  {
    id: 'd3', quiz_id: MOCK_QUIZ.id, order_index: 3,
    question_text: 'Metode Rata-rata Tertimbang menghitung harga pokok per unit dengan membagi total biaya barang tersedia dengan total unit tersedia.',
    question_type: 'true_false', explanation: 'Definisi dasar Weighted Average.',
    points: 10, difficulty_level: 'beginner', topic_tag: 'Rata-rata', created_at: '',
    options: [
      { id: 'o5', question_id: 'd3', option_label: 'A', option_text: 'Benar', is_correct: true },
      { id: 'o6', question_id: 'd3', option_label: 'B', option_text: 'Salah', is_correct: false },
    ],
  },
];

export default function QuizPage() {
  const [view, setView] = useState<'home' | 'quiz' | 'result'>('home');
  const {
    state, startAttempt, selectMCQOption, selectMultiSelectOption,
    setNumericAnswer, setShortAnswer, nextQuestion, prevQuestion,
    submitQuiz, tickTime,
  } = useQuiz({ quiz: MOCK_QUIZ, questionsList: MOCK_QUESTIONS });

  const handleStart = async () => { await startAttempt(); setView('quiz'); };
  const handleSubmit = async () => { await submitQuiz(); setView('result'); };

  const currentQuestion = state.questions[state.currentQuestionIndex];
  const currentAnswer = state.answers[currentQuestion?.id] || {};
  const progress = state.attempt ? ((state.currentQuestionIndex + 1) / state.questions.length) * 100 : 0;

  return (
    <main style={{ padding: '2rem 1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--azure)', fontSize: '0.9rem', textDecoration: 'none' }}>
        ← Kembali ke Beranda
      </a>

      {view === 'home' && (
        <Card glow style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="badge-tech badge-tech-accent" style={{ marginBottom: '1rem', display: 'inline-flex' }}>Demo Quiz Engine</span>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>{MOCK_QUIZ.title}</h2>
          <p style={{ marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem auto' }}>{MOCK_QUIZ.description}</p>
          <Button id="btn-start-quiz" onClick={handleStart} variant="primary" style={{ padding: '0.85rem 2.5rem', fontSize: '1.05rem' }}>
            Mulai Quiz
          </Button>
        </Card>
      )}

      {view === 'quiz' && currentQuestion && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--grey-blue)', marginBottom: '0.5rem' }}>Progress: {state.currentQuestionIndex + 1}/{state.questions.length}</div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--navy), var(--azure))', transition: 'width 0.3s ease' }} />
              </div>
            </div>
            <QuizTimer secondsLeft={state.timeLeftSeconds} formattedTime={new Date(state.timeLeftSeconds * 1000).toISOString().substr(14, 5)} onTick={tickTime} isRunning={!state.isCompleted} />
          </div>

          <QuestionCard question={currentQuestion} index={state.currentQuestionIndex} totalQuestions={state.questions.length}
            selectedOptionId={currentAnswer.selected_option_id} selectedOptionIds={currentAnswer.selected_option_ids}
            numericAnswer={currentAnswer.numeric_answer} textAnswer={currentAnswer.text_answer}
            onMCQSelect={(id) => selectMCQOption(currentQuestion.id, id)}
            onMultiSelect={(id) => selectMultiSelectOption(currentQuestion.id, id)}
            onNumericChange={(v) => setNumericAnswer(currentQuestion.id, v)}
            onTextChange={(v) => setShortAnswer(currentQuestion.id, v)}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button id="btn-prev" onClick={prevQuestion} variant={state.currentQuestionIndex === 0 ? 'disabled' : 'secondary'} disabled={state.currentQuestionIndex === 0}>← Sebelumnya</Button>
            {state.currentQuestionIndex === state.questions.length - 1
              ? <Button id="btn-submit" onClick={handleSubmit} variant="primary">Kirim Jawaban ✓</Button>
              : <Button id="btn-next" onClick={nextQuestion} variant="primary">Selanjutnya →</Button>}
          </div>
        </div>
      )}

      {view === 'result' && state.attempt && (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>Hasil Quiz</h2>
          <div style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{state.attempt.percentage}%</div>
          <span className={`badge-tech ${state.attempt.percentage! >= MOCK_QUIZ.passing_score ? '' : 'badge-tech-accent'}`}>
            {state.attempt.percentage! >= MOCK_QUIZ.passing_score ? '✅ LULUS' : '❌ TIDAK LULUS'}
          </span>
          <p style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
            Skor: {state.attempt.score} poin | Waktu: {Math.floor(state.attempt.time_spent_seconds! / 60)}m {state.attempt.time_spent_seconds! % 60}s
          </p>
          <Button id="btn-back" onClick={() => setView('home')} variant="secondary">Kembali</Button>
        </Card>
      )}
    </main>
  );
}
