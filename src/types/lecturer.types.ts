/**
 * Lecturer Types — Nalara API
 * Sesuai dengan schema OpenAPI dari Swagger documentation
 */

// ─── Generic API Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiListResponse<T> {
  success?: boolean;
  data?: T[];
}

// ─── Pembelajaran (Course) ───────────────────────────────────────────────────

export interface Pembelajaran {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  uuid_user?: string;
  status?: 'published' | 'draft' | 'archived';
  createdAt?: string;
  updatedAt?: string;
  creator?: {
    full_name?: string;
    username?: string;
  };
}

export interface CreatePembelajaranPayload {
  title: string;
  description?: string;
}

export interface UpdatePembelajaranPayload {
  title?: string;
  description?: string;
}

// ─── Modul ───────────────────────────────────────────────────────────────────

export interface Modul {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  uuid_user?: string;
  uuid_pembelajaran?: string;
  createdAt?: string;
  updatedAt?: string;
  creator?: {
    full_name?: string;
    username?: string;
  };
  pembelajaran?: {
    title?: string;
  };
}

export interface CreateModulPayload {
  title: string;
  description?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  uuid_pembelajaran: string;
}

export interface UpdateModulPayload {
  title?: string;
  description?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  uuid_pembelajaran?: string;
}

// ─── Tugas (Assignment) ──────────────────────────────────────────────────────

export type TugasType = 'Reading' | 'Video' | 'CaseStudy' | 'Practice';

export interface Tugas {
  id: string;
  title: string;
  slug?: string;
  type: TugasType;
  content?: Record<string, unknown>; // TipTap JSON for Reading type
  youtube_link?: string;
  file_url?: string;
  published_at?: string | null;
  deadline_at?: string | null;
  uuid_pembelajaran: string;
  uuid_modul: string;
  uuid_user?: string;
  createdAt?: string;
  updatedAt?: string;
  pembelajaran?: {
    id?: string;
    title?: string;
  };
  modul?: {
    id?: string;
    title?: string;
  };
}

export interface CreateTugasPayload {
  title: string;
  type: TugasType;
  content?: Record<string, unknown>;
  youtube_link?: string;
  uuid_pembelajaran: string;
  uuid_modul: string;
  published_at?: string | null;
  deadline_at?: string | null;
}

export interface UpdateTugasPayload {
  title?: string;
  type?: TugasType;
  content?: Record<string, unknown>;
  youtube_link?: string;
  uuid_pembelajaran?: string;
  uuid_modul?: string;
  published_at?: string | null;
  deadline_at?: string | null;
}

// ─── Quiz ────────────────────────────────────────────────────────────────────

export type QuizDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type QuestionType = 'MultipleChoice' | 'TrueFalse' | 'MultiSelect' | 'Essay' | 'QuestionGroup';

export interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface SubQuestion {
  question_text: string;
  type: Exclude<QuestionType, 'QuestionGroup'>;
  options?: QuestionOption[];
  correct_answer?: string;
}

export interface QuizQuestion {
  id?: string;
  uuid_question?: string;
  question_text: string;
  type: QuestionType;
  explanation?: string;
  difficulty?: QuizDifficulty;
  weight?: number;
  topic_tags?: string[];
  options?: QuestionOption[];
  correct_answer?: string;
  sub_questions?: SubQuestion[];
}

export interface Quiz {
  id: string;
  title: string;
  difficulty: QuizDifficulty;
  tags?: string[];
  time_limit?: number | null; // minutes
  passing_score: number; // 0-100
  max_attempts: number;
  shuffle_questions?: boolean;
  show_explanations?: boolean;
  uuid_pembelajaran?: string;
  uuid_modul?: string;
  uuid_tugas?: string;
  questions?: QuizQuestion[];
  createdAt?: string;
  updatedAt?: string;
  pembelajaran?: {
    title?: string;
  };
  modul?: {
    title?: string;
  };
}

export interface CreateQuizPayload {
  title: string;
  difficulty: QuizDifficulty;
  tags?: string[];
  time_limit?: number | null;
  passing_score: number;
  max_attempts: number;
  shuffle_questions?: boolean;
  show_explanations?: boolean;
  uuid_pembelajaran: string;
  uuid_modul?: string;
  uuid_tugas?: string;
  questions?: QuizQuestion[];
}

export interface UpdateQuizPayload {
  title?: string;
  difficulty?: string;
  passing_score?: number;
  max_attempts?: number;
  questions?: QuizQuestion[];
}

export interface QuizSubmitPayload {
  answers: {
    uuid_question: string;
    submitted_answer: string | string[];
  }[];
}

export interface QuizSubmitResult {
  success: boolean;
  percentage?: number;
  is_passed?: boolean;
  score?: number;
  total?: number;
}

export interface QuizRekapItem {
  id: string;
  quiz_title?: string;
  percentage: number;
  is_passed: boolean;
  created_at: string;
  quiz?: {
    title?: string;
  };
  profiles?: {
    full_name?: string;
  };
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface UserProfile {
  uuid_user: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  last_login_at?: string;
  avatar_url?: string;
}

export interface UpdateProfilePayload {
  username?: string;
  full_name?: string;
}

export interface ChangePasswordPayload {
  new_password: string;
  confirm_password: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface LecturerDashboardData {
  online_students: number;
  active_courses: number;
  total_students: number;
  pending_submissions?: number;
}

// ─── Enroll ──────────────────────────────────────────────────────────────────

export interface EnrollStudent {
  id: string;
  full_name: string;
  username: string;
  email: string;
}

export interface EnrollPayload {
  course_id: string;
  student_ids: string[];
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}
