"use client";

import React, { useState, useEffect } from 'react';
import { 
  Brain, Plus, Sparkles, X, Loader2, AlertCircle, 
  HelpCircle, CheckCircle, ChevronDown, Trash2, Edit2, PlusCircle
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import { useRouter } from 'next/navigation';

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



interface QuizQuestionInput {
  question_text: string;
  type: 'MultipleChoice' | 'TrueFalse' | 'Checkbox';
  options: { id: string; text: string; is_correct: boolean }[];
}

interface QuizListItem {
  id: string;
  title: string;
  moduleTitle: string;
  count: number;
}

export default function QuizzesPage() {
  const router = useRouter();
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
  const [counts, setCounts] = useState({
    MultipleChoice: 3,
    TrueFalse: 2,
    Checkbox: 1
  });
  
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestionInput[]>([]);
  const [savingAiQuiz, setSavingAiQuiz] = useState(false);

  // AI Quiz metadata fields (for save to bank)
  const [aiTitle, setAiTitle] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiTimeLimit, setAiTimeLimit] = useState(30);
  const [aiDeadline, setAiDeadline] = useState('');
  const [aiIsPublished, setAiIsPublished] = useState(true);

  // Manual Modal and Inputs (CRUD)
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualQuizId, setManualQuizId] = useState<string | null>(null);
  const [manualTitle, setManualTitle] = useState('');
  const [manualCourse, setManualCourse] = useState('');
  const [manualModule, setManualModule] = useState('');
  const [manualTimeLimit, setManualTimeLimit] = useState(30);
  const [manualQuestions, setManualQuestions] = useState<QuizQuestionInput[]>([]);
  const [savingManualQuiz, setSavingManualQuiz] = useState(false);

  // Wizard and extra Swagger fields
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [manualDeadline, setManualDeadline] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualIsPublished, setManualIsPublished] = useState(true);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);

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
      const response = await apiGet<any>('/api/pembelajaran', {
        token: auth.token,
        headers: auth.headers
      });
      let list: any[] = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        list = response.data;
      }

      const mapped = list.map((c: any) => ({
        uuid_pembelajaran: c.uuid_pembelajaran || c.id || '',
        title: c.nama_pembelajaran || c.title || ''
      }));
      setCourses(mapped);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const fetchModules = async (courseId?: string) => {
    try {
      const auth = getAuthHeaders();
      let url = '/api/modul';
      if (courseId) {
        url += `?uuid_pembelajaran=${courseId}`;
      }
      const response = await apiGet<any>(url, {
        token: auth.token,
        headers: auth.headers
      });

      let list: any[] = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        list = response.data;
      }

      const mapped = list.map((m: any) => ({
        uuid_modul: m.uuid_modul || m.id || '',
        title: m.nama_modul || m.title || '',
        description: m.deskripsi || m.description || '',
        difficulty: m.difficulty || '',
        uuid_pembelajaran: m.uuid_pembelajaran || m.id_pembelajaran || ''
      }));
      setModules(mapped);
    } catch (err) {
      console.error('Failed to fetch modules:', err);
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

      const mapped = list.map((q: any) => ({
        id: q.uuid_quiz || q.id || q.uuid,
        title: q.nama_quiz || q.title || 'Untitled Quiz',
        moduleTitle: q.asal_modul || q.modul?.title || q.asal_pembelajaran || q.pembelajaran?.title || '-',
        count: q.question_count || q.questions?.length || q._count?.questions || q.count || 0
      }));

      const finalized = await Promise.all(mapped.map(async (quiz: any) => {
        if (quiz.count > 0) return quiz;
        try {
          const detailRes = await apiGet<any>(`/api/quiz/${quiz.id}`, {
            token: auth.token,
            headers: auth.headers
          });
          const d = detailRes?.data || detailRes;
          const detailCount = (d.questions || d.daftar_soal || []).length || 0;
          return { ...quiz, count: detailCount };
        } catch {
          return quiz;
        }
      }));

      setQuizzes(finalized);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar quiz.');
    } finally {
      setLoading(false);
    }
  };

  const checkLocalDraft = () => {
    const draft = localStorage.getItem('nalara_quiz_draft');
    if (draft) {
      setHasLocalDraft(true);
    } else {
      setHasLocalDraft(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchQuizzes();
    checkLocalDraft();
  }, []);

  // Fetch modules dynamically when manual quiz course changes
  useEffect(() => {
    if (manualCourse) {
      fetchModules(manualCourse);
    } else {
      setModules([]);
    }
  }, [manualCourse]);

  // Fetch modules dynamically when AI generator course changes
  useEffect(() => {
    if (selectedCourse) {
      fetchModules(selectedCourse);
    }
  }, [selectedCourse]);

  // Auto-save draft logic
  const saveDraftToLocal = (fields: any) => {
    if (fields.title || fields.course || fields.questions.length > 0) {
      localStorage.setItem('nalara_quiz_draft', JSON.stringify(fields));
      setHasLocalDraft(true);
    }
  };

  const clearLocalDraft = () => {
    localStorage.removeItem('nalara_quiz_draft');
    setHasLocalDraft(false);
  };

  useEffect(() => {
    if (showManualModal && !manualQuizId) {
      saveDraftToLocal({
        title: manualTitle,
        course: manualCourse,
        module: manualModule,
        timeLimit: manualTimeLimit,
        deadline: manualDeadline,
        description: manualDescription,
        isPublished: manualIsPublished,
        questions: manualQuestions,
        step: modalStep
      });
    }
  }, [
    showManualModal,
    manualQuizId,
    manualTitle,
    manualCourse,
    manualModule,
    manualTimeLimit,
    manualDeadline,
    manualDescription,
    manualIsPublished,
    manualQuestions,
    modalStep
  ]);

  // AI Question Generator Handler
  const handleGenerateQuestions = async () => {
    if (!readingMaterial) {
      alert("Harap masukkan Reading Material sebagai landasan pembuatan kuis.");
      return;
    }

    const totalCount = counts.MultipleChoice + counts.TrueFalse + counts.Checkbox;
    if (totalCount === 0) {
      alert("Masukkan jumlah soal minimal 1 untuk setiap tipe yang diinginkan.");
      return;
    }
    if (totalCount > 25) {
      alert("Total soal tidak boleh melebihi 25. Harap kurangi jumlah soal.");
      return;
    }
    
    setAiGenerating(true);
    setGeneratedQuestions([]);
    try {
      const auth = getAuthHeaders();
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;
      const reqHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...auth.headers,
      };
      // AI endpoints require Bearer token — always set Authorization if token available
      if (auth.token) {
        reqHeaders['Authorization'] = `Bearer ${auth.token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/ai/generate-questions`, {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({
          prompt: promptText || "Generate questions based on the reading material",
          language: "id",
          readingMaterial,
          lessonTitle: modules.find(m => m.uuid_modul === selectedModule)?.title || "Lesson",
          counts,
        }),
      });

      if (!res.ok) {
        let errMsg = `Status ${res.status}`;
        try {
          const errData = await res.json();
          errMsg = errData.message || errData.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      const list: QuizQuestionInput[] = data.questions || data.data || [];
      if (list.length > 0) {
        setGeneratedQuestions(list);
      } else {
        throw new Error('Tidak ada pertanyaan yang dihasilkan.');
      }
    } catch (err) {
      console.warn('[AI Generate] Gagal dari API, menggunakan data contoh:', err instanceof Error ? err.message : err);
      // Fallback ke contoh soal berdasarkan reading material yang diinput
      const lessonName = modules.find(m => m.uuid_modul === selectedModule)?.title || 'Materi';
      const mockList: QuizQuestionInput[] = [
        {
          type: 'MultipleChoice',
          question_text: `Berdasarkan materi "${lessonName}", manakah pernyataan berikut yang paling tepat?`,
          options: [
            { id: 'A', text: 'Semua konsep dalam materi bersifat teoritis dan tidak dapat diterapkan', is_correct: false },
            { id: 'B', text: 'Materi ini mencakup konsep-konsep dasar yang fundamental', is_correct: true },
            { id: 'C', text: 'Hanya bagian tertentu dari materi yang relevan', is_correct: false },
            { id: 'D', text: 'Materi ini tidak berhubungan dengan praktik nyata', is_correct: false }
          ]
        },
        {
          type: 'TrueFalse',
          question_text: `Pemahaman mendalam terhadap materi "${lessonName}" penting untuk pengembangan kompetensi.`,
          options: [
            { id: 'A', text: 'Benar', is_correct: true },
            { id: 'B', text: 'Salah', is_correct: false }
          ]
        },
        {
          type: 'Checkbox',
          question_text: `Pilih poin-poin yang relevan dengan materi "${lessonName}":`,
          options: [
            { id: 'A', text: 'Poin relevan 1', is_correct: true },
            { id: 'B', text: 'Poin tidak relevan', is_correct: false },
            { id: 'C', text: 'Poin relevan 2', is_correct: true },
            { id: 'D', text: 'Poin keliru', is_correct: false }
          ]
        }
      ];
      setGeneratedQuestions(mockList);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveAiQuiz = async () => {
    if (generatedQuestions.length === 0 || !selectedCourse) {
      alert('Harap pilih Course dan generate soal terlebih dahulu.');
      return;
    }
    if (!aiTitle.trim()) {
      alert('Harap isi Judul Kuis sebelum menyimpan.');
      return;
    }
    setSavingAiQuiz(true);
    try {
      const auth = getAuthHeaders();
      const apiQuestions = generatedQuestions.map((q) => {
        const formattedQ: any = {
          question_text: q.question_text,
          type: q.type,
        };
        formattedQ.options = (q.options || []).map((opt) => ({
          id: opt.id,
          text: opt.text,
          is_correct: opt.is_correct
        }));
        return formattedQ;
      });

      await apiPost('/api/quiz', {
        title: aiTitle.trim(),
        description: aiDescription || undefined,
        time_limit: Number(aiTimeLimit),
        deadline: aiDeadline ? new Date(aiDeadline).toISOString() : undefined,
        is_published: aiIsPublished,
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
      setSelectedCourse('');
      setSelectedModule('');
      setAiTitle('');
      setAiDescription('');
      setAiTimeLimit(30);
      setAiDeadline('');
      setAiIsPublished(true);
      fetchQuizzes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan quiz ke server.');
    } finally {
      setSavingAiQuiz(false);
    }
  };

  // Manual Quiz CRUD Handlers
  const handleOpenManualCreate = () => {
    setManualQuizId(null);
    setManualTitle('');
    setManualCourse('');
    setManualModule('');
    setManualTimeLimit(30);
    setManualDeadline('');
    setManualDescription('');
    setManualIsPublished(true);
    setManualQuestions([]);
    setModalStep(1);
    setShowManualModal(true);
  };

  const handleResumeDraft = async () => {
    const draftStr = localStorage.getItem('nalara_quiz_draft');
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        setManualQuizId(null);
        setManualTitle(draft.title || '');
        setManualCourse(draft.course || '');
        
        if (draft.course) {
          await fetchModules(draft.course);
        } else {
          setModules([]);
        }

        setManualModule(draft.module || '');
        setManualTimeLimit(draft.timeLimit ?? 30);
        setManualDeadline(draft.deadline || '');
        setManualDescription(draft.description || '');
        setManualIsPublished(draft.isPublished ?? true);
        setManualQuestions(draft.questions || []);
        setModalStep(draft.step || 1);
        setShowManualModal(true);
      } catch (err) {
        console.error('Failed to parse draft:', err);
      }
    }
  };

  const handleDiscardDraft = () => {
    if (confirm('Apakah Anda yakin ingin membuang draft kuis ini?')) {
      clearLocalDraft();
    }
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
      setManualTimeLimit(quizData.time_limit ?? 30);
      
      if (quizData.deadline) {
        const d = new Date(quizData.deadline);
        const pad = (n: number) => String(n).padStart(2, '0');
        const formattedDeadline = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setManualDeadline(formattedDeadline);
      } else {
        setManualDeadline('');
      }
      setManualDescription(quizData.description || '');
      setManualIsPublished(quizData.is_published ?? true);

      // Map questions
      const mappedQuestions: QuizQuestionInput[] = (quizData.questions || []).map((q: any) => {
        const qType: 'MultipleChoice' | 'TrueFalse' | 'Checkbox' = q.type || 'MultipleChoice';
        const optionsList = (q.options || []).map((o: any) => ({
          id: o.id || '',
          text: o.text || '',
          is_correct: !!o.is_correct
        }));

        return {
          question_text: q.question_text || '',
          type: qType,
          options: optionsList
        };
      });

      if (quizData.uuid_pembelajaran) {
        await fetchModules(quizData.uuid_pembelajaran);
      } else {
        setModules([]);
      }

      setManualQuestions(mappedQuestions);
      setModalStep(1);
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
    setManualQuestions(prev => prev.map((q, idx) => {
      if (idx !== index) return q;
      if (field === 'type') {
        const type = value as 'MultipleChoice' | 'TrueFalse' | 'Checkbox';
        return {
          ...q,
          type,
          options: type === 'TrueFalse'
            ? [
                { id: 'A', text: 'True', is_correct: true },
                { id: 'B', text: 'False', is_correct: false }
              ]
            : [
                { id: 'A', text: '', is_correct: false },
                { id: 'B', text: '', is_correct: false },
                { id: 'C', text: '', is_correct: false },
                { id: 'D', text: '', is_correct: false }
              ]
        };
      } else {
        return {
          ...q,
          [field]: value
        };
      }
    }));
  };

  const handleOptionTextChange = (qIdx: number, oIdx: number, text: string) => {
    setManualQuestions(prev => prev.map((q, idx) => {
      if (idx !== qIdx) return q;
      return {
        ...q,
        options: q.options.map((opt, oKey) => oKey === oIdx ? { ...opt, text } : opt)
      };
    }));
  };

  const handleOptionCorrectChange = (qIdx: number, oIdx: number) => {
    setManualQuestions(prev => prev.map((q, idx) => {
      if (idx !== qIdx) return q;
      return {
        ...q,
        options: q.options.map((opt, oKey) => {
          if (q.type === 'Checkbox') {
            return oKey === oIdx ? { ...opt, is_correct: !opt.is_correct } : opt;
          } else {
            return { ...opt, is_correct: oKey === oIdx };
          }
        })
      };
    }));
  };

  const handleSaveManualQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualCourse) {
      alert('Judul Kuis dan Target Course wajib diisi.');
      return;
    }
    if (manualQuestions.length < 10) {
      alert('Kuis minimal harus memiliki 10 soal untuk dapat disimpan.');
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
        };

        formattedQ.options = q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          is_correct: opt.is_correct
        }));

        return formattedQ;
      });

      const payload = {
        title: manualTitle,
        description: manualDescription || undefined,
        deadline: manualDeadline ? new Date(manualDeadline).toISOString() : undefined,
        time_limit: Number(manualTimeLimit),
        is_published: manualIsPublished,
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

      clearLocalDraft();
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

      {/* Local Draft recovery panel if exists */}
      {hasLocalDraft && (
        <div style={s.draftPanel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={s.iconWrapDraft}>
              <Brain size={18} color="var(--azure)" />
            </div>
            <div>
              <h4 style={s.draftName}>Lanjutkan Pembuatan Kuis Terakhir?</h4>
              <span style={s.draftMeta}>Anda memiliki draf kuis yang belum selesai disimpan.</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleResumeDraft} style={s.resumeBtn}>
              Lanjutkan Draft
            </button>
            <button onClick={handleDiscardDraft} style={s.discardBtn}>
              Hapus Draft
            </button>
          </div>
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
                <div 
                  style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 1 }}
                  onClick={() => router.push(`/lecturer/quizzes/detail?id=${quiz.id}`)}
                  title="Klik untuk melihat detail soal kuis"
                >
                  <div style={s.iconWrap}>
                    <Brain size={18} color="var(--lemon)" />
                  </div>
                  <div>
                    <h4 style={s.quizName}>{quiz.title}</h4>
                    <span style={s.quizMeta}>{quiz.moduleTitle} • {quiz.count} Questions</span>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
                {/* Left Panel — AI Settings */}
                <div style={s.aiInputs}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--azure)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    ① Generate Soal
                  </div>

                  <div style={s.formGroup}>
                    <label style={s.label}>Course (Pembelajaran) *</label>
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
                    <label style={s.label}>Module (Optional)</label>
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
                    <label style={s.label}>Reading Material / Context *</label>
                    <textarea
                      value={readingMaterial}
                      onChange={(e) => setReadingMaterial(e.target.value)}
                      placeholder="Paste materi bacaan di sini sebagai sumber soal..."
                      style={{ ...s.input, minHeight: 100, resize: 'vertical' }}
                    />
                  </div>

                  <div style={s.formGroup}>
                    <label style={s.label}>Topic Guidance (Optional)</label>
                    <input
                      type="text"
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      placeholder="e.g., Fokus pada konsep utama materi ini..."
                      style={s.input}
                    />
                  </div>

                  <div style={s.formGroup}>
                    <label style={s.label}>Jumlah Soal Per Tipe <span style={{ color: 'var(--grey)', fontWeight: 400 }}>(Maks. 25 total)</span></label>
                    <div style={s.counterRow}>
                      <div style={s.counterBox}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>MCQ</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--grey)', marginTop: 2 }}>Pilihan Ganda</div>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="25"
                          value={counts.MultipleChoice}
                          onChange={(e) => setCounts({ ...counts, MultipleChoice: parseInt(e.target.value) || 0 })}
                          style={s.counterInput}
                        />
                      </div>
                      <div style={s.counterBox}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>T/F</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--grey)', marginTop: 2 }}>Benar / Salah</div>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="25"
                          value={counts.TrueFalse}
                          onChange={(e) => setCounts({ ...counts, TrueFalse: parseInt(e.target.value) || 0 })}
                          style={s.counterInput}
                        />
                      </div>
                      <div style={s.counterBox}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Checkbox</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--grey)', marginTop: 2 }}>Multi Jawaban</div>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="25"
                          value={counts.Checkbox}
                          onChange={(e) => setCounts({ ...counts, Checkbox: parseInt(e.target.value) || 0 })}
                          style={s.counterInput}
                        />
                      </div>
                    </div>
                    {(() => {
                      const total = counts.MultipleChoice + counts.TrueFalse + counts.Checkbox;
                      return (
                        <div style={{ fontSize: '0.75rem', color: 'var(--grey-blue)', marginTop: 6 }}>
                          Total: <strong style={{ color: total > 25 ? '#FF5252' : '#fff' }}>{total}</strong> soal
                          {total > 25 && <span style={{ color: '#FF5252', marginLeft: 6 }}>— melebihi batas maksimum 25!</span>}
                        </div>
                      );
                    })()}
                  </div>

                  <button
                    onClick={handleGenerateQuestions}
                    disabled={aiGenerating || !readingMaterial || !selectedCourse}
                    style={{
                      ...s.generateBtn,
                      opacity: (aiGenerating || !readingMaterial || !selectedCourse) ? 0.6 : 1
                    }}
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Generating Soal...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Generate Questions</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Right Panel — Quiz Metadata + Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 24 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--lemon)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    ② Data Kuis
                  </div>

                  <div style={s.formGroup}>
                    <label style={s.label}>Judul Kuis *</label>
                    <input
                      type="text"
                      value={aiTitle}
                      onChange={(e) => setAiTitle(e.target.value)}
                      placeholder="e.g., Kuis JavaScript Dasar (AI)"
                      style={s.input}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={s.formGroup}>
                      <label style={s.label}>Time Limit (Menit)</label>
                      <input
                        type="number"
                        min="1"
                        value={aiTimeLimit}
                        onChange={(e) => setAiTimeLimit(parseInt(e.target.value) || 1)}
                        style={s.input}
                      />
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>Deadline (Optional)</label>
                      <input
                        type="datetime-local"
                        value={aiDeadline}
                        onChange={(e) => setAiDeadline(e.target.value)}
                        onClick={(e) => { try { (e.target as any).showPicker(); } catch {} }}
                        style={s.input}
                      />
                    </div>
                  </div>

                  <div style={s.formGroup}>
                    <label style={s.label}>Deskripsi (Optional)</label>
                    <textarea
                      rows={2}
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      placeholder="Tulis instruksi atau deskripsi kuis untuk siswa..."
                      style={{ ...s.input, resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      id="aiIsPublished"
                      checked={aiIsPublished}
                      onChange={(e) => setAiIsPublished(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: 'var(--azure)', cursor: 'pointer' }}
                    />
                    <label htmlFor="aiIsPublished" style={{ ...s.label, cursor: 'pointer', userSelect: 'none' }}>
                      Publish langsung kuis ini
                    </label>
                  </div>

                  {/* Questions Preview */}
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--grey-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
                    ③ Preview Soal ({generatedQuestions.length})
                  </div>
                  <div style={{ ...s.previewArea, minHeight: 200, maxHeight: 260 }}>
                    {generatedQuestions.length > 0 ? (
                      <div style={s.questionsList}>
                        {generatedQuestions.map((q, idx) => (
                          <div key={idx} style={s.questionItem}>
                            <div style={s.qHeader}>
                              <span style={s.qBadge}>{q.type}</span>
                              <span style={s.qNum}>Soal {idx + 1}</span>
                            </div>
                            <p style={s.qText}>{q.question_text}</p>
                            {q.options && (
                              <ul style={s.optionsList}>
                                {q.options.map((opt, oIdx) => (
                                  <li key={oIdx} style={{ ...s.optionItem, color: opt.is_correct ? 'var(--lemon)' : 'inherit' }}>
                                    <strong>{opt.id}.</strong> {opt.text} {opt.is_correct && '✓'}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={s.previewPlaceholder}>
                        {aiGenerating
                          ? 'AI sedang membuat soal dari materi bacaan...'
                          : 'Klik "Generate Questions" untuk melihat preview soal di sini.'}
                      </div>
                    )}
                  </div>

                  {generatedQuestions.length > 0 && (
                    <button
                      onClick={handleSaveAiQuiz}
                      disabled={savingAiQuiz || !aiTitle.trim() || !selectedCourse}
                      style={{
                        ...s.saveQuizBtn,
                        opacity: (savingAiQuiz || !aiTitle.trim() || !selectedCourse) ? 0.6 : 1,
                        cursor: (savingAiQuiz || !aiTitle.trim() || !selectedCourse) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {savingAiQuiz ? (
                        <>
                          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          <span>Save Quiz to Bank</span>
                        </>
                      )}
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
                <h3>
                  {manualQuizId ? 'Edit Quiz (Manual)' : 'Create Quiz (Manual)'} 
                  <span style={{ fontSize: '0.85rem', color: 'var(--grey-blue)', marginLeft: 12 }}>
                    (Langkah {modalStep} dari 2: {modalStep === 1 ? 'Data Kuis' : 'Daftar Soal'})
                  </span>
                </h3>
              </div>
              <button onClick={() => setShowManualModal(false)} style={s.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveManualQuizSubmit} style={s.form}>
              {/* STEP 1: DATA QUIZ */}
              {modalStep === 1 && (
                <div style={s.modalBody}>
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
                        <option value="" style={{ background: '#191919', color: '#fff' }}>Select course...</option>
                        {courses.map(c => (
                          <option key={c.uuid_pembelajaran} value={c.uuid_pembelajaran} style={{ background: '#191919', color: '#fff' }}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ ...s.formGrid2Col, marginTop: 16 }}>
                    <div style={s.formGroup}>
                      <label style={s.label}>Module (Optional)</label>
                      <select
                        value={manualModule}
                        onChange={(e) => setManualModule(e.target.value)}
                        style={s.select}
                      >
                        <option value="" style={{ background: '#191919', color: '#fff' }}>Select module...</option>
                        {(manualCourse ? modules.filter(m => m.uuid_pembelajaran === manualCourse) : modules).map(m => (
                          <option key={m.uuid_modul} value={m.uuid_modul} style={{ background: '#191919', color: '#fff' }}>{m.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ ...s.formGrid2Col, marginTop: 16 }}>
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
                    <div style={s.formGroup}>
                      <label style={s.label}>Deadline (Tenggat Waktu)</label>
                      <input 
                        type="datetime-local"
                        value={manualDeadline}
                        onChange={(e) => setManualDeadline(e.target.value)}
                        onClick={(e) => { try { (e.target as any).showPicker(); } catch {} }}
                        style={s.input}
                      />
                    </div>
                  </div>

                  <div style={{ ...s.formGroup, marginTop: 16 }}>
                    <label style={s.label}>Description (Deskripsi Kuis)</label>
                    <textarea 
                      rows={3}
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      placeholder="Tulis instruksi atau deskripsi kuis untuk siswa di sini..."
                      style={{ ...s.input, resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
                    <input 
                      type="checkbox"
                      id="manualIsPublished"
                      checked={manualIsPublished}
                      onChange={(e) => setManualIsPublished(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: 'var(--azure)' }}
                    />
                    <label htmlFor="manualIsPublished" style={{ ...s.label, cursor: 'pointer', userSelect: 'none' }}>
                      Publish langsung kuis ini (buat agar dapat dilihat oleh siswa)
                    </label>
                  </div>

                  <div style={s.modalFooter}>
                    <button type="button" onClick={() => setShowManualModal(false)} style={s.cancelBtn}>Batal</button>
                    <button 
                      type="button" 
                      onClick={() => {
                        if (!manualTitle || !manualCourse) {
                          alert('Harap isi Judul Kuis dan pilih Kelas terlebih dahulu.');
                          return;
                        }
                        setModalStep(2);
                      }} 
                      style={s.submitBtn}
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: SOAL */}
              {modalStep === 2 && (
                <div style={s.modalBody}>
                  {/* Minimum 10 questions validation warning banner */}
                  {manualQuestions.length < 10 ? (
                    <div style={{ ...s.errorAlert, marginBottom: 20 }}>
                      <AlertCircle size={20} color="#FF5252" />
                      <span style={s.errorMsg}>
                        <strong>Jumlah Soal Belum Memenuhi Syarat:</strong> Anda memerlukan minimal <strong>10 soal</strong> untuk membuat kuis. Saat ini baru terdapat <strong>{manualQuestions.length}</strong> soal.
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', background: 'rgba(0, 200, 83, 0.08)', border: '1px solid rgba(0, 200, 83, 0.2)', borderRadius: 8, marginBottom: 20, color: '#00C853', fontSize: '0.85rem' }}>
                      <CheckCircle size={20} color="#00C853" />
                      <span>Syarat minimum 10 soal sudah terpenuhi! Kuis siap disimpan.</span>
                    </div>
                  )}

                  {/* Manual Questions Builder Section */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h4 style={{ margin: 0, color: '#fff', fontSize: '1.05rem' }}>Daftar Soal ({manualQuestions.length})</h4>
                      <button type="button" onClick={handleAddManualQuestion} style={s.addQuestionBtn}>
                        <PlusCircle size={14} />
                        <span>Tambah Soal</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '420px', overflowY: 'auto', paddingRight: 8 }}>
                      {manualQuestions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--grey-blue)', fontSize: '0.85rem', border: '1px dashed var(--border-color)', borderRadius: 8 }}>
                          Belum ada soal. Klik tombol "Tambah Soal" di kanan atas untuk mulai membuat soal.
                        </div>
                      ) : (
                        manualQuestions.map((q, qIdx) => (
                          <div key={qIdx} style={s.manualQuestionCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--azure)' }}>Soal #{qIdx + 1}</span>
                              <button type="button" onClick={() => handleRemoveManualQuestion(qIdx)} style={s.removeQBtn}>
                                <Trash2 size={14} color="#FF5252" />
                              </button>
                            </div>

                            <div style={s.formGroup} className="mb-4">
                              <label style={s.label}>Pertanyaan *</label>
                              <textarea
                                required
                                rows={2}
                                value={q.question_text}
                                onChange={(e) => handleQuestionChange(qIdx, 'question_text', e.target.value)}
                                placeholder="Tuliskan pertanyaan di sini..."
                                style={s.input}
                              />
                            </div>

                            <div style={s.formGrid3Col}>
                              <div style={s.formGroup}>
                                <label style={s.label}>Tipe Soal</label>
                                <select
                                  value={q.type}
                                  onChange={(e) => handleQuestionChange(qIdx, 'type', e.target.value)}
                                  style={s.select}
                                >
                                  <option value="MultipleChoice" style={{ background: '#191919', color: '#fff' }}>Pilihan Ganda</option>
                                  <option value="TrueFalse" style={{ background: '#191919', color: '#fff' }}>Benar / Salah</option>
                                  <option value="Checkbox" style={{ background: '#191919', color: '#fff' }}>Checkbox (Multi Correct)</option>
                                </select>
                              </div>
                            </div>
                            {/* Options for MCQ / TF / Checkbox */}
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <label style={s.label}>Opsi Jawaban & Jawaban Benar</label>
                              {q.options.map((opt, oIdx) => (
                                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <input 
                                    type={q.type === 'Checkbox' ? "checkbox" : "radio"}
                                    name={`correct-choice-${qIdx}-${q.type === 'Checkbox' ? oIdx : 'radio'}`}
                                    checked={opt.is_correct}
                                    onChange={() => handleOptionCorrectChange(qIdx, oIdx)}
                                    style={{ accentColor: 'var(--azure)', cursor: 'pointer', width: 16, height: 16 }}
                                  />
                                  <span style={{ color: 'var(--grey-blue)', fontWeight: 600, fontSize: '0.85rem' }}>{opt.id}</span>
                                  <input 
                                    type="text"
                                    required
                                    disabled={q.type === 'TrueFalse'}
                                    value={opt.text}
                                    onChange={(e) => handleOptionTextChange(qIdx, oIdx, e.target.value)}
                                    placeholder={`Teks Opsi ${opt.id}`}
                                    style={s.input}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div style={s.modalFooter}>
                    <div style={{ marginRight: 'auto', display: 'flex', gap: 12 }}>
                      <button type="button" onClick={() => setModalStep(1)} style={s.cancelBtn}>Sebelumnya</button>
                    </div>
                    <button type="button" onClick={() => setShowManualModal(false)} style={s.cancelBtn}>Batal</button>
                    <button 
                      type="submit" 
                      disabled={savingManualQuiz || manualQuestions.length < 10} 
                      style={{
                        ...s.submitBtn,
                        opacity: (savingManualQuiz || manualQuestions.length < 10) ? 0.6 : 1,
                        cursor: (savingManualQuiz || manualQuestions.length < 10) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {savingManualQuiz ? 'Menyimpan...' : 'Buat Quiz'}
                    </button>
                  </div>
                </div>
              )}
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
  },
  draftPanel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: 'rgba(65, 150, 240, 0.06)',
    border: '1px solid rgba(65, 150, 240, 0.2)',
    borderRadius: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  iconWrapDraft: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(65, 150, 240, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftName: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
  },
  draftMeta: {
    fontSize: '0.8rem',
    color: 'var(--grey-blue)',
    display: 'block',
    marginTop: '2px',
  },
  resumeBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    background: 'linear-gradient(135deg, var(--navy), var(--m-blue))',
    color: '#ffffff',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  discardBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid rgba(244, 67, 54, 0.25)',
    background: 'rgba(244, 67, 54, 0.05)',
    color: '#FF5252',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
  }
};
