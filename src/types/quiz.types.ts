export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type QuestionType = 'mcq' | 'true_false' | 'multi_select' | 'numeric' | 'short_answer';

export type AttemptStatus = 'in_progress' | 'submitted' | 'expired';

export interface Quiz {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number;
  passing_score: number;
  max_attempts: number;
  difficulty_level: DifficultyLevel;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  order_index: number;
  question_text: string;
  question_type: QuestionType;
  explanation: string | null;
  points: number;
  difficulty_level: string;
  topic_tag: string | null;
  created_at: string;
  options?: QuizOption[]; // populated in queries
}

export interface QuizOption {
  id: string;
  question_id: string;
  option_label: string;
  option_text: string;
  is_correct: boolean;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  attempt_number: number;
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
  status: AttemptStatus;
  time_spent_seconds: number | null;
  created_at: string;
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
  selected_option_ids: string[] | null;
  text_answer: string | null;
  numeric_answer: number | null;
  is_correct: boolean | null;
  awarded_points: number;
}

// Client state UI interface
export interface QuizState {
  attempt: QuizAttempt | null;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, {
    selected_option_id?: string;
    selected_option_ids?: string[];
    text_answer?: string;
    numeric_answer?: number;
  }>;
  timeLeftSeconds: number;
  isSubmitting: boolean;
  isCompleted: boolean;
}
