import { useState, useEffect, useCallback } from 'react';
import { Quiz, QuizQuestion, QuizAttempt, QuizAnswer, QuizState } from '../types/quiz.types';
import { supabase } from '../lib/supabase';

interface UseQuizProps {
  quiz: Quiz;
  questionsList: QuizQuestion[];
  userId?: string;
}

export function useQuiz({ quiz, questionsList, userId = 'mock-user-123' }: UseQuizProps) {
  const [state, setState] = useState<QuizState>({
    attempt: null,
    questions: questionsList,
    currentQuestionIndex: 0,
    answers: {},
    timeLeftSeconds: quiz.time_limit_minutes * 60,
    isSubmitting: false,
    isCompleted: false,
  });

  // Start attempt (client-side initialization, ready for db synchronization)
  const startAttempt = useCallback(async () => {
    setState((prev) => ({ ...prev, isSubmitting: true }));
    
    const initialAttempt: QuizAttempt = {
      id: typeof window !== 'undefined' ? window.crypto.randomUUID() : 'mock-attempt-id',
      user_id: userId,
      quiz_id: quiz.id,
      attempt_number: 1,
      started_at: new Date().toISOString(),
      submitted_at: null,
      score: 0,
      max_score: questionsList.reduce((acc, q) => acc + q.points, 0),
      percentage: 0,
      status: 'in_progress',
      time_spent_seconds: 0,
      created_at: new Date().toISOString(),
    };

    // Try to sync with Supabase if client is configured
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && supabase) {
        const { data, error } = await supabase
          .from('quiz_attempts')
          .insert({
            quiz_id: quiz.id,
            user_id: userId,
            status: 'in_progress',
          })
          .select()
          .single();

        if (!error && data) {
          initialAttempt.id = data.id;
          initialAttempt.attempt_number = data.attempt_number;
        }
      }
    } catch (err) {
      console.warn('Could not sync quiz attempt with database, running locally:', err);
    }

    setState((prev) => ({
      ...prev,
      attempt: initialAttempt,
      timeLeftSeconds: quiz.time_limit_minutes * 60,
      isSubmitting: false,
      isCompleted: false,
      answers: {},
      currentQuestionIndex: 0,
    }));
  }, [quiz, questionsList, userId]);

  // Answer handling
  const setAnswer = useCallback((questionId: string, value: {
    selected_option_id?: string;
    selected_option_ids?: string[];
    text_answer?: string;
    numeric_answer?: number;
  }) => {
    setState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: value,
      },
    }));
  }, []);

  const selectMCQOption = useCallback((questionId: string, optionId: string) => {
    setAnswer(questionId, { selected_option_id: optionId });
  }, [setAnswer]);

  const selectMultiSelectOption = useCallback((questionId: string, optionId: string) => {
    setState((prev) => {
      const currentSelection = prev.answers[questionId]?.selected_option_ids || [];
      const newSelection = currentSelection.includes(optionId)
        ? currentSelection.filter((id) => id !== optionId)
        : [...currentSelection, optionId];
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: { selected_option_ids: newSelection },
        },
      };
    });
  }, []);

  const setNumericAnswer = useCallback((questionId: string, value: number) => {
    setAnswer(questionId, { numeric_answer: value });
  }, [setAnswer]);

  const setShortAnswer = useCallback((questionId: string, value: string) => {
    setAnswer(questionId, { text_answer: value });
  }, [setAnswer]);

  // Navigation
  const nextQuestion = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.min(prev.currentQuestionIndex + 1, prev.questions.length - 1),
    }));
  }, []);

  const prevQuestion = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.max(prev.currentQuestionIndex - 1, 0),
    }));
  }, []);

  // Submit Logic
  const submitQuiz = useCallback(async () => {
    if (!state.attempt || state.isCompleted) return;

    setState((prev) => ({ ...prev, isSubmitting: true }));
    const submittedAt = new Date().toISOString();
    const timeSpent = Math.max(
      0,
      quiz.time_limit_minutes * 60 - state.timeLeftSeconds
    );

    // Calculate score
    let totalScore = 0;
    const maxScore = state.questions.reduce((acc, q) => acc + q.points, 0);
    const answersToSync: Omit<QuizAnswer, 'id'>[] = [];

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
        // Find if any explanation or option matches, or standard comparison
        // For numerical matching, we might have seeded numerical explanation or target
        // Let's assume explanation contains the string value of numeric answer as simple fallback
        const correctAnswerString = question.explanation?.match(/\d+[\.,]?\d*/)?.[0] || '';
        const standardCleanedValue = correctAnswerString.replace(/\./g, '').replace(/,/g, '.');
        const correctVal = parseFloat(standardCleanedValue);
        isCorrect = answer?.numeric_answer === correctVal;
      }

      const pointsAwarded = isCorrect ? question.points : 0;
      totalScore += pointsAwarded;

      answersToSync.push({
        attempt_id: state.attempt!.id,
        question_id: question.id,
        selected_option_id: answer?.selected_option_id || null,
        selected_option_ids: answer?.selected_option_ids || null,
        text_answer: answer?.text_answer || null,
        numeric_answer: answer?.numeric_answer !== undefined ? answer.numeric_answer : null,
        is_correct: isCorrect,
        awarded_points: pointsAwarded,
      });
    });

    const percentage = parseFloat(((totalScore / maxScore) * 100).toFixed(2));
    const finalAttempt: QuizAttempt = {
      ...state.attempt,
      submitted_at: submittedAt,
      score: totalScore,
      percentage,
      status: 'submitted',
      time_spent_seconds: timeSpent,
    };

    // Save to Database if supabase is set up
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && supabase) {
        // Update attempt
        await supabase
          .from('quiz_attempts')
          .update({
            submitted_at: submittedAt,
            score: totalScore,
            max_score: maxScore,
            percentage,
            status: 'submitted',
            time_spent_seconds: timeSpent,
          })
          .eq('id', state.attempt.id);

        // Sync answers
        await supabase.from('quiz_answers').insert(
          answersToSync.map((ans) => ({
            attempt_id: ans.attempt_id,
            question_id: ans.question_id,
            selected_option_id: ans.selected_option_id,
            selected_option_ids: ans.selected_option_ids,
            text_answer: ans.text_answer,
            numeric_answer: ans.numeric_answer,
            is_correct: ans.is_correct,
            awarded_points: ans.awarded_points,
          }))
        );
      }
    } catch (err) {
      console.warn('Could not sync quiz results to database:', err);
    }

    setState((prev) => ({
      ...prev,
      attempt: finalAttempt,
      isSubmitting: false,
      isCompleted: true,
    }));
  }, [state, quiz]);

  // Tick time down
  const tickTime = useCallback(() => {
    setState((prev) => {
      if (prev.timeLeftSeconds <= 1) {
        // Auto submit
        setTimeout(() => {
          submitQuiz();
        }, 0);
        return { ...prev, timeLeftSeconds: 0 };
      }
      return { ...prev, timeLeftSeconds: prev.timeLeftSeconds - 1 };
    });
  }, [submitQuiz]);

  return {
    state,
    startAttempt,
    selectMCQOption,
    selectMultiSelectOption,
    setNumericAnswer,
    setShortAnswer,
    nextQuestion,
    prevQuestion,
    submitQuiz,
    tickTime,
    setRawState: setState,
  };
}
