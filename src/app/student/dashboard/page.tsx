"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {
  GraduationCap, BookOpen, Clock, Flame,
  RefreshCw, ShieldAlert, ChevronRight, Play
} from 'lucide-react';
import AgendaSection from '@/components/dashboard/AgendaSection';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import { useRouter } from 'next/navigation';

interface UpcomingTask {
  id: number | string;
  task_name: string;
  course_name: string;
  module_name: string;
  deadline: string;
}

interface StudentData {
  current_level: string;
  enrolled_courses: number;
  total_materials: number;
  completed_materials: number;
  pending_exams: number;
  pending_assignments: {
    done: number;
    ongoing: number;
    overdue: number;
  };
  learning_streak: number;
  longest_streak?: number;
  upcoming_tasks: UpcomingTask[];
}

interface StudentTaskRaw {
  id_tugas?: number | string;
  id?: number | string;
  nama_tugas?: string;
  task_name?: string;
  pembelajaran_asal?: string;
  course_name?: string;
  modul_asal?: string;
  module_name?: string;
  deadline?: string;
  deadline_at?: string;
}

interface StudentDashboardResponse {
  current_level?: string;
  enrolled_courses?: number;
  total_materials?: number;
  completed_materials?: number;
  pending_exams?: number;
  pending_assignments?: {
    done: number;
    ongoing: number;
    overdue: number;
  };
  learning_streak?: number;
  longest_streak?: number;
  tugas_mendesak?: StudentTaskRaw[];
  upcoming_tasks?: StudentTaskRaw[];
}

type StudentDashboardApiResponse = StudentDashboardResponse | { success: boolean; data: StudentDashboardResponse };

function formatNumber(num: number): string {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000000000) {
    return (num / 1000000000000).toFixed(1).replace(/\.0$/, '') + ' Triliun';
  }
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + ' Miliar';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + ' Juta';
  }
  return num.toLocaleString('id-ID');
}

function formatDeadlineDate(dateStr?: string): string {
  if (!dateStr || dateStr === 'Segera') return 'Tenggat Segera';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB';
  } catch {
    return dateStr;
  }
}

