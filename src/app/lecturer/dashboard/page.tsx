"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {
  Users, BookOpen, RefreshCw, AlertTriangle, ArrowRight, Clock, CheckCircle, Flame, Target, Layers
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AgendaSection from '@/components/dashboard/AgendaSection';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

interface TaskToGrade {
  id: number;
  task_name: string;
  course_name: string;
  module_name: string;
  ungraded_count: number;
  total_submissions: number;
  deadline?: string;
}

interface LecturerData {
  online_students: number;
  active_courses: number;
  total_students: number;
  pending_submissions?: number;
  tasks_to_grade?: TaskToGrade[];
}

interface LecturerTaskRaw {
  id_tugas?: number;
  id?: number;
  nama_tugas?: string;
  task_name?: string;
  kelas_asal?: string;
  course_name?: string;
  modul_asal?: string;
  module_name?: string;
  jumlah_belum_dinilai?: number;
  ungraded_count?: number;
  total_submissions?: number;
  rasio_pengumpulan?: string;
  tenggat_verifikasi?: string | null;
  deadline?: string | null;
}

interface LecturerDashboardResponse {
  online_students?: number;
  active_courses?: number;
  total_students?: number;
  pending_submissions?: number;
  tasks_to_grade?: LecturerTaskRaw[];
  tugas_mendesak?: LecturerTaskRaw[];
}

type LecturerDashboardApiResponse = LecturerDashboardResponse | { success: boolean; data: LecturerDashboardResponse };

const formatNumber = (num: number) => {
  if (num >= 1000000000000) return (num / 1000000000000).toFixed(1).replace(/\.0$/, '') + ' Triliun';
  if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + ' Miliar';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + ' Juta';
  return num.toString();
};

