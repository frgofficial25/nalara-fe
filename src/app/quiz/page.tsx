'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuiz } from '../../hooks/useQuiz';
import Card from '../../components/quiz/Card';
import Button from '../../components/quiz/Button';
import QuestionCard from '../../components/quiz/QuestionCard';
import QuizTimer from '../../components/quiz/QuizTimer';
import { Quiz, QuizQuestion, DifficultyLevel, QuestionType } from '../../types/quiz.types';
import { apiGet, apiPost } from '../../lib/api';
import { getStoredToken } from '../../services/auth';
import { Loader2, AlertCircle } from 'lucide-react';

interface QuizContentProps {
  quiz: Quiz;
  questionsList: QuizQuestion[];
  onBack: () => void;
}

function QuizContent({ quiz, questionsList, onBack }: QuizContentProps) {
  const [view, setView] = useState<'home' | 'quiz' | 'result'>('home');
  
  let userId = 'mock-user-123';
  if (typeof window !== 'undefined') {
    const localUser = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
    if (localUser) {
      try {
        const u = JSON.parse(localUser);
        if (u.id) userId = u.id;
      } catch {}
    }
  }

  const {
    state, startAttempt, selectMCQOption, selectMultiSelectOption,
    setNumericAnswer, setShortAnswer, nextQuestion, prevQuestion,
    submitQuiz, tickTime, setRawState
  } = useQuiz({ quiz, questionsList, userId });

  const handleStart = async () => { 
    await startAttempt(); 
    setView('quiz'); 
  };

  const handleSubmit = async () => {
    if (!state.attempt || state.isCompleted) return;

    setRawState((prev) => ({ ...prev, isSubmitting: true }));
    const submittedAt = new Date().toISOString();
    const timeSpent = Math.max(
      0,
      quiz.time_limit_minutes * 60 - state.timeLeftSeconds
    );

    let localScore = 0;
    const maxScore = state.questions.reduce((acc, q) => acc + q.points, 0);
    const answersToSync: any[] = [];

    state.questions.forEach((question) => {
      const answer = state.answers[question.id];
      let isCorrect = false;

      if (question.question_type === 'mcq' || question.question_type === 'true_false') {
        const correctOption = question.options?.find((o) => o.is_correct);
        isCorrect = answer?.selected_option_id === correctOption?.id;
      } else if (question.question_type === 'multi_select') {
        const correctOptions = question.options?.filter((o) => o.is_correct).map((o) => o.id) || [];
        const selectedIds = answer?.selected_option_ids || [];
        isCorrect =
          correctOptions.length === selectedIds.length &&
          correctOptions.every((id) => selectedIds.includes(id));
      } else if (question.question_type === 'numeric') {
        const correctAnswerString = question.explanation?.match(/\d+[\.,]?\d*/)?.[0] || '';
        const standardCleanedValue = correctAnswerString.replace(/\./g, '').replace(/,/g, '.');
        const correctVal = parseFloat(standardCleanedValue);
        isCorrect = answer?.numeric_answer === correctVal;
      }

      const pointsAwarded = isCorrect ? question.points : 0;
      localScore += pointsAwarded;

      let submitted_answer: any = '';
      if (answer?.selected_option_id) {
        submitted_answer = answer.selected_option_id;
      } else if (answer?.selected_option_ids) {
        submitted_answer = answer.selected_option_ids;
      } else if (answer?.numeric_answer !== undefined && answer?.numeric_answer !== null) {
        submitted_answer = answer.numeric_answer;
      } else if (answer?.text_answer) {
        submitted_answer = answer.text_answer;
      }

      answersToSync.push({
        uuid_question: question.id,
        submitted_answer
      });
    });

    const localPercentage = parseFloat(((localScore / maxScore) * 100).toFixed(2));
    
    let finalScore = localScore;
    let finalPercentage = localPercentage;

    try {
      const token = getStoredToken();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      } else if (token) {
        headers['x-api-key'] = token;
      }

      const payload = { answers: answersToSync };
      const res = await apiPost<any>(`/api/quiz/${quiz.id}/submit`, payload, {
        token: token || undefined,
        headers
      });

      const resData = res.data || res;
      if (resData.skor !== undefined) {
        finalPercentage = Number(resData.skor);
        finalScore = Math.round((finalPercentage / 100) * maxScore);
      } else if (resData.score !== undefined) {
        finalScore = Number(resData.score);
        finalPercentage = parseFloat(((finalScore / maxScore) * 100).toFixed(2));
      }
    } catch (err) {
      console.warn('API quiz submission failed, relying on client calculation:', err);
    }

    const finalAttempt = {
      ...state.attempt,
      submitted_at: submittedAt,
      score: finalScore,
      percentage: finalPercentage,
      status: 'submitted' as const,
      time_spent_seconds: timeSpent,
    };

    setRawState((prev) => ({
      ...prev,
      attempt: finalAttempt,
      isSubmitting: false,
      isCompleted: true,
    }));
    setView('result');
  };

  const currentQuestion = state.questions[state.currentQuestionIndex];
  const currentAnswer = state.answers[currentQuestion?.id] || {};
  const progress = state.attempt ? ((state.currentQuestionIndex + 1) / state.questions.length) * 100 : 0;

  return (
    <main style={{ padding: '2rem 1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--azure)', fontSize: '0.9rem', textDecoration: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
        ← Kembali ke Kelas
      </button>

      {view === 'home' && (
        <Card glow style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="badge-tech badge-tech-accent" style={{ marginBottom: '1rem', display: 'inline-flex' }}>Quiz Pembelajaran</span>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>{quiz.title}</h2>
          <p style={{ marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem auto' }}>{quiz.description || 'Selesaikan kuis ini untuk menguji pemahaman Anda.'}</p>
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
            <QuizTimer secondsLeft={state.timeLeftSeconds} formattedTime={new Date(state.timeLeftSeconds * 1000).toISOString().substring(14, 19)} onTick={tickTime} isRunning={!state.isCompleted} />
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
              ? <Button id="btn-submit" onClick={handleSubmit} variant="primary" disabled={state.isSubmitting}>{state.isSubmitting ? 'Mengirim...' : 'Kirim Jawaban ✓'}</Button>
              : <Button id="btn-next" onClick={nextQuestion} variant="primary">Selanjutnya →</Button>}
          </div>
        </div>
      )}

      {view === 'result' && state.attempt && (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>Hasil Quiz</h2>
          <div style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{state.attempt.percentage}%</div>
          <span className={`badge-tech ${state.attempt.percentage! >= quiz.passing_score ? '' : 'badge-tech-accent'}`}>
            {state.attempt.percentage! >= quiz.passing_score ? '✅ LULUS' : '❌ TIDAK LULUS'}
          </span>
          <p style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
            Skor: {state.attempt.score} poin | Waktu: {Math.floor(state.attempt.time_spent_seconds! / 60)}m {state.attempt.time_spent_seconds! % 60}s
          </p>
          <Button id="btn-back" onClick={onBack} variant="secondary">Kembali ke Kelas</Button>
        </Card>
      )}
    </main>
  );
}

export default function QuizPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const quizId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    if (!quizId) {
      setError('Quiz ID tidak ditemukan di URL');
      setLoading(false);
      return;
    }

    const fetchQuizDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = getStoredToken();
        const apiKey = process.env.NEXT_PUBLIC_API_KEY;
        const headers: Record<string, string> = {};
        if (apiKey) {
          headers['x-api-key'] = apiKey;
        } else if (token) {
          headers['x-api-key'] = token;
        }

        const res = await apiGet<any>(`/api/quiz/${quizId}`, {
          token: token || undefined,
          headers
        });

        const quizData = res.data || res;
        
        const mappedQuiz: Quiz = {
          id: quizData.uuid_quiz || quizData.id,
          module_id: quizData.uuid_modul || quizData.module_id || '',
          title: quizData.nama_quiz || quizData.title || 'Kuis',
          description: quizData.description || null,
          time_limit_minutes: quizData.time_limit ?? 30,
          passing_score: quizData.passing_score ?? 75,
          max_attempts: quizData.max_attempts ?? 1,
          difficulty_level: (quizData.difficulty?.toLowerCase() as DifficultyLevel) || 'beginner',
          is_published: quizData.is_published ?? true,
          created_by: quizData.created_by || null,
          created_at: quizData.created_at || new Date().toISOString(),
        };

        const mappedQuestions: QuizQuestion[] = (quizData.questions || []).map((q: any, idx: number) => {
          const apiType = q.type || q.question_type || 'MultipleChoice';
          let question_type: QuestionType = 'mcq';
          if (apiType === 'MultipleChoice' || apiType === 'mcq') {
            question_type = 'mcq';
          } else if (apiType === 'TrueFalse' || apiType === 'true_false') {
            question_type = 'true_false';
          } else if (apiType === 'Checkbox' || apiType === 'multi_select' || apiType === 'Checkbox') {
            question_type = 'multi_select';
          } else if (apiType === 'Numeric' || apiType === 'numeric') {
            question_type = 'numeric';
          } else {
            question_type = 'short_answer';
          }

          return {
            id: q.uuid_question || q.id || `q-${idx}`,
            quiz_id: mappedQuiz.id,
            order_index: idx + 1,
            question_text: q.question_text || q.question || '',
            question_type,
            explanation: q.explanation || null,
            points: q.weight || q.points || 10,
            difficulty_level: q.difficulty || 'beginner',
            topic_tag: q.topic_tag || null,
            created_at: q.created_at || new Date().toISOString(),
            options: (q.options || []).map((o: any) => ({
              id: o.id || '',
              question_id: q.uuid_question || q.id || `q-${idx}`,
              option_label: o.id || '',
              option_text: o.text || o.option_text || '',
              is_correct: !!o.is_correct,
            })),
          };
        });

        setQuiz(mappedQuiz);
        setQuestions(mappedQuestions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal mengambil data kuis dari server');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizDetails();
  }, [quizId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <Loader2 size={36} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--grey-blue)' }}>Memuat data kuis...</span>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <main style={{ padding: '2rem 1.5rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <Card style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <AlertCircle size={48} color="#FF5252" />
          <h2 style={{ fontSize: '1.5rem', color: '#fff' }}>Kuis Gagal Dimuat</h2>
          <p style={{ color: 'var(--grey-blue)' }}>{error || 'Kuis tidak ditemukan.'}</p>
          <Button onClick={() => router.push('/student/courses')} variant="secondary">Kembali ke Kelas</Button>
        </Card>
      </main>
    );
  }

  return (
    <QuizContent 
      quiz={quiz} 
      questionsList={questions} 
      onBack={() => {
        if (quiz.module_id) {
          router.push(`/student/courses/${quiz.module_id}`);
        } else {
          router.push('/student/courses');
        }
      }} 
    />
  );
}
