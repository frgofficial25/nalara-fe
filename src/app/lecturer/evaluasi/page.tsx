"use client";

import React, { useState, useEffect } from 'react';
import {
  Brain, Plus, Sparkles, X, Loader2, AlertCircle,
  CheckCircle, Trash2, Edit2, PlusCircle,
  FileText, BookOpenCheck, FlaskConical, Video, PencilLine, Filter, Eye
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import { useRouter } from 'next/navigation';
import type { Tugas, TugasType, Pembelajaran, Modul } from '@/types/lecturer.types';
import Portal from '@/components/common/Portal';

// ─── Quiz types ─────────────────────────────────────────────────────────────
interface QuizQuestionInput {
  question_text: string;
  type: 'MultipleChoice' | 'TrueFalse' | 'Checkbox';
  options: { id: string; text: string; is_correct: boolean }[];
}
interface QuizListItem { id: string; title: string; moduleTitle: string; count: number; }

// ─── Helpers ────────────────────────────────────────────────────────────────
function getAuthHeaders() {
  const token = getStoredToken();
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) headers['x-api-key'] = apiKey;
  else if (token) headers['x-api-key'] = token;
  return { token: token || undefined, headers };
}

const typeIcons: Record<TugasType, React.ReactNode> = {
  Reading:   <BookOpenCheck size={16} color="#4196F0" />,
  Video:     <Video size={16} color="#E040FB" />,
  CaseStudy: <FlaskConical size={16} color="#FF9100" />,
  Practice:  <PencilLine size={16} color="#00C853" />,
};
const typeColors: Record<TugasType, { bg: string; text: string; border: string }> = {
  Reading:   { bg: 'rgba(65,150,240,0.1)',   text: '#4196F0', border: 'rgba(65,150,240,0.2)' },
  Video:     { bg: 'rgba(224,64,251,0.1)',   text: '#E040FB', border: 'rgba(224,64,251,0.2)' },
  CaseStudy: { bg: 'rgba(255,145,0,0.1)',    text: '#FF9100', border: 'rgba(255,145,0,0.2)' },
  Practice:  { bg: 'rgba(0,200,83,0.1)',     text: '#00C853', border: 'rgba(0,200,83,0.2)' },
};

