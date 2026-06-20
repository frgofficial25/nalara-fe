"use client";

import React, { useState, useEffect } from 'react';
import { 
  Brain, Plus, Sparkles, X, Loader2, AlertCircle, 
  HelpCircle, CheckCircle, ChevronDown, Trash2
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

interface Module {
  id: string;
  title: string;
  description?: string;
  difficulty?: string;
}

interface Question {
  type: 'mcq' | 'true_false' | 'multi_select' | 'numeric' | 'essay';
  question: string;
  options?: string[];
  answer: string | boolean | string[] | number;
}

export default function QuizzesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI Modal and Inputs
  const [showAiModal, setShowAiModal] = useState(false);
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
  const [quizzes, setQuizzes] = useState<{ id: string; title: string; moduleTitle: string; count: number }[]>([
    { id: '1', title: 'Kuis Dasar Akuntansi', moduleTitle: 'Modul Pengantar Keuangan', count: 5 },
    { id: '2', title: 'Evaluasi Liabilitas Lancar', moduleTitle: 'Modul Keuangan Lanjutan', count: 6 },
  ]);

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

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);
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
      setError(err instanceof Error ? err.message : 'Gagal memuat modul.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

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
        lessonTitle: modules.find(m => m.id === selectedModule)?.title || "Lesson",
        counts,
        difficulty
      }, {
        token: auth.token,
        headers: auth.headers
      });

      const list = response.questions || response.data || [];
      setGeneratedQuestions(list);
    } catch (err) {
      // Fallback mock questions if the server is offline or doesn't have Groq key setup
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

  const handleSaveQuiz = () => {
    if (generatedQuestions.length === 0) return;
    const newQuiz = {
      id: String(Date.now()),
      title: `Kuis Baru Modul ${modules.find(m => m.id === selectedModule)?.title || 'Umum'}`,
      moduleTitle: modules.find(m => m.id === selectedModule)?.title || 'Modul Umum',
      count: generatedQuestions.length
    };
    setQuizzes([newQuiz, ...quizzes]);
    setShowAiModal(false);
    setGeneratedQuestions([]);
    setPromptText('');
    setReadingMaterial('');
  };

  const handleDeleteQuiz = (id: string) => {
    setQuizzes(quizzes.filter(q => q.id !== id));
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
          <p style={s.subtitle}>Create interactive assessments using AI question generation tools</p>
        </div>
        <button onClick={() => setShowAiModal(true)} style={s.aiBtn}>
          <Sparkles size={16} color="var(--lemon)" />
          <span>AI Quiz Generator</span>
        </button>
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
        <div style={s.quizGrid}>
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="glass-panel" style={s.quizCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={s.iconWrap}>
                  <Brain size={18} color="var(--lemon)" />
                </div>
                <div>
                  <h4 style={s.quizName}>{quiz.title}</h4>
                  <span style={s.quizMeta}>{quiz.moduleTitle} • {quiz.count} Questions</span>
                </div>
              </div>
              <button onClick={() => handleDeleteQuiz(quiz.id)} style={s.deleteBtn} title="Hapus Kuis">
                <Trash2 size={14} color="#FF5252" />
              </button>
            </div>
          ))}
        </div>
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
                    <label style={s.label}>Target Module</label>
                    <select 
                      value={selectedModule} 
                      onChange={(e) => setSelectedModule(e.target.value)}
                      style={s.select}
                    >
                      <option value="">Select a module...</option>
                      {modules.map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
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
                    <button onClick={handleSaveQuiz} style={s.saveQuizBtn}>
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
    marginBottom: '28px',
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
    border: '1px solid rgba(255, 168, 38, 0.25)',
    background: 'rgba(255, 168, 38, 0.06)',
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
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
  listSection: {
    marginTop: '12px',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    color: '#ffffff',
    fontWeight: 700,
    marginBottom: '16px',
  },
  quizGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  quizCard: {
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(255, 178, 64, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizName: {
    fontSize: '0.92rem',
    fontWeight: 600,
    color: '#ffffff',
    margin: 0,
  },
  quizMeta: {
    fontSize: '0.78rem',
    color: 'var(--grey-blue)',
    marginTop: '2px',
    display: 'block',
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
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
    maxWidth: '600px',
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
  }
};
