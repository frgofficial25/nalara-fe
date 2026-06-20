"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, Activity, RefreshCw, ShieldAlert, ChevronRight, Layers 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

interface LecturerData {
  online_students: number;
  active_courses: number;
  total_students: number;
  pending_submissions?: number;
}

export default function LecturerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<LecturerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userName, setUserName] = useState("Lecturer");

  const fetchData = async () => {
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

      const response = await apiGet<{ success: boolean; data: LecturerData }>(
        '/api/dashboard/lecturer',
        {
          token: token || undefined,
          headers
        }
      );

      // Local storage check for username
      const localUser = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
      if (localUser) {
        try {
          const userObj = JSON.parse(localUser);
          if (userObj.name) {
            setUserName(userObj.name);
          }
        } catch {}
      }

      if (response.data) {
        setData(response.data);
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
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const attendanceRate = data && data.total_students > 0
    ? Math.round((data.online_students / data.total_students) * 100)
    : 0;

  const kpiCards = [
    {
      title: "Online Students",
      value: data?.online_students ?? 0,
      desc: "Currently active on platform",
      icon: Activity,
      color: "#00C853", // Green
      bg: "rgba(0, 200, 83, 0.1)"
    },
    {
      title: "Active Courses",
      value: data?.active_courses ?? 0,
      desc: "Courses being taught",
      icon: BookOpen,
      color: "#4196F0", // Azure
      bg: "rgba(65, 150, 240, 0.1)"
    },
    {
      title: "Total Students",
      value: data?.total_students ?? 0,
      desc: "Registered class members",
      icon: Users,
      color: "#9C27B0", // Purple
      bg: "rgba(156, 39, 176, 0.1)"
    }
  ];

  return (
    <div style={s.container}>
      {/* Top action header */}
      <div style={s.topHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={s.title}>Lecturer Command Panel</h1>
            <span style={s.apiBadge}>Consuming API</span>
          </div>
          <p style={s.subtitle}>Monitor class activities, courses, and platform statistics</p>
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

      {/* Main Greeting Banner */}
      <div style={s.bannerCard}>
        <div style={s.bannerLeft}>
          <h2 style={s.bannerGreeting}>Welcome back, Prof. {userName}.</h2>
          <p style={s.bannerSubtitle}>
            Your classes are currently operating at a healthy attendance. Manage your courses and learning modules directly.
          </p>
          <div style={s.bannerBtnRow}>
            <button onClick={() => router.push('/lecturer/courses')} style={s.bannerBtnPrimary}>
              <BookOpen size={14} color="#fff" style={{ marginRight: 6 }} />
              Manage Courses
            </button>
            <button onClick={() => router.push('/lecturer/modules')} style={s.bannerBtnSecondary}>
              <Layers size={14} color="#fff" style={{ marginRight: 6 }} />
              Manage Modules
            </button>
          </div>
        </div>
        <div style={s.bannerRight}>
          <div style={s.progressLabelRow}>
            <span style={s.progressLabel}>Online Attendance</span>
            <span style={s.progressValue}>{attendanceRate}%</span>
          </div>
          <div style={s.progressBarBg}>
            <div style={{ ...s.progressBarFill, width: `${attendanceRate}%` }} />
          </div>
          <span style={s.progressSubtext}>→ {data?.online_students || 0} out of {data?.total_students || 0} students online</span>
        </div>
      </div>

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
  apiBadge: {
    fontSize: '0.72rem',
    fontWeight: 700,
    background: 'rgba(0, 200, 83, 0.12)',
    color: '#00C853',
    padding: '4px 10px',
    borderRadius: '99px',
    border: '1px solid rgba(0, 200, 83, 0.25)',
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
    background: 'linear-gradient(135deg, #0e3047 0%, #061c2b 100%)',
    border: '1px solid rgba(65, 150, 240, 0.15)',
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
    color: '#a0b9ca',
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
    background: '#4196F0',
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
    display: 'flex',
    alignItems: 'center',
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
    color: '#a0b9ca',
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
    background: '#4196F0',
    borderRadius: '999px',
  },
  progressSubtext: {
    fontSize: '0.75rem',
    color: '#7ba2be',
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
    background: 'rgba(65, 150, 240, 0.1)',
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