export default function LecturerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<LecturerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userName, setUserName] = useState("Tentor");

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

      const response = await apiGet<LecturerDashboardApiResponse>(
        '/api/dashboard/lecturer',
        { token: token || undefined, headers }
      );
      const rawData = response && typeof response === 'object' && 'data' in response ? response.data : response;
      const rawTasks = rawData.tasks_to_grade || rawData.tugas_mendesak || [];
      const mappedTasks = rawTasks.map((t: LecturerTaskRaw, idx: number) => {
        let totalSub = 0;
        if (t.rasio_pengumpulan && typeof t.rasio_pengumpulan === 'string') {
          const parts = t.rasio_pengumpulan.split('/');
          totalSub = parseInt(parts[1]) || 0;
        }
        return {
          id: t.id_tugas || t.id || idx + 1,
          task_name: t.nama_tugas || t.task_name || '',
          course_name: t.kelas_asal || t.course_name || '',
          module_name: t.modul_asal || t.module_name || '',
          ungraded_count: t.jumlah_belum_dinilai !== undefined ? t.jumlah_belum_dinilai : t.ungraded_count || 0,
          total_submissions: totalSub || t.total_submissions || 0,
          deadline: t.tenggat_verifikasi || t.deadline || undefined
        };
      });
      const lecturerData = {
        online_students: rawData.online_students || 0,
        active_courses: rawData.active_courses || 0,
        total_students: rawData.total_students || 0,
        pending_submissions: rawData.pending_submissions || 0,
        tasks_to_grade: mappedTasks
      };

      const localUser = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
      if (localUser) {
        try {
          const userObj = JSON.parse(localUser);
          if (userObj.nama_lengkap || userObj.name || userObj.username) {
            setUserName(userObj.nama_lengkap || userObj.name || userObj.username);
          }
        } catch { }
      }

      if (lecturerData) {
        const computedData = {
          ...lecturerData,
          online_students: Math.max(1, Math.round(lecturerData.total_students * 0.3))
        };
        setData(computedData);
      } else {
        throw new Error('Format response data tidak valid');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data dashboard');
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

  const activeCourses = data?.active_courses ?? 0;
  const totalStudents = data?.total_students ?? 0;

  let totalPendingTasks = data?.pending_submissions ?? 0;
  if (data?.tasks_to_grade && data.tasks_to_grade.length > 0) {
    const sumUngraded = data.tasks_to_grade.reduce((acc, t) => acc + t.ungraded_count, 0);
    if (sumUngraded > totalPendingTasks) {
      totalPendingTasks = sumUngraded;
    }
  }

  // FIFO sorting: Get task with ungraded_count > 0 having the closest deadline date
  const urgentTask = data?.tasks_to_grade
    ? [...data.tasks_to_grade]
      .filter(t => t.ungraded_count > 0)
      .sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      })[0]
    : undefined;

  const kpiCards = [
    {
      title: "Kelas Dibuka",
      value: activeCourses,
      icon: BookOpen,
      gradient: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(37,99,235,0.05) 100%)",
      iconColor: "#3B82F6",
    },
    {
      title: "Total Student",
      value: totalStudents,
      icon: Users,
      gradient: "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.05) 100%)",
      iconColor: "#10B981",
    },
    {
      title: "Tugas Belum Diverif",
      value: totalPendingTasks,
      icon: AlertTriangle,
      gradient: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.05) 100%)",
      iconColor: "#F59E0B",
    }
  ];

  return (
    <div style={s.pageWrapper}>
      {/* Background glow effects */}
      <div style={s.bgGlow1} />
      <div style={s.bgGlow2} />

      <div style={s.container}>
        {/* Top bar with Refresh */}
        <div style={s.topBar}>
          <h1 style={s.pageTitle}>Dashboard</h1>
          <button
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            style={{
              ...s.refreshBtn,
              opacity: loading || isRefreshing ? 0.7 : 1,
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
              }}
            />
            {isRefreshing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div style={s.errorAlert}>
            <AlertTriangle size={20} color="#F87171" />
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', color: '#FCA5A5', fontSize: '0.9rem' }}>Connection Error</strong>
              <span style={{ color: '#FECACA', fontSize: '0.85rem' }}>{error}</span>
            </div>
          </div>
        )}

        {/* Hero Section (Welcome & Urgent Task) */}
        <div style={s.heroCard}>
          <div style={s.heroLeft}>
            <div style={s.heroGreetingWrapper}>
              <h2 style={s.heroGreeting}>Welcome back, {userName}!</h2>
              <p style={s.heroSubtitle}>
                {urgentTask
                  ? "You have tasks waiting for verification. Let's get them cleared!"
                  : "Everything is up to date. Excellent work!"}
              </p>
            </div>

            <div style={s.heroMetricsMini}>
              <div style={s.miniMetric}>
                <Target size={16} color="#3B82F6" />
                <span>{formatNumber(activeCourses)} Classes</span>
              </div>
              <div style={s.miniMetric}>
                <Users size={16} color="#10B981" />
                <span>{formatNumber(totalStudents)} Students</span>
              </div>
            </div>
          </div>

          <div style={s.heroRight}>
            {loading ? (
              <div style={s.urgentTaskLoading}>
                <div style={s.spinner} />
                <span>Memuat data tugas...</span>
              </div>
            ) : urgentTask ? (
              <div style={s.urgentTaskGlass}>
                <div style={s.urgentTaskHeader}>
                  <div style={s.urgentTaskBadge}>
                    <Flame size={14} /> Tugas Mendesak
                  </div>
                  <div style={s.urgentDeadline}>
                    <Clock size={14} /> {urgentTask.deadline || "Segera"}
                  </div>
                </div>

                <div style={s.urgentTaskBody}>
                  <h3 style={s.urgentTaskTitle}>{urgentTask.task_name}</h3>
                  <div style={s.urgentTaskTags}>
                    <span style={s.taskTag}><Layers size={12} /> {urgentTask.course_name}</span>
                    <span style={s.taskTag}><BookOpen size={12} /> {urgentTask.module_name}</span>
                  </div>
                </div>

                <div style={s.urgentTaskFooter}>
                  <div style={s.taskProgress}>
                    <span style={s.progressText}>
                      <strong style={{ color: '#F59E0B', fontSize: '1.1rem' }}>{formatNumber(urgentTask.ungraded_count)}</strong>
                      <span style={{ opacity: 0.6 }}> / {formatNumber(urgentTask.total_submissions)} Belum dinilai</span>
                    </span>
                    <div style={s.progressBarBg}>
                      <div style={{ ...s.progressBarFill, width: `${Math.min(100, Math.max(0, (urgentTask.total_submissions - urgentTask.ungraded_count) / Math.max(1, urgentTask.total_submissions) * 100))}%` }} />
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/lecturer/tugas`)}
                    style={s.ctaButton}
                  >
                    Lanjutkan Pemberian Penilaian <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div style={s.urgentTaskEmpty}>
                <CheckCircle size={40} color="#10B981" style={{ marginBottom: 12 }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#F8FAFC' }}>All Caught Up!</h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#94A3B8' }}>Tidak ada tugas yang perlu diverifikasi.</p>
              </div>
            )}
          </div>
        </div>

        {/* KPIs Grid */}
        <h3 style={s.sectionHeader}>Overview Metrics</h3>
        <div style={s.metricsGrid}>
          {kpiCards.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} style={{ ...s.metricCard, background: kpi.gradient }}>
                <div style={s.metricIconWrapper}>
                  <Icon size={24} color={kpi.iconColor} />
                </div>
                <div style={s.metricInfo}>
                  <div style={s.metricLabel}>{kpi.title}</div>
                  <div style={s.metricValue}>
                    {loading ? <div style={s.skeletonValue} /> : formatNumber(kpi.value)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <h3 style={s.sectionHeader}>Agenda Lecturer</h3>
        <AgendaSection />
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  pageWrapper: {
    position: 'relative',
    minHeight: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  bgGlow1: {
    position: 'absolute',
    top: '-20%',
    left: '-10%',
    width: '50%',
    height: '60%',
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  bgGlow2: {
    position: 'absolute',
    bottom: '-20%',
    right: '-10%',
    width: '50%',
    height: '60%',
    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, transparent 70%)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  container: {
    position: 'relative',
    zIndex: 1,
    padding: '12px 0 40px 0',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#E2E8F0',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    margin: 0,
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#E2E8F0',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    marginBottom: '24px',
    backdropFilter: 'blur(10px)',
  },

  // HERO CARD
  heroCard: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    overflow: 'hidden',
    marginBottom: '40px',
    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.4)',
  },
  heroLeft: {
    flex: '1 1 350px',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
  },
  heroGreeting: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#FFFFFF',
    margin: '0 0 12px 0',
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },
  heroSubtitle: {
    fontSize: '1rem',
    color: '#94A3B8',
    margin: 0,
    lineHeight: 1.5,
    maxWidth: '85%',
  },
  heroGreetingWrapper: {
    marginBottom: '32px',
  },
  heroMetricsMini: {
    display: 'flex',
    gap: '20px',
  },
  miniMetric: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '8px 16px',
    borderRadius: '99px',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#E2E8F0',
  },

  heroRight: {
    flex: '1 1 450px',
    padding: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.15)',
    borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
  },
  urgentTaskGlass: {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxShadow: '0 10px 30px -5px rgba(0,0,0,0.2)',
  },
  urgentTaskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urgentTaskBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(245, 158, 11, 0.15)',
    color: '#F59E0B',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  urgentDeadline: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#EF4444',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  urgentTaskBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  urgentTaskTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#FFFFFF',
    margin: 0,
    lineHeight: 1.3,
  },
  urgentTaskTags: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  taskTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#94A3B8',
    fontSize: '0.85rem',
    background: 'rgba(0,0,0,0.2)',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  urgentTaskFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: '8px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    flexWrap: 'wrap',
    gap: '16px',
  },
  taskProgress: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
    minWidth: '200px',
  },
  progressText: {
    fontSize: '0.85rem',
    color: '#E2E8F0',
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '99px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3B82F6 0%, #10B981 100%)',
    borderRadius: '99px',
  },
  ctaButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.2s, background 0.2s',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },
  urgentTaskLoading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    color: '#94A3B8',
    fontSize: '0.95rem',
    padding: '40px',
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#3B82F6',
    borderRadius: '50%',
    animation: 'spin 1s infinite linear',
  },
  urgentTaskEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '40px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '20px',
    border: '1px dashed rgba(255,255,255,0.1)',
  },

  // Metrics Grid
  sectionHeader: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#F8FAFC',
    margin: '32px 0 20px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
  metricCard: {
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)',
  },
  metricIconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.05)',
  },
  metricInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metricLabel: {
    fontSize: '0.9rem',
    color: '#94A3B8',
    fontWeight: 500,
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#FFFFFF',
    lineHeight: 1.1,
  },
  skeletonValue: {
    height: '34px',
    width: '80px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
  },
};
