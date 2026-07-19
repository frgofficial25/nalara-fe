"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Award, RefreshCw, Trophy, Crown, CheckCircle, AlertTriangle, User,
  Clock, Loader2
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

interface RankedStudent {
  rank: number;
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  final_score: number;
  status_kelulusan: "Lulus" | "Tidak Lulus";
}

interface LeaderboardData {
  topStudents: RankedStudent[];
  userRank: RankedStudent | null;
}

interface GradeItem {
  uuid_attempt: string;
  quiz: {
    uuid_quiz: string;
    title: string;
  };
  score: number;
  percentage: number;
  grade_letter: string;
  is_passed: boolean;
  started_at: string;
  completed_at?: string;
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('global');

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

  const fetchLeaderboard = async () => {
    try {
      setError(null);
      const auth = getAuthHeaders();

      // Get current user's ID from stored session
      const localUser = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
      let userId = '';
      if (localUser) {
        try {
          const userObj = JSON.parse(localUser);
          userId = userObj.id || userObj.uuid_user || '';
        } catch {}
      }

      // Fetch courses list if not fetched yet
      if (courses.length === 0) {
        try {
          const coursesRes = await apiGet<any>('/api/pembelajaran', {
            token: auth.token,
            headers: auth.headers
          });
          const mapped = Array.isArray(coursesRes) ? coursesRes : (coursesRes?.data || []);
          setCourses(mapped);
        } catch (cErr) {
          console.warn('Failed to load courses:', cErr);
        }
      }

      const isGlobal = selectedCourseId === 'global';
      const path = isGlobal
        ? (userId ? `/api/students/leaderboard?userId=${userId}` : '/api/students/leaderboard')
        : `/api/grades/leaderboard/${selectedCourseId}?userId=${userId}`;

      const [leaderboardRes, gradesRes] = await Promise.all([
        apiGet<any>(path, {
          token: auth.token,
          headers: auth.headers
        }),
        apiGet<any>('/api/grade-center/my-grades', {
          token: auth.token,
          headers: auth.headers
        }).catch(err => {
          console.warn('Gagal memuat grades:', err);
          return [];
        })
      ]);

      if (leaderboardRes?.success && leaderboardRes?.data) {
        if (isGlobal) {
          setData(leaderboardRes.data);
        } else {
          // Map class-level leaderboard to the generic topStudents schema
          const list = Array.isArray(leaderboardRes.data.leaderboard) ? leaderboardRes.data.leaderboard : [];
          const mappedTop: RankedStudent[] = list.map((item: any) => ({
            rank: item.rank,
            id: item.uuid_user,
            full_name: item.user?.full_name || 'Student',
            username: item.user?.username || '',
            avatar_url: item.user?.avatar_url || null,
            final_score: item.final_score,
            status_kelulusan: item.is_passed ? 'Lulus' : 'Tidak Lulus'
          }));
          const currentUser = leaderboardRes.data.currentUser;
          const mappedUser: RankedStudent | null = currentUser ? {
            rank: currentUser.rank,
            id: currentUser.uuid_user,
            full_name: currentUser.user?.full_name || 'Student',
            username: currentUser.user?.username || '',
            avatar_url: currentUser.user?.avatar_url || null,
            final_score: currentUser.final_score,
            status_kelulusan: currentUser.is_passed ? 'Lulus' : 'Tidak Lulus'
          } : null;

          setData({
            topStudents: mappedTop,
            userRank: mappedUser
          });
        }
      } else {
        throw new Error('Format response tidak dikenali');
      }

      const gradesList = Array.isArray(gradesRes) ? gradesRes : (gradesRes?.data ?? []);
      setGrades(gradesList);
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data leaderboard.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedCourseId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLeaderboard();
  };

  const getPodiumBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown size={32} color="#FFD700" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.4))' }} />;
      case 2:
        return <Trophy size={28} color="#C0C0C0" style={{ filter: 'drop-shadow(0 0 6px rgba(192, 192, 192, 0.3))' }} />;
      case 3:
        return <Trophy size={24} color="#CD7F32" style={{ filter: 'drop-shadow(0 0 4px rgba(205, 127, 50, 0.2))' }} />;
      default:
        return null;
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'linear-gradient(135deg, #FF6B6B, #FF8E53)',
      'linear-gradient(135deg, #4E54C8, #8F94FB)',
      'linear-gradient(135deg, #11998E, #38EF7D)',
      'linear-gradient(135deg, #FC466B, #3F5EFB)',
      'linear-gradient(135deg, #F9D423, #FF4E50)',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Top 3 Podium Arrangement
  const podiumStudents = data ? [
    data.topStudents.find(s => s.rank === 2),
    data.topStudents.find(s => s.rank === 1),
    data.topStudents.find(s => s.rank === 3)
  ].filter(Boolean) as RankedStudent[] : [];

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.topHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award size={28} color="var(--azure)" />
            <h1 style={s.title}>Student Leaderboard</h1>
          </div>
          <p style={s.subtitle}>Lihat peringkat 10 besar student Nalara dan pantau posisi belajarmu!</p>
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
            color="#fff" 
            style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} 
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel" style={s.filterRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={15} color="var(--grey-blue)" />
          <select 
            value={selectedCourseId} 
            onChange={e => setSelectedCourseId(e.target.value)} 
            style={s.select}
          >
            <option value="global">Global Leaderboard</option>
            {courses.map((c: any) => (
              <option key={c.uuid_pembelajaran || c.id} value={c.uuid_pembelajaran || c.id}>
                Leaderboard: {c.title || c.nama_pembelajaran}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={s.loadingWrap}>
          <RefreshCw size={36} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ marginTop: 12, color: 'var(--grey-blue)' }}>Memuat Leaderboard...</span>
        </div>
      ) : (
        <div style={s.content}>
          {/* Nilai Saya Section */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', margin: '0 0 16px 0', color: '#fff' }}>Nilai & Riwayat Kuis Saya</h3>
            {grades.length === 0 ? (
              <div className="glass-panel" style={{
                background: 'rgba(25, 25, 25, 0.95)',
                border: '1px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                color: 'var(--grey-blue)',
                fontSize: '0.85rem'
              }}>
                Belum ada kuis yang selesai dikerjakan atau dinilai.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {grades.map((item, i) => (
                  <div key={i} className="glass-panel" style={{
                    background: 'rgba(25, 25, 25, 0.95)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(6,113,224,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Award size={18} color="var(--azure)" />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: 0 }}>{item.quiz.title}</h4>
                          <span style={{ fontSize: '0.72rem', color: 'var(--grey-blue)', display: 'flex', alignItems: 'center', marginTop: '2px' }}>
                            <Clock size={11} style={{ marginRight: '4px' }} />
                            Selesai: {item.completed_at ? new Date(item.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--grey-blue)', textTransform: 'uppercase' }}>Nilai</span>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{item.score}%</div>
                        </div>
                        <div style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '10px',
                          border: '1px solid',
                          background: item.is_passed ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 82, 82, 0.1)',
                          color: item.is_passed ? '#00C853' : '#FF5252',
                          borderColor: item.is_passed ? 'rgba(0, 200, 83, 0.2)' : 'rgba(255, 82, 82, 0.2)',
                        }}>
                          Grade {item.grade_letter}
                        </div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '4px', height: '4px', width: '100%' }}>
                      <div style={{
                        height: '100%',
                        borderRadius: '4px',
                        width: `${Math.min(item.score, 100)}%`,
                        background: item.is_passed ? 'var(--azure)' : '#FF5252',
                        transition: 'width 0.6s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Personal Rank Card Banner */}
          {data?.userRank && (
            <div style={{
              ...s.userRankCard,
              borderLeft: data.userRank.status_kelulusan === "Lulus" ? '4px solid #00C853' : '4px solid #FF3D00'
            }}>
              <div style={s.userRankLeft}>
                <div style={{
                  ...s.rankCircle,
                  background: data.userRank.status_kelulusan === "Lulus" ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 61, 0, 0.1)',
                  color: data.userRank.status_kelulusan === "Lulus" ? '#00C853' : '#FF3D00'
                }}>
                  #{data.userRank.rank}
                </div>
                <div>
                  <h4 style={s.userRankName}>Peringkat Anda</h4>
                  <p style={s.userRankSub}>{data.userRank.full_name} (@{data.userRank.username})</p>
                </div>
              </div>
              
              <div style={s.userRankRight}>
                <div style={s.metricItem}>
                  <span style={s.metricLabel}>Nilai Akhir</span>
                  <span style={s.metricValue}>{data.userRank.final_score}%</span>
                </div>
                <div style={s.metricItem}>
                  <span style={s.metricLabel}>Status Kelulusan</span>
                  <span style={{
                    ...s.statusBadge,
                    background: data.userRank.status_kelulusan === "Lulus" ? 'rgba(0, 200, 83, 0.12)' : 'rgba(255, 61, 0, 0.12)',
                    color: data.userRank.status_kelulusan === "Lulus" ? '#00C853' : '#FF3D00',
                    border: data.userRank.status_kelulusan === "Lulus" ? '1px solid rgba(0, 200, 83, 0.2)' : '1px solid rgba(255, 61, 0, 0.2)'
                  }}>
                    {data.userRank.status_kelulusan === "Lulus" ? (
                      <>
                        <CheckCircle size={12} style={{ marginRight: 4 }} />
                        Lulus
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={12} style={{ marginRight: 4 }} />
                        Tidak Lulus
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Podium for Top 3 */}
          {podiumStudents.length > 0 && (
            <div style={s.podiumContainer}>
              {podiumStudents.map((student) => {
                const isWinner = student.rank === 1;
                const isSecond = student.rank === 2;
                const isThird = student.rank === 3;
                
                // Set custom heights for visual hierarchy
                const height = isWinner ? '220px' : isSecond ? '180px' : '150px';
                
                return (
                  <div key={student.id} style={{
                    ...s.podiumWrapper,
                    order: isSecond ? 1 : isWinner ? 2 : 3 // left, center, right ordering
                  }}>
                    {/* Badge on top */}
                    <div style={s.badgeWrap}>
                      {getPodiumBadge(student.rank)}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      ...s.avatarLarge,
                      background: getAvatarColor(student.full_name),
                      border: isWinner ? '3px solid #FFD700' : isSecond ? '2px solid #C0C0C0' : '2px solid #CD7F32'
                    }}>
                      {student.avatar_url ? (
                        <img src={student.avatar_url} alt={student.full_name} style={s.avatarImg} />
                      ) : (
                        <span>{student.full_name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={s.podiumInfo}>
                      <h3 style={s.podiumName}>{student.full_name}</h3>
                      <p style={s.podiumUsername}>@{student.username}</p>
                    </div>

                    {/* Standing Column */}
                    <div style={{
                      ...s.podiumColumn,
                      height,
                      background: isWinner 
                        ? 'linear-gradient(180deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.02) 100%)' 
                        : isSecond 
                        ? 'linear-gradient(180deg, rgba(192, 192, 192, 0.1) 0%, rgba(192, 192, 192, 0.02) 100%)'
                        : 'linear-gradient(180deg, rgba(205, 127, 50, 0.08) 0%, rgba(205, 127, 50, 0.02) 100%)',
                      border: isWinner 
                        ? '1px solid rgba(255, 215, 0, 0.2)' 
                        : isSecond 
                        ? '1px solid rgba(192, 192, 192, 0.15)'
                        : '1px solid rgba(205, 127, 50, 0.12)',
                    }}>
                      <span style={{
                        ...s.podiumRankText,
                        color: isWinner ? '#FFD700' : isSecond ? '#C0C0C0' : '#CD7F32'
                      }}>
                        {student.rank}
                      </span>
                      <span style={s.podiumScoreText}>
                        {student.final_score}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List for rest of Top 10 */}
          <div style={s.tableContainer} className="glass-panel">
            <h3 style={s.tableTitle}>Top 10 Students</h3>
            <div style={s.tableList}>
              {data?.topStudents.map((student) => (
                <div key={student.id} style={s.tableRow}>
                  <div style={s.rowLeft}>
                    <span style={{
                      ...s.rowRank,
                      color: student.rank === 1 ? '#FFD700' : student.rank === 2 ? '#C0C0C0' : student.rank === 3 ? '#CD7F32' : 'var(--grey-blue)'
                    }}>
                      {student.rank}
                    </span>
                    <div style={{
                      ...s.rowAvatar,
                      background: getAvatarColor(student.full_name)
                    }}>
                      {student.avatar_url ? (
                        <img src={student.avatar_url} alt={student.full_name} style={s.avatarImg} />
                      ) : (
                        <span>{student.full_name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h4 style={s.rowName}>{student.full_name}</h4>
                      <p style={s.rowUsername}>@{student.username}</p>
                    </div>
                  </div>

                  <div style={s.rowRight}>
                    <span style={s.rowScore}>{student.final_score}%</span>
                    <span style={{
                      ...s.statusBadge,
                      background: student.status_kelulusan === "Lulus" ? 'rgba(0, 200, 83, 0.08)' : 'rgba(255, 61, 0, 0.08)',
                      color: student.status_kelulusan === "Lulus" ? '#00C853' : '#FF3D00',
                      border: student.status_kelulusan === "Lulus" ? '1px solid rgba(0, 200, 83, 0.15)' : '1px solid rgba(255, 61, 0, 0.15)'
                    }}>
                      {student.status_kelulusan}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    color: '#fff',
    minHeight: '100vh',
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 18px',
    borderRadius: '10px',
    marginBottom: '20px',
    background: 'rgba(25, 25, 25, 0.95)',
    border: '1px solid var(--border-color)',
    flexWrap: 'wrap',
  },
  select: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#E2E8F0',
    padding: '6px 12px',
    fontSize: '0.85rem',
    outline: 'none',
    cursor: 'pointer',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '1.65rem',
    background: 'linear-gradient(135deg, #fff, #94a3b8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.88rem',
    color: 'var(--grey-blue)',
    marginTop: '4px',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#fff',
    transition: 'background 0.2s',
  },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  userRankCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(25, 25, 25, 0.95)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '16px 20px',
    backdropFilter: 'blur(10px)',
  },
  userRankLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  rankCircle: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '1.1rem',
  },
  userRankName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#fff',
    margin: 0,
  },
  userRankSub: {
    fontSize: '0.8rem',
    color: 'var(--grey-blue)',
    marginTop: '2px',
    margin: 0,
  },
  userRankRight: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: '0.7rem',
    color: 'var(--grey-blue)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metricValue: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#fff',
    marginTop: '2px',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    marginTop: '4px',
  },
  podiumContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: '24px',
    padding: '24px 0',
    background: 'rgba(25, 25, 25, 0.5)',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    backdropFilter: 'blur(10px)',
  },
  podiumWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '180px',
  },
  badgeWrap: {
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  avatarLarge: {
    width: '74px',
    height: '74px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '1.8rem',
    color: '#fff',
    overflow: 'hidden',
    boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  podiumInfo: {
    textAlign: 'center',
    marginTop: '12px',
    marginBottom: '16px',
  },
  podiumName: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: '#fff',
    margin: 0,
  },
  podiumUsername: {
    fontSize: '0.75rem',
    color: 'var(--grey-blue)',
    marginTop: '2px',
    margin: 0,
  },
  podiumColumn: {
    width: '100%',
    borderRadius: '12px 12px 0 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
  },
  podiumRankText: {
    fontSize: '2rem',
    fontWeight: 800,
  },
  podiumScoreText: {
    fontSize: '0.85rem',
    fontWeight: 600,
    opacity: 0.8,
  },
  tableContainer: {
    background: 'rgba(25, 25, 25, 0.95)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '24px',
    backdropFilter: 'blur(10px)',
  },
  tableTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '1.15rem',
    margin: '0 0 16px 0',
  },
  tableList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  tableRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '10px',
    transition: 'transform 0.15s, background 0.15s',
  },
  rowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  rowRank: {
    width: '24px',
    fontWeight: 700,
    fontSize: '0.95rem',
    textAlign: 'center',
  },
  rowAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '0.95rem',
    color: '#fff',
    overflow: 'hidden',
  },
  rowName: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: '#fff',
    margin: 0,
  },
  rowUsername: {
    fontSize: '0.75rem',
    color: 'var(--grey-blue)',
    marginTop: '2px',
    margin: 0,
  },
  rowRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  rowScore: {
    fontSize: '1rem',
    fontWeight: 700,
  },
};
