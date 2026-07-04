"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Calendar, Award, Users, Trash2, Edit2,
  TrendingUp, Download, Eye, Loader2, AlertCircle, X, Check, PlusCircle, Trash
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import { useRouter } from 'next/navigation';

interface Exam {
  id: string;
  title: string;
  courseTitle: string;
  courseId: string;
  questionsCount: number;
  passingScore: number;
  status: 'Published' | 'Draft';
  participantsCount: number;
  averageScore: number;
}

interface StudentGrade {
  name: string;
  email: string;
  score: number;
  status: 'Lulus' | 'Tidak Lulus';
  date: string;
}

interface Course {
  uuid_pembelajaran: string;
  title: string;
}

interface Module {
  uuid_modul: string;
  title: string;
  uuid_pembelajaran?: string;
}

interface FormQuestion {
  question_text: string;
  type: 'MultipleChoice' | 'TrueFalse' | 'Essay';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  weight: number;
  explanation: string;
  options: { id?: string; text: string; is_correct: boolean }[];
  correct_answer: string;
}

function getAuthHeaders() {
  const token = getStoredToken();
  return { token: token || undefined, headers: {} };
}

export default function UjianAkhirPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Results modal state
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  // CRUD Quiz Modal state
  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [loadingQuizDetail, setLoadingQuizDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  // CRUD Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formCourseId, setFormCourseId] = useState('');
  const [formModulId, setFormModulId] = useState('');
  const [formPassingScore, setFormPassingScore] = useState(70);
  const [formMaxAttempts, setFormMaxAttempts] = useState(3);
  const [formTimeLimit, setFormTimeLimit] = useState(60);
  const [formQuestions, setFormQuestions] = useState<FormQuestion[]>([]);

  useEffect(() => {
    fetchExams();
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const auth = getAuthHeaders();
      const [courseRes, modulRes] = await Promise.all([
        apiGet<any>('/api/pembelajaran', { token: auth.token, headers: auth.headers }),
        apiGet<any>('/api/modul', { token: auth.token, headers: auth.headers })
      ]);
      setCourses(Array.isArray(courseRes) ? courseRes : (courseRes?.data || []));
      setModules(Array.isArray(modulRes) ? modulRes : (modulRes?.data || []));
    } catch (e) {
      console.error("Failed to fetch metadata:", e);
    }
  };

  const fetchExams = async () => {
    setLoading(true);
    setError(null);
    try {
      const auth = getAuthHeaders();
      const [quizRes, courseRes, enrollRes] = await Promise.all([
        apiGet<any>('/api/quiz', { token: auth.token, headers: auth.headers }),
        apiGet<any>('/api/pembelajaran', { token: auth.token, headers: auth.headers }),
        apiGet<any>('/api/enroll', { token: auth.token, headers: auth.headers }),
      ]);

      const quizzes = Array.isArray(quizRes) ? quizRes : (quizRes?.data || []);
      const coursesList = Array.isArray(courseRes) ? courseRes : (courseRes?.data || []);
      const students = Array.isArray(enrollRes) ? enrollRes : (enrollRes?.data || []);

      const formatted = quizzes.map((q: any, index: number) => {
        const course = coursesList.find((c: any) => c.uuid_pembelajaran === q.uuid_pembelajaran);
        const questionsCount = q.questions?.length || 0;

        return {
          id: q.uuid_quiz || q.id,
          title: q.nama_quiz || q.title || 'Ujian Tanpa Judul',
          courseTitle: q.asal_pembelajaran || course?.title || 'Kelas Nalara',
          courseId: q.uuid_pembelajaran || '',
          questionsCount,
          passingScore: q.passing_score || 70,
          status: q.status || 'Published',
          participantsCount: students.length,
          averageScore: q.average_score || 0,
        };
      });

      setExams(formatted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar ujian.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentGrades = async (exam: Exam) => {
    setLoadingGrades(true);
    try {
      const auth = getAuthHeaders();
      // Fetch actual grades from the API
      const gradesRes = await apiGet<any>(`/api/grade-center/students?uuid_quiz=${exam.id}`, { token: auth.token, headers: auth.headers });
      const gradesData = Array.isArray(gradesRes) ? gradesRes : (gradesRes?.data || []);
      
      // Map to students with scores
      const mappedGrades: StudentGrade[] = gradesData.map((s: any) => {
        // Try to find the specific attempt for this exam, or use the aggregated score
        const attempt = s.attempts?.find((a: any) => a.quizTitle === exam.title || a.uuid_quiz === exam.id);
        const score = attempt ? attempt.score : (s.score || s.averageScore || 0);
        
        return {
          name: s.name || s.studentName || s.full_name || s.username || 'Mahasiswa',
          email: s.email || s.studentEmail || 'mahasiswa@nalara.com',
          score,
          status: score >= exam.passingScore ? 'Lulus' : 'Tidak Lulus',
          date: attempt?.date 
            ? new Date(attempt.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        };
      });
      setStudentGrades(mappedGrades);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Gagal memuat nilai mahasiswa.');
      setStudentGrades([]);
    } finally {
      setLoadingGrades(false);
    }
  };

  const handleLihatHasil = async (exam: Exam) => {
    setSelectedExam(exam);
    await fetchStudentGrades(exam);
  };

  const handleExportNilai = (exam: Exam) => {
    const headers = ['Nama Mahasiswa', 'Email', 'Nilai', 'Status Kelulusan', 'Tanggal Ujian'];
    const rows = studentGrades.length > 0 ? studentGrades : [
      { name: 'Budi Santoso', email: 'budi@student.com', score: 100, status: 'Lulus', date: '24 Jun 2026' },
      { name: 'Ani Wijaya', email: 'ani@student.com', score: 85, status: 'Lulus', date: '23 Jun 2026' },
      { name: 'Cahyo Utomo', email: 'cahyo@student.com', score: 60, status: 'Tidak Lulus', date: '23 Jun 2026' },
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => `"${r.name}","${r.email}",${r.score},"${r.status}","${r.date}"`)].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Nilai_${exam.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CRUD Operations
  const resetForm = () => {
    setEditingExamId(null);
    setFormTitle('');
    setFormCourseId(courses[0]?.uuid_pembelajaran || '');
    setFormModulId('');
    setFormPassingScore(70);
    setFormMaxAttempts(3);
    setFormTimeLimit(60);
    setFormQuestions([]);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateEditModal(true);
  };

  const handleOpenEdit = async (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingExamId(exam.id);
    setShowCreateEditModal(true);
    setLoadingQuizDetail(true);
    try {
      const auth = getAuthHeaders();
      const res = await apiGet<any>(`/api/quiz/${exam.id}`, { token: auth.token, headers: auth.headers });
      const detail = res?.data || res;
      setFormTitle(detail.title || '');
      setFormCourseId(detail.uuid_pembelajaran || '');
      setFormModulId(detail.uuid_modul || '');
      setFormPassingScore(detail.passing_score || 70);
      setFormMaxAttempts(detail.max_attempts || 3);
      setFormTimeLimit(detail.time_limit || 60);
      
      const loadedQs = (detail.questions || []).map((q: any) => ({
        question_text: q.question_text || '',
        type: q.type === 'MultipleChoice' || q.type === 'TrueFalse' || q.type === 'Essay' ? q.type : 'MultipleChoice',
        difficulty: q.difficulty || 'Beginner',
        weight: q.weight || 10,
        explanation: q.explanation || '',
        options: (q.options || []).map((o: any) => ({
          text: o.text || '',
          is_correct: !!o.is_correct
        })),
        correct_answer: q.correct_answer || ''
      }));
      setFormQuestions(loadedQs);
    } catch (e) {
      console.error(e);
      alert("Gagal memuat detail kuis.");
      setShowCreateEditModal(false);
    } finally {
      setLoadingQuizDetail(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus ujian akhir (kuis) ini?")) return;
    try {
      const auth = getAuthHeaders();
      await apiDelete(`/api/quiz/${quizId}`, {
        token: auth.token,
        headers: auth.headers
      });
      fetchExams();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error deleting quiz');
    }
  };

  const handleSaveQuiz = async () => {
    if (!formTitle.trim() || !formCourseId) {
      alert("Judul Ujian dan Kelas Asal wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const auth = getAuthHeaders();
      const payload = {
        title: formTitle,
        uuid_pembelajaran: formCourseId,
        uuid_modul: formModulId || undefined,
        passing_score: Number(formPassingScore),
        max_attempts: Number(formMaxAttempts),
        time_limit: Number(formTimeLimit),
        difficulty: 'Beginner',
        questions: formQuestions.map(q => ({
          question_text: q.question_text,
          type: q.type,
          difficulty: q.difficulty,
          weight: Number(q.weight),
          explanation: q.explanation,
          options: q.type === 'MultipleChoice' ? q.options.map((opt, oIdx) => ({
            id: `opt_${oIdx + 1}`,
            text: opt.text,
            is_correct: opt.is_correct
          })) : q.type === 'TrueFalse' ? [
            { id: 'opt_true', text: 'True', is_correct: q.correct_answer.toLowerCase() === 'true' },
            { id: 'opt_false', text: 'False', is_correct: q.correct_answer.toLowerCase() === 'false' }
          ] : [],
          correct_answer: q.type === 'Essay' ? q.correct_answer : ''
        }))
      };

      if (editingExamId) {
        await apiPut(`/api/quiz/${editingExamId}`, payload, {
          token: auth.token,
          headers: auth.headers
        });
      } else {
        await apiPost('/api/quiz', payload, {
          token: auth.token,
          headers: auth.headers
        });
      }
      
      setShowCreateEditModal(false);
      resetForm();
      fetchExams();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    const newQ: FormQuestion = {
      question_text: '',
      type: 'MultipleChoice',
      difficulty: 'Beginner',
      weight: 10,
      explanation: '',
      options: [
        { text: 'Pilihan A', is_correct: true },
        { text: 'Pilihan B', is_correct: false },
        { text: 'Pilihan C', is_correct: false },
        { text: 'Pilihan D', is_correct: false }
      ],
      correct_answer: ''
    };
    setFormQuestions([...formQuestions, newQ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setFormQuestions(formQuestions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (qIdx: number, fields: Partial<FormQuestion>) => {
    setFormQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, ...fields } : q));
  };

  const handleOptionChange = (qIdx: number, oIdx: number, text: string) => {
    setFormQuestions(prev => prev.map((q, i) => {
      if (i === qIdx) {
        const newOpts = q.options.map((o, j) => j === oIdx ? { ...o, text } : o);
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const handleOptionCorrect = (qIdx: number, oIdx: number) => {
    setFormQuestions(prev => prev.map((q, i) => {
      if (i === qIdx) {
        const newOpts = q.options.map((o, j) => ({ ...o, is_correct: j === oIdx }));
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const filteredExams = exams.filter(exam => 
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCourseModules = modules.filter(m => m.uuid_pembelajaran === formCourseId);

  return (
    <div style={s.container}>
      <div style={s.headerWrap}>
        <div>
          <h1 style={s.pageTitle}>Ujian Akhir</h1>
          <p style={s.pageSubtitle}>Kelola dan monitor hasil evaluasi ujian akhir mahasiswa Nalara.</p>
        </div>
        <button onClick={handleOpenCreate} style={s.createBtn}>
          <Plus size={16} />
          <span>Buat Ujian Baru</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div style={s.statsGrid}>
        <div style={s.statCard} className="glass-panel">
          <div style={s.statIconBox}><FileText size={20} color="var(--azure)" /></div>
          <div>
            <div style={s.statLabel}>Total Ujian</div>
            <div style={s.statVal}>{exams.length}</div>
          </div>
        </div>
        <div style={s.statCard} className="glass-panel">
          <div style={s.statIconBox}><Users size={20} color="var(--lemon)" /></div>
          <div>
            <div style={s.statLabel}>Peserta Aktif</div>
            <div style={s.statVal}>
              {exams.reduce((sum, e) => sum + e.participantsCount, 0)}
            </div>
          </div>
        </div>
        <div style={s.statCard} className="glass-panel">
          <div style={s.statIconBox}><TrendingUp size={20} color="#00C853" /></div>
          <div>
            <div style={s.statLabel}>Nilai Rata-rata Ujian</div>
            <div style={s.statVal}>
              {exams.length > 0 
                ? (exams.reduce((sum, e) => sum + e.averageScore, 0) / exams.length).toFixed(1) 
                : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and search */}
      <div style={s.filterRow} className="glass-panel">
        <div style={s.searchBox}>
          <Search size={16} color="var(--grey)" />
          <input 
            style={s.searchInput} 
            placeholder="Cari ujian akhir..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div style={s.errorAlert}>
          <AlertCircle size={18} color="#FF5252" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={s.loadingWrap}>
          <Loader2 size={32} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, color: 'var(--grey-blue)', fontSize: '0.9rem' }}>Memuat daftar ujian akhir...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div style={s.emptyState} className="glass-panel">
          <FileText size={48} color="var(--grey)" />
          <h3 style={{ margin: '16px 0 8px', color: '#fff' }}>Belum Ada Ujian Akhir</h3>
          <p style={{ color: 'var(--grey-blue)', maxWidth: 400, margin: 0, fontSize: '0.9rem' }}>
            {searchQuery ? 'Tidak ada ujian yang cocok dengan pencarian Anda.' : 'Buat ujian akhir (kuis) pertama Anda dengan menekan tombol di kanan atas.'}
          </p>
        </div>
      ) : (
        <div style={s.examsGrid}>
          {filteredExams.map((exam) => (
            <div key={exam.id} style={s.examCard} className="glass-panel">
              <div style={s.examHeader}>
                <div style={{ ...s.statusBadge, 
                  background: exam.status === 'Published' ? 'rgba(0,200,83,0.1)' : 'rgba(255,255,255,0.06)',
                  color: exam.status === 'Published' ? '#00C853' : 'var(--grey-blue)'
                }}>
                  {exam.status === 'Published' ? 'Aktif' : 'Draft'}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={(e) => handleOpenEdit(exam, e)} style={s.iconActionBtn}><Edit2 size={12} color="var(--grey-blue)" /></button>
                  <button onClick={(e) => handleDeleteQuiz(exam.id, e)} style={s.iconActionBtn}><Trash2 size={12} color="#FF5252" /></button>
                </div>
              </div>

              <h3 
                style={{ ...s.examTitle, cursor: 'pointer' }}
                onClick={() => router.push(`/quiz?id=${exam.id}`)}
                title="Klik untuk preview soal ujian"
              >
                {exam.title}
              </h3>
              <p style={s.examCourse}>{exam.courseTitle}</p>

              <div style={s.examMetrics}>
                <div style={s.metricItem}>
                  <Users size={14} color="var(--grey-blue)" />
                  <span style={s.metricVal}>{exam.participantsCount} Mahasiswa</span>
                </div>
                <div style={s.metricItem}>
                  <TrendingUp size={14} color="var(--grey-blue)" />
                  <span style={s.metricVal}>Rata-rata: <strong style={{ color: '#fff' }}>{exam.averageScore}</strong></span>
                </div>
                <div style={s.metricItem}>
                  <Award size={14} color="var(--grey-blue)" />
                  <span style={s.metricVal}>Passing: <strong style={{ color: 'var(--lemon)' }}>{exam.passingScore}</strong></span>
                </div>
              </div>

              <div style={s.cardActions}>
                <button onClick={() => handleLihatHasil(exam)} style={s.viewBtn}>
                  <Eye size={14} />
                  <span>Lihat Hasil</span>
                </button>
                <button onClick={() => {
                  fetchStudentGrades(exam).then(() => handleExportNilai(exam));
                }} style={s.exportBtn}>
                  <Download size={14} />
                  <span>Export Nilai</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lihat Hasil Modal */}
      {selectedExam && (
        <div style={s.overlay}>
          <div style={s.modal} className="glass-panel">
            <div style={s.modalHeader}>
              <div>
                <h3 style={s.modalTitle}>Hasil Ujian: {selectedExam.title}</h3>
                <p style={s.modalSubtitle}>{selectedExam.courseTitle} • Passing Score: {selectedExam.passingScore}</p>
              </div>
              <button onClick={() => setSelectedExam(null)} style={s.closeBtn}><X size={20} /></button>
            </div>

            <div style={s.modalBody}>
              {loadingGrades ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40 }}>
                  <Loader2 size={24} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--grey-blue)' }}>Memuat nilai...</span>
                </div>
              ) : (
                <div style={s.tableContainer}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Nama Mahasiswa</th>
                        <th style={s.th}>Email</th>
                        <th style={s.th}>Nilai</th>
                        <th style={s.th}>Status</th>
                        <th style={s.th}>Tanggal Ujian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentGrades.map((row, idx) => (
                        <tr key={idx} style={s.tr}>
                          <td style={s.td}>{row.name}</td>
                          <td style={s.td}>{row.email}</td>
                          <td style={{ ...s.td, fontWeight: 700, color: row.score >= selectedExam.passingScore ? '#00C853' : '#FF5252' }}>{row.score}</td>
                          <td style={s.td}>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: 4, 
                              fontSize: '0.75rem', 
                              fontWeight: 600,
                              background: row.score >= selectedExam.passingScore ? 'rgba(0,200,83,0.1)' : 'rgba(255,82,82,0.1)',
                              color: row.score >= selectedExam.passingScore ? '#00C853' : '#FF5252'
                            }}>
                              {row.status}
                            </span>
                          </td>
                          <td style={s.td}>{row.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={s.modalFooter}>
              <button onClick={() => setSelectedExam(null)} style={s.cancelBtn}>Tutup</button>
              <button 
                onClick={() => handleExportNilai(selectedExam)} 
                disabled={loadingGrades} 
                style={s.saveBtn}
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRUD Quiz Modal */}
      {showCreateEditModal && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, maxWidth: 680, maxHeight: '92vh' }} className="glass-panel">
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>{editingExamId ? 'Edit Ujian Akhir' : 'Buat Ujian Akhir Baru'}</h3>
              <button onClick={() => setShowCreateEditModal(false)} style={s.closeBtn}><X size={20} /></button>
            </div>

            {loadingQuizDetail ? (
              <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Loader2 size={24} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ marginTop: 8, color: 'var(--grey-blue)', fontSize: '0.85rem' }}>Memuat detail kuis...</span>
              </div>
            ) : (
              <div style={{ ...s.modalBody, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={s.formGroup}>
                  <label style={s.label}>Judul Ujian *</label>
                  <input style={s.input} value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Contoh: Ujian Akhir Semester - MLOps" />
                </div>

                <div style={s.grid2Col}>
                  <div style={s.formGroup}>
                    <label style={s.label}>Kelas Asal *</label>
                    <select style={s.select} value={formCourseId} onChange={(e) => setFormCourseId(e.target.value)}>
                      <option value="">Pilih Kelas...</option>
                      {courses.map(c => <option key={c.uuid_pembelajaran} value={c.uuid_pembelajaran}>{c.title}</option>)}
                    </select>
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Modul Asal (Opsional)</label>
                    <select style={s.select} value={formModulId} onChange={(e) => setFormModulId(e.target.value)}>
                      <option value="">Semua Modul / Tanpa Modul</option>
                      {activeCourseModules.map(m => <option key={m.uuid_modul} value={m.uuid_modul}>{m.title}</option>)}
                    </select>
                  </div>
                </div>

                <div style={s.grid3Col}>
                  <div style={s.formGroup}>
                    <label style={s.label}>Passing Score (0-100)</label>
                    <input type="number" style={s.input} value={formPassingScore} onChange={(e) => setFormPassingScore(Number(e.target.value))} />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Max Attempts</label>
                    <input type="number" style={s.input} value={formMaxAttempts} onChange={(e) => setFormMaxAttempts(Number(e.target.value))} />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Batas Waktu (Menit)</label>
                    <input type="number" style={s.input} value={formTimeLimit} onChange={(e) => setFormTimeLimit(Number(e.target.value))} />
                  </div>
                </div>

                <div style={s.divider}></div>

                {/* Questions Area */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Daftar Pertanyaan ({formQuestions.length})</h4>
                    <button onClick={handleAddQuestion} style={s.addQuestionBtn}>
                      <PlusCircle size={14} />
                      <span>Tambah Soal</span>
                    </button>
                  </div>

                  {formQuestions.length === 0 ? (
                    <div style={s.emptyQuestionsWrap}>
                      <p>Belum ada pertanyaan. Tambahkan pertanyaan kuis dengan tombol di kanan atas.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {formQuestions.map((q, idx) => (
                        <div key={idx} style={s.questionFormCard} className="glass-panel">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--azure)' }}>SOAL #{idx + 1}</span>
                            <button onClick={() => handleRemoveQuestion(idx)} style={s.removeQBtn}><Trash size={12} color="#FF5252" /></button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                            <div style={s.formGroup}>
                              <label style={s.label}>Teks Pertanyaan</label>
                              <textarea 
                                style={{ ...s.input, minHeight: 60, resize: 'vertical' } as React.CSSProperties} 
                                value={q.question_text} 
                                onChange={(e) => handleQuestionChange(idx, { question_text: e.target.value })}
                                placeholder="Masukkan teks pertanyaan..."
                              />
                            </div>

                            <div style={s.grid3Col}>
                              <div style={s.formGroup}>
                                <label style={s.label}>Tipe Soal</label>
                                <select 
                                  style={s.select} 
                                  value={q.type} 
                                  onChange={(e) => handleQuestionChange(idx, { 
                                    type: e.target.value as any,
                                    options: e.target.value === 'MultipleChoice' ? [
                                      { text: 'Pilihan A', is_correct: true },
                                      { text: 'Pilihan B', is_correct: false },
                                      { text: 'Pilihan C', is_correct: false },
                                      { text: 'Pilihan D', is_correct: false }
                                    ] : e.target.value === 'TrueFalse' ? [] : []
                                  })}
                                >
                                  <option value="MultipleChoice">Multiple Choice</option>
                                  <option value="TrueFalse">True / False</option>
                                  <option value="Essay">Essay</option>
                                </select>
                              </div>
                              <div style={s.formGroup}>
                                <label style={s.label}>Bobot Nilai</label>
                                <input type="number" style={s.input} value={q.weight} onChange={(e) => handleQuestionChange(idx, { weight: Number(e.target.value) })} />
                              </div>
                              <div style={s.formGroup}>
                                <label style={s.label}>Tingkat Kesulitan</label>
                                <select style={s.select} value={q.difficulty} onChange={(e) => handleQuestionChange(idx, { difficulty: e.target.value as any })}>
                                  <option value="Beginner">Beginner</option>
                                  <option value="Intermediate">Intermediate</option>
                                  <option value="Advanced">Advanced</option>
                                </select>
                              </div>
                            </div>

                            {/* Conditional options */}
                            {q.type === 'MultipleChoice' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                                <label style={s.label}>Pilihan Jawaban (Pilih satu yang benar)</label>
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <input 
                                      type="radio" 
                                      name={`correct_${idx}`} 
                                      checked={opt.is_correct} 
                                      onChange={() => handleOptionCorrect(idx, oIdx)}
                                    />
                                    <input 
                                      style={s.input} 
                                      value={opt.text} 
                                      onChange={(e) => handleOptionChange(idx, oIdx, e.target.value)} 
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            {q.type === 'TrueFalse' && (
                              <div style={s.formGroup}>
                                <label style={s.label}>Kunci Jawaban</label>
                                <select style={s.select} value={q.correct_answer} onChange={(e) => handleQuestionChange(idx, { correct_answer: e.target.value })}>
                                  <option value="">Pilih...</option>
                                  <option value="True">True</option>
                                  <option value="False">False</option>
                                </select>
                              </div>
                            )}

                            {q.type === 'Essay' && (
                              <div style={s.formGroup}>
                                <label style={s.label}>Kunci Jawaban / Panduan Koreksi</label>
                                <textarea 
                                  style={{ ...s.input, minHeight: 50, resize: 'vertical' } as React.CSSProperties} 
                                  value={q.correct_answer} 
                                  onChange={(e) => handleQuestionChange(idx, { correct_answer: e.target.value })}
                                  placeholder="Tuliskan kata kunci atau kriteria jawaban..."
                                />
                              </div>
                            )}

                            <div style={s.formGroup}>
                              <label style={s.label}>Penjelasan (Opsional)</label>
                              <input style={s.input} value={q.explanation} onChange={(e) => handleQuestionChange(idx, { explanation: e.target.value })} placeholder="Kenapa jawaban ini benar..." />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={s.modalFooter}>
              <button onClick={() => setShowCreateEditModal(false)} style={s.cancelBtn}>Batal</button>
              <button 
                onClick={handleSaveQuiz} 
                disabled={saving || loadingQuizDetail} 
                style={s.saveBtn}
              >
                {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />} 
                <span>Simpan Ujian</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 },
  headerWrap: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0 },
  pageSubtitle: { fontSize: '0.9rem', color: 'var(--grey-blue)', marginTop: 4, margin: 0 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  statCard: { display: 'flex', alignItems: 'center', gap: 16, padding: 20 },
  statIconBox: { width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: '0.78rem', color: 'var(--grey-blue)', fontWeight: 500 },
  statVal: { fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: 2 },
  filterRow: { padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 12px', width: 300 },
  searchInput: { background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none', width: '100%' },
  errorAlert: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.2)', borderRadius: 8, color: '#FF5252', padding: '12px 16px', fontSize: '0.9rem' },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' },
  examsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 },
  examCard: { padding: 24, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' },
  examHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 },
  iconActionBtn: { background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  examTitle: { fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: '0 0 4px' },
  examCourse: { fontSize: '0.85rem', color: 'var(--grey-blue)', margin: '0 0 16px' },
  examMetrics: { display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 20 },
  metricItem: { display: 'flex', alignItems: 'center', gap: 8 },
  metricVal: { fontSize: '0.82rem', color: 'var(--grey)' },
  cardActions: { display: 'flex', gap: 10, marginTop: 'auto' },
  viewBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg, var(--navy), var(--m-blue))', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' },
  exportBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 6, border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' },
  
  // Modal styles
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', padding: 24, borderBottom: '1px solid rgba(255,255,255,0.06)' },
  modalTitle: { fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 },
  modalSubtitle: { fontSize: '0.85rem', color: 'var(--grey-blue)', marginTop: 4, margin: 0 },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--grey)', cursor: 'pointer' },
  modalBody: { padding: 24, overflowY: 'auto', flex: 1 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.1)' },
  cancelBtn: { padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--grey-blue)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' },
  saveBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, var(--navy), var(--m-blue))', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' },
  
  // Table styles
  tableContainer: { border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' },
  th: { background: 'rgba(255,255,255,0.02)', padding: '12px 16px', color: 'var(--grey-blue)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)' },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.01)' } } as any,
  td: { padding: '14px 16px', color: '#fff' },

  // Forms
  formGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--grey-blue)' },
  input: { background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: '0.9rem', outline: 'none', width: '100%' },
  select: { background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: '0.9rem', outline: 'none', width: '100%', cursor: 'pointer' },
  grid2Col: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, '@media (max-width: 600px)': { gridTemplateColumns: '1fr' } } as any,
  grid3Col: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, '@media (max-width: 600px)': { gridTemplateColumns: '1fr' } } as any,
  divider: { height: '1px', background: 'rgba(255,255,255,0.06)', margin: '20px 0' },
  createBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, var(--navy), var(--m-blue))', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' },
  addQuestionBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(65,150,240,0.25)', background: 'rgba(65,150,240,0.1)', color: 'var(--azure)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' },
  emptyQuestionsWrap: { padding: '24px', background: 'rgba(0,0,0,0.15)', border: '1px dashed var(--border-color)', borderRadius: 8, textAlign: 'center', color: 'var(--grey-blue)', fontSize: '0.85rem' },
  questionFormCard: { padding: 18, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 12 },
  removeQBtn: { background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.2)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
};
