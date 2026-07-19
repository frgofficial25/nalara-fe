"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {
  Users, BookOpen, FileText, RefreshCw, ShieldAlert, ChevronRight, FileCheck, Flame, Clock, Layers, ArrowRight, CheckCircle
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
  deadline?: string; // Date string to enable FIFO sorting
}

interface TentorData {
  managed_courses: number;
  total_students: number;
  pending_submissions: number;
  verified_by_me: number;
  tasks_to_grade: TaskToGrade[];
}

interface TentorTaskRaw {
  id?: number;
  task_name?: string;
  nama_tugas?: string;
  course_name?: string;
  kelas_asal?: string;
  module_name?: string;
  modul_asal?: string;
  ungraded_count?: number;
  jumlah_belum_dinilai?: number;
  total_submissions?: number;
  deadline?: string | null;
}

interface TentorDashboardResponse {
  managed_courses?: number;
  total_students?: number;
  pending_submissions?: number;
  verified_by_me?: number;
  tasks_to_grade?: TentorTaskRaw[];
}

type TentorDashboardApiResponse = TentorDashboardResponse | { success: boolean; data: TentorDashboardResponse };

export default function TentorDashboard() {
  const router = useRouter();
  const [data, setData] = useState<TentorData | null>(null);
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
      if (apiKey) headers['x-api-key'] = apiKey;
      else if (token) headers['x-api-key'] = token;

      // Ambil nama dari local storage
      const localUser = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
      if (localUser) {
        try {
          const userObj = JSON.parse(localUser);
          const name = userObj.nama_lengkap || userObj.name || userObj.username;
          if (name) setUserName(name);
        } catch { }
      }

      const response = await apiGet<TentorDashboardApiResponse>(
        '/api/dashboard/tentor',
        { token: token || undefined, headers }
      );

      const raw = 'data' in (response || {}) ? response.data : response;

      setData({
        managed_courses: raw?.managed_courses ?? 0,
        total_students: raw?.total_students ?? 0,
        pending_submissions: raw?.pending_submissions ?? 0,
        verified_by_me: raw?.verified_by_me ?? 0,
        tasks_to_grade: (raw?.tasks_to_grade ?? []).map((t: TentorTaskRaw, i: number) => ({
          id: t.id ?? i + 1,
          task_name: t.task_name ?? t.nama_tugas ?? '-',
          course_name: t.course_name ?? t.kelas_asal ?? '-',
          module_name: t.module_name ?? t.modul_asal ?? '-',
          ungraded_count: t.ungraded_count ?? t.jumlah_belum_dinilai ?? 0,
          total_submissions: t.total_submissions ?? 0,
          deadline: t.deadline ?? null,
        }))
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data dashboard.');
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

  // Convert numbers > 999.999 as requested by PRD
  const formatNumber = (num: number) => {
    if (num >= 1000000000000) return (num / 1000000000000).toFixed(1).replace(/\.0$/, '') + ' Triliun';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + ' Miliar';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + ' Juta';
    return num.toLocaleString('id-ID');
  };

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
      title: "Total Kelas",
      value: data?.managed_courses ?? 0,
      desc: "Kelas aktif di platform",
      icon: BookOpen,
      color: "#4196F0",
      bg: "rgba(65, 150, 240, 0.1)"
    },
    {
      title: "Total Student",
      value: data?.total_students ?? 0,
      desc: "Total peserta terdaftar",
      icon: Users,
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.1)"
    },
    {
      title: "Menunggu Verifikasi",
      value: data?.pending_submissions ?? 0,
      desc: "Submission belum dinilai mentor",
      icon: FileText,
      color: "#FFA826",
      bg: "rgba(255, 168, 38, 0.1)"
    },
    {
      title: "Sudah Diverifikasi",
      value: data?.verified_by_me ?? 0,
      desc: "Submission yang telah kamu verifikasi",
      icon: FileCheck,
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.1)"
    }
  ];

  return (
    <div style={s.container}>
      {/* Top Header */}
      <div style={s.topHeader}>
        <div>
          <h1 style={s.title}>Tentor Dashboard</h1>
          <p style={s.subtitle}>Overview kelas, data student, dan penilaian tugas peserta</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || isRefreshing}
          style={{
            ...s.refreshBtn,
            opacity: loading || isRefreshing ? 0.6 : 1,
            cursor: loading || isRefreshing ? 'not-allowed' : 'pointer'
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
          <ShieldAlert size={20} color="#ef4444" />
          <div style={s.errorContent}>
            <strong style={s.errorTitle}>Gagal Memuat Data</strong>
            <span style={s.errorMsg}>{error}</span>
          </div>
          <button style={s.retryBtn} onClick={handleRefresh}>Coba Lagi</button>
        </div>
      )}

      {/* TIER 1: HERO CARD PERINGATAN (TUGAS PALING MENDESAK - FIFO) */}
      <div style={s.heroCard}>
        <div style={s.heroLeft}>
          <h2 style={s.heroGreeting}>Welcome back, {userName}!</h2>
          <p style={s.heroSubtitle}>
            {urgentTask
              ? "Terdapat tugas mendesak yang menunggu penilaian Anda. Selesaikan segera!"
              : "Semua pengumpulan tugas telah dinilai dengan sukses. Kerja bagus!"}
          </p>
          <div style={s.infoStatsRow}>
            <div style={s.infoStatItem}>
              <BookOpen size={16} color="var(--azure)" />
              <span>{formatNumber(data?.managed_courses ?? 0)} Kelas</span>
            </div>
            <div style={s.infoStatItem}>
              <Users size={16} color="#10b981" />
              <span>{formatNumber(data?.total_students ?? 0)} Student</span>
            </div>
          </div>
        </div>

        <div style={s.heroRight}>
          {loading ? (
            <div style={s.taskLoadingWrap}>
              <RefreshCw size={24} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--azure)' }} />
              <span>Memuat tugas mendesak...</span>
            </div>
          ) : urgentTask ? (
            <div style={s.urgentBox}>
              <div style={s.urgentHeader}>
                <span style={s.urgentBadge}>
                  <Flame size={12} style={{ marginRight: 4 }} /> Tugas Paling Mendesak
                </span>
                <span style={s.deadlineLabel}>
                  <Clock size={12} style={{ marginRight: 4 }} />
                  Deadline: {urgentTask.deadline ? new Date(urgentTask.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : "Segera"}
                </span>
              </div>

              <div style={s.urgentBody}>
                <h3 style={s.urgentTitle}>{urgentTask.task_name}</h3>
                <div style={s.urgentTags}>
                  <span style={s.tagItem}><Layers size={12} style={{ marginRight: 4 }} /> {urgentTask.course_name}</span>
                  <span style={s.tagItem}><BookOpen size={12} style={{ marginRight: 4 }} /> {urgentTask.module_name}</span>
                </div>
              </div>

              <div style={s.urgentFooter}>
                <div style={s.progressTextGroup}>
                  <span style={s.ratioLabel}>Rasio Pengumpulan:</span>
                  <span style={s.ratioValue}>
                    <strong style={{ color: '#FFA826' }}>{formatNumber(urgentTask.ungraded_count)}</strong>
                    <span style={{ opacity: 0.6 }}> / {formatNumber(urgentTask.total_submissions)} belum dinilai</span>
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/tentor/tugas`)}
                  style={s.ctaBtn}
                >
                  <span>Lanjutkan Pemberian Penilaian</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div style={s.emptyUrgent}>
              <CheckCircle size={36} color="#10b981" />
              <strong style={{ marginTop: 10, color: '#ffffff' }}>Semua Tugas Selesai!</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--grey-blue)', marginTop: 4 }}>Belum ada pengumpulan baru untuk dinilai.</p>
            </div>
          )}
        </div>
      </div>

      {/* TIER 2: OVERVIEW KPI CARDS */}
      <h3 style={s.sectionHeader}>Overview Metrics</h3>
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
                    <span style={s.cardValue}>{formatNumber(kpi.value)}</span>
                    <span style={s.cardDesc}>{kpi.desc}</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* TIER 3: TASKS LIST */}
      <div style={s.taskSection}>
        <div style={s.sectionHeaderContainer}>
          <h3 style={s.sectionTitle}>Daftar Pemeriksaan Tugas</h3>
          <span style={s.sectionSubtitle}>Daftar modul yang memerlukan verifikasi kelulusan</span>
        </div>

        <div style={s.taskList}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--grey-blue)' }}>Memuat daftar tugas...</div>
          ) : data?.tasks_to_grade && data.tasks_to_grade.length > 0 ? (
            data.tasks_to_grade.map((task) => (
              <div key={task.id} style={s.taskRow}>
                <div style={s.taskIconBox}>
                  <FileText size={16} color="var(--azure)" />
                </div>
                <div style={s.taskInfo}>
                  <strong style={s.taskName}>{task.task_name}</strong>
                  <span style={s.taskMeta}>
                    {task.course_name} • {task.module_name}
                  </span>
                </div>
                <div style={s.taskStatusCol}>
                  <span style={s.statusLabel}>Rasio Diperiksa</span>
                  <span style={s.statusValue}>
                    {formatNumber(task.total_submissions - task.ungraded_count)} / {formatNumber(task.total_submissions)} Terverifikasi
                  </span>
                </div>
                <div style={s.taskSubmissionCol}>
                  <span style={{
                    ...s.ungradedTag,
                    background: task.ungraded_count > 0 ? 'rgba(255, 168, 38, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: task.ungraded_count > 0 ? '#FFA826' : '#10b981',
                    border: task.ungraded_count > 0 ? '1px solid rgba(255, 168, 38, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    {task.ungraded_count > 0 ? `${formatNumber(task.ungraded_count)} Belum Dinilai` : 'Selesai'}
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/tentor/tugas`)}
                  style={s.startTaskBtn}
                >
                  <span>Periksa</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            ))
          ) : (
            <div style={s.emptyState}>Semua tugas selesai dinilai!</div>
          )}
        </div>
      </div>

      <h3 style={s.sectionHeader}>Agenda Tentor</h3>
      <AgendaSection />

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
    fontFamily: 'var(--font-sans)',
    transition: 'all 0.2s ease',
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
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
  },

  // Hero Card
  heroCard: {
    background: 'linear-gradient(135deg, rgba(33, 33, 33, 0.6) 0%, rgba(20, 20, 22, 0.8) 100%)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '28px',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '24px',
    marginBottom: '32px',
    flexWrap: 'wrap',
  },
  heroLeft: {
    flex: '1 1 400px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '20px',
  },
  heroGreeting: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
    fontFamily: 'var(--font-display)',
  },
  heroSubtitle: {
    fontSize: '0.88rem',
    color: 'var(--grey-blue)',
    marginTop: '8px',
    lineHeight: '1.5',
    margin: 0,
  },
  infoStatsRow: {
    display: 'flex',
    gap: '16px',
  },
  infoStatItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    color: 'var(--silver)',
  },
  heroRight: {
    flex: '1 1 350px',
    display: 'flex',
  },
  taskLoadingWrap: {
    width: '100%',
    minHeight: '140px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '12px',
    fontSize: '0.85rem',
    color: 'var(--grey-blue)',
  },
  urgentBox: {
    width: '100%',
    background: 'rgba(255, 168, 38, 0.04)',
    border: '1px solid rgba(255, 168, 38, 0.2)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '14px',
  },
  urgentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  urgentBadge: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#FFA826',
    background: 'rgba(255, 168, 38, 0.12)',
    padding: '4px 10px',
    borderRadius: '20px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  deadlineLabel: {
    fontSize: '0.72rem',
    color: 'var(--grey-blue)',
    display: 'inline-flex',
    alignItems: 'center',
  },
  urgentBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  urgentTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
    lineHeight: '1.35',
  },
  urgentTags: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  tagItem: {
    fontSize: '0.72rem',
    color: 'var(--grey-blue)',
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '3px 8px',
    borderRadius: '4px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  urgentFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  progressTextGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  ratioLabel: {
    fontSize: '0.7rem',
    color: 'var(--grey)',
  },
  ratioValue: {
    fontSize: '0.8rem',
    color: 'var(--silver)',
    marginTop: '2px',
  },
  ctaBtn: {
    background: 'linear-gradient(135deg, var(--lemon), var(--d-yellow))',
    border: 'none',
    borderRadius: '8px',
    color: 'var(--bg-dark)',
    padding: '8px 16px',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
  },
  emptyUrgent: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(16, 185, 129, 0.03)',
    border: '1px solid rgba(16, 185, 129, 0.1)',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
  },

  // KPI Grid
  sectionHeader: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: '40px 0 16px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  card: {
    background: 'rgba(30, 30, 32, 0.4)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '130px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  cardLabel: {
    fontSize: '0.85rem',
    color: 'var(--grey-blue)',
    fontWeight: 600,
  },
  iconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '16px',
  },
  cardValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#ffffff',
    fontFamily: 'var(--font-display)',
    lineHeight: 1.1,
  },
  cardDesc: {
    fontSize: '0.78rem',
    color: 'var(--grey)',
    marginTop: '6px',
  },
  skeletonWrapper: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '12px',
  },
  skeletonLabel: {
    height: '16px',
    width: '60%',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
  },
  skeletonValue: {
    height: '32px',
    width: '40%',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    marginTop: '8px',
  },

  // Task Section
  taskSection: {
    background: 'rgba(33, 33, 33, 0.4)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '24px',
    marginTop: '32px',
  },
  sectionHeaderContainer: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '14px',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
    fontFamily: 'var(--font-display)',
  },
  sectionSubtitle: {
    fontSize: '0.75rem',
    color: 'var(--grey-blue)',
    marginTop: '4px',
    display: 'block',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  taskRow: {
    background: 'rgba(25, 25, 25, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  taskIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(65, 150, 240, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskInfo: {
    flex: '1 1 250px',
    display: 'flex',
    flexDirection: 'column',
  },
  taskName: {
    fontSize: '0.88rem',
    color: '#ffffff',
  },
  taskMeta: {
    fontSize: '0.75rem',
    color: 'var(--grey-blue)',
    marginTop: '4px',
  },
  taskStatusCol: {
    flex: '1 1 150px',
    display: 'flex',
    flexDirection: 'column',
  },
  statusLabel: {
    fontSize: '0.7rem',
    color: 'var(--grey)',
  },
  statusValue: {
    fontSize: '0.78rem',
    color: 'var(--silver)',
    marginTop: '2px',
  },
  taskSubmissionCol: {
    flex: '1 1 120px',
    display: 'flex',
    justifyContent: 'flex-start',
  },
  ungradedTag: {
    fontSize: '0.72rem',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '20px',
  },
  startTaskBtn: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    color: '#ffffff',
    padding: '6px 12px',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
  },
  emptyState: {
    padding: '32px',
    textAlign: 'center',
    color: 'var(--grey-blue)',
    background: 'rgba(0, 0, 0, 0.1)',
    borderRadius: '10px',
    fontSize: '0.85rem',
  },
};
