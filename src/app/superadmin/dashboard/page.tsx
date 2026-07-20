"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {
  Users, Activity, Ban, RefreshCw, ShieldAlert, Award,
  GraduationCap, BookOpen
} from 'lucide-react';
import AgendaSection from '@/components/dashboard/AgendaSection';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

interface DashboardData {
  total_users: number;
  total_students: number;
  total_lecturers: number;
  total_tentors: number;
  signed_in_users: number;
  inactive_users: number;
}

type DashboardApiResponse = DashboardData | { data?: DashboardData };

export default function SuperadminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
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

      const response = await apiGet<DashboardApiResponse>(
        '/api/dashboard/superadmin',
        {
          token: token || undefined,
          headers
        }
      );
      const responseData = (response && 'data' in response && response.data) ? response.data : (response as DashboardData);

      if (responseData && typeof responseData === 'object') {
        setData({
          total_users: responseData.total_users ?? 0,
          total_students: responseData.total_students ?? 0,
          total_lecturers: responseData.total_lecturers ?? 0,
          total_tentors: responseData.total_tentors ?? 0,
          signed_in_users: responseData.signed_in_users ?? 0,
          inactive_users: responseData.inactive_users ?? 0
        });
      } else {
        throw new Error('Data dashboard tidak valid');
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      void fetchDashboardData();
    });
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void fetchDashboardData();
  };

  // Convert numbers > 999.999 as requested by PRD
  const formatNumber = (num: number) => {
    if (num >= 1000000000000) return (num / 1000000000000).toFixed(1).replace(/\.0$/, '') + ' Triliun';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + ' Miliar';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + ' Juta';
    return num.toLocaleString('id-ID');
  };

  const primaryMetrics = [
    {
      title: "Signed In Users",
      value: data?.signed_in_users ?? 0,
      icon: Activity,
      color: "#0671E0",
      desc: "Pengguna yang sedang aktif/masuk hari ini"
    }
  ];

  const accumulativeMetrics = [
    {
      title: "Total Jumlah User(s)",
      value: data?.total_users ?? 0,
      icon: Users,
      color: "#0663C7",
      desc: "Seluruh akun terdaftar di sistem"
    },
    {
      title: "Total Akun Student(s)",
      value: data?.total_students ?? 0,
      icon: GraduationCap,
      color: "#4196F0",
      desc: "Akun dengan role Student"
    },
    {
      title: "Total Akun Lecturer(s)",
      value: data?.total_lecturers ?? 0,
      icon: BookOpen,
      color: "#9C27B0",
      desc: "Akun dengan role Lecturer"
    },
    {
      title: "Total Akun Tentor(s)",
      value: data?.total_tentors ?? 0,
      icon: Award,
      color: "#FFA826",
      desc: "Akun dengan role Tentor/Mentor"
    },
    {
      title: "User Dinonaktifkan",
      value: data?.inactive_users ?? 0,
      icon: Ban,
      color: "#ef4444",
      desc: "Akun yang sedang ditangguhkan"
    }
  ];

  return (
    <div style={s.container}>
      {/* Top Header */}
      <div style={s.topHeader}>
        <div>
          <h1 style={s.title}>SuperAdmin Overview</h1>
          <p style={s.subtitle}>Agregat pengguna, statistik sistem, dan monitor otomatisasi</p>
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
            size={15}
            color="var(--silver)"
            style={{
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
            }}
          />
          <span>{isRefreshing ? 'Syncing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {error && (
        <div style={s.errorAlert}>
          <ShieldAlert size={20} color="#ef4444" />
          <div style={s.errorContent}>
            <strong style={s.errorTitle}>API Server Offline</strong>
            <span style={s.errorMsg}>{error} (Menampilkan data lokal/fallback)</span>
          </div>
          <button style={s.retryBtn} onClick={handleRefresh}>Coba Lagi</button>
        </div>
      )}



      {/* TIER 2: PRIMARY METRICS GRID (DAILY ACTIVITY) */}
      <h3 style={s.sectionHeader}>Metriks Utama</h3>
      <div style={s.primaryGrid}>
        {primaryMetrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} style={{ ...s.card, borderTop: `4px solid ${item.color}` }}>
              <div style={s.cardHeader}>
                <span style={s.cardLabel}>{item.title}</span>
                <div style={{ ...s.iconWrap, background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                  <Icon size={18} color={item.color} />
                </div>
              </div>
              <div style={s.cardBody}>
                <span style={s.cardValue}>
                  {loading ? "..." : formatNumber(item.value)}
                </span>
                <span style={s.cardDesc}>{item.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* TIER 3: ACCUMULATIVE METRICS GRID */}
      <h3 style={s.sectionHeader}>Metrik Akumulasi</h3>
      <div style={s.accumulativeGrid}>
        {accumulativeMetrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} style={{ ...s.cardSmall, borderTop: `3px solid ${item.color}` }}>
              <div style={s.cardHeader}>
                <span style={s.cardLabelSmall}>{item.title}</span>
                <Icon size={16} color={item.color} />
              </div>
              <div style={s.cardBodySmall}>
                <span style={s.cardValueSmall}>
                  {loading ? "..." : formatNumber(item.value)}
                </span>
                <span style={s.cardDescSmall}>{item.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      <h3 style={s.sectionHeader}>Agenda SuperAdmin</h3>
      <AgendaSection allowManage />

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
    padding: '8px 0',
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
  sectionHeader: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: '32px 0 16px 0',
  },

  // Alerts Panel
  alertsPanel: {
    background: 'rgba(33, 33, 33, 0.4)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
  },
  alertsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '14px',
    marginBottom: '20px',
  },
  panelTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
    fontFamily: 'var(--font-display)',
  },
  panelBadge: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#FFA826',
    background: 'rgba(255, 168, 38, 0.12)',
    border: '1px solid rgba(255, 168, 38, 0.2)',
    padding: '3px 10px',
    borderRadius: '12px',
  },
  alertsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  alertItem: {
    background: 'rgba(25, 25, 25, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  alertIconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertTextGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  alertLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#ffffff',
  },
  alertDesc: {
    fontSize: '0.72rem',
    color: 'var(--grey-blue)',
    marginTop: '2px',
    maxWidth: '220px',
  },
  alertValue: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    fontWeight: 800,
  },

  // Primary Metrics
  primaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
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
    minHeight: '140px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  cardLabel: {
    fontSize: '0.88rem',
    color: 'var(--silver)',
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
    fontSize: '2.2rem',
    fontWeight: 800,
    color: '#ffffff',
    fontFamily: 'var(--font-display)',
    lineHeight: 1.1,
  },
  cardDesc: {
    fontSize: '0.78rem',
    color: 'var(--grey-blue)',
    marginTop: '6px',
  },

  // Small Cards
  accumulativeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  cardSmall: {
    background: 'rgba(25, 25, 27, 0.3)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '110px',
  },
  cardLabelSmall: {
    fontSize: '0.78rem',
    color: 'var(--grey-blue)',
    fontWeight: 600,
  },
  cardBodySmall: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '8px',
  },
  cardValueSmall: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#ffffff',
    fontFamily: 'var(--font-display)',
    lineHeight: 1.1,
  },
  cardDescSmall: {
    fontSize: '0.7rem',
    color: 'var(--grey)',
    marginTop: '4px',
  },
};
