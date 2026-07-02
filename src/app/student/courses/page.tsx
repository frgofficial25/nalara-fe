"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

interface Course {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  createdAt?: string;
  modulesCount?: number;
}

export default function StudentCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const auth = getAuthHeaders();
      const response = await apiGet<Course[] | { success: boolean; data: Course[] }>('/api/pembelajaran', {
        token: auth.token,
        headers: auth.headers
      });

      let list: Course[] = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        list = response.data;
      }

      const baseCourses = list.map((c: any) => ({
        ...c,
        id: c.uuid_pembelajaran || c.id,
        title: c.nama_pembelajaran || c.title || '',
        description: c.deskripsi || c.description || '',
        createdAt: c.tanggal_dibuat || c.createdAt || c.created_at,
      }));

      // Fetch moduls count for each course
      const coursesWithModules = await Promise.all(baseCourses.map(async (c) => {
        try {
          const modulRes = await apiGet<any[] | { data?: any[] }>(
            `/api/modul`, { token: auth.token, headers: auth.headers }
          );
          const modulList = Array.isArray(modulRes)
            ? modulRes
            : (modulRes as any).data ?? [];
          const filtered = modulList.filter((m: any) => m.uuid_pembelajaran === c.id);
          return {
            ...c,
            modulesCount: filtered.length
          };
        } catch (e) {
          return {
            ...c,
            modulesCount: 0
          };
        }
      }));

      setCourses(coursesWithModules);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar pembelajaran.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h1 style={s.title}>Pembelajaran Saya</h1>
        <p style={s.subtitle}>Pilih kelas untuk mulai belajar dan melihat modul pembelajaran Anda.</p>
      </div>

      {error && (
        <div style={s.errorAlert}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={s.loaderWrap}>
          <Loader2 size={36} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ marginTop: 12, color: 'var(--grey-blue)' }}>Memuat daftar kelas...</span>
        </div>
      ) : courses.length === 0 ? (
        <div style={s.emptyState}>
          <BookOpen size={48} color="var(--grey)" />
          <h3 style={{ marginTop: 16, color: '#fff', fontSize: '1.05rem' }}>Belum terdaftar di kelas</h3>
          <p style={{ color: 'var(--grey-blue)', fontSize: '0.85rem' }}>Anda belum terdaftar di kelas manapun saat ini.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {courses.map((course) => (
            <div 
              key={course.id} 
              style={s.card} 
              className="glass-panel hover-card"
              onClick={() => router.push(`/student/courses/detail?id=${course.id}`)}
            >
              <div style={s.cardBody}>
                <div style={s.iconWrapper}>
                  <BookOpen size={20} color="var(--azure)" />
                </div>
                <h3 style={s.courseTitle}>{course.title}</h3>
                <p style={s.courseDesc}>{course.description || 'Tidak ada deskripsi.'}</p>
              </div>

              <div style={s.cardFooter}>
                <span style={s.modulesCount}>📦 {course.modulesCount || 0} Modul</span>
                <span style={s.learnBtn}>
                  Mulai Belajar
                  <ChevronRight size={14} style={{ marginLeft: 2 }} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.01) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
        }
        .hover-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .hover-card:hover {
          transform: translateY(-4px);
          border-color: rgba(65, 150, 240, 0.3) !important;
          background: rgba(255, 255, 255, 0.02) !important;
        }
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    padding: '4px 0',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--grey-blue)',
    marginTop: 4,
    margin: 0,
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(244, 67, 54, 0.08)',
    border: '1px solid rgba(244, 67, 54, 0.2)',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#FF5252',
    fontSize: '0.82rem',
    marginBottom: 20,
  },
  loaderWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px dashed rgba(255,255,255,0.08)',
    borderRadius: 14,
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 24,
  },
  card: {
    borderRadius: 14,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 210,
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'rgba(65, 150, 240, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  courseTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#fff',
    margin: '0 0 8px 0',
    lineHeight: 1.35,
  },
  courseDesc: {
    fontSize: '0.82rem',
    color: 'var(--grey-blue)',
    lineHeight: 1.5,
    margin: 0,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: 16,
    marginTop: 16,
  },
  modulesCount: {
    fontSize: '0.78rem',
    color: 'var(--grey-blue)',
    fontWeight: 500,
  },
  learnBtn: {
    fontSize: '0.78rem',
    color: 'var(--azure)',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
  },
};