function DeadlineCountdown({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = new Date(deadline).getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (isNaN(targetDate) || difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (timeLeft.isExpired) {
    return (
      <span style={{
        fontSize: '0.75rem', fontWeight: 700, color: '#fca5a5',
        background: 'rgba(239, 68, 68, 0.18)', padding: '2px 8px',
        borderRadius: 6, border: '1px solid rgba(239, 68, 68, 0.3)'
      }}>
        ⏰ Waktu Pengerjaan Berakhir
      </span>
    );
  }

  const isUrgent = timeLeft.days < 2;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: isUrgent ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.18)',
        border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.35)' : 'rgba(99, 102, 241, 0.35)'}`,
        borderRadius: 6, padding: '3px 8px'
      }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isUrgent ? '#fca5a5' : '#c7d2fe' }}>
          ⏳ Sisa Waktu: {String(timeLeft.days).padStart(2, '0')}h : {String(timeLeft.hours).padStart(2, '0')}j : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userName, setUserName] = useState("Student");

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const token = getStoredToken();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;

      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      } else if (token) {
        headers['x-api-key'] = token;
      }

      // Local storage check for username
      const localUser = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
      if (localUser) {
        try {
          const userObj = JSON.parse(localUser);
          if (userObj.nama_lengkap || userObj.name || userObj.username) {
            setUserName(userObj.nama_lengkap || userObj.name || userObj.username);
          }
        } catch { }
      }

      // Fetch student dashboard main data
      const response = await apiGet<StudentDashboardApiResponse>(
        '/api/dashboard/student',
        {
          token: token || undefined,
          headers
        }
      );
      const rawData = response && 'data' in response ? response.data : response;

      if (!rawData || typeof rawData !== 'object') {
        throw new Error('Format response data tidak valid');
      }

      // Fetch authentic task deadline times directly from the /api/tugas endpoint
      let activeTugasList: any[] = [];
      try {
        const tugasRes = await apiGet<any>('/api/tugas', { token: token || undefined, headers });
        activeTugasList = tugasRes && 'data' in tugasRes ? tugasRes.data : tugasRes;
      } catch (tugasErr) {
        console.warn('Failed to fetch authentic task list, falling back to dashboard items:', tugasErr);
      }

      const rawTasks = rawData.tugas_mendesak || rawData.upcoming_tasks || [];
      const upcoming_tasks = rawTasks.map((t: StudentTaskRaw, idx: number) => {
        // Match backend's task object to find corresponding task from /api/tugas endpoint
        const matchedTugas = activeTugasList.find(at => at.uuid_tugas === t.id_tugas);
        return {
          id: t.id_tugas || t.id || idx + 1,
          task_name: t.nama_tugas || t.task_name || 'Tugas Baru',
          course_name: t.pembelajaran_asal || t.course_name || 'Kelas',
          module_name: t.modul_asal || t.module_name || 'Modul',
          deadline: matchedTugas?.deadline_at || t.deadline_at || t.deadline || 'Segera'
        };
      });

      setData({
        current_level: rawData.current_level || '',
        enrolled_courses: rawData.enrolled_courses || 0,
        total_materials: rawData.total_materials || 0,
        completed_materials: rawData.completed_materials || 0,
        pending_exams: rawData.pending_exams || 0,
        pending_assignments: rawData.pending_assignments || { done: 0, ongoing: 0, overdue: 0 },
        learning_streak: rawData.learning_streak || 0,
        longest_streak: rawData.longest_streak || 0,
        upcoming_tasks,
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data dashboard student');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      void fetchData();
    });
  }, [fetchData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void fetchData();
  };

  const completed = data?.completed_materials ?? 0;
  const totalMaterials = data?.total_materials ?? 0;
  const enrolled = data?.enrolled_courses ?? 0;
  const exams = data?.pending_exams ?? 0;
  const streak = data?.learning_streak ?? 0;
  const longestStreak = data?.longest_streak ?? 0;

  const urgentTask = data?.upcoming_tasks && data.upcoming_tasks.length > 0
    ? [...data.upcoming_tasks].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0]
    : null;

  const kpiCards = [
    {
      title: "Modules Completed",
      value: data
        ? `${formatNumber(completed)} / ${formatNumber(Math.max(totalMaterials, completed))}`
        : "0 / 0",
      desc: "Overall progress",
      icon: BookOpen,
      color: "#00C853", // Green
      bg: "rgba(0, 200, 83, 0.12)"
    },
    {
      title: "Enrolled Courses",
      value: formatNumber(enrolled),
      desc: "Cumulative average",
      icon: GraduationCap,
      color: "#4196F0", // Azure
      bg: "rgba(65, 150, 240, 0.12)"
    },
    {
      title: "Pending Exams",
      value: formatNumber(exams),
      desc: "Requires action",
      icon: Clock,
      color: "#FFA826", // Orange
      bg: "rgba(255, 168, 38, 0.12)"
    },
    {
      title: "Learning Streak",
      value: `${formatNumber(streak)} Days`,
      desc: `Streak tertinggi: ${formatNumber(longestStreak)} Days`,
      icon: Flame,
      color: "#FF5252", // Red
      bg: "rgba(255, 82, 82, 0.12)"
    }
  ];

  return (
    <div style={s.container}>
      {/* Top action header */}
      <div style={s.topHeader}>
        <div>
          <h1 style={s.title}>Learning Dashboard</h1>
          <p style={s.subtitle}>Overview of your academic progress and tasks</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || isRefreshing}
          style={{
            ...s.refreshBtn,
            opacity: loading || isRefreshing ? 0.6 : 1,
          }}
        >
          <RefreshCw
            size={14}
            color="var(--silver)"
            style={{
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
            }}
          />
          <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <div style={s.errorAlert}>
          <ShieldAlert size={20} color="#F44336" />
          <div style={s.errorContent}>
            <strong style={s.errorTitle}>Koneksi API Bermasalah</strong>
            <span style={s.errorMsg}>{error}</span>
          </div>
          <button style={s.retryBtn} onClick={handleRefresh}>Coba Lagi</button>
        </div>
      )}

      {/* Main Promo Banner or Hero Card Peringatan (Tugas Mendesak) */}
      {loading ? (
        <div style={{ ...s.bannerCard, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={s.skeletonWrapper}>
            <div style={s.skeletonLabel} />
            <div style={s.skeletonValue} />
          </div>
        </div>
      ) : urgentTask ? (
        <div style={{ ...s.bannerCard, background: 'linear-gradient(135deg, #4c1d1d 0%, #1a0505 100%)', border: '1px solid rgba(239, 82, 82, 0.25)' }}>
          <div style={s.bannerLeft}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, background: 'rgba(239, 82, 82, 0.15)', border: '1px solid rgba(239, 82, 82, 0.25)', borderRadius: 6, padding: '4px 10px', width: 'fit-content' }}>
              <ShieldAlert size={14} color="#FF5252" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FF5252', letterSpacing: '0.05em' }}>TUGAS MENDESAK</span>
            </div>
            <h2 style={s.bannerGreeting}>{urgentTask.task_name}</h2>
            <p style={{ ...s.bannerSubtitle, color: '#fca5a5' }}>
              Kelas Asal: <strong>{urgentTask.course_name}</strong> • Modul Asal: <strong>{urgentTask.module_name}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '6px 0 20px 0' }}>
              <div style={{ fontSize: '0.85rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>Tanggal Tenggat:</span>
                <strong style={{ color: '#fff', background: 'rgba(239, 82, 82, 0.3)', padding: '2px 8px', borderRadius: 4 }}>
                  {formatDeadlineDate(urgentTask.deadline)}
                </strong>
              </div>
              <DeadlineCountdown deadline={urgentTask.deadline} />
            </div>
            <div style={s.bannerBtnRow}>
              <button onClick={() => router.push('/student/penugasan')} style={{ ...s.bannerBtnPrimary, background: '#FF5252', cursor: 'pointer' }}>
                <Play size={14} fill="#fff" color="#fff" style={{ marginRight: 6 }} />
                Kerjakan Tugas
              </button>
              <button onClick={() => router.push('/student/kelas')} style={{ ...s.bannerBtnSecondary, cursor: 'pointer' }}>
                Lanjutkan Pembelajaran
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={s.bannerCard}>
          <div style={s.bannerLeft}>
            <h2 style={s.bannerGreeting}>Semua tugas telah diselesaikan!</h2>
            <p style={s.bannerSubtitle}>
              Kerja bagus, {userName}! Tidak ada tugas mendesak saat ini. Tetap pertahankan progres belajarmu.
            </p>
            <div style={s.bannerBtnRow}>
              <button onClick={() => router.push('/student/kelas')} style={{ ...s.bannerBtnSecondary, cursor: 'pointer' }}>
                Lanjutkan Pembelajaran
              </button>
            </div>
          </div>
          <div style={s.bannerRight}>
            <div style={s.progressLabelRow}>
              <span style={s.progressLabel}>Course Progress</span>
              <span style={s.progressValue}>100%</span>
            </div>
            <div style={s.progressBarBg}>
              <div style={{ ...s.progressBarFill, width: '100%' }} />
            </div>
            <span style={s.progressSubtext}>→ Semua materi tuntas</span>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={s.grid}>
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} style={s.card}>
              {loading ? (
                <div style={s.skeletonWrapper}>
                  <div style={s.skeletonLabel} />
                  <div style={s.skeletonValue} />
                </div>
              ) : (
                <>
                  <div style={s.cardHeader}>
                    <span style={s.cardLabel}>{kpi.title}</span>
                    <div style={{ ...s.iconWrap, background: kpi.bg }}>
                      <Icon size={18} color={kpi.color} />
                    </div>
                  </div>
                  <div style={s.cardBody}>
                    <span style={s.cardValue}>{kpi.value}</span>
                    <span style={s.cardDesc}>{kpi.desc}</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming Tasks Section */}
      <div style={s.taskSection}>
        <div style={s.sectionHeader}>
          <h3 style={s.sectionTitle}>Upcoming Tasks</h3>
          <span style={s.sectionSubtitle}>Pending activities requiring completion</span>
        </div>

        <div style={s.taskList}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--grey)' }}>Loading tasks...</div>
          ) : data?.upcoming_tasks && data.upcoming_tasks.length > 0 ? (
            data.upcoming_tasks.map((task) => (
              <div key={task.id} style={s.taskRow}>
                <div style={s.taskIconBox}>
                  <Clock size={16} color="var(--azure)" />
                </div>
                <div style={s.taskInfo}>
                  <strong style={s.taskName}>{task.task_name}</strong>
                  <span style={s.taskMeta}>
                    {task.course_name} • {task.module_name}
                  </span>
                </div>
                <div style={s.taskDeadlineCol}>
                  <span style={s.deadlineLabel}>Tanggal Tenggat</span>
                  <span style={s.deadlineVal}>{formatDeadlineDate(task.deadline)}</span>
                  <div style={{ marginTop: 4 }}>
                    <DeadlineCountdown deadline={task.deadline} />
                  </div>
                </div>
                <button onClick={() => router.push('/student/penugasan')} style={{ ...s.startTaskBtn, cursor: 'pointer' }}>
                  <span>Start</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            ))
          ) : (
            <div style={s.emptyState}>No upcoming tasks recorded yet.</div>
          )}
        </div>
      </div>

      <div style={s.agendaSectionWrap}>
        <div style={s.sectionHeader}>
          <h3 style={s.sectionTitle}>Agenda Student</h3>
          <span style={s.sectionSubtitle}>Jadwal kelas dan sesi yang akan datang</span>
        </div>
        <AgendaSection />
      </div>

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
    marginBottom: '24px',
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
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'rgba(255, 255, 255, 0.03)',
    color: 'var(--silver)',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    background: 'rgba(244, 67, 54, 0.08)',
    border: '1px solid rgba(244, 67, 54, 0.2)',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  errorContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  errorTitle: {
    fontSize: '0.88rem',
    color: '#FF5252',
    fontWeight: 600,
  },
  errorMsg: {
    fontSize: '0.82rem',
    color: 'var(--grey-blue)',
    marginTop: '2px',
  },
  retryBtn: {
    background: '#F44336',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  bannerCard: {
    background: 'linear-gradient(135deg, #0e3c28 0%, #062b1a 100%)',
    border: '1px solid rgba(0, 200, 83, 0.15)',
    borderRadius: '16px',
    padding: '28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '24px',
  },
  bannerLeft: {
    flex: 1,
    minWidth: '280px',
  },
  bannerGreeting: {
    fontFamily: 'Georgia, serif',
    fontSize: '1.85rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  bannerSubtitle: {
    fontSize: '0.9rem',
    color: '#a9c4b7',
    marginTop: '8px',
    lineHeight: 1.5,
    margin: '8px 0 20px 0',
  },
  bannerBtnRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  bannerBtnPrimary: {
    background: '#00C853',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background 0.2s ease',
  },
  bannerBtnSecondary: {
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  bannerRight: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '20px',
    width: '320px',
    maxWidth: '100%',
  },
  progressLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  progressLabel: {
    fontSize: '0.82rem',
    color: '#a9c4b7',
    fontWeight: 600,
  },
  progressValue: {
    fontSize: '0.88rem',
    color: '#ffffff',
    fontWeight: 700,
  },
  progressBarBg: {
    height: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '999px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressBarFill: {
    height: '100%',
    background: '#00C853',
    borderRadius: '999px',
  },
  progressSubtext: {
    fontSize: '0.75rem',
    color: '#7ba28e',
    display: 'block',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '28px',
  },
  card: {
    background: 'rgba(30, 30, 30, 0.45)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '120px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  cardLabel: {
    fontSize: '0.82rem',
    color: 'var(--grey-blue)',
    fontWeight: 600,
  },
  iconWrap: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '12px',
  },
  cardValue: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#ffffff',
    fontFamily: 'var(--font-display)',
    lineHeight: 1.1,
  },
  cardDesc: {
    fontSize: '0.75rem',
    color: 'var(--grey)',
    marginTop: '4px',
  },
  taskSection: {
    background: 'rgba(30, 30, 30, 0.45)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '24px',
  },
  agendaSectionWrap: {
    marginTop: '32px',
  },
  sectionHeader: {
    marginBottom: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    paddingBottom: '16px',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#ffffff',
    fontFamily: 'var(--font-display)',
    margin: 0,
  },
  sectionSubtitle: {
    fontSize: '0.78rem',
    color: 'var(--grey-blue)',
    display: 'block',
    marginTop: '2px',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  taskRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '14px 16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '10px',
    flexWrap: 'wrap',
  },
  taskIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(65, 150, 240, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskInfo: {
    flex: 1,
    minWidth: '180px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  taskName: {
    fontSize: '0.88rem',
    color: '#ffffff',
    fontWeight: 600,
  },
  taskMeta: {
    fontSize: '0.78rem',
    color: 'var(--grey-blue)',
  },
  taskDeadlineCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    minWidth: '100px',
  },
  deadlineLabel: {
    fontSize: '0.72rem',
    color: 'var(--grey)',
  },
  deadlineVal: {
    fontSize: '0.82rem',
    color: '#ffffff',
    fontWeight: 500,
  },
  startTaskBtn: {
    background: 'transparent',
    border: '1px solid var(--border-color)',
    color: 'var(--silver)',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
  },
  emptyState: {
    padding: '24px',
    textAlign: 'center',
    color: 'var(--grey)',
    fontSize: '0.85rem',
  },
  skeletonWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
  },
  skeletonLabel: {
    height: '14px',
    width: '70%',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
  },
  skeletonValue: {
    height: '24px',
    width: '40%',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    marginTop: '6px',
  },
};
