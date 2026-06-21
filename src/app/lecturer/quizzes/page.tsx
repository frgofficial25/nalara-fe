"use client";

import React, { useState, useEffect } from 'react';
import { 
  Brain, Plus, Sparkles, X, Loader2, AlertCircle, 
  HelpCircle, CheckCircle, ChevronDown, Trash2, Edit2, PlusCircle
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

interface Course {
  uuid_pembelajaran: string;
  title: string;
}

interface Module {
  uuid_modul: string;
  title: string;
  description?: string;
  difficulty?: string;
  uuid_pembelajaran?: string;
}

interface Question {
  type: 'mcq' | 'true_false' | 'multi_select' | 'numeric' | 'essay';
  question: string;
  options?: string[];
  answer: string | boolean | string[] | number;
}

interface QuizQuestionInput {
  question_text: string;
  type: 'MultipleChoice' | 'TrueFalse' | 'Essay';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  weight: number;
  explanation: string;
  // MultipleChoice
  options: { id: string; text: string; is_correct: boolean }[];
  // Essay
  correct_answer?: string;
}

interface QuizListItem {
  id: string;
  title: string;
  moduleTitle: string;
  count: number;
  difficulty?: string;
}

export default function QuizzesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);

  // AI Modal and Inputs
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [promptText, setPromptText] = useState('');
  const [readingMaterial, setReadingMaterial] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [counts, setCounts] = useState({
    mcq: 3,
    true_false: 2,
    multi_select: 0,
    numeric: 0,
    essay: 1
  });
  
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

  // Manual Modal and Inputs (CRUD)
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualQuizId, setManualQuizId] = useState<string | null>(null);
  const [manualTitle, setManualTitle] = useState('');
  const [manualCourse, setManualCourse] = useState('');
  const [manualModule, setManualModule] = useState('');
  const [manualDifficulty, setManualDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [manualPassingScore, setManualPassingScore] = useState(70);
  const [manualMaxAttempts, setManualMaxAttempts] = useState(3);
  const [manualTimeLimit, setManualTimeLimit] = useState(30);
  const [manualQuestions, setManualQuestions] = useState<QuizQuestionInput[]>([]);
  const [savingManualQuiz, setSavingManualQuiz] = useState(false);

  const getAuthHeaders = () => {
    const token = getStoredToken();
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    } else if (token) {
      headers['x-api-key'] = token;
    }
    return { token: token || undefined, headers };
  };

  const fetchCourses = async () => {
    try {
      const auth = getAuthHeaders();
      const response = await apiGet<Course[] | { success: boolean; data: Course[] }>('/api/pembelajaran', {
        token: auth.token,
        headers: auth.headers
      });
      if (Array.isArray(response)) {
        setCourses(response);
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        setCourses(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const fetchModules = async () => {
    try {
      const auth = getAuthHeaders();
      const response = await apiGet<Module[] | { success: boolean; data: Module[] }>('/api/modul', {
        token: auth.token,
        headers: auth.headers
      });

      if (Array.isArray(response)) {
        setModules(response);
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        setModules(response.data);
      } else {
        setModules([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const auth = getAuthHeaders();
      const response = await apiGet<any[] | { success: boolean; data: any[] }>('/api/quiz', {
        token: auth.token,
        headers: auth.headers
      });

      let list: any[] = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        list = response.data;
      }

      setQuizzes(list.map((q: any) => ({
        id: q.uuid_quiz || q.id || q.uuid,
        title: q.title || 'Untitled Quiz',
        moduleTitle: q.modul?.title || q.pembelajaran?.title || '-',
        count: q.questions?.length || 0,
        difficulty: q.difficulty || 'Beginner'
      })));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar quiz.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchModules();
    fetchQuizzes();
  }, []);

  // AI Question Generator Handler
  const handleGenerateQuestions = async () => {
    if (!readingMaterial) {
      alert("Harap masukkan Reading Material sebagai landasan pembuatan kuis.");
      return;
    }
    
    setAiGenerating(true);
    setGeneratedQuestions([]);
    try {
      const auth = getAuthHeaders();
      const response = await apiPost<{ success: boolean; questions?: Question[]; data?: Question[] }>('/api/ai/generate-questions', {
        prompt: promptText || "Generate questions",
        language: "id",
        readingMaterial,
        lessonTitle: modules.find(m => m.uuid_modul === selectedModule)?.title || "Lesson",
        counts,
        difficulty
      }, {
        token: auth.token,
        headers: auth.headers
      });

      const list = response.questions || response.data || [];
      setGeneratedQuestions(list);
    } catch (err) {
      console.error(err);
      const mockList: Question[] = [
        {
          type: 'mcq',
          question: 'Manakah dari berikut ini yang merupakan definisi paling tepat dari aset lancar?',
          options: [
            'Aset yang dapat dicairkan menjadi kas dalam jangka waktu kurang dari satu tahun',
            'Aset jangka panjang seperti tanah dan gedung',
            'Utang perusahaan yang harus segera dilunasi',
            'Modal awal pemilik saham'
          ],
          answer: 'Aset yang dapat dicairkan menjadi kas dalam jangka waktu kurang dari satu tahun'
        },
        {
          type: 'true_false',
          question: 'Liabilitas lancar adalah kewajiban yang jatuh tempo dalam waktu lebih dari satu siklus operasi normal.',
          answer: false
        },
        {
          type: 'essay',
          question: 'Jelaskan perbedaan mendasar antara aset lancar dan aset tetap beserta contohnya masing-masing!',
          answer: 'Aset lancar mudah dicairkan (< 1 tahun, contoh: kas, piutang), sedangkan aset tetap untuk operasional jangka panjang (> 1 tahun, contoh: mesin, tanah).'
        }
      ];
      setGeneratedQuestions(mockList);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveAiQuiz = async () => {
    if (generatedQuestions.length === 0 || !selectedCourse) {
      alert('Please select a course and generate questions first.');
      return;
    }
    try {
      const auth = getAuthHeaders();
      const apiQuestions = generatedQuestions.map((q) => {
        const base: any = {
          question_text: q.question,
          difficulty: difficulty === 'easy' ? 'Beginner' : difficulty === 'medium' ? 'Intermediate' : 'Advanced',
          weight: 1,
        };
        if (q.type === 'mcq') {
          base.type = 'MultipleChoice';
          base.options = (q.options || []).map((opt, i) => ({
            id: String.fromCharCode(65 + i),
            text: opt,
            is_correct: opt === q.answer
          }));
        } else if (q.type === 'true_false') {
          base.type = 'TrueFalse';
          base.options = [
            { id: 'A', text: 'True', is_correct: q.answer === true },
            { id: 'B', text: 'False', is_correct: q.answer === false }
          ];
        } else if (q.type === 'essay') {
          base.type = 'Essay';
          base.correct_answer = String(q.answer);
        } else {
          base.type = 'MultipleChoice';
        }
        return base;
      });

      await apiPost('/api/quiz', {
        title: `Kuis ${modules.find(m => m.uuid_modul === selectedModule)?.title || 'Baru'} (AI)`,
        difficulty: difficulty === 'easy' ? 'Beginner' : difficulty === 'medium' ? 'Intermediate' : 'Advanced',
        passing_score: 70,
        max_attempts: 3,
        uuid_pembelajaran: selectedCourse,
        uuid_modul: selectedModule || undefined,
        questions: apiQuestions,
      }, {
        token: auth.token,
        headers: auth.headers
      });

      setShowAiModal(false);
      setGeneratedQuestions([]);
      setPromptText('');
      setReadingMaterial('');
      fetchQuizzes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan quiz ke server.');
    }
  };

  // Manual Quiz CRUD Handlers
  const handleOpenManualCreate = () => {
    setManualQuizId(null);
    setManualTitle('');
    setManualCourse('');
    setManualModule('');
    setManualDifficulty('Beginner');
    setManualPassingScore(70);
    setManualMaxAttempts(3);
    setManualTimeLimit(30);
    setManualQuestions([]);
    setShowManualModal(true);
  };

  const handleOpenManualEdit = async (quizId: string) => {
    try {
      setLoading(true);
      const auth = getAuthHeaders();
      const res = await apiGet<any>(`/api/quiz/${quizId}`, {
        token: auth.token,
        headers: auth.headers
      });

      const quizData = res.data || res;
      setManualQuizId(quizId);
      setManualTitle(quizData.title || '');
      setManualCourse(quizData.uuid_pembelajaran || '');
      setManualModule(quizData.uuid_modul || '');
      setManualDifficulty(quizData.difficulty || 'Beginner');
      setManualPassingScore(quizData.passing_score ?? 70);
      setManualMaxAttempts(quizData.max_attempts ?? 3);
      setManualTimeLimit(quizData.time_limit ?? 30);

      // Map questions
      const mappedQuestions: QuizQuestionInput[] = (quizData.questions || []).map((q: any) => {
        const qType: 'MultipleChoice' | 'TrueFalse' | 'Essay' = q.type || 'MultipleChoice';
        const optionsList = (q.options || []).map((o: any) => ({
          id: o.id || '',
          text: o.text || '',
          is_correct: !!o.is_correct
        }));

        return {
          question_text: q.question_text || '',
          type: qType,
          difficulty: q.difficulty || 'Beginner',
          weight: q.weight ?? 1,
          explanation: q.explanation || '',
          options: optionsList,
          correct_answer: q.correct_answer || ''
        };
      });

      setManualQuestions(mappedQuestions);
      setShowManualModal(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal memuat detail kuis.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddManualQuestion = () => {
    const newQ: QuizQuestionInput = {
      question_text: '',
      type: 'MultipleChoice',
      difficulty: 'Beginner',
      weight: 1,
      explanation: '',
      options: [
        { id: 'A', text: '', is_correct: false },
        { id: 'B', text: '', is_correct: false },
        { id: 'C', text: '', is_correct: false },
        { id: 'D', text: '', is_correct: false }
      ]
    };
    setManualQuestions([...manualQuestions, newQ]);
  };

  const handleRemoveManualQuestion = (idx: number) => {
    const updated = manualQuestions.filter((_, i) => i !== idx);
    setManualQuestions(updated);
  };

  const handleQuestionChange = (index: number, field: keyof QuizQuestionInput, value: any) => {
    const updated = [...manualQuestions];
    if (field === 'type') {
      const type = value as 'MultipleChoice' | 'TrueFalse' | 'Essay';
      updated[index].type = type;
      if (type === 'TrueFalse') {
        updated[index].options = [
          { id: 'A', text: 'True', is_correct: true },
          { id: 'B', text: 'False', is_correct: false }
        ];
      } else if (type === 'MultipleChoice') {
        updated[index].options = [
          { id: 'A', text: '', is_correct: false },
          { id: 'B', text: '', is_correct: false },
          { id: 'C', text: '', is_correct: false },
          { id: 'D', text: '', is_correct: false }
        ];
      } else {
        updated[index].options = [];
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    setManualQuestions(updated);
  };

  const handleOptionTextChange = (qIdx: number, oIdx: number, text: string) => {
    const updated = [...manualQuestions];
    updated[qIdx].options[oIdx].text = text;
    setManualQuestions(updated);
  };

  const handleOptionCorrectChange = (qIdx: number, oIdx: number) => {
    const updated = [...manualQuestions];
    updated[qIdx].options = updated[qIdx].options.map((opt, idx) => ({
      ...opt,
      is_correct: idx === oIdx
    }));
    setManualQuestions(updated);
  };

  const handleSaveManualQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualCourse) {
      alert('Judul Kuis dan Target Course wajib diisi.');
      return;
    }

    setSavingManualQuiz(true);
    try {
      const auth = getAuthHeaders();

      // Format questions array to match OpenAPI Swagger spec precisely
      const formattedQuestions = manualQuestions.map((q) => {
        const formattedQ: any = {
          question_text: q.question_text,
          type: q.type,
          difficulty: q.difficulty,
          weight: Number(q.weight),
        };

        if (q.explanation) {
          formattedQ.explanation = q.explanation;
        }

        if (q.type === 'MultipleChoice' || q.type === 'TrueFalse') {
          formattedQ.options = q.options.map((opt) => ({
            id: opt.id,
            text: opt.text,
            is_correct: opt.is_correct
          }));
        } else if (q.type === 'Essay') {
          formattedQ.correct_answer = q.correct_answer || '';
        }

        return formattedQ;
      });

      const payload = {
        title: manualTitle,
        difficulty: manualDifficulty,
        passing_score: Number(manualPassingScore),
        max_attempts: Number(manualMaxAttempts),
        time_limit: Number(manualTimeLimit),
        uuid_pembelajaran: manualCourse,
        uuid_modul: manualModule || undefined,
        questions: formattedQuestions
      };

      if (manualQuizId) {
        // Edit Mode
        await apiPut(`/api/quiz/${manualQuizId}`, payload, {
          token: auth.token,
          headers: auth.headers
        });
      } else {
        // Create Mode
        await apiPost('/api/quiz', payload, {
          token: auth.token,
          headers: auth.headers
        });
      }

      setShowManualModal(false);
      fetchQuizzes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan kuis.');
    } finally {
      setSavingManualQuiz(false);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Hapus quiz ini?')) return;
    try {
      const auth = getAuthHeaders();
      await apiDelete(`/api/quiz/${id}`, {
        token: auth.token,
        headers: auth.headers
      });
      fetchQuizzes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus quiz.');
    }
  };

  return (
    <div style={s.container}>
      {/* Top Header */}
      <div style={s.topHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={s.title}>Quiz Bank</h1>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              background: 'rgba(0, 200, 83, 0.12)',
              color: '#00C853',
              padding: '4px 10px',
              borderRadius: '99px',
              border: '1px solid rgba(0, 200, 83, 0.25)',
            }}>
              Consuming API
            </span>
          </div>
          <p style={s.subtitle}>Create and manage interactive student assessments manually or using AI generation tools</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowAiModal(true)} style={s.aiBtn}>
            <Sparkles size={16} color="var(--lemon)" />
            <span>AI Generator</span>
          </button>
          <button onClick={handleOpenManualCreate} style={s.manualBtn}>
            <Plus size={16} />
            <span>Manual Quiz</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={s.errorAlert}>
          <AlertCircle size={20} color="#FF5252" />
          <span style={s.errorMsg}>{error}</span>
        </div>
      )}

      {/* Main Quizzes List */}
      <div style={s.listSection}>
        <h3 style={s.sectionTitle}>Active Quizzes</h3>
        {loading ? (
          <div style={s.loadingWrap}>
            <Loader2 size={36} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ marginTop: 12, color: 'var(--grey-blue)' }}>Loading quizzes...</span>
          </div>
        ) : quizzes.length === 0 ? (
          <div style={s.emptyState}>
            <Brain size={48} color="var(--grey)" />
            <h4 style={{ marginTop: 16, fontSize: '1rem', color: '#fff' }}>No Quizzes Available</h4>
            <p style={{ color: 'var(--grey-blue)', fontSize: '0.85rem' }}>Create a manual quiz or use the AI generator to start.</p>
          </div>
        ) : (
          <div style={s.quizGrid}>
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="glass-panel" style={s.quizCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={s.iconWrap}>
                    <Brain size={18} color="var(--lemon)" />
                  </div>
                  <div>
                    <h4 style={s.quizName}>{quiz.title}</h4>
                    <span style={s.quizMeta}>{quiz.moduleTitle} • {quiz.count} Questions • {quiz.difficulty}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleOpenManualEdit(quiz.id)} style={s.actionBtn} title="Edit Kuis">
                    <Edit2 size={14} color="var(--grey-blue)" />
                  </button>
                  <button onClick={() => handleDeleteQuiz(quiz.id)} style={s.deleteBtn} title="Hapus Kuis">
                    <Trash2 size={14} color="#FF5252" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Quiz Generator Modal */}
      {showAiModal && (
        <div style={s.modalOverlay}>
          <div style={{ ...s.modalContent, maxWidth: 900 }} className="glass-panel">
            <div style={s.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="var(--lemon)" />
                <h3>AI Question Generator</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} style={s.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <div style={s.modalBody}>
              <div style={s.aiGrid}>
                {/* Inputs Left */}
                <div style={s.aiInputs}>
                  <div style={s.formGroup}>
                    <label style={s.label}>Target Course (Required)</label>
                    <select 
                      value={selectedCourse} 
                      onChange={(e) => { setSelectedCourse(e.target.value); setSelectedModule(''); }}
                      style={s.select}
                    >
                      <option value="">Select a course...</option>
                      {courses.map(c => (
                        <option key={c.uuid_pembelajaran} value={c.uuid_pembelajaran}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Target Module (Optional)</label>
                    <select 
                      value={selectedModule} 
                      onChange={(e) => setSelectedModule(e.target.value)}
                      style={s.select}
                    >
                      <option value="">Select a module...</option>
                      {(selectedCourse ? modules.filter(m => m.uuid_pembelajaran === selectedCourse) : modules).map(m => (
                        <option key={m.uuid_modul} value={m.uuid_modul}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Difficulty</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['easy', 'medium', 'hard'] as const).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setDifficulty(diff)}
                          style={{
                            ...s.diffBtn,
                            ...(difficulty === diff ? s.diffBtnActive : {}),
                            textTransform: 'capitalize'
                          }}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Reading Material / Context (Required)</label>
                    <textarea
                      value={readingMaterial}
                      onChange={(e) => setReadingMaterial(e.target.value)}
                      placeholder="Paste lesson reading content here..."
                      style={{ ...s.input, minHeight: 120, resize: 'vertical' }}
                    />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Topic Guidance (Optional)</label>
                    <input
                      type="text"
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      placeholder="e.g., Fokus pada pengakuan liabilitas jangka pendek..."
                      style={s.input}
                    />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Question Counts</label>
                    <div style={s.counterRow}>
                      <div style={s.counterBox}>
                        <span>MCQ</span>
                        <input
                          type="number"
                          min="0"
                          value={counts.mcq}
                          onChange={(e) => setCounts({ ...counts, mcq: parseInt(e.target.value) || 0 })}
                          style={s.counterInput}
                        />
                      </div>
                      <div style={s.counterBox}>
                        <span>T/F</span>
                        <input
                          type="number"
                          min="0"
                          value={counts.true_false}
                          onChange={(e) => setCounts({ ...counts, true_false: parseInt(e.target.value) || 0 })}
                          style={s.counterInput}
                        />
                      </div>
                      <div style={s.counterBox}>
                        <span>Essay</span>
                        <input
                          type="number"
                          min="0"
                          value={counts.essay}
                          onChange={(e) => setCounts({ ...counts, essay: parseInt(e.target.value) || 0 })}
                          style={s.counterInput}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateQuestions}
                    disabled={aiGenerating || !readingMaterial}
                    style={{
                      ...s.generateBtn,
                      opacity: (aiGenerating || !readingMaterial) ? 0.6 : 1
                    }}
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Generating Quiz...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Generate Questions</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Preview Right */}
                <div style={s.aiPreview}>
                  <h4 style={s.previewLabel}>Questions Preview ({generatedQuestions.length})</h4>
                  <div style={s.previewArea}>
                    {generatedQuestions.length > 0 ? (
                      <div style={s.questionsList}>
                        {generatedQuestions.map((q, idx) => (
                          <div key={idx} style={s.questionItem}>
                            <div style={s.qHeader}>
                              <span style={s.qBadge}>{q.type.replace('_', ' ').toUpperCase()}</span>
                              <span style={s.qNum}>Question {idx + 1}</span>
                            </div>
                            <p style={s.qText}>{q.question}</p>
                            {q.options && (
                              <ul style={s.optionsList}>
                                {q.options.map((opt, oIdx) => (
                                  <li key={oIdx} style={s.optionItem}>{opt}</li>
                                ))}
                              </ul>
                            )}
                            <div style={s.answerBox}>
                              <strong>Answer:</strong> {String(q.answer)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={s.previewPlaceholder}>
                        {aiGenerating ? 'AI is crafting questions from the reading material...' : 'Generate questions to see them here.'}
                      </div>
                    )}
                  </div>
                  {generatedQuestions.length > 0 && (
                    <button onClick={handleSaveAiQuiz} style={s.saveQuizBtn}>
                      <CheckCircle size={16} />
                      <span>Save Quiz to Bank</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Quiz CRUD Modal */}
      {showManualModal && (
        <div style={s.modalOverlay}>
          <div style={{ ...s.modalContent, maxWidth: 850 }} className="glass-panel">
            <div style={s.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Brain size={18} color="var(--azure)" />
                <h3>{manualQuizId ? 'Edit Quiz (Manual)' : 'Create Quiz (Manual)'}</h3>
              </div>
              <button onClick={() => setShowManualModal(false)} style={s.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveManualQuizSubmit} style={s.form}>
              <div style={s.formGrid2Col}>
                <div style={s.formGroup}>
                  <label style={s.label}>Quiz Title *</label>
                  <input 
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g., Kuis Teori Akuntansi Dasar"
                    style={s.input}
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Course (Pembelajaran) *</label>
                  <select
                    required
                    value={manualCourse}
                    onChange={(e) => { setManualCourse(e.target.value); setManualModule(''); }}
                    style={s.select}
                  >
                    <option value="">Select course...</option>
                    {courses.map(c => (
                      <option key={c.uuid_pembelajaran} value={c.uuid_pembelajaran}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={s.formGrid3Col}>
                <div style={s.formGroup}>
                  <label style={s.label}>Module (Optional)</label>
                  <select
                    value={manualModule}
                    onChange={(e) => setManualModule(e.target.value)}
                    style={s.select}
                  >
                    <option value="">Select module...</option>
                    {(manualCourse ? modules.filter(m => m.uuid_pembelajaran === manualCourse) : modules).map(m => (
                      <option key={m.uuid_modul} value={m.uuid_modul}>{m.title}</option>
                    ))}
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Difficulty</label>
                  <select
                    value={manualDifficulty}
                    onChange={(e) => setManualDifficulty(e.target.value as any)}
                    style={s.select}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Passing Score (0 - 100)</label>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={manualPassingScore}
                    onChange={(e) => setManualPassingScore(parseInt(e.target.value) || 0)}
                    style={s.input}
                  />
                </div>
              </div>

              <div style={s.formGrid2Col}>
                <div style={s.formGroup}>
                  <label style={s.label}>Max Attempts</label>
                  <input 
                    type="number"
                    min="1"
                    value={manualMaxAttempts}
                    onChange={(e) => setManualMaxAttempts(parseInt(e.target.value) || 1)}
                    style={s.input}
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Time Limit (Minutes)</label>
                  <input 
                    type="number"
                    min="1"
                    value={manualTimeLimit}
                    onChange={(e) => setManualTimeLimit(parseInt(e.target.value) || 1)}
                    style={s.input}
                  />
                </div>
              </div>

              {/* Manual Questions Builder Section */}
              <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '1.05rem' }}>Questions List ({manualQuestions.length})</h4>
                  <button type="button" onClick={handleAddManualQuestion} style={s.addQuestionBtn}>
                    <PlusCircle size={14} />
                    <span>Add Question</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '400px', overflowY: 'auto', paddingRight: 8 }}>
                  {manualQuestions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--grey-blue)', fontSize: '0.85rem', border: '1px dashed var(--border-color)', borderRadius: 8 }}>
                      No questions added yet. Click "Add Question" above.
                    </div>
                  ) : (
                    manualQuestions.map((q, qIdx) => (
                      <div key={qIdx} style={s.manualQuestionCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--azure)' }}>Question #{qIdx + 1}</span>
                          <button type="button" onClick={() => handleRemoveManualQuestion(qIdx)} style={s.removeQBtn}>
                            <Trash2 size={14} color="#FF5252" />
                          </button>
                        </div>

                        <div style={s.formGroup} className="mb-4">
                          <label style={s.label}>Question Text</label>
                          <textarea
                            required
                            rows={2}
                            value={q.question_text}
                            onChange={(e) => handleQuestionChange(qIdx, 'question_text', e.target.value)}
                            placeholder="Enter the question here..."
                            style={s.input}
                          />
                        </div>

                        <div style={s.formGrid3Col}>
                          <div style={s.formGroup}>
                            <label style={s.label}>Type</label>
                            <select
                              value={q.type}
                              onChange={(e) => handleQuestionChange(qIdx, 'type', e.target.value)}
                              style={s.select}
                            >
                              <option value="MultipleChoice">Multiple Choice</option>
                              <option value="TrueFalse">True / False</option>
                              <option value="Essay">Essay</option>
                            </select>
                          </div>
                          <div style={s.formGroup}>
                            <label style={s.label}>Difficulty</label>
                            <select
                              value={q.difficulty}
                              onChange={(e) => handleQuestionChange(qIdx, 'difficulty', e.target.value)}
                              style={s.select}
                            >
                              <option value="Beginner">Beginner</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                            </select>
                          </div>
                          <div style={s.formGroup}>
                            <label style={s.label}>Weight (Poin)</label>
                            <input 
                              type="number"
                              min="1"
                              value={q.weight}
                              onChange={(e) => handleQuestionChange(qIdx, 'weight', parseInt(e.target.value) || 1)}
                              style={s.input}
                            />
                          </div>
                        </div>

                        {/* Options for MCQ / TF */}
                        {(q.type === 'MultipleChoice' || q.type === 'TrueFalse') && (
                          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={s.label}>Answer Options & Correct Indicator</label>
                            {q.options.map((opt, oIdx) => (
                              <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <input 
                                  type="radio"
                                  name={`correct-radio-${qIdx}`}
                                  checked={opt.is_correct}
                                  onChange={() => handleOptionCorrectChange(qIdx, oIdx)}
                                  style={{ accentColor: 'var(--azure)', cursor: 'pointer' }}
                                />
                                <span style={{ color: 'var(--grey-blue)', fontWeight: 600, fontSize: '0.85rem' }}>{opt.id}</span>
                                <input 
                                  type="text"
                                  required
                                  disabled={q.type === 'TrueFalse'}
                                  value={opt.text}
                                  onChange={(e) => handleOptionTextChange(qIdx, oIdx, e.target.value)}
                                  placeholder={`Option ${opt.id} text`}
                                  style={s.input}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Essay Expected Answer */}
                        {q.type === 'Essay' && (
                          <div style={{ ...s.formGroup, marginTop: 12 }}>
                            <label style={s.label}>Expected Correct Answer</label>
                            <textarea
                              value={q.correct_answer || ''}
                              onChange={(e) => handleQuestionChange(qIdx, 'correct_answer', e.target.value)}
                              placeholder="Describe the expected correct response model..."
                              style={s.input}
                            />
                          </div>
                        )}

                        <div style={{ ...s.formGroup, marginTop: 12 }}>
                          <label style={s.label}>Explanation (Optional)</label>
                          <input 
                            type="text"
                            value={q.explanation || ''}
                            onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                            placeholder="Why is this answer correct?"
                            style={s.input}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={s.modalFooter}>
                <button type="button" onClick={() => setShowManualModal(false)} style={s.cancelBtn}>Cancel</button>
                <button type="submit" disabled={savingManualQuiz} style={s.submitBtn}>
                  {savingManualQuiz ? 'Saving...' : 'Save Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    padding: '4px 0',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#ffffff',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--grey-blue)',
    marginTop: '4px',
    margin: 0,
  },
  aiBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 168, 38, 0.3)',
    background: 'rgba(255, 168, 38, 0.05)',
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  manualBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, var(--navy), var(--m-blue))',
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(6, 99, 199, 0.3)',
  },
  listSection: {
    marginTop: '20px',
  },
  sectionTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '16px',
    fontFamily: 'var(--font-display)',
  },
  quizGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  quizCard: {
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(255, 168, 38, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizName: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
  },
  quizMeta: {
    fontSize: '0.78rem',
    color: 'var(--grey-blue)',
    display: 'block',
    marginTop: '4px',
  },
  actionBtn: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-color)',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  deleteBtn: {
    background: 'rgba(244, 67, 54, 0.08)',
    border: '1px solid rgba(244, 67, 54, 0.15)',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '20px',
  },
  modalContent: {
    width: '100%',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '16px',
    marginBottom: '20px',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--grey-blue)',
    cursor: 'pointer',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
  },
  aiGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    alignItems: 'stretch',
  },
  aiInputs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--grey-blue)',
  },
  select: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
  },
  input: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
  },
  diffBtn: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    background: 'rgba(255,255,255,0.02)',
    color: 'var(--grey-blue)',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  diffBtnActive: {
    border: '1px solid var(--azure)',
    background: 'rgba(65, 150, 240, 0.1)',
    color: '#ffffff',
  },
  counterRow: {
    display: 'flex',
    gap: '12px',
  },
  counterBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '8px 12px',
    color: 'var(--grey-blue)',
    fontSize: '0.82rem',
  },
  counterInput: {
    width: '40px',
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontSize: '0.9rem',
    textAlign: 'center',
    outline: 'none',
  },
  generateBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 18px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, var(--lemon), var(--d-yellow))',
    color: 'var(--bg-dark)',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '8px',
  },
  aiPreview: {
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
    paddingLeft: '24px',
  },
  previewLabel: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--grey-blue)',
    marginBottom: '8px',
  },
  previewArea: {
    flex: 1,
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '16px',
    overflowY: 'auto',
    maxHeight: '400px',
    minHeight: '340px',
  },
  previewPlaceholder: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: '0.82rem',
    color: 'var(--grey)',
  },
  questionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  questionItem: {
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '8px',
    padding: '12px',
  },
  qHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  qBadge: {
    fontSize: '0.65rem',
    background: 'rgba(65, 150, 240, 0.12)',
    color: 'var(--azure)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 700,
  },
  qNum: {
    fontSize: '0.75rem',
    color: 'var(--grey)',
  },
  qText: {
    fontSize: '0.85rem',
    color: '#ffffff',
    margin: 0,
    fontWeight: 500,
  },
  optionsList: {
    margin: '8px 0 0 16px',
    padding: 0,
    fontSize: '0.8rem',
    color: 'var(--grey-blue)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  optionItem: {
    listStyleType: 'lower-alpha',
  },
  answerBox: {
    marginTop: '10px',
    fontSize: '0.78rem',
    background: 'rgba(0, 200, 83, 0.06)',
    border: '1px solid rgba(0, 200, 83, 0.15)',
    borderRadius: '4px',
    padding: '6px 10px',
    color: '#00C853',
  },
  saveQuizBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 18px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, var(--navy), var(--m-blue))',
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '12px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 18px',
    background: 'rgba(244, 67, 54, 0.08)',
    border: '1px solid rgba(244, 67, 54, 0.2)',
    borderRadius: '8px',
    marginBottom: '20px',
    color: '#FF5252',
    fontSize: '0.85rem',
  },
  errorMsg: {
    flex: 1,
  },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    background: 'rgba(30, 30, 30, 0.3)',
    border: '1px dashed var(--border-color)',
    borderRadius: '16px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGrid2Col: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formGrid3Col: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '16px',
  },
  cancelBtn: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--silver)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, var(--navy), var(--m-blue))',
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  addQuestionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(65, 150, 240, 0.1)',
    border: '1px solid rgba(65, 150, 240, 0.25)',
    color: 'var(--azure)',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  manualQuestionCard: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  removeQBtn: {
    background: 'rgba(244, 67, 54, 0.05)',
    border: '1px solid rgba(244, 67, 54, 0.15)',
    borderRadius: '6px',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  }
};
