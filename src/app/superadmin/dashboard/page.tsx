"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, Clock, GraduationCap, 
  BookOpen, Ban, RefreshCw, ShieldAlert, Award
} from 'lucide-react';
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

export default function SuperadminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const token = getStoredToken();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      
      // Mengirim x-api-key dari env (atau token session sebagai fallback)
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      } else if (token) {
        headers['x-api-key'] = token;
      }

      const response = await apiGet<{ success: boolean; data: DashboardData }>(
        '/api/dashboard/superadmin',
        {
          token: token || undefined,
          headers
        }
      );

      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error('Format response data tidak valid');
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  // Kartu-kartu KPI beserta konfigurasinya
  const kpis = [
    { 
      title: "Total Registered Users", 
      value: data?.total_users ?? 0, 
      icon: Users, 
      color: "#0663C7", // Navy
      desc: "Platform total accounts"
    },
    { 
      title: "Active Students", 
      value: data?.total_students ?? 0, 
      icon: GraduationCap, 
      color: "#4196F0", // Azure
      desc: "Enrolled learners"
    },
    { 
      title: "Active Lecturers", 
      value: data?.total_lecturers ?? 0, 
      icon: BookOpen, 
      color: "#9C27B0", // Purple
      desc: "Academic instructors"
    },
    { 
      title: "Active Tentors/Mentors", 
      value: data?.total_tentors ?? 0, 
      icon: Award, 
      color: "#00C853", // Green
      desc: "Course support team"
    },
    { 
      title: "Online Sessions", 
      value: data?.signed_in_users ?? 0, 
      icon: Activity, 
      color: "#FFA826", // Orange/Lemon
      desc: "Users active now"
    },
    { 
      title: "Inactive Accounts", 
      value: data?.inactive_users ?? 0, 
      icon: Ban, 
      color: "#F44336", // Red
      desc: "Suspended or pending deletion"
    },
  ];

  return (
    <div style={s.container}>
      {/* Header Panel */}
      <div style={s.topHeader}>
        <div>
          <h1 style={s.title}>System Overview</h1>
          <p style={s.subtitle}>Real-time stats from Nalara API Endpoint</p>
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
          <ShieldAlert size={20} color="#F44336" />
          <div style={s.errorContent}>
            <strong style={s.errorTitle}>Koneksi API Bermasalah</strong>
            <span style={s.errorMsg}>{error}</span>
          </div>
          <button style={s.retryBtn} onClick={handleRefresh}>Coba Lagi</button>
        </div>
      )}

      {/* Grid of KPI Cards */}
      <div style={s.grid}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} style={{ ...s.card, borderTop: `4px solid ${kpi.color}` }}>
              {loading ? (
                <div style={s.skeletonWrapper}>
                  <div style={s.skeletonLabel} />
                  <div style={s.skeletonValue} />
                  <div style={s.skeletonDesc} />
                </div>
              ) : (
                <>
                  <div style={s.cardHeader}>
                    <span style={s.cardLabel}>{kpi.title}</span>
                    <div style={{
                      ...s.iconWrap,
                      background: `${kpi.color}15`,
                      border: `1px solid ${kpi.color}25`
                    }}>
                      <Icon size={18} color={kpi.color} />
                    </div>
                  </div>
                  <div style={s.cardBody}>
                    <span style={s.cardValue}>
                      {kpi.value.toLocaleString('id-ID')}
                    </span>
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
    background: '#F44336',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  card: {
    background: 'rgba(30, 30, 30, 0.45)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '140px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
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
    letterSpacing: '0.02em',
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
  skeletonDesc: {
    height: '12px',
    width: '80%',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '4px',
  },
};


