"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Loader2, AlertCircle, ChevronRight, Video,
  BookOpenCheck, FlaskConical, PencilLine, ArrowLeft, Layers,
  Brain
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

interface Pembelajaran {
  id: string;
  title: string;
  description?: string;
  nama_pembelajaran?: string;
  deskripsi?: string;
}

interface Modul {
  id: string;
  uuid_modul?: string;
  uuid_pembelajaran?: string;
  title: string;
  description?: string;
  difficulty?: string;
}

interface Tugas {
  id: string;
  uuid_tugas?: string;
  title: string;
  type: 'Reading' | 'Video' | 'CaseStudy' | 'Practice';
}

export default function CourseDetailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('id') || '';

  const [course, setCourse] = useState<Pembelajaran | null>(null);
  const [moduls, setModuls] = useState<Modul[]>([]);
  const [tugasMap, setTugasMap] = useState<Record<string, Tugas[]>>({});
  const [quizMap, setQuizMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuth = () => {
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

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const auth = getAuth();
      const opts = { token: auth.token, headers: auth.headers };

      // Fetch course detail
      const courseRes = await apiGet<any>(
        `/api/pembelajaran/${courseId}`, opts
      );
      const rawCourse = (courseRes && 'data' in courseRes && courseRes.data) ? courseRes.data : courseRes;
      const courseData: Pembelajaran = {
        ...rawCourse,
        id: rawCourse.uuid_pembelajaran || rawCourse.id,
        title: rawCourse.nama_pembelajaran || rawCourse.title || '',
        description: rawCourse.deskripsi || rawCourse.description || '',
      };
      setCourse(courseData);

      // Fetch moduls for this course
      const modulRes = await apiGet<any>(
        `/api/modul?uuid_pembelajaran=${courseId}`, opts
      );
      let modulList: Modul[] = Array.isArray(modulRes)
        ? modulRes
        : (modulRes as any).data ?? [];
      modulList = modulList
        .filter(m => m.uuid_pembelajaran === courseId)
        .map(m => ({ ...m, id: m.uuid_modul || m.id }));
      setModuls(modulList);

      // Fetch tugas for each modul
      const newTugasMap: Record<string, Tugas[]> = {};
      const newQuizMap: Record<string, any[]> = {};
      await Promise.all(
        modulList.map(async (m) => {
          const tugasRes = await apiGet<any>(
            `/api/materi?uuid_modul=${m.id}`, opts
          );
          let rawList: any[] = [];
          if (tugasRes && tugasRes.data && Array.isArray(tugasRes.data.materi)) {
            rawList = tugasRes.data.materi;
          } else if (Array.isArray(tugasRes)) {
            rawList = tugasRes;
          } else if (tugasRes && 'data' in tugasRes && Array.isArray(tugasRes.data)) {
            rawList = tugasRes.data;
          }

          const tugasList: Tugas[] = rawList.map((t: any) => ({
            id: t.uuid_tugas || t.id,
            title: t.nama_materi || t.title || '',
            type: t.tipe || t.type || 'Reading',
            file_url: t.file?.url || t.file_url || '',
            order: t.nomor_urut || t.order,
            createdAt: t.tanggal_dibuat || t.createdAt
          }));
          newTugasMap[m.id] = tugasList;

          try {
            const quizRes = await apiGet<any>(
              `/api/quiz?uuid_pembelajaran=${courseId}&uuid_modul=${m.id}`, opts
            );
            let quizList: any[] = Array.isArray(quizRes)
              ? quizRes
              : (quizRes as any).data ?? [];
            newQuizMap[m.id] = quizList;
          } catch (err) {
            console.error(`Failed to fetch quiz for module ${m.id}:`, err);
            newQuizMap[m.id] = [];
          }
        })
      );
      setTugasMap(newTugasMap);
      setQuizMap(newQuizMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail kelas.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const typeIcons: Record<Tugas['type'], React.ReactNode> = {
    Reading: <BookOpenCheck size={16} color="#4196F0" />,
    Video: <Video size={16} color="#E040FB" />,
    CaseStudy: <FlaskConical size={16} color="#FF9100" />,
    Practice: <PencilLine size={16} color="#00C853" />,
  };

  const typeLabels: Record<Tugas['type'], string> = {
    Reading: 'Bacaan',
    Video: 'Video',
    CaseStudy: 'Case Study',
    Practice: 'Practice',
  };

  const handleTugasClick = (tugas: Tugas) => {
    if (tugas.type === 'CaseStudy' || tugas.type === 'Practice') {
      router.push('/student/study-case-submissions');
    } else {
      router.push(`/student/courses/materi?courseId=${courseId}&tugasId=${tugas.id}`);
    }
  };

  return (
    <div style={s.container}>
      <button onClick={() => router.push('/student/courses')} style={s.backBtn}>
        <ArrowLeft size={16} />
        <span>Kembali ke Kelas</span>
      </button>

      {error && (
        <div style={s.errorAlert}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={s.loaderWrap}>
          <Loader2 size={36} color="var(--azure)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ marginTop: 12, color: 'var(--grey-blue)' }}>Memuat materi kelas...</span>
        </div>
      ) : (
        <>
          {course && (
            <div style={s.courseHeader} className="glass-panel">
              <div style={s.iconBox}>
                <BookOpen size={24} color="var(--azure)" />
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={s.courseTitle}>{course.title}</h1>
                <p style={s.courseDesc}>{course.description || 'Tidak ada deskripsi.'}</p>
              </div>
            </div>
          )}

          <h2 style={s.sectionTitle}>Modul Pembelajaran</h2>

          {moduls.length === 0 ? (
            <div style={s.emptyState}>
              <Layers size={40} color="var(--grey)" />
              <p style={{ color: 'var(--grey-blue)', fontSize: '0.88rem', marginTop: 12 }}>Belum ada modul yang tersedia di kelas ini.</p>
            </div>
          ) : (
            <div style={s.modulList}>
              {moduls.map((modul) => {
                const tugasList = tugasMap[modul.id] || [];
                return (
                  <div key={modul.id} style={s.modulCard} className="glass-panel">
                    <div style={s.modulHeader}>
                      <div>
                        <h3 style={s.modulTitle}>{modul.title}</h3>
                        <p style={s.modulDesc}>{modul.description || 'Tidak ada deskripsi modul.'}</p>
                      </div>
                      {modul.difficulty && (
                        <span style={s.difficultyBadge}>{modul.difficulty}</span>
                      )}
                    </div>

                    <div style={s.materiList}>
                      {tugasList.length === 0 && (quizMap[modul.id] || []).length === 0 ? (
                        <p style={s.noMateri}>Belum ada materi atau tugas di modul ini.</p>
                      ) : (
                        <>
                          {tugasList.map((t) => (
                            <div
                              key={t.id}
                              style={s.materiItem}
                              onClick={() => handleTugasClick(t)}
                              className="materi-item-hover"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {typeIcons[t.type]}
                                <span style={s.materiTitle}>{t.title}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={s.materiType}>{typeLabels[t.type]}</span>
                                <ChevronRight size={14} color="var(--grey-blue)" />
                              </div>
                            </div>
                          ))}

                          {(quizMap[modul.id] || []).map((q: any) => (
                            <div
                              key={q.uuid_quiz || q.id}
                              style={s.materiItem}
                              onClick={() => router.push(`/quiz?id=${q.uuid_quiz || q.id}&courseId=${courseId}`)}
                              className="materi-item-hover"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Brain size={16} color="#FFD700" />
                                <span style={s.materiTitle}>{q.nama_quiz || q.title || 'Kuis'}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ ...s.materiType, color: '#FFD700' }}>Kuis ({q.rasio_pengerjaan || '0.00%'})</span>
                                <ChevronRight size={14} color="var(--grey-blue)" />
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
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
        }
        .materi-item-hover {
          transition: all 0.2s;
          cursor: pointer;
        }
        .materi-item-hover:hover {
          background: rgba(255, 255, 255, 0.03);
          padding-left: 14px;
        }
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    padding: '4px 0',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'none',
    border: 'none',
    color: 'var(--grey-blue)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 20,
    padding: 0,
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
  courseHeader: {
    padding: 24,
    borderRadius: 14,
    display: 'flex',
    gap: 20,
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: 'rgba(65, 150, 240, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseTitle: {
    fontSize: '1.45rem',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  courseDesc: {
    fontSize: '0.86rem',
    color: 'var(--grey-blue)',
    marginTop: 6,
    margin: 0,
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#fff',
    marginBottom: 16,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 0',
  },
  modulList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  modulCard: {
    borderRadius: 14,
    padding: 20,
  },
  modulHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 14,
    marginBottom: 14,
  },
  modulTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  modulDesc: {
    fontSize: '0.8rem',
    color: 'var(--grey-blue)',
    marginTop: 4,
    margin: 0,
  },
  difficultyBadge: {
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.05)',
    color: '#cbd5e1',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  materiList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  noMateri: {
    fontSize: '0.78rem',
    color: 'var(--grey-blue)',
    margin: 0,
    fontStyle: 'italic',
  },
  materiItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    padding: '10px 12px',
  },
  materiTitle: {
    fontSize: '0.85rem',
    color: '#fff',
    fontWeight: 500,
  },
  materiType: {
    fontSize: '0.72rem',
    color: 'var(--grey-blue)',
    fontWeight: 500,
  },
};
