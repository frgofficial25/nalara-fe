"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import {
  GraduationCap, Search, BookOpen, Brain, FileText, CheckCircle2,
  AlertCircle, Loader2, X, RefreshCw, ChevronRight, Check, AlertTriangle, ShieldCheck, UserCheck,
  ClipboardList, Users2
} from 'lucide-react';
import { getStoredToken } from '@/services/auth';
import Portal from '@/components/common/Portal';

// --- Types ---
interface Course {
  uuid_pembelajaran: string;
  title: string;
  description?: string;
}

interface Student {
  id: string;
  full_name: string;
  username: string;
  email: string;
}

interface FinalGrade {
  uuid_grade?: string;
  uuid_user: string;
  uuid_pembelajaran: string;
  final_score: number;
  is_passed: boolean;
  user?: {
    username: string;
    full_name: string;
    email: string;
  };
}

interface VerificationMetadata {
  status: 'Lulus' | 'Tidak Lulus' | 'Belum Diverifikasi';
  verifier_name: string;
  verification_date: string;
  notes: string;
}

export default function TentorKelulusanPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [recapData, setRecapData] = useState<FinalGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Searching & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Batas Kuota (Quota limit)
  const [quotaLimit, setQuotaLimit] = useState<number>(10);

  // Verifier Info from Session
  const [verifierName, setVerifierName] = useState('Tentor');

  // Verification metadata mapping (per student uuid)
  // Saved in localStorage to persist metadata not supported by default backend schema
  const [verificationMeta, setVerificationMeta] = useState<Record<string, VerificationMetadata>>({});

  // Modals state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [activeStudent, setActiveStudent] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<'Lulus' | 'Tidak Lulus'>('Lulus');
  const [notes, setNotes] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // Attendance modal state
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceStudent, setAttendanceStudent] = useState<any | null>(null);
  const [attendanceCount, setAttendanceCount] = useState<number>(0);
  const [globalTotalMeetings, setGlobalTotalMeetings] = useState<number>(0);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [savingMeetings, setSavingMeetings] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { count: number; total: number }>>({});

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getAuthHeaders = () => {
    const token = getStoredToken();
    const apiKey = "GSV6K570cC05dhvWODt35y7Q5Pd4PCjfJHYEUHAJMSdEZH25Wk5YVqo8L08mFP3HUaEr1CEdn3yT1D5hxxdprDHb6mirNrS4FQu50Sd18UCGvwn6huS17zG1CBNxd2IoeBjizHqwRVXLaCqVIa04CLCXLnmZ21DwFd9BiuNLQ8PdhCQ47l4pzzLXye1qK3Bo";
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }
    return { token: token || undefined, headers };
  };

  // Load Initial Setup
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const auth = getAuthHeaders();

      // 1. Fetch courses
      const coursesRes = await apiGet<Course[] | { success: boolean; data: Course[] }>('/api/pembelajaran', {
        token: auth.token,
        headers: auth.headers
      });
      let courseList: Course[] = [];
      if (Array.isArray(coursesRes)) {
        courseList = coursesRes;
      } else if (coursesRes && 'data' in coursesRes) {
        courseList = coursesRes.data;
      }
      const mappedCourses = courseList.map((c: any) => ({
        ...c,
        uuid_pembelajaran: c.uuid_pembelajaran || c.id,
        title: c.nama_pembelajaran || c.title || 'Untitled Class'
      }));
      setCourses(mappedCourses);

      let initialCourseId = '';
      if (mappedCourses.length > 0) {
        initialCourseId = mappedCourses[0].uuid_pembelajaran;
        setSelectedCourseId(initialCourseId);
      }

      // 2. Fetch students
      const studentsRes = await apiGet<Student[] | { success: boolean; data: Student[] }>('/api/students', {
        token: auth.token,
        headers: auth.headers
      });
      let studentList: Student[] = [];
      if (Array.isArray(studentsRes)) {
        studentList = studentsRes;
      } else if (studentsRes && 'data' in studentsRes) {
        studentList = studentsRes.data;
      }
      setStudents(studentList);

      // Load local attendance map & total meetings from localStorage
      const activeCourseId = initialCourseId;
      if (activeCourseId) {
        const localMeetings = localStorage.getItem(`nalara_meetings_${activeCourseId}`);
        if (localMeetings) {
          setGlobalTotalMeetings(parseInt(localMeetings) || 0);
        } else {
          setGlobalTotalMeetings(0);
        }

        const localAttendance = localStorage.getItem(`nalara_attendance_${activeCourseId}`);
        if (localAttendance) {
          try {
            setAttendanceMap(JSON.parse(localAttendance));
          } catch {}
        } else {
          setAttendanceMap({});
        }
      }

      // 3. Fetch user session verifier info
      const localUser = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
      if (localUser) {
        try {
          const userObj = JSON.parse(localUser);
          setVerifierName(userObj.nama_lengkap || userObj.name || userObj.username || 'Tentor');
        } catch {}
      }

      // 4. Load verification metadata from localStorage
      const localMeta = localStorage.getItem('nalara_kelulusan_meta');
      if (localMeta) {
        try {
          setVerificationMeta(JSON.parse(localMeta));
        } catch {}
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecap = useCallback(async () => {
    if (!selectedCourseId) return;
    try {
      const auth = getAuthHeaders();
      const recapRes = await apiGet<{ success: boolean; data: FinalGrade[] }>(`/api/grades/recap/${selectedCourseId}`, {
        token: auth.token,
        headers: auth.headers
      });
      setRecapData(recapRes?.data || []);
    } catch (err) {
      console.error('Error fetching recap:', err);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Update attendance data when selected course changes
  useEffect(() => {
    if (selectedCourseId) {
      const localMeetings = localStorage.getItem(`nalara_meetings_${selectedCourseId}`);
      if (localMeetings) {
        setGlobalTotalMeetings(parseInt(localMeetings) || 0);
      } else {
        setGlobalTotalMeetings(0);
      }

      const localAttendance = localStorage.getItem(`nalara_attendance_${selectedCourseId}`);
      if (localAttendance) {
        try {
          setAttendanceMap(JSON.parse(localAttendance));
        } catch {}
      } else {
        setAttendanceMap({});
      }
      fetchRecap();
    }
  }, [selectedCourseId, fetchRecap]);

  // Merge students, recap grades and local verification metadata
  // Menggunakan pembobotan di Frontend: Kehadiran 15%, Kuis 25%, Studi Kasus 60%
  const mergedStudents = students.map(student => {
    const recap = recapData.find(r => r.uuid_user === student.id);
    
    // Ambil data kehadiran dari state lokal (localStorage)
    const attData = attendanceMap[student.id];
    const attendanceCountVal = attData?.count ?? 0;
    const totalMeetingsVal = globalTotalMeetings > 0 ? globalTotalMeetings : 0;
    
    // Nilai Kehadiran = (Hadir / Total) * 100
    const attendanceScore = totalMeetingsVal > 0 ? (attendanceCountVal / totalMeetingsVal) * 100 : 0;

    // Untuk pembobotan kuis (25%) dan studi kasus (60%), jika tidak ada nilai dari DB (recap), default ke 0.
    // Karena recap dari BE adalah average score, mari kita proyeksikan bobot baru di FE:
    // (Jika ada final_score di DB, kita asumsikan kuis & studi kasus sudah dikalkulasi. Untuk simulasi FE yang akurat:
    // Kita gunakan final_score DB sebagai basis akademis (kuis + tugas), lalu kita bobot ulang dengan Kehadiran).
    // Rumus: Nilai Akhir Baru = (Skor Akademis DB * 0.85) + (Skor Kehadiran * 0.15)
    const academicScore = recap ? recap.final_score : 0;
    const finalWeightedScore = Math.min(100, Math.round((academicScore * 0.85) + (attendanceScore * 0.15)));

    const meta = verificationMeta[`${selectedCourseId}_${student.id}`] || {
      status: finalWeightedScore >= 75 ? 'Lulus' : 'Tidak Lulus',
      verifier_name: recap ? verifierName : '',
      verification_date: '',
      notes: ''
    };

    return {
      ...student,
      final_score: finalWeightedScore,
      verification_status: meta.status,
      verifier_name: meta.verifier_name,
      verification_date: meta.verification_date,
      notes: meta.notes
    };
  });

  // Sort students descending by final score
  const rankedStudents = [...mergedStudents]
    .sort((a, b) => b.final_score - a.final_score)
    .map((s, index) => ({
      ...s,
      rank: index + 1
    }));

  const filteredStudents = rankedStudents.filter(s =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  const selectedCourse = courses.find(c => c.uuid_pembelajaran === selectedCourseId);

  // Open Edit Status popup
  const handleOpenStatusModal = (student: any) => {
    setActiveStudent(student);
    setNewStatus(student.verification_status === 'Tidak Lulus' ? 'Tidak Lulus' : 'Lulus');
    setNotes(student.notes || '');
    setStatusError(null);
    setShowStatusModal(true);
  };

  // Open Attendance modal
  const handleOpenAttendanceModal = (student: any) => {
    setAttendanceStudent(student);
    const existing = attendanceMap[student.id];
    setAttendanceCount(existing?.count ?? 0);
    setShowAttendanceModal(true);
  };

  // Save total meetings globally for the class in localStorage
  const handleSaveTotalMeetings = async () => {
    if (!selectedCourseId || globalTotalMeetings <= 0) return;
    setSavingMeetings(true);
    try {
      localStorage.setItem(`nalara_meetings_${selectedCourseId}`, String(globalTotalMeetings));
      showToast(`Total pertemuan kelas berhasil diset ke ${globalTotalMeetings}.`, 'success');
    } catch (err) {
      console.error('Failed to save total meetings:', err);
      showToast('Gagal menyimpan total pertemuan.', 'error');
    } finally {
      setSavingMeetings(false);
    }
  };

  // Save attendance via localStorage
  const handleSaveAttendance = async () => {
    if (!attendanceStudent || !selectedCourseId) return;
    setSavingAttendance(true);
    try {
      const updatedMap = {
        ...attendanceMap,
        [attendanceStudent.id]: { count: attendanceCount, total: globalTotalMeetings }
      };
      setAttendanceMap(updatedMap);
      localStorage.setItem(`nalara_attendance_${selectedCourseId}`, JSON.stringify(updatedMap));
      showToast(`Kehadiran ${attendanceStudent.full_name} berhasil disimpan.`, 'success');
      setShowAttendanceModal(false);
    } catch (err) {
      console.error('Failed to save attendance:', err);
      showToast('Gagal menyimpan data kehadiran.', 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  // Save Edit Status
  const handleSaveStatus = () => {
    if (!activeStudent || !selectedCourseId) return;

    // Constraint: Reason field is mandatory if status is 'Tidak Lulus'
    if (newStatus === 'Tidak Lulus' && !notes.trim()) {
      setStatusError('Catatan/Alasan wajib diisi jika status kelulusan yang dipilih adalah Tidak Lulus.');
      return;
    }

    const verificationDate = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const key = `${selectedCourseId}_${activeStudent.id}`;
    const updatedMeta = {
      ...verificationMeta,
      [key]: {
        status: newStatus,
        verifier_name: verifierName,
        verification_date: verificationDate,
        notes: notes.trim()
      }
    };

    setVerificationMeta(updatedMeta);
    localStorage.setItem('nalara_kelulusan_meta', JSON.stringify(updatedMeta));

    showToast(`Status kelulusan ${activeStudent.full_name} diubah menjadi ${newStatus}.`, 'success');
    setShowStatusModal(false);
    setActiveStudent(null);
  };

  const [calculatingUserIds, setCalculatingUserIds] = useState<Record<string, boolean>>({});
  const [calculatingAll, setCalculatingAll] = useState(false);

  // Auto-calculate dynamic final grade for a student
  const handleCalculateGrade = async (studentId: string, silent = false) => {
    if (!selectedCourseId) return;
    setCalculatingUserIds(prev => ({ ...prev, [studentId]: true }));
    try {
      const auth = getAuthHeaders();
      const res = await apiPost<{ success: boolean; message: string }>(
        '/api/grades/calculate',
        {
          uuid_user: studentId,
          uuid_pembelajaran: selectedCourseId
        },
        { token: auth.token, headers: auth.headers }
      );
      if (res?.success) {
        if (!silent) {
          showToast('Kalkulasi nilai akhir berhasil diperbarui!', 'success');
          await fetchRecap();
        }
      }
    } catch (err) {
      console.error('Failed to calculate grade for student', studentId, err);
      if (!silent) {
        showToast('Gagal menghitung nilai akhir siswa.', 'error');
      }
    } finally {
      setCalculatingUserIds(prev => ({ ...prev, [studentId]: false }));
    }
  };

  // Batch auto-calculate for all students in the class
  const handleCalculateAllGrades = async () => {
    if (!selectedCourseId || students.length === 0) return;
    setCalculatingAll(true);
    showToast('Memulai kalkulasi nilai akhir untuk semua siswa...', 'success');
    try {
      // Calculate sequentially to prevent DB locking or overload
      for (const student of students) {
        await handleCalculateGrade(student.id, true);
      }
      showToast('Berhasil menyelesaikan kalkulasi semua nilai siswa!', 'success');
      await fetchRecap();
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan saat kalkulasi masal.', 'error');
    } finally {
      setCalculatingAll(false);
    }
  };

  // Submit Finalization
  const handleFinalize = async () => {
    if (!selectedCourseId) return;
    setFinalizing(true);
    try {
      const auth = getAuthHeaders();
      const gradesToSubmit = rankedStudents
        .filter(s => s && s.id)
        .map(s => {
          const isPassed = s.verification_status === 'Lulus';
          return {
            uuid_user: s.id,
            final_score: Number(s.final_score) || 0,
            is_passed: Boolean(isPassed)
          };
        });

      if (gradesToSubmit.length === 0) {
        showToast('Tidak ada data siswa untuk difinalisasi.', 'error');
        setFinalizing(false);
        return;
      }

      console.log('SUBMITTING FINAL GRADES:', gradesToSubmit);

      // Implement retry logic up to 3 attempts to handle Supabase pooler connection timeouts
      let attempts = 3;
      let success = false;
      let res: { success: boolean; message: string; data?: any } | null = null;

      for (let i = 0; i < attempts; i++) {
        try {
          res = await apiPost<{ success: boolean; message: string; data?: any }>(
            `/api/grades/set-grades/${selectedCourseId}`,
            { grades: gradesToSubmit },
            { token: auth.token, headers: auth.headers }
          );
          if (res?.success) {
            success = true;
            break;
          }
        } catch (postErr) {
          console.warn(`Attempt ${i + 1} to finalize grades failed, retrying...`, postErr);
          if (i === attempts - 1) {
            throw postErr;
          }
          // Wait 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (success) {
        showToast('Finalisasi kelulusan berhasil disimpan dan dipublikasikan!', 'success');
        await fetchRecap();
        setShowFinalizeModal(false);
      } else {
        throw new Error(res?.message || 'Gagal melakukan finalisasi setelah beberapa percobaan.');
      }
    } catch (err) {
      console.error('Finalize error details:', err);
      showToast(err instanceof Error ? err.message : 'Gagal mempublikasikan finalisasi kelulusan.', 'error');
    } finally {
      setFinalizing(false);
    }
  };

  // Calculate final totals for finalization popup
  const totalPassed = rankedStudents.filter(s => s.verification_status === 'Lulus').length;
  const totalFailed = rankedStudents.filter(s => s.verification_status === 'Tidak Lulus').length;

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.topHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={s.title}>Verifikasi Kelulusan</h1>
          </div>
          <p style={s.subtitle}>Verifikasi kelayakan kelulusan siswa secara komprehensif berdasarkan SOP dan kehadiran</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => { fetchInitialData(); fetchRecap(); }}
            disabled={loading}
            style={s.refreshBtn}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Sync Data</span>
          </button>
          <button
            onClick={handleCalculateAllGrades}
            disabled={loading || calculatingAll || students.length === 0}
            style={s.refreshBtn}
          >
            <Brain size={14} style={{ animation: calculatingAll ? 'spin 1.2s linear infinite' : 'none' }} color="var(--azure)" />
            <span>Kalkulasi Masal</span>
          </button>
          <button
            onClick={() => setShowFinalizeModal(true)}
            disabled={loading || rankedStudents.length === 0}
            style={{
              ...s.finalizeBtn,
              opacity: loading || rankedStudents.length === 0 ? 0.6 : 1
            }}
          >
            <ShieldCheck size={14} />
            <span>Finalisasi Kelulusan</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={s.errorAlert}>
          <AlertCircle size={20} color="#FF5252" />
          <span style={s.errorMsg}>{error}</span>
        </div>
      )}

      {/* Filters & Batch Setting */}
      <div style={s.filterRow} className="glass-panel">
        <div style={s.selectWrap}>
          <BookOpen size={16} color="var(--grey-blue)" />
          <select
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setCurrentPage(1);
            }}
            style={s.select}
          >
            {courses.map(course => (
              <option key={course.uuid_pembelajaran} value={course.uuid_pembelajaran} style={s.option}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div style={s.quotaInputWrap}>
          <span style={s.quotaLabel}>Batas Kuota Kelulusan:</span>
          <input
            type="number"
            min="1"
            max="200"
            value={quotaLimit}
            onChange={(e) => setQuotaLimit(Math.max(1, parseInt(e.target.value) || 1))}
            style={s.quotaInput}
          />
        </div>

        {/* Total Pertemuan Global */}
        <div style={s.quotaInputWrap}>
          <span style={s.quotaLabel}>Total Pertemuan:</span>
          <input
            type="number"
            min="0"
            max="200"
            value={globalTotalMeetings}
            onChange={(e) => setGlobalTotalMeetings(Math.max(0, parseInt(e.target.value) || 0))}
            style={s.quotaInput}
            placeholder="0"
          />
          <button
            onClick={handleSaveTotalMeetings}
            disabled={savingMeetings || globalTotalMeetings <= 0 || !selectedCourseId}
            style={{
              ...s.verifyBtn,
              background: 'rgba(99, 102, 241, 0.12)',
              borderColor: 'rgba(99, 102, 241, 0.25)',
              color: '#a5b4fc',
              opacity: savingMeetings || globalTotalMeetings <= 0 ? 0.6 : 1,
              cursor: savingMeetings || globalTotalMeetings <= 0 ? 'not-allowed' : 'pointer',
              padding: '6px 12px',
              fontSize: '0.78rem',
              marginLeft: '8px'
            }}
          >
            {savingMeetings ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />}
            <span>Set</span>
          </button>
        </div>

        <div style={s.searchWrap}>
          <Search size={16} color="var(--grey)" />
          <input
            type="text"
            placeholder="Cari nama, username, atau email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={s.searchInput}
          />
        </div>
      </div>

      {/* Student List Table */}
      {loading ? (
        <div style={s.loadingWrap}>
          <Loader2 size={36} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ marginTop: 12, color: 'var(--grey-blue)' }}>Memuat data siswa...</span>
        </div>
      ) : paginatedStudents.length === 0 ? (
        <div style={s.emptyState} className="glass-panel">
          <GraduationCap size={48} color="var(--grey)" />
          <h3 style={{ marginTop: 16, fontSize: '1.1rem', color: '#fff' }}>Tidak Ada Data Siswa</h3>
          <p style={{ color: 'var(--grey-blue)', fontSize: '0.85rem' }}>Belum ada siswa terdaftar atau cocok dengan pencarian.</p>
        </div>
      ) : (
        <div style={s.tableCard} className="glass-panel">
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: '60px' }}>Rank</th>
                <th style={s.th}>Siswa</th>
                <th style={s.th}>Nilai Akhir</th>
                <th style={s.th}>Status Verifikasi</th>
                <th style={s.th}>Nama Verifikator</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((student, idx) => {
                const globalIndex = indexOfFirstItem + idx + 1;
                const isUnderQuota = globalIndex <= quotaLimit;
                const showBoundaryLine = globalIndex === quotaLimit;

                return (
                  <React.Fragment key={student.id}>
                    <tr style={{
                      ...s.tr,
                      borderLeft: isUnderQuota ? '4px solid #00C853' : '4px solid rgba(255,255,255,0.05)'
                    }}>
                      <td style={s.td}>
                        <strong style={{ color: isUnderQuota ? '#00C853' : 'var(--grey-blue)' }}>#{student.rank}</strong>
                      </td>
                      <td style={s.td}>
                        <div>
                          <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{student.full_name}</strong>
                          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--grey-blue)' }}>
                            @{student.username} • {student.email}
                          </span>
                        </div>
                      </td>
                      <td style={s.td}>
                        <strong style={{ color: 'var(--azure)', fontSize: '0.95rem' }}>{student.final_score.toFixed(1)}</strong>
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            flexShrink: 0,
                            background: student.verification_status === 'Lulus'
                              ? '#00C853'
                              : student.verification_status === 'Tidak Lulus'
                              ? '#FF3D00'
                              : 'rgba(180,180,200,0.5)',
                          }} />
                          <span style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: student.verification_status === 'Lulus'
                              ? '#00C853'
                              : student.verification_status === 'Tidak Lulus'
                              ? '#FF3D00'
                              : 'var(--grey-blue)',
                            whiteSpace: 'nowrap',
                          }}>
                            {student.verification_status === 'Belum Diverifikasi' ? 'Pending' : student.verification_status}
                          </span>
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={{ fontSize: '0.88rem', color: student.verifier_name ? '#fff' : 'var(--grey)' }}>
                          {student.verifier_name || '-'}
                        </span>
                      </td>
                      <td style={{ ...s.td, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => handleCalculateGrade(student.id)}
                          disabled={calculatingUserIds[student.id]}
                          style={{
                            ...s.verifyBtn,
                            background: 'rgba(255, 168, 38, 0.1)',
                            borderColor: 'rgba(255, 168, 38, 0.25)',
                            color: '#FFA826'
                          }}
                        >
                          {calculatingUserIds[student.id] ? (
                            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Brain size={13} />
                          )}
                          <span>Kalkulasi</span>
                        </button>
                        <button
                          onClick={() => handleOpenAttendanceModal(student)}
                          style={{
                            ...s.verifyBtn,
                            background: 'rgba(99, 102, 241, 0.1)',
                            borderColor: 'rgba(99, 102, 241, 0.25)',
                            color: '#a5b4fc'
                          }}
                        >
                          <ClipboardList size={13} />
                          <span>Kehadiran</span>
                        </button>
                        <button
                          onClick={() => handleOpenStatusModal(student)}
                          style={s.verifyBtn}
                        >
                          <UserCheck size={13} />
                          <span>Ubah Status</span>
                        </button>
                      </td>
                    </tr>
                    
                    {/* Quota limit line separator */}
                    {showBoundaryLine && globalIndex < filteredStudents.length && (
                      <tr>
                        <td colSpan={6} style={s.boundaryTd}>
                          <div style={s.boundaryLine}>
                            <span style={s.boundaryBadge}>Batas Kuota Kelulusan ({quotaLimit} Siswa)</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div style={s.paginationRow}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{ ...s.pageBtn, opacity: currentPage === 1 ? 0.4 : 1 }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--grey-blue)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{ ...s.pageBtn, opacity: currentPage === totalPages ? 0.4 : 1 }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah Kehadiran */}
      {showAttendanceModal && attendanceStudent && (
        <Portal>
          <div style={s.modalOverlay} onClick={() => setShowAttendanceModal(false)}>
            <div style={{ ...s.modalContent, maxWidth: '400px' }} className="glass-panel" onClick={e => e.stopPropagation()}>
              <div style={s.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ClipboardList size={18} color="#a5b4fc" />
                  </div>
                  <div>
                    <h3 style={s.modalTitle}>Input Kehadiran</h3>
                    <span style={s.modalSubtitle}>{attendanceStudent.full_name}</span>
                  </div>
                </div>
                <button onClick={() => setShowAttendanceModal(false)} style={s.closeBtn}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 4 }}>
                {/* Info total meetings */}
                <div style={{ background: 'rgba(99, 102, 241, 0.07)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users2 size={14} color="#a5b4fc" />
                  <span style={{ fontSize: '0.82rem', color: '#a5b4fc' }}>
                    Total pertemuan kelas: <strong>{globalTotalMeetings > 0 ? globalTotalMeetings : '—'}</strong>
                    {globalTotalMeetings === 0 && (
                      <span style={{ color: '#FF5252', marginLeft: 6 }}>⚠ Set total pertemuan dulu di panel atas</span>
                    )}
                  </span>
                </div>

                {/* Kehadiran input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={s.label}>Jumlah Kehadiran Student</label>
                  <input
                    type="number"
                    min={0}
                    max={globalTotalMeetings || 999}
                    value={attendanceCount}
                    onChange={e => setAttendanceCount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Contoh: 10"
                    style={{ ...s.textArea, height: 'auto', padding: '10px 14px', borderRadius: 8 }}
                  />
                  <span style={{ fontSize: '0.76rem', color: 'var(--grey)' }}>Berapa kali student ini hadir dari {globalTotalMeetings || '?'} pertemuan</span>
                </div>

                {/* Persentase preview — hanya tampil kalau globalTotalMeetings sudah diset */}
                {globalTotalMeetings > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--grey-blue)' }}>Persentase Kehadiran (preview)</span>
                      <strong style={{ fontSize: '1rem', color: attendanceCount / globalTotalMeetings >= 0.75 ? '#00C853' : '#FF5252' }}>
                        {Math.min(Math.round((attendanceCount / globalTotalMeetings) * 100), 100)}%
                      </strong>
                    </div>
                    <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        borderRadius: 3,
                        width: `${Math.min((attendanceCount / globalTotalMeetings) * 100, 100)}%`,
                        background: attendanceCount / globalTotalMeetings >= 0.75 ? '#00C853' : '#FF5252',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.73rem', color: 'var(--grey)', marginTop: 4, display: 'block' }}>
                      Nilai akhir dihitung backend: Kehadiran 15% • Kuis 25% • Studi Kasus 60%
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                  <button onClick={() => setShowAttendanceModal(false)} style={{ ...s.cancelBtn }}>
                    Batal
                  </button>
                  <button
                    onClick={handleSaveAttendance}
                    disabled={savingAttendance || globalTotalMeetings === 0}
                    style={{
                      ...s.saveBtn,
                      opacity: savingAttendance || globalTotalMeetings === 0 ? 0.6 : 1,
                      cursor: savingAttendance || globalTotalMeetings === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {savingAttendance ? (
                      <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /><span>Menyimpan...</span></>
                    ) : (
                      <><Check size={14} /><span>Simpan Kehadiran</span></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Ubah Status Kelulusan Pop-up page */}
      {showStatusModal && activeStudent && (
        <Portal>
          <div style={s.modalOverlay}>
            <div style={{ ...s.modalContent, maxWidth: '460px' }} className="glass-panel">
              <div style={s.modalHeader}>
                <div>
                  <h3 style={s.modalTitle}>Ubah Status Kelulusan</h3>
                  <span style={s.modalSubtitle}>Verifikasi kesesuaian SOP akademik</span>
                </div>
                <button onClick={() => setShowStatusModal(false)} style={s.closeBtn}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.88rem' }}>
                <div style={s.detailGrid}>
                  <div style={s.gridRow}>
                    <span style={s.gridLabel}>Nomor Ranking:</span>
                    <strong style={{ color: '#fff' }}>#{activeStudent.rank}</strong>
                  </div>
                  <div style={s.gridRow}>
                    <span style={s.gridLabel}>Username Student:</span>
                    <strong style={{ color: '#fff' }}>@{activeStudent.username}</strong>
                  </div>
                  <div style={s.gridRow}>
                    <span style={s.gridLabel}>Nama Asli Student:</span>
                    <strong style={{ color: '#fff' }}>{activeStudent.full_name}</strong>
                  </div>
                  <div style={s.gridRow}>
                    <span style={s.gridLabel}>Nilai Akhir:</span>
                    <strong style={{ color: 'var(--azure)' }}>{activeStudent.final_score.toFixed(1)}</strong>
                  </div>
                  <div style={s.gridRow}>
                    <span style={s.gridLabel}>Status Verifikasi:</span>
                    <strong style={{ color: '#fff' }}>{activeStudent.verification_status}</strong>
                  </div>
                  <div style={s.gridRow}>
                    <span style={s.gridLabel}>Tanggal Verifikasi:</span>
                    <strong style={{ color: '#00C853' }}>
                      {newStatus ? new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </strong>
                  </div>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Pilihan Status Baru</label>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => { setNewStatus('Lulus'); setStatusError(null); }}
                      style={{
                        ...s.statusOptionBtn,
                        background: newStatus === 'Lulus' ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255,255,255,0.02)',
                        color: newStatus === 'Lulus' ? '#00C853' : 'var(--grey-blue)',
                        borderColor: newStatus === 'Lulus' ? '#00C853' : 'var(--border-color)'
                      }}
                    >
                      Lulus
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNewStatus('Tidak Lulus'); setStatusError(null); }}
                      style={{
                        ...s.statusOptionBtn,
                        background: newStatus === 'Tidak Lulus' ? 'rgba(255, 61, 0, 0.15)' : 'rgba(255,255,255,0.02)',
                        color: newStatus === 'Tidak Lulus' ? '#FF3D00' : 'var(--grey-blue)',
                        borderColor: newStatus === 'Tidak Lulus' ? '#FF3D00' : 'var(--border-color)'
                      }}
                    >
                      Tidak Lulus
                    </button>
                  </div>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>
                    Catatan/Alasan {newStatus === 'Tidak Lulus' && <span style={{ color: '#FF3D00' }}>* (Wajib)</span>}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      if (e.target.value.trim()) setStatusError(null);
                    }}
                    placeholder="Masukkan catatan evaluasi atau alasan tidak kelulusan..."
                    style={{ ...s.input, minHeight: '80px', resize: 'vertical', marginTop: 4 }}
                  />
                </div>

                {statusError && (
                  <div style={{ color: '#FF5252', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={14} />
                    <span>{statusError}</span>
                  </div>
                )}

                <div style={s.modalFooter}>
                  <button type="button" onClick={() => setShowStatusModal(false)} style={s.cancelBtn}>Batal</button>
                  <button type="button" onClick={handleSaveStatus} style={s.submitBtn}>Simpan Perubahan</button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Konfirmasi Finalisasi Pop-up page */}
      {showFinalizeModal && (
        <Portal>
          <div style={s.modalOverlay}>
            <div style={{ ...s.modalContent, maxWidth: '440px' }} className="glass-panel">
              <div style={s.modalHeader}>
                <div>
                  <h3 style={s.modalTitle}>Konfirmasi Finalisasi</h3>
                  <span style={s.modalSubtitle}>Publikasi hasil verifikasi kelulusan</span>
                </div>
                <button onClick={() => setShowFinalizeModal(false)} style={s.closeBtn}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.88rem' }}>
                <p style={{ color: 'var(--silver)', lineHeight: 1.5, margin: 0 }}>
                  Apakah Anda yakin ingin memfinalisasi kelulusan kelas ini? Hasil kelulusan akan langsung dipublikasikan ke Dashboard masing-masing Student.
                </p>

                <div style={s.detailGrid}>
                  <div style={s.gridRow}>
                    <span style={s.gridLabel}>Nama Kelas:</span>
                    <strong style={{ color: '#fff' }}>{selectedCourse?.title || '-'}</strong>
                  </div>
                  <div style={s.gridRow}>
                    <span style={s.gridLabel}>Jumlah Student Lulus:</span>
                    <strong style={{ color: '#00C853', fontSize: '1rem' }}>{totalPassed} Student</strong>
                  </div>
                  <div style={s.gridRow}>
                    <span style={s.gridLabel}>Jumlah Student Tidak Lulus:</span>
                    <strong style={{ color: '#FF3D00', fontSize: '1rem' }}>{totalFailed} Student</strong>
                  </div>
                </div>

                <div style={s.modalFooter}>
                  <button type="button" onClick={() => setShowFinalizeModal(false)} style={s.cancelBtn}>Batal</button>
                  <button
                    type="button"
                    onClick={handleFinalize}
                    disabled={finalizing}
                    style={{
                      ...s.submitBtn,
                      background: 'linear-gradient(135deg, #00C853, #009624)',
                      boxShadow: '0 4px 12px rgba(0, 200, 83, 0.3)'
                    }}
                  >
                    {finalizing ? 'Finalisasi...' : 'Finalisasi'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Toast notifications */}
      {toast && (
        <Portal>
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: toast.type === 'success' ? 'rgba(0, 200, 83, 0.95)' : 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            zIndex: 999999,
          }}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{toast.message}</span>
          </div>
        </Portal>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.02) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          backdrop-filter: blur(12px) !important;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25) !important;
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
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'rgba(255, 255, 255, 0.03)',
    color: 'var(--silver)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  finalizeBtn: {
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
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(6, 99, 199, 0.3)',
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
  filterRow: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  selectWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-color)',
    padding: '0 14px',
    borderRadius: '8px',
    flex: 1,
    minWidth: '220px',
    height: '42px',
  },
  select: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '0.88rem',
    outline: 'none',
    width: '100%',
    cursor: 'pointer',
  },
  option: {
    background: '#191919',
    color: '#fff',
  },
  quotaInputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    height: '42px',
  },
  quotaLabel: {
    fontSize: '0.82rem',
    color: 'var(--grey-blue)',
    fontWeight: 600,
  },
  quotaInput: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    width: '70px',
    height: '100%',
    padding: '0 10px',
    color: '#fff',
    fontSize: '0.9rem',
    textAlign: 'center',
    outline: 'none',
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-color)',
    padding: '0 14px',
    borderRadius: '8px',
    flex: 2,
    minWidth: '240px',
    height: '42px',
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '0.88rem',
    outline: 'none',
    width: '100%',
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
    border: '1px dashed var(--border-color)',
    borderRadius: '16px',
    textAlign: 'center',
  },
  tableCard: {
    borderRadius: '12px',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.88rem',
  },
  th: {
    padding: '14px 18px',
    color: 'var(--grey-blue)',
    fontWeight: 600,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    transition: 'background 0.2s',
  },
  td: {
    padding: '16px 18px',
    verticalAlign: 'middle',
  },
  boundaryTd: {
    padding: '12px 18px',
    background: 'rgba(255,255,255,0.01)',
  },
  boundaryLine: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '2px dashed rgba(255, 61, 0, 0.4)',
    position: 'relative',
    height: '1px',
    margin: '10px 0',
  },
  boundaryBadge: {
    position: 'absolute',
    background: '#1a0e0e',
    border: '1px solid rgba(255, 61, 0, 0.3)',
    color: '#FF5252',
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '2px 10px',
    borderRadius: '20px',
    textTransform: 'uppercase',
  },
  statusBadge: {
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '20px',
    textTransform: 'uppercase',
  },
  verifyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(65, 150, 240, 0.1)',
    border: '1px solid rgba(65, 150, 240, 0.25)',
    color: 'var(--azure)',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  pageBtn: {
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    color: 'var(--silver)',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  // Modal layout
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
    zIndex: 9999,
    padding: '20px',
  },
  modalContent: {
    width: '100%',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '85vh',
    overflowY: 'auto',
    borderRadius: '16px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '16px',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  modalSubtitle: {
    fontSize: '0.78rem',
    color: 'var(--grey-blue)',
    display: 'block',
    marginTop: '2px',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--grey-blue)',
    cursor: 'pointer',
  },
  detailGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '14px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px',
  },
  gridRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridLabel: {
    color: 'var(--grey-blue)',
    fontSize: '0.82rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--grey-blue)',
  },
  statusOptionBtn: {
    flex: 1,
    padding: '8px 0',
    borderRadius: '8px',
    border: '1px solid',
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
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
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '16px',
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
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  textArea: {
    width: '100%',
    minHeight: '60px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '0.88rem',
    outline: 'none',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
};
