'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuiz } from '../../hooks/useQuiz';
import Card from '../../components/quiz/Card';
import Button from '../../components/quiz/Button';
import QuestionCard from '../../components/quiz/QuestionCard';
import QuizTimer from '../../components/quiz/QuizTimer';
import { Quiz, QuizQuestion, DifficultyLevel, QuestionType } from '../../types/quiz.types';
import { apiGet, apiPost } from '../../lib/api';
import { getStoredToken } from '../../services/auth';
import { Loader2, AlertCircle, Calendar, Clock, Award, ShieldAlert, CheckCircle, Brain, Play } from 'lucide-react';

interface QuizContentProps {
  quiz: Quiz;
  questionsList: QuizQuestion[];
  onBack: () => void;
  initialAttemptDetails: any;
}

function QuizContent({ quiz, questionsList, onBack, initialAttemptDetails }: QuizContentProps) {
  const router = useRouter();
  const [view, setView] = useState<'home' | 'quiz' | 'result'>('home');
  const [attemptDetails, setAttemptDetails] = useState<any>(initialAttemptDetails);
  
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

  // Status Pengerjaan (Terlambat / Selesai / Ditugaskan)
  const isFinished = !!attemptDetails;
  const isOverdue = !isFinished && quiz.created_at && Date.now() > new Date(quiz.created_at).getTime(); 
  // Wait, let's use the deadline/tenggat_pengerjaan if available
  const deadlineTime = quiz.created_at ? new Date(quiz.created_at).getTime() : 0; // fallback to created_at if no deadline
  const hasDeadlinePassed = deadlineTime > 0 && Date.now() > deadlineTime;
  
  let statusPengerjaan = 'Ditugaskan';
  if (isFinished) {
    statusPengerjaan = 'Selesai';
  } else if (hasDeadlinePassed) {
    statusPengerjaan = 'Terlambat';
  }

  // Timer Continuity logic
  useEffect(() => {
    if (view === 'quiz') {
      const storageKey = `nalara_quiz_end_${quiz.id}`;
      let endTime = localStorage.getItem(storageKey);
      
      if (!endTime) {
        // Set new end time
        const newEnd = Date.now() + quiz.time_limit_minutes * 60 * 1000;
        localStorage.setItem(storageKey, String(newEnd));
        endTime = String(newEnd);
      }
      
      const updateTimer = () => {
        const remaining = Math.max(0, Math.floor((Number(endTime) - Date.now()) / 1000));
        setRawState(prev => ({
          ...prev,
          timeLeftSeconds: remaining
        }));
        
        if (remaining <= 0) {
          handleSubmit();
        }
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [view]);

  const handleStart = async () => { 
    if (statusPengerjaan === 'Terlambat') {
      alert('Tenggat waktu kuis ini sudah lewat. Anda tidak dapat mengerjakan kuis ini.');
      return;
    }
    await startAttempt(); 
    setView('quiz'); 
  };

  const handleSubmit = async () => {
    localStorage.removeItem(`nalara_quiz_end_${quiz.id}`);
    
    setRawState((prev) => ({ ...prev, isSubmitting: true }));
    const submittedAt = new Date().toISOString();
    const timeSpent = Math.max(
      0,
      quiz.time_limit_minutes * 60 - state.timeLeftSeconds
    );

    let localScore = 0;
    const maxScore = state.questions.reduce((acc, q) => acc + q.points, 0);
    const answersToSync: any[] = [];
    let correctCount = 0;
    let incorrectCount = 0;

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

      if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
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
      
      // Update local attempt details
      setAttemptDetails({
        score: finalScore,
        percentage: finalPercentage,
        correct_count: resData.benar || correctCount,
        incorrect_count: resData.salah || incorrectCount,
        submitted_at: submittedAt
      });
    } catch (err) {
      console.warn('API quiz submission failed, relying on client calculation:', err);
      setAttemptDetails({
        score: finalScore,
        percentage: finalPercentage,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        submitted_at: submittedAt
      });
    }

    const finalAttempt = {
      ...state.attempt!,
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
  const totalQuestions = state.questions.length;
  const progress = ((state.currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <main style={{ padding: '2rem 1.5rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--azure)', fontSize: '0.9rem', textDecoration: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
        ← Kembali ke Kelas
      </button>

      {view === 'home' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Detail Quiz Card */}
          <Card glow style={{ padding: '2.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <span className="badge-tech" style={{ background: 'rgba(65, 150, 240, 0.1)', color: 'var(--azure)', marginBottom: '0.75rem', display: 'inline-flex' }}>
                  Detail Quiz
                </span>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem 0' }}>{quiz.title}</h2>
              </div>
              <span className="badge-tech" style={{
                background: statusPengerjaan === 'Selesai' ? 'rgba(0, 200, 83, 0.1)' : statusPengerjaan === 'Terlambat' ? 'rgba(255, 82, 82, 0.1)' : 'rgba(255, 168, 38, 0.1)',
                color: statusPengerjaan === 'Selesai' ? '#00C853' : statusPengerjaan === 'Terlambat' ? '#FF5252' : '#FFA826',
                fontWeight: 700,
                fontSize: '0.9rem',
                padding: '6px 16px',
                borderRadius: '8px'
              }}>
                {statusPengerjaan}
              </span>
            </div>

            {/* Quiz Specs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Clock size={20} color="var(--grey-blue)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--grey)' }}>Waktu Pengerjaan</div>
                  <strong style={{ color: '#fff' }}>{quiz.time_limit_minutes} Menit</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Calendar size={20} color="var(--grey-blue)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--grey)' }}>Tenggat Pengerjaan</div>
                  <strong style={{ color: '#fff' }}>{quiz.created_at ? new Date(quiz.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</strong>
                </div>
              </div>
              {quiz.module_id && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Award size={20} color="var(--grey-blue)" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--grey)' }}>Modul Asal</div>
                    <strong style={{ color: '#fff' }}>{quiz.module_id}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Preparation and Rules */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div>
                <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Persiapan</h4>
                <p style={{ color: 'var(--grey-blue)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                  Persiapkan diri Anda, pastikan koneksi internet stabil dan gunakan ruang belajar yang tenang agar dapat fokus.
                </p>
              </div>
              <div>
                <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Aturan Kuis</h4>
                <ul style={{ color: 'var(--grey-blue)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0, paddingLeft: '1.2rem' }}>
                  <li>Setiap kuis hanya dapat dikerjakan satu kali.</li>
                  <li>Waktu pengerjaan akan terus berjalan setelah dimulai, meskipun Anda memuat ulang halaman atau keluar dari web.</li>
                  <li>Pastikan Anda mengklik tombol "Selesai" sebelum batas waktu habis untuk menyimpan jawaban.</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {statusPengerjaan === 'Terlambat' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 82, 82, 0.1)', color: '#FF5252', padding: '12px 24px', borderRadius: '8px', fontSize: '0.9rem' }}>
                  <ShieldAlert size={16} /> Anda sudah melewati batas waktu pengerjaan.
                </div>
              )}
              {statusPengerjaan === 'Ditugaskan' && (
                <Button id="btn-start-quiz" onClick={handleStart} variant="primary" style={{ padding: '1rem 3.5rem', fontSize: '1.1rem', gap: '8px' }}>
                  <Play size={16} fill="#fff" /> Mulai Kerjakan Quiz
                </Button>
              )}
            </div>
          </Card>

          {/* Rekap Hasil Quiz (Only visible if completed) */}
          {isFinished && (
            <Card style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(30,30,30,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0, 200, 83, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <CheckCircle size={28} color="#00C853" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: '0 0 1.5rem 0' }}>Rekap Hasil Quiz</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--grey)', marginBottom: '0.5rem' }}>Nilai Quiz</div>
                  <strong style={{ fontSize: '1.8rem', color: 'var(--lemon)', fontWeight: 800 }}>{attemptDetails?.percentage || attemptDetails?.score || 0}%</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--grey)', marginBottom: '0.5rem' }}>Jumlah Benar</div>
                  <strong style={{ fontSize: '1.8rem', color: '#00C853', fontWeight: 800 }}>{attemptDetails?.correct_count ?? 0}</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--grey)', marginBottom: '0.5rem' }}>Jumlah Salah</div>
                  <strong style={{ fontSize: '1.8rem', color: '#FF5252', fontWeight: 800 }}>{attemptDetails?.incorrect_count ?? 0}</strong>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {view === 'quiz' && currentQuestion && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header pengerjaan */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--grey-blue)', marginBottom: '0.5rem' }}>
                Soal {state.currentQuestionIndex + 1} dari {totalQuestions}
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--navy), var(--azure))', transition: 'width 0.3s ease' }} />
              </div>
            </div>
            <QuizTimer secondsLeft={state.timeLeftSeconds} formattedTime={new Date(state.timeLeftSeconds * 1000).toISOString().substring(14, 19)} onTick={tickTime} isRunning={!state.isCompleted} />
          </div>

          {/* Question Card */}
          <QuestionCard question={currentQuestion} index={state.currentQuestionIndex} totalQuestions={totalQuestions}
            selectedOptionId={currentAnswer.selected_option_id} selectedOptionIds={currentAnswer.selected_option_ids}
            numericAnswer={currentAnswer.numeric_answer} textAnswer={currentAnswer.text_answer}
            onMCQSelect={(id) => selectMCQOption(currentQuestion.id, id)}
            onMultiSelect={(id) => selectMultiSelectOption(currentQuestion.id, id)}
            onNumericChange={(v) => setNumericAnswer(currentQuestion.id, v)}
            onTextChange={(v) => setShortAnswer(currentQuestion.id, v)}
          />

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1rem' }}>
            <Button id="btn-prev" onClick={prevQuestion} variant={state.currentQuestionIndex === 0 ? 'disabled' : 'secondary'} disabled={state.currentQuestionIndex === 0}>
              ← Sebelumnya
            </Button>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              {state.currentQuestionIndex === totalQuestions - 1 ? (
                <Button id="btn-submit" onClick={handleSubmit} variant="primary" style={{ background: '#00C853', borderColor: '#00C853' }} disabled={state.isSubmitting}>
                  {state.isSubmitting ? 'Mengirim...' : 'Selesai ✓'}
                </Button>
              ) : (
                <Button id="btn-next" onClick={nextQuestion} variant="primary">
                  Selanjutnya →
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'result' && state.attempt && (
        <Card style={{ padding: '3.5rem', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0, 200, 83, 0.1)', display: 'flex', alignItems: 'center', justifyAll: 'center', margin: '0 auto 1.5rem', justifyContent: 'center' }}>
            <CheckCircle size={32} color="#00C853" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '0 0 1.5rem 0' }}>Quiz Selesai Dikirim!</h2>
          
          <div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--lemon)', marginBottom: '0.5rem', fontFamily: 'Georgia, serif' }}>
            {state.attempt.percentage}%
          </div>
          
          <span className="badge-tech" style={{
            background: state.attempt.percentage! >= quiz.passing_score ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 82, 82, 0.1)',
            color: state.attempt.percentage! >= quiz.passing_score ? '#00C853' : '#FF5252',
            fontWeight: 700,
            fontSize: '0.9rem',
            padding: '6px 18px'
          }}>
            {state.attempt.percentage! >= quiz.passing_score ? '✅ LULUS' : '❌ TIDAK LULUS'}
          </span>

          <p style={{ marginTop: '1.5rem', marginBottom: '2.5rem', color: 'var(--grey-blue)', fontSize: '0.95rem' }}>
            Skor: {state.attempt.score} poin | Waktu Pengerjaan: {Math.floor(state.attempt.time_spent_seconds! / 60)}m {state.attempt.time_spent_seconds! % 60}s
          </p>
          <Button id="btn-back" onClick={onBack} variant="secondary" style={{ padding: '0.75rem 2rem' }}>
            Kembali ke Kelas
          </Button>
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
  const [initialAttemptDetails, setInitialAttemptDetails] = useState<any>(null);

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
          created_at: quizData.deadline || quizData.tenggat_pengerjaan || quizData.created_at || new Date().toISOString(), // Use deadline as tenggat_pengerjaan
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

        // Try to fetch quiz attempt rekap to see if already answered
        try {
          const rekapRes = await apiGet<any>('/api/quiz/rekap', {
            token: token || undefined,
            headers
          });
          const rekapList = Array.isArray(rekapRes) ? rekapRes : (rekapRes.data || []);
          const match = rekapList.find((item: any) => item.uuid_quiz === quizId);
          if (match) {
            setInitialAttemptDetails(match);
          }
        } catch (rekapErr) {
          console.warn('Failed to fetch initial attempt rekap:', rekapErr);
        }

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
      initialAttemptDetails={initialAttemptDetails}
      onBack={() => {
        if (quiz.module_id) {
          router.push(`/student/courses/detail?id=${quiz.module_id}`);
        } else {
          router.push('/student/courses');
        }
      }} 
    />
  );
}