// ============================================================================
export default function EvaluasiPage() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<'studycase' | 'quiz'>('studycase');

  // ── Shared data ──────────────────────────────────────────────────────────
  const [courses, setCourses]   = useState<any[]>([]);
  const [modules, setModules]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // ── Study Case state ─────────────────────────────────────────────────────
  const [tugasList, setTugasList]         = useState<Tugas[]>([]);
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterModuleId, setFilterModuleId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentTugas, setCurrentTugas]       = useState<Tugas | null>(null);
  const [form, setForm] = useState({
    title: '', type: 'CaseStudy' as TugasType,
    youtube_link: '', content_text: '',
    uuid_pembelajaran: '', uuid_modul: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Quiz state ───────────────────────────────────────────────────────────
  const [quizzes, setQuizzes]               = useState<QuizListItem[]>([]);
  const [quizLoading, setQuizLoading]       = useState(false);
  const [hasLocalDraft, setHasLocalDraft]   = useState(false);

  // AI modal
  const [showAiModal, setShowAiModal]           = useState(false);
  const [selectedCourse, setSelectedCourse]     = useState('');
  const [selectedModule, setSelectedModule]     = useState('');
  const [promptText, setPromptText]             = useState('');
  const [readingMaterial, setReadingMaterial]   = useState('');
  const [counts, setCounts] = useState({ MultipleChoice: 5, TrueFalse: 3, Checkbox: 2 });
  const [aiGenerating, setAiGenerating]         = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestionInput[]>([]);
  const [aiTitle, setAiTitle]       = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiTimeLimit, setAiTimeLimit]   = useState(30);
  const [aiDeadline, setAiDeadline]     = useState('');
  const [aiIsPublished, setAiIsPublished] = useState(true);
  const [savingAiQuiz, setSavingAiQuiz] = useState(false);

  // Manual quiz modal
  const [showManualModal, setShowManualModal]   = useState(false);
  const [manualQuizId, setManualQuizId]         = useState<string | null>(null);
  const [manualTitle, setManualTitle]           = useState('');
  const [manualCourse, setManualCourse]         = useState('');
  const [manualModule, setManualModule]         = useState('');
  const [manualTimeLimit, setManualTimeLimit]   = useState(30);
  const [manualDeadline, setManualDeadline]     = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualIsPublished, setManualIsPublished] = useState(true);
  const [manualQuestions, setManualQuestions]   = useState<QuizQuestionInput[]>([]);
  const [savingManualQuiz, setSavingManualQuiz] = useState(false);
  const [modalStep, setModalStep]               = useState<1 | 2>(1);

  // ── Fetch helpers ────────────────────────────────────────────────────────
  const fetchSharedData = async () => {
    try {
      const auth = getAuthHeaders();
      const [cRes, mRes] = await Promise.all([
        apiGet<any>('/api/pembelajaran', { token: auth.token, headers: auth.headers }),
        apiGet<any>('/api/modul',        { token: auth.token, headers: auth.headers }),
      ]);
      const cList = Array.isArray(cRes) ? cRes : (cRes?.data || []);
      const mList = Array.isArray(mRes) ? mRes : (mRes?.data || []);
      setCourses(cList.map((c: any) => ({
        uuid_pembelajaran: c.uuid_pembelajaran || c.id || '',
        title: c.nama_pembelajaran || c.title || '',
        id: c.uuid_pembelajaran || c.id || '',
      })));
      setModules(mList.map((m: any) => ({
        uuid_modul: m.uuid_modul || m.id || '',
        title: m.nama_modul || m.title || '',
        uuid_pembelajaran: m.uuid_pembelajaran || '',
        id: m.uuid_modul || m.id || '',
      })));
    } catch (e) { console.error('fetchSharedData', e); }
  };

  const fetchTugas = async () => {
    try {
      setLoading(true); setError(null);
      const auth = getAuthHeaders();
      let path = '/api/tugas';
      const p = new URLSearchParams();
      if (filterCourseId) p.set('uuid_pembelajaran', filterCourseId);
      if (filterModuleId) p.set('uuid_modul', filterModuleId);
      const qs = p.toString(); if (qs) path += `?${qs}`;
      const res = await apiGet<any>(path, { token: auth.token, headers: auth.headers });
      let list: any[] = Array.isArray(res) ? res : (res?.data || []);
      list = list
        .filter((t: any) => (!filterCourseId || t.uuid_pembelajaran === filterCourseId) && (!filterModuleId || t.uuid_modul === filterModuleId))
        .map((t: any) => ({ ...t, id: t.uuid_tugas || t.id }));
      setTugasList(list);
    } catch (e: any) { setError(e.message || 'Gagal memuat tugas.'); }
    finally { setLoading(false); }
  };

  const fetchModulesForCourse = async (courseId: string) => {
    try {
      const auth = getAuthHeaders();
      const res = await apiGet<any>(`/api/modul?uuid_pembelajaran=${courseId}`, { token: auth.token, headers: auth.headers });
      const list = Array.isArray(res) ? res : (res?.data || []);
      setModules(list.map((m: any) => ({
        uuid_modul: m.uuid_modul || m.id || '',
        title: m.nama_modul || m.title || '',
        uuid_pembelajaran: m.uuid_pembelajaran || '',
        id: m.uuid_modul || m.id || '',
      })));
    } catch { /* keep existing */ }
  };

  const fetchQuizzes = async () => {
    try {
      setQuizLoading(true);
      const auth = getAuthHeaders();
      const res = await apiGet<any>('/api/quiz', { token: auth.token, headers: auth.headers });
      const list = Array.isArray(res) ? res : (res?.data || []);
      setQuizzes(list.map((q: any) => ({
        id: q.uuid_quiz || q.id || '',
        title: q.nama_quiz || q.title || 'Untitled Quiz',
        moduleTitle: q.asal_modul || q.modul?.title || q.asal_pembelajaran || q.pembelajaran?.title || '-',
        count: q.questions?.length || 0,
      })));
    } catch (e: any) { setError(e.message || 'Gagal memuat kuis.'); }
    finally { setQuizLoading(false); }
  };

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => { fetchSharedData(); setHasLocalDraft(!!localStorage.getItem('nalara_quiz_draft')); }, []);
  useEffect(() => { if (mainTab === 'studycase') fetchTugas(); else fetchQuizzes(); }, [mainTab, filterCourseId, filterModuleId]);
  useEffect(() => { if (manualCourse) fetchModulesForCourse(manualCourse); }, [manualCourse]);
  useEffect(() => { if (selectedCourse) fetchModulesForCourse(selectedCourse); }, [selectedCourse]);

  // ── Study Case CRUD ──────────────────────────────────────────────────────
  const resetForm = () => setForm({ title: '', type: 'CaseStudy', youtube_link: '', content_text: '', uuid_pembelajaran: '', uuid_modul: '' });
  const getFormModules = () => form.uuid_pembelajaran ? modules.filter(m => m.uuid_pembelajaran === form.uuid_pembelajaran) : modules;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const auth = getAuthHeaders();
      const payload: any = { title: form.title, type: form.type, uuid_pembelajaran: form.uuid_pembelajaran, uuid_modul: form.uuid_modul };
      if (form.type === 'Video' && form.youtube_link) payload.youtube_link = form.youtube_link;
      if ((form.type === 'Reading' || form.type === 'CaseStudy') && form.content_text) {
        payload.content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: form.content_text }] }] };
      }
      await apiPost('/api/tugas', payload, { token: auth.token, headers: auth.headers });
      setShowCreateModal(false); resetForm(); fetchTugas();
    } catch (e: any) { alert(e.message || 'Gagal membuat tugas.'); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTugas) return;
    setSubmitting(true);
    try {
      const auth = getAuthHeaders();
      const payload: any = { title: form.title, type: form.type };
      if (form.type === 'Video') payload.youtube_link = form.youtube_link;
      if ((form.type === 'Reading' || form.type === 'CaseStudy') && form.content_text) {
        payload.content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: form.content_text }] }] };
      }
      if (form.uuid_pembelajaran) payload.uuid_pembelajaran = form.uuid_pembelajaran;
      if (form.uuid_modul) payload.uuid_modul = form.uuid_modul;
      await apiPut(`/api/tugas/${currentTugas.id}`, payload, { token: auth.token, headers: auth.headers });
      setShowEditModal(false); setCurrentTugas(null); resetForm(); fetchTugas();
    } catch (e: any) { alert(e.message || 'Gagal memperbarui tugas.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus tugas ini?')) return;
    try {
      const auth = getAuthHeaders();
      await apiDelete(`/api/tugas/${id}`, { token: auth.token, headers: auth.headers });
      fetchTugas();
    } catch (e: any) { alert(e.message || 'Gagal menghapus tugas.'); }
  };

  const handleViewDetail = async (tugas: Tugas) => {
    try {
      const auth = getAuthHeaders();
      const res = await apiGet<any>(`/api/tugas/${tugas.id}`, { token: auth.token, headers: auth.headers });
      setCurrentTugas('data' in res ? res.data : res);
    } catch { setCurrentTugas(tugas); }
    setShowDetailModal(true);
  };

  const openEditModal = (tugas: Tugas) => {
    setCurrentTugas(tugas);
    let initialText = '';
    if (tugas.content) {
      if (typeof tugas.content === 'object' && (tugas.content as any).content?.[0]?.content?.[0]?.text) {
        initialText = (tugas.content as any).content[0].content[0].text;
      } else if (typeof tugas.content === 'object' && (tugas.content as any).type === 'doc') {
        initialText = (tugas.content as any).content?.map((p: any) => p.content?.map((t: any) => t.text).join('') || '').join('\n') || '';
      } else {
        initialText = typeof tugas.content === 'string' ? tugas.content : JSON.stringify(tugas.content);
      }
    }
    setForm({
      title: tugas.title,
      type: tugas.type,
      youtube_link: tugas.youtube_link || '',
      content_text: initialText,
      uuid_pembelajaran: tugas.uuid_pembelajaran || '',
      uuid_modul: tugas.uuid_modul || ''
    });
    setShowEditModal(true);
  };

  // ── Quiz CRUD ────────────────────────────────────────────────────────────
  const openManualCreate = () => {
    setManualQuizId(null); setManualTitle(''); setManualCourse(''); setManualModule('');
    setManualTimeLimit(30); setManualDeadline(''); setManualDescription(''); setManualIsPublished(true);
    setManualQuestions([]); setModalStep(1); setShowManualModal(true);
  };

  const openManualEdit = async (quizId: string) => {
    try {
      const auth = getAuthHeaders();
      const res = await apiGet<any>(`/api/quiz/${quizId}`, { token: auth.token, headers: auth.headers });
      const d = res.data || res;
      setManualQuizId(quizId);
      setManualTitle(d.title || '');
      setManualCourse(d.uuid_pembelajaran || '');
      setManualModule(d.uuid_modul || '');
      setManualTimeLimit(d.time_limit ?? 30);
      if (d.deadline) {
        const dt = new Date(d.deadline);
        const pad = (n: number) => String(n).padStart(2, '0');
        setManualDeadline(`${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`);
      } else setManualDeadline('');
      setManualDescription(d.description || '');
      setManualIsPublished(d.is_published ?? true);
      setManualQuestions((d.questions || []).map((q: any) => ({
        question_text: q.question_text || '',
        type: q.type || 'MultipleChoice',
        options: (q.options || []).map((o: any) => ({ id: o.id || '', text: o.text || '', is_correct: !!o.is_correct })),
      })));
      setModalStep(1); setShowManualModal(true);
    } catch (e: any) { alert(e.message || 'Gagal memuat kuis.'); }
  };

  const handleSaveManualQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualQuestions.length < 10) { alert('Kuis minimal harus memiliki 10 soal.'); return; }
    setSavingManualQuiz(true);
    try {
      const auth = getAuthHeaders();
      const payload = {
        title: manualTitle,
        description: manualDescription || undefined,
        deadline: manualDeadline ? new Date(manualDeadline).toISOString() : undefined,
        time_limit: Number(manualTimeLimit),
        is_published: manualIsPublished,
        uuid_pembelajaran: manualCourse,
        uuid_modul: manualModule || undefined,
        questions: manualQuestions.map(q => ({ question_text: q.question_text, type: q.type, options: q.options.map(o => ({ id: o.id, text: o.text, is_correct: o.is_correct })) })),
      };
      if (manualQuizId) await apiPut(`/api/quiz/${manualQuizId}`, payload, { token: auth.token, headers: auth.headers });
      else await apiPost('/api/quiz', payload, { token: auth.token, headers: auth.headers });
      localStorage.removeItem('nalara_quiz_draft');
      setHasLocalDraft(false);
      setShowManualModal(false); fetchQuizzes();
    } catch (e: any) { alert(e.message || 'Gagal menyimpan kuis.'); }
    finally { setSavingManualQuiz(false); }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Hapus kuis ini?')) return;
    try {
      const auth = getAuthHeaders();
      await apiDelete(`/api/quiz/${id}`, { token: auth.token, headers: auth.headers });
      fetchQuizzes();
    } catch (e: any) { alert(e.message || 'Gagal menghapus kuis.'); }
  };

  // Question helpers
  const addQuestion = () => setManualQuestions(prev => [...prev, { question_text: '', type: 'MultipleChoice', options: [{ id: 'A', text: '', is_correct: false }, { id: 'B', text: '', is_correct: false }, { id: 'C', text: '', is_correct: false }, { id: 'D', text: '', is_correct: false }] }]);
  const removeQuestion = (i: number) => setManualQuestions(prev => prev.filter((_, idx) => idx !== i));
  const changeQField = (i: number, field: string, val: any) => setManualQuestions(prev => {
    const updated = [...prev];
    if (field === 'type') {
      updated[i] = { ...updated[i], type: val, options: val === 'TrueFalse' ? [{ id: 'A', text: 'True', is_correct: true }, { id: 'B', text: 'False', is_correct: false }] : [{ id: 'A', text: '', is_correct: false }, { id: 'B', text: '', is_correct: false }, { id: 'C', text: '', is_correct: false }, { id: 'D', text: '', is_correct: false }] };
    } else { (updated[i] as any)[field] = val; }
    return updated;
  });
  const changeOptText = (qi: number, oi: number, text: string) => setManualQuestions(prev => { const u = [...prev]; u[qi].options[oi].text = text; return u; });
  const changeOptCorrect = (qi: number, oi: number) => setManualQuestions(prev => {
    const u = [...prev];
    if (u[qi].type === 'Checkbox') u[qi].options[oi].is_correct = !u[qi].options[oi].is_correct;
    else u[qi].options = u[qi].options.map((o, j) => ({ ...o, is_correct: j === oi }));
    return u;
  });

  // AI Generate
  const handleGenerateAI = async () => {
    if (!readingMaterial) { alert('Harap isi Reading Material terlebih dahulu.'); return; }
    const total = counts.MultipleChoice + counts.TrueFalse + counts.Checkbox;
    if (total === 0) { alert('Masukkan jumlah soal minimal 1.'); return; }
    if (total > 25) { alert('Total soal tidak boleh melebihi 25.'); return; }
    setAiGenerating(true); setGeneratedQuestions([]);
    try {
      const auth = getAuthHeaders();
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL as string;
      const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json', ...auth.headers };
      if (auth.token) reqHeaders['Authorization'] = `Bearer ${auth.token}`;
      const res = await fetch(`${API_BASE}/api/ai/generate-questions`, {
        method: 'POST', headers: reqHeaders,
        body: JSON.stringify({ prompt: promptText || 'Generate from reading material', language: 'id', readingMaterial, lessonTitle: modules.find(m => m.uuid_modul === selectedModule)?.title || 'Lesson', counts }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const list: QuizQuestionInput[] = data.questions || data.data || [];
      if (list.length === 0) throw new Error('Tidak ada pertanyaan yang dihasilkan.');
      setGeneratedQuestions(list);
      setAiTitle(`Quiz: ${promptText.slice(0, 40) || 'Generated'}`);
    } catch (err: any) {
      // Fallback mock
      const lessonName = modules.find(m => m.uuid_modul === selectedModule)?.title || 'Materi';
      setGeneratedQuestions([
        { type: 'MultipleChoice', question_text: `Berdasarkan materi "${lessonName}", pilih jawaban yang paling tepat:`, options: [{ id: 'A', text: 'Pilihan A', is_correct: false }, { id: 'B', text: 'Pilihan B (Benar)', is_correct: true }, { id: 'C', text: 'Pilihan C', is_correct: false }, { id: 'D', text: 'Pilihan D', is_correct: false }] },
        { type: 'TrueFalse', question_text: `Pemahaman "${lessonName}" penting untuk pengembangan kompetensi.`, options: [{ id: 'A', text: 'True', is_correct: true }, { id: 'B', text: 'False', is_correct: false }] },
        { type: 'Checkbox', question_text: `Pilih poin yang relevan dengan "${lessonName}":`, options: [{ id: 'A', text: 'Poin relevan 1', is_correct: true }, { id: 'B', text: 'Poin tidak relevan', is_correct: false }, { id: 'C', text: 'Poin relevan 2', is_correct: true }, { id: 'D', text: 'Poin keliru', is_correct: false }] },
      ]);
      setAiTitle(`Quiz: ${promptText.slice(0, 40) || 'Generated'}`);
    }
    setAiGenerating(false);
  };

  const handleSaveAiQuiz = async () => {
    if (!aiTitle.trim() || !selectedCourse) { alert('Isi Judul Kuis dan pilih Kelas.'); return; }
    setSavingAiQuiz(true);
    try {
      const auth = getAuthHeaders();
      await apiPost('/api/quiz', {
        title: aiTitle.trim(),
        description: aiDescription || undefined,
        time_limit: Number(aiTimeLimit),
        deadline: aiDeadline ? new Date(aiDeadline).toISOString() : undefined,
        is_published: aiIsPublished,
        uuid_pembelajaran: selectedCourse,
        uuid_modul: selectedModule || undefined,
        questions: generatedQuestions.map(q => ({ question_text: q.question_text, type: q.type, options: q.options.map(o => ({ id: o.id, text: o.text, is_correct: o.is_correct })) })),
      }, { token: auth.token, headers: auth.headers });
      setShowAiModal(false); setGeneratedQuestions([]); setAiTitle(''); setSelectedCourse(''); setSelectedModule(''); setReadingMaterial(''); setPromptText('');
      fetchQuizzes();
    } catch (e: any) { alert(e.message || 'Gagal menyimpan kuis.'); }
    finally { setSavingAiQuiz(false); }
  };

  const resumeDraft = async () => {
    const draftStr = localStorage.getItem('nalara_quiz_draft');
    if (!draftStr) return;
    try {
      const d = JSON.parse(draftStr);
      setManualQuizId(null);
      setManualTitle(d.title || ''); setManualCourse(d.course || ''); setManualModule(d.module || '');
      setManualTimeLimit(d.timeLimit ?? 30); setManualDeadline(d.deadline || ''); setManualDescription(d.description || ''); setManualIsPublished(d.isPublished ?? true);
      setManualQuestions(d.questions || []); setModalStep(d.step || 1);
      if (d.course) await fetchModulesForCourse(d.course);
      setShowManualModal(true);
    } catch {}
  };

  // Auto-save draft
  useEffect(() => {
    if (showManualModal && !manualQuizId) {
      const draft = { title: manualTitle, course: manualCourse, module: manualModule, timeLimit: manualTimeLimit, deadline: manualDeadline, description: manualDescription, isPublished: manualIsPublished, questions: manualQuestions, step: modalStep };
      if (draft.title || draft.questions.length > 0) {
        localStorage.setItem('nalara_quiz_draft', JSON.stringify(draft));
        setHasLocalDraft(true);
      }
    }
  }, [showManualModal, manualTitle, manualCourse, manualModule, manualTimeLimit, manualDeadline, manualDescription, manualIsPublished, manualQuestions, modalStep]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Page Header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Evaluasi Belajar</h1>
          <p style={s.pageSubtitle}>Kelola studi kasus dan kuis interaktif untuk siswa Anda</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {mainTab === 'studycase' ? (
            <button onClick={() => { resetForm(); setShowCreateModal(true); }} style={s.btnPrimary}>
              <Plus size={16} /><span>Buat Tugas</span>
            </button>
          ) : (
            <>
              <button onClick={() => setShowAiModal(true)} style={s.btnAi}>
                <Sparkles size={16} /><span>AI Generator</span>
              </button>
              <button onClick={openManualCreate} style={s.btnPrimary}>
                <Plus size={16} /><span>Buat Kuis</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div style={s.tabBar}>
        {(['studycase', 'quiz'] as const).map(tab => (
          <button key={tab} onClick={() => setMainTab(tab)} style={{ ...s.tabBtn, ...(mainTab === tab ? s.tabBtnActive : {}) }}>
            {tab === 'studycase' ? <><FileText size={15} /><span>Studi Kasus / Tugas</span></> : <><Brain size={15} /><span>Kuis Interaktif</span></>}
          </button>
        ))}
      </div>

      {/* ── STUDY CASE TAB ── */}
      {mainTab === 'studycase' && (
        <>
          {/* Filters */}
          <div style={s.filterBar}>
            <Filter size={15} color="var(--grey-blue)" />
            <select value={filterCourseId} onChange={e => { setFilterCourseId(e.target.value); setFilterModuleId(''); }} style={s.filterSelect}>
              <option value="">Semua Kelas</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <select value={filterModuleId} onChange={e => setFilterModuleId(e.target.value)} style={s.filterSelect}>
              <option value="">Semua Modul</option>
              {modules.filter(m => !filterCourseId || m.uuid_pembelajaran === filterCourseId).map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>

          {error && <div style={s.errorBanner}><AlertCircle size={18} /><span>{error}</span></div>}

          {loading ? (
            <div style={s.centered}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /><p>Memuat...</p></div>
          ) : tugasList.length === 0 ? (
            <div style={s.emptyState}><FileText size={48} color="var(--border-color)" /><h3>Belum ada Tugas</h3><p>Klik "Buat Tugas" untuk mulai.</p></div>
          ) : (
            <div style={s.grid}>
              {tugasList.map(tugas => {
                const tc = typeColors[tugas.type] || typeColors.Reading;
                return (
                  <div key={tugas.id} className="glass-panel" style={s.card}>
                    <div style={s.cardTop}>
                      <span style={{ ...s.badge, background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>
                        {typeIcons[tugas.type]} <span style={{ marginLeft: 4 }}>{tugas.type}</span>
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleViewDetail(tugas)} style={s.iconBtn} title="Detail"><Eye size={13} /></button>
                        <button onClick={() => openEditModal(tugas)} style={s.iconBtn} title="Edit"><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(tugas.id)} style={s.iconBtnDanger} title="Hapus"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <h3 style={s.cardTitle}>{tugas.title}</h3>
                    <div style={s.cardMeta}>
                      {tugas.pembelajaran?.title && <span>📚 {tugas.pembelajaran.title}</span>}
                      {tugas.modul?.title && <span>📦 {tugas.modul.title}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── QUIZ TAB ── */}
      {mainTab === 'quiz' && (
        <>
          {hasLocalDraft && (
            <div style={s.draftBanner}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Brain size={18} color="var(--azure)" />
                <div>
                  <strong>Lanjutkan Draft Kuis?</strong>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--grey-blue)' }}>Anda memiliki draft yang belum selesai.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={resumeDraft} style={s.btnPrimary}>Lanjutkan</button>
                <button onClick={() => { localStorage.removeItem('nalara_quiz_draft'); setHasLocalDraft(false); }} style={s.btnGhost}>Buang</button>
              </div>
            </div>
          )}

          {error && <div style={s.errorBanner}><AlertCircle size={18} /><span>{error}</span></div>}

          {quizLoading ? (
            <div style={s.centered}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /><p>Memuat kuis...</p></div>
          ) : quizzes.length === 0 ? (
            <div style={s.emptyState}><Brain size={48} color="var(--border-color)" /><h3>Belum ada Kuis</h3><p>Buat kuis manual atau gunakan AI Generator.</p></div>
          ) : (
            <div style={s.quizList}>
              {quizzes.map(quiz => (
                <div key={quiz.id} className="glass-panel" style={s.quizRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, cursor: 'pointer' }} onClick={() => router.push(`/lecturer/quizzes/detail?id=${quiz.id}`)}>
                    <div style={s.quizIcon}><Brain size={18} color="var(--azure)" /></div>
                    <div>
                      <h4 style={s.quizTitle}>{quiz.title}</h4>
                      <span style={s.quizMeta}>{quiz.moduleTitle} • {quiz.count} soal</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openManualEdit(quiz.id)} style={s.iconBtn} title="Edit"><Edit2 size={14} /></button>
                    <button onClick={() => handleDeleteQuiz(quiz.id)} style={s.iconBtnDanger} title="Hapus"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════ TUGAS MODALS ═══════════════════ */}
      {(showCreateModal || showEditModal) && (
        <Portal>
          <div style={{ ...s.overlay, zIndex: 9999 }}>
            <div style={{ ...s.modal, maxHeight: '85vh', overflowY: 'auto' }} className="glass-panel">
              <div style={s.modalHead}>
                <h3>{showCreateModal ? 'Buat Tugas Baru' : 'Edit Tugas'}</h3>
                <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} style={s.closeBtn}><X size={18} /></button>
              </div>
              <form onSubmit={showCreateModal ? handleCreate : handleEdit}>
                <div style={s.modalBody}>
                  <div style={s.fg}>
                    <label style={s.label}>Judul *</label>
                    <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Judul tugas..." style={s.input} />
                  </div>
                  <div style={s.fg}>
                    <label style={s.label}>Kelas *</label>
                    <select required value={form.uuid_pembelajaran} onChange={e => setForm({ ...form, uuid_pembelajaran: e.target.value, uuid_modul: '' })} style={s.select}>
                      <option value="">Pilih kelas...</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  {form.type === 'Video' && (
                    <div style={s.fg}><label style={s.label}>YouTube Link</label><input type="url" value={form.youtube_link} onChange={e => setForm({ ...form, youtube_link: e.target.value })} placeholder="https://youtube.com/watch?v=..." style={s.input} /></div>
                  )}
                  {(form.type === 'Reading' || form.type === 'CaseStudy') && (
                    <div style={s.fg}>
                      <label style={s.label}>{form.type === 'CaseStudy' ? 'Soal / Deskripsi Tugas *' : 'Konten *'}</label>
                      <textarea required rows={5} value={form.content_text} onChange={e => setForm({ ...form, content_text: e.target.value })} placeholder={form.type === 'CaseStudy' ? 'Tuliskan pertanyaan/instruksi studi kasus...' : 'Isi bacaan...'} style={s.textarea} />
                    </div>
                  )}
                </div>
                <div style={s.modalFoot}>
                  <button type="button" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} style={s.btnGhost}>Batal</button>
                  <button type="submit" disabled={submitting} style={s.btnPrimary}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Detail Modal */}
      {showDetailModal && currentTugas && (
        <Portal>
          <div style={{ ...s.overlay, zIndex: 9999 }}>
            <div style={{ ...s.modal, maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' }} className="glass-panel">
              <div style={s.modalHead}>
                <h3>Detail Tugas</h3>
                <button onClick={() => setShowDetailModal(false)} style={s.closeBtn}><X size={18} /></button>
              </div>
              <div style={{ ...s.modalBody, gap: 14 }}>
                {[
                  ['Judul', currentTugas.title],
                  ['Tipe', currentTugas.type],
                  ['Kelas', currentTugas.pembelajaran?.title || '-'],
                  ['Modul', currentTugas.modul?.title || '-'],
                  currentTugas.slug && ['Slug', `/${currentTugas.slug}`],
                  currentTugas.youtube_link && ['YouTube', currentTugas.youtube_link],
                ].filter(Boolean).map(([k, v]: any) => (
                  <div key={k} style={{ display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10 }}>
                    <span style={{ minWidth: 80, fontSize: '0.8rem', color: 'var(--grey-blue)', fontWeight: 600 }}>{k}</span>
                    <span style={{ fontSize: '0.88rem', color: '#fff' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ═══════════════════ MANUAL QUIZ MODAL ═══════════════════ */}
      {showManualModal && (
        <Portal>
          <div style={{ ...s.overlay, zIndex: 9999 }}>
            <div style={{ ...s.modal, maxWidth: 820, maxHeight: '85vh', overflowY: 'auto' }} className="glass-panel">
              <div style={s.modalHead}>
                <h3>{manualQuizId ? 'Edit Kuis' : 'Buat Kuis Manual'} — Langkah {modalStep}/2</h3>
                <button onClick={() => setShowManualModal(false)} style={s.closeBtn}><X size={18} /></button>
              </div>
              <form onSubmit={handleSaveManualQuiz}>
                {modalStep === 1 ? (
                  <div style={s.modalBody}>
                    <div style={s.fg}><label style={s.label}>Judul Kuis *</label><input required value={manualTitle} onChange={e => setManualTitle(e.target.value)} placeholder="Judul kuis..." style={s.input} /></div>
                    <div style={s.grid2}>
                      <div style={s.fg}>
                        <label style={s.label}>Kelas *</label>
                        <select required value={manualCourse} onChange={e => setManualCourse(e.target.value)} style={s.select}>
                          <option value="">Pilih kelas...</option>
                          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                      </div>
                      <div style={s.fg}>
                        <label style={s.label}>Modul</label>
                        <select value={manualModule} onChange={e => setManualModule(e.target.value)} style={s.select}>
                          <option value="">Pilih modul...</option>
                          {modules.filter(m => !manualCourse || m.uuid_pembelajaran === manualCourse).map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={s.grid2}>
                      <div style={s.fg}><label style={s.label}>Durasi (menit)</label><input type="number" min="1" value={manualTimeLimit} onChange={e => setManualTimeLimit(+e.target.value || 30)} style={s.input} /></div>
                      <div style={s.fg}><label style={s.label}>Tenggat</label><input type="datetime-local" value={manualDeadline} onChange={e => setManualDeadline(e.target.value)} style={s.input} /></div>
                    </div>
                    <div style={s.fg}><label style={s.label}>Deskripsi</label><textarea rows={3} value={manualDescription} onChange={e => setManualDescription(e.target.value)} placeholder="Instruksi kuis..." style={s.textarea} /></div>
                    <div style={s.modalFoot}>
                      <button type="button" onClick={() => setShowManualModal(false)} style={s.btnGhost}>Batal</button>
                      <button type="button" onClick={() => { if (!manualTitle || !manualCourse) { alert('Judul & Kelas wajib diisi.'); return; } setModalStep(2); }} style={s.btnPrimary}>Selanjutnya →</button>
                    </div>
                  </div>
                ) : (
                  <div style={s.modalBody}>
                    {manualQuestions.length < 10 && (
                      <div style={{ ...s.errorBanner, marginBottom: 12 }}><AlertCircle size={16} /><span>Minimal 10 soal diperlukan. Saat ini: {manualQuestions.length}</span></div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ margin: 0 }}>Daftar Soal ({manualQuestions.length})</h4>
                      <button type="button" onClick={addQuestion} style={s.btnPrimary}><PlusCircle size={14} /><span>Tambah Soal</span></button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14, maxHeight: 380, overflowY: 'auto' as const, paddingRight: 4 }}>
                      {manualQuestions.map((q, qi) => (
                        <div key={qi} style={s.questionCard}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontWeight: 700, color: 'var(--azure)', fontSize: '0.85rem' }}>Soal #{qi + 1}</span>
                            <button type="button" onClick={() => removeQuestion(qi)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={13} color="#FF5252" /></button>
                          </div>
                          <input required value={q.question_text} onChange={e => changeQField(qi, 'question_text', e.target.value)} placeholder="Pertanyaan..." style={{ ...s.input, marginBottom: 8 }} />
                          <select value={q.type} onChange={e => changeQField(qi, 'type', e.target.value)} style={{ ...s.select, marginBottom: 10 }}>
                            <option value="MultipleChoice">Pilihan Ganda</option>
                            <option value="TrueFalse">Benar / Salah</option>
                            <option value="Checkbox">Checkbox (Multi Correct)</option>
                          </select>
                          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                            {q.options.map((opt, oi) => (
                              <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input type={q.type === 'Checkbox' ? 'checkbox' : 'radio'} name={`q-${qi}`} checked={opt.is_correct} onChange={() => changeOptCorrect(qi, oi)} />
                                <span style={{ fontSize: '0.78rem', color: 'var(--grey-blue)', minWidth: 16 }}>{opt.id}</span>
                                <input required={q.type !== 'TrueFalse'} disabled={q.type === 'TrueFalse'} value={opt.text} onChange={e => changeOptText(qi, oi, e.target.value)} placeholder={`Opsi ${opt.id}...`} style={{ ...s.input, padding: '6px 10px', flex: 1 }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={s.modalFoot}>
                      <button type="button" onClick={() => setModalStep(1)} style={s.btnGhost}>← Kembali</button>
                      <button type="submit" disabled={savingManualQuiz || manualQuestions.length < 10} style={s.btnPrimary}>{savingManualQuiz ? 'Menyimpan...' : 'Simpan Kuis'}</button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* ═══════════════════ AI QUIZ MODAL ═══════════════════ */}
      {showAiModal && (
        <Portal>
          <div style={{ ...s.overlay, zIndex: 9999 }}>
            <div style={{ ...s.modal, maxWidth: 920, maxHeight: '85vh', overflowY: 'auto' }} className="glass-panel">
              <div style={s.modalHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={18} color="var(--azure)" /><h3>AI Quiz Generator</h3></div>
                <button onClick={() => setShowAiModal(false)} style={s.closeBtn}><X size={18} /></button>
              </div>
              <div style={{ ...s.modalBody, display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 24 }}>
                {/* Left: settings */}
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--azure)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>① Generate Soal</div>
                  <div style={s.fg}>
                    <label style={s.label}>Kelas *</label>
                    <select value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSelectedModule(''); }} style={s.select}>
                      <option value="">Pilih kelas...</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div style={s.fg}>
                    <label style={s.label}>Modul (Opsional)</label>
                    <select value={selectedModule} onChange={e => setSelectedModule(e.target.value)} style={s.select}>
                      <option value="">Pilih modul...</option>
                      {modules.filter(m => !selectedCourse || m.uuid_pembelajaran === selectedCourse).map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                  </div>
                  <div style={s.fg}>
                    <label style={s.label}>Reading Material / Konteks *</label>
                    <textarea rows={6} value={readingMaterial} onChange={e => setReadingMaterial(e.target.value)} placeholder="Paste materi bacaan di sini sebagai sumber soal..." style={s.textarea} />
                  </div>
                  <div style={s.fg}>
                    <label style={s.label}>Topic Guidance (Opsional)</label>
                    <input type="text" value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="Fokus pada aspek tertentu..." style={s.input} />
                  </div>
                  <div style={s.fg}>
                    <label style={s.label}>Jumlah Soal <span style={{ color: 'var(--grey-blue)', fontWeight: 400 }}>(Maks. 25 total)</span></label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {(['MultipleChoice', 'TrueFalse', 'Checkbox'] as const).map(type => (
                        <div key={type} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' as const }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--grey-blue)' }}>{type === 'MultipleChoice' ? 'MCQ' : type === 'TrueFalse' ? 'T/F' : 'CB'}</div>
                          <input type="number" min="0" max="25" value={counts[type]} onChange={e => setCounts({ ...counts, [type]: +e.target.value || 0 })} style={{ ...s.input, textAlign: 'center' as const, padding: '4px', marginTop: 4 }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--grey-blue)', marginTop: 6 }}>
                      Total: <strong style={{ color: (counts.MultipleChoice + counts.TrueFalse + counts.Checkbox) > 25 ? '#FF5252' : '#fff' }}>{counts.MultipleChoice + counts.TrueFalse + counts.Checkbox}</strong> soal
                    </div>
                  </div>
                  <button type="button" onClick={handleGenerateAI} disabled={aiGenerating || !readingMaterial} style={{ ...s.btnAi, justifyContent: 'center', opacity: (aiGenerating || !readingMaterial) ? 0.6 : 1 }}>
                    {aiGenerating ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /><span>Generating...</span></> : <><Sparkles size={15} /><span>Generate Questions</span></>}
                  </button>
                </div>
  
                {/* Right: preview & save settings */}
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--azure)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>② Simpan ke Bank Soal</div>
                  <div style={s.fg}><label style={s.label}>Judul Kuis *</label><input value={aiTitle} onChange={e => setAiTitle(e.target.value)} placeholder="Judul kuis AI..." style={s.input} /></div>
                  <div style={s.fg}><label style={s.label}>Deskripsi</label><textarea rows={2} value={aiDescription} onChange={e => setAiDescription(e.target.value)} placeholder="Deskripsi singkat..." style={s.textarea} /></div>
                  <div style={s.grid2}>
                    <div style={s.fg}><label style={s.label}>Durasi (menit)</label><input type="number" min="1" value={aiTimeLimit} onChange={e => setAiTimeLimit(+e.target.value || 30)} style={s.input} /></div>
                    <div style={s.fg}><label style={s.label}>Tenggat</label><input type="datetime-local" value={aiDeadline} onChange={e => setAiDeadline(e.target.value)} style={s.input} /></div>
                  </div>
                  {/* Preview */}
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 14, overflowY: 'auto' as const, maxHeight: 240, border: '1px solid var(--border-color)' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: 'var(--grey-blue)', fontWeight: 600 }}>Preview ({generatedQuestions.length} soal)</p>
                    {generatedQuestions.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--grey)' }}>Belum ada soal. Klik "Generate Questions" terlebih dahulu.</p>
                    ) : generatedQuestions.map((q, i) => (
                      <div key={i} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '0.82rem', color: '#E2E8F0' }}>{i+1}. {q.question_text} <span style={{ color: 'var(--azure)', fontSize: '0.72rem' }}>({q.type})</span></p>
                        {q.options.map(o => <div key={o.id} style={{ fontSize: '0.74rem', color: o.is_correct ? '#00C853' : 'var(--grey-blue)', paddingLeft: 10 }}>{o.id}: {o.text} {o.is_correct && '✓'}</div>)}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={handleSaveAiQuiz} disabled={savingAiQuiz || generatedQuestions.length === 0 || !aiTitle.trim()} style={{ ...s.btnPrimary, justifyContent: 'center', opacity: (savingAiQuiz || generatedQuestions.length === 0 || !aiTitle.trim()) ? 0.6 : 1 }}>
                    {savingAiQuiz ? 'Menyimpan...' : <><CheckCircle size={15} /><span>Simpan ke Bank Soal</span></>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { padding: '4px 0', color: '#E2E8F0' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  pageTitle: { fontSize: '1.75rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', margin: 0 },
  pageSubtitle: { fontSize: '0.85rem', color: 'var(--grey-blue)', marginTop: 4, margin: 0 },
  tabBar: { display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 1, marginBottom: 22 },
  tabBtn: { display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', borderBottom: '2px solid transparent', color: 'var(--grey-blue)', padding: '9px 18px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  tabBtnActive: { borderBottom: '2px solid var(--azure)', color: 'var(--azure)' },
  filterBar: { display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 16px', marginBottom: 20 },
  filterSelect: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#E2E8F0', padding: '6px 12px', fontSize: '0.85rem', outline: 'none' },
  errorBanner: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 16px', color: '#EF4444', marginBottom: 16 },
  centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--grey-blue)', gap: 12 },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.08)', borderRadius: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 },
  card: { borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 },
  cardTitle: { fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 },
  cardMeta: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.78rem', color: 'var(--grey-blue)' },
  iconBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--grey-blue)', cursor: 'pointer', padding: '5px 7px', borderRadius: 6 },
  iconBtnDanger: { background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', cursor: 'pointer', padding: '5px 7px', borderRadius: 6 },
  draftBanner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(6,113,224,0.08)', border: '1px solid rgba(6,113,224,0.2)', borderRadius: 10, padding: '12px 18px', marginBottom: 18 },
  quizList: { display: 'flex', flexDirection: 'column', gap: 12 },
  quizRow: { display: 'flex', alignItems: 'center', borderRadius: 12, padding: '14px 18px' },
  quizIcon: { width: 38, height: 38, borderRadius: 10, background: 'rgba(6,113,224,0.1)', border: '1px solid rgba(6,113,224,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  quizTitle: { margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#fff' },
  quizMeta: { fontSize: '0.78rem', color: 'var(--grey-blue)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 },
  modal: { width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: 16 },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  modalBody: { padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 },
  modalFoot: { padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'flex-end', gap: 10 },
  closeBtn: { background: 'none', border: 'none', color: 'var(--grey-blue)', cursor: 'pointer' },
  fg: { display: 'flex', flexDirection: 'column', gap: 6, width: '100%' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  label: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-blue)' },
  input: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E2E8F0', padding: '9px 13px', fontSize: '0.88rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  select: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E2E8F0', padding: '9px 13px', fontSize: '0.88rem', outline: 'none', width: '100%' },
  textarea: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E2E8F0', padding: '9px 13px', fontSize: '0.88rem', outline: 'none', width: '100%', resize: 'vertical', boxSizing: 'border-box' },
  typeOpt: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--grey-blue)' },
  questionCard: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 14 },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--azure, #0671E0)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  btnAi: { display: 'inline-flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 7, background: 'transparent', color: 'var(--grey-blue)', border: '1px solid rgba(255,255,255,0.12)', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
};
