/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import {
  BookOpen, Layers, ChevronRight, Loader2, AlertCircle,
  FileText, Video, FlaskConical, PencilLine, BookOpenCheck,
  Play, Eye, X, Clock, Award, Download
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchCertificateSettings, downloadCertificate, fetchGraduationStatus } from '@/hooks/useCertificate';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Course {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  modulesCount?: number;
  prerequisite_uuid?: string | null;
  prerequisite_name?: string | null;
  prerequisite_passed?: boolean | null; // null = no prerequisite, false = not passed, true = passed
  is_passed?: boolean;
  has_higher_passed?: boolean;
}
interface Module {
  id: string;
  uuid_modul: string;
  title: string;
  description?: string;
  difficulty?: string;
  uuid_pembelajaran: string;
  materiCount?: number;
}
interface Materi {
  id: string;
  uuid_materi?: string;
  title: string;
  type: 'Reading' | 'Video' | 'CaseStudy' | 'Practice';
  youtube_link?: string;
  file_url?: string;
  file_format?: string;
  content?: any;
  slug?: string;
}

function getAuthHeaders() {
  const token = getStoredToken();
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) headers['x-api-key'] = apiKey;
  else if (token) headers['x-api-key'] = token;
  return { token: token || undefined, headers };
}

const typeIcon: Record<string, React.ReactNode> = {
  Reading: <BookOpenCheck size={14} color="#4196F0" />,
  Video: <Video size={14} color="#E040FB" />,
  CaseStudy: <FlaskConical size={14} color="#FF9100" />,
  Practice: <PencilLine size={14} color="#00C853" />,
};
const typeColor: Record<string, { bg: string; text: string }> = {
  Reading: { bg: 'rgba(65,150,240,0.1)', text: '#4196F0' },
  Video: { bg: 'rgba(224,64,251,0.1)', text: '#E040FB' },
  CaseStudy: { bg: 'rgba(255,145,0,0.1)', text: '#FF9100' },
  Practice: { bg: 'rgba(0,200,83,0.1)', text: '#00C853' },
};

// ═════════════════════════════════════════════════════════════════════════════
function StudentKelasPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Nav state: null=course list, id=module list, {course,module}=materi list
  const [view, setView] = useState<'courses' | 'modules' | 'materi'>(() => {
    const courseId = searchParams.get('courseId');
    const modulId = searchParams.get('modulId');
    if (courseId && modulId) return 'materi';
    if (courseId) return 'modules';
    return 'courses';
  });
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reading modal
  const [readingModal, setReadingModal] = useState<Materi | null>(null);

  // Certificate download state
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);
  const [certError, setCertError] = useState<string | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getUserId = () => {
    const raw = typeof window !== 'undefined' ? (localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info') || '') : '';
    try {
      const p = JSON.parse(raw);
      return p.id || p.uuid_user || '';
    } catch {
      return '';
    }
  };

  const getUserFullName = () => {
    const raw = typeof window !== 'undefined' ? (localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info') || '') : '';
    try {
      const p = JSON.parse(raw);
      return p.full_name || p.name || p.username || 'Siswa';
    } catch {
      return 'Siswa';
    }
  };

  const handleDownloadCertificate = async (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    if (course.prerequisite_passed === false) return;
    setCertError(null);
    setDownloadingCertId(course.id);
    try {
      const settings = await fetchCertificateSettings(course.id);
      if (!settings || !settings.certificate_template_url) {
        setCertError('Template sertifikat belum dikonfigurasi untuk kelas ini.');
        setTimeout(() => setCertError(null), 4000);
        setDownloadingCertId(null);
        return;
      }
      const fullName = getUserFullName();
      const userId = getUserId();
      console.log('useCertificate debug: fullName =', fullName, 'userId =', userId);
      let certCode = undefined;
      if (userId) {
        console.log('useCertificate debug: calling fetchGraduationStatus for course =', course.id);
        const grad = await fetchGraduationStatus(course.id, userId);
        console.log('useCertificate debug: fetchGraduationStatus result =', grad);
        if (grad && grad.certificate_code) {
          certCode = grad.certificate_code;
        }
      }
      console.log('useCertificate debug: certCode to pass =', certCode);
      const safeCourse = course.title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      const safeName = fullName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      await downloadCertificate(settings, fullName, `Sertifikat_${safeCourse}_${safeName}.png`, certCode);
    } catch (err: any) {
      setCertError(err.message || 'Gagal mengunduh sertifikat.');
      setTimeout(() => setCertError(null), 5000);
    } finally {
      setDownloadingCertId(null);
    }
  };

  const getLocalPrerequisiteStatus = (prereqUuid: string | null | undefined): boolean | null => {
    if (!prereqUuid) return null;
    const userId = getUserId();
    if (!userId) return null;
    try {
      const localMetaStr = localStorage.getItem('nalara_kelulusan_meta');
      if (localMetaStr) {
        const localMeta = JSON.parse(localMetaStr);
        const metaKey = `${prereqUuid}_${userId}`;
        if (localMeta[metaKey] && localMeta[metaKey].status) {
          return localMeta[metaKey].status === 'Lulus';
        }
      }
    } catch (e) {
      console.warn('Failed to read local graduation meta in Kelas page:', e);
    }
    return null;
  };

  // ── Fetch courses ──────────────────────────────────────────────────────────
  const fetchCourses = async () => {
    try {
      setLoading(true); setError(null);
      const auth = getAuthHeaders();
      const res = await apiGet<any>('/api/pembelajaran', { token: auth.token, headers: auth.headers });
      const list = Array.isArray(res) ? res : (res?.data || []);
      setCourses(list.map((c: any) => {
        const prereqUuid = c.prerequisite_uuid ?? null;
        let prereqPassed = c.prerequisite_passed ?? null;
        const localPassed = getLocalPrerequisiteStatus(prereqUuid);
        if (localPassed !== null) {
          prereqPassed = localPassed;
        }
        return {
          id: c.uuid_pembelajaran || c.id,
          title: c.nama_pembelajaran || c.title || 'Untitled',
          description: c.deskripsi || c.description || '',
          slug: c.slug,
          modulesCount: c.modulesCount || 0,
          prerequisite_uuid: prereqUuid,
          prerequisite_name: c.prerequisite_name ?? null,
          prerequisite_passed: prereqPassed,
          is_passed: c.is_passed,
          has_higher_passed: c.has_higher_passed,
        };
      }));
    } catch (e: any) { setError(e.message || 'Gagal memuat kelas.'); }
    finally { setLoading(false); }
  };

  // ── Fetch modules for a course ─────────────────────────────────────────────
  const fetchModules = async (courseId: string) => {
    try {
      setLoading(true); setError(null);
      const auth = getAuthHeaders();
      const res = await apiGet<any>(`/api/modul?uuid_pembelajaran=${courseId}`, { token: auth.token, headers: auth.headers });
      const rawList = Array.isArray(res) ? res : (res?.data || []);
      // Filter di sisi klien sebagai jaminan — server lama mungkin belum support filter query
      const list = rawList.filter((m: any) =>
        !m.uuid_pembelajaran || m.uuid_pembelajaran === courseId
      );
      setModules(list.map((m: any) => ({
        id: m.uuid_modul || m.id,
        uuid_modul: m.uuid_modul || m.id,
        title: m.title || m.nama_modul || 'Modul',
        description: m.description || m.deskripsi || '',
        difficulty: m.difficulty || '',
        uuid_pembelajaran: m.uuid_pembelajaran || courseId,
      })));
    } catch (e: any) { setError(e.message || 'Gagal memuat modul.'); }
    finally { setLoading(false); }
  };

  // ── Fetch materi for a module ──────────────────────────────────────────────
  const fetchMateri = async (moduleId: string) => {
    try {
      setLoading(true); setError(null);
      const auth = getAuthHeaders();
      const res = await apiGet<any>(`/api/materi?uuid_modul=${moduleId}`, { token: auth.token, headers: auth.headers });
      // Backend: { success, data: { materi: [...], nama_modul, ... } }
      // Fallback ke flat array jika backend lama
      let list: any[] = [];
      if (res?.data?.materi && Array.isArray(res.data.materi)) {
        list = res.data.materi;
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      } else if (Array.isArray(res)) {
        list = res;
      }
      setMateriList(list.map((m: any) => ({
        id: m.id || m.uuid_materi,
        uuid_materi: m.id || m.uuid_materi,
        title: m.nama_materi || m.title || 'Materi',
        type: m.tipe || m.type || 'Reading',
        youtube_link: m.video_url || m.youtube_link || '',
        file_url: m.file?.url || m.file?.preview_url || m.file_url || '',
        file_format: m.file?.format_file || m.file_format || '',
        content: m.content,
        slug: m.slug,
      })));
    } catch (e: any) { setError(e.message || 'Gagal memuat materi.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true);
        setError(null);
        const auth = getAuthHeaders();

        // 1. Fetch courses list
        const coursesRes = await apiGet<any>('/api/pembelajaran', { token: auth.token, headers: auth.headers });
        const coursesList = Array.isArray(coursesRes) ? coursesRes : (coursesRes?.data || []);
        const mappedCourses = coursesList.map((c: any) => {
          const prereqUuid = c.prerequisite_uuid ?? null;
          let prereqPassed = c.prerequisite_passed ?? null;
          const localPassed = getLocalPrerequisiteStatus(prereqUuid);
          if (localPassed !== null) {
            prereqPassed = localPassed;
          }
          return {
            id: c.uuid_pembelajaran || c.id,
            title: c.nama_pembelajaran || c.title || 'Untitled',
            description: c.deskripsi || c.description || '',
            slug: c.slug,
            modulesCount: c.modulesCount || 0,
            prerequisite_uuid: prereqUuid,
            prerequisite_name: c.prerequisite_name ?? null,
            prerequisite_passed: prereqPassed,
            is_passed: c.is_passed,
            has_higher_passed: c.has_higher_passed,
          };
        });
        setCourses(mappedCourses);

        const paramCourseId = searchParams.get('courseId');
        const paramModulId = searchParams.get('modulId');

        if (paramCourseId) {
          const course = mappedCourses.find((c: any) => c.id === paramCourseId);
          if (course) {
            setSelectedCourse(course);

            // 2. Fetch modules list
            const modulesRes = await apiGet<any>(`/api/modul?uuid_pembelajaran=${course.id}`, { token: auth.token, headers: auth.headers });
            const modulesRaw = Array.isArray(modulesRes) ? modulesRes : (modulesRes?.data || []);
            const modulesList = modulesRaw.filter((m: any) => !m.uuid_pembelajaran || m.uuid_pembelajaran === course.id).map((m: any) => ({
              id: m.uuid_modul || m.id,
              uuid_modul: m.uuid_modul || m.id,
              title: m.title || m.nama_modul || 'Modul',
              description: m.description || m.deskripsi || '',
              difficulty: m.difficulty || '',
              uuid_pembelajaran: m.uuid_pembelajaran || course.id,
            }));
            setModules(modulesList);

            if (paramModulId) {
              const mod = modulesList.find((m: any) => m.id === paramModulId);
              if (mod) {
                setSelectedModule(mod);
                // 3. Fetch materials list
                const materiRes = await apiGet<any>(`/api/materi?uuid_modul=${mod.uuid_modul}`, { token: auth.token, headers: auth.headers });
                let list: any[] = [];
                if (materiRes?.data?.materi && Array.isArray(materiRes.data.materi)) {
                  list = materiRes.data.materi;
                } else if (Array.isArray(materiRes?.data)) {
                  list = materiRes.data;
                } else if (Array.isArray(materiRes)) {
                  list = materiRes;
                }
                setMateriList(list.map((m: any) => ({
                  id: m.id || m.uuid_materi,
                  uuid_materi: m.id || m.uuid_materi,
                  title: m.nama_materi || m.title || 'Materi',
                  type: m.tipe || m.type || 'Reading',
                  youtube_link: m.video_url || m.youtube_link || '',
                  file_url: m.file?.url || m.file?.preview_url || m.file_url || '',
                  file_format: m.file?.format_file || m.file_format || '',
                  content: m.content,
                  slug: m.slug,
                })));
              } else {
                setView('modules');
              }
            }
          } else {
            setView('courses');
          }
        } else {
          setView('courses');
        }
      } catch (e: any) {
        setError(e.message || 'Gagal memuat data kelas.');
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [searchParams]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const openCourse = (course: Course) => {
    // Blokir akses jika prerequisite belum terpenuhi
    if (course.prerequisite_passed === false) return;
    setSelectedCourse(course);
    setView('modules');
    fetchModules(course.id);
  };

  const openModule = (mod: Module) => {
    setSelectedModule(mod);
    setView('materi');
    fetchMateri(mod.uuid_modul);
  };

  const openMateri = (materi: Materi) => {
    const courseId = selectedCourse?.id || '';
    const modulId = selectedModule?.uuid_modul || selectedModule?.id || '';
    // Semua tipe materi (termasuk Video YouTube) → navigasi ke halaman detail
    router.push(`/student/kelas/materi?courseId=${courseId}&tugasId=${materi.id}&modulId=${modulId}`);
  };

  const goBack = () => {
    if (view === 'materi') {
      setView('modules');
      setSelectedModule(null);
    } else if (view === 'modules') {
      setView('courses');
      setSelectedCourse(null);
    }
  };

  // ── Breadcrumb ─────────────────────────────────────────────────────────────
  const renderBreadcrumb = () => (
    <div style={s.breadcrumb}>
      <button onClick={() => { setView('courses'); setSelectedCourse(null); setSelectedModule(null); }} style={s.bcItem}>
        Kelas
      </button>
      {selectedCourse && (
        <>
          <ChevronRight size={14} color="var(--grey-blue)" />
          <button onClick={() => { setView('modules'); setSelectedModule(null); fetchModules(selectedCourse.id); }} style={s.bcItem}>
            {selectedCourse.title}
          </button>
        </>
      )}
      {selectedModule && (
        <>
          <ChevronRight size={14} color="var(--grey-blue)" />
          <span style={{ ...s.bcItem, color: '#fff', cursor: 'default' }}>{selectedModule.title}</span>
        </>
      )}
    </div>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Kelas</h1>
          <p style={s.pageSubtitle}>Jelajahi materi kursus dan pelajari konten pembelajaran Anda</p>
        </div>
      </div>

      {view !== 'courses' && renderBreadcrumb()}

      {error && <div style={s.errorBanner}><AlertCircle size={16} /><span>{error}</span></div>}

      {/* Certificate error banner */}
      {certError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8, padding: '10px 16px', color: '#EF4444', marginBottom: 16, fontSize: '0.85rem'
        }}>
          <AlertCircle size={16} />
          <span>{certError}</span>
        </div>
      )}

      {loading ? (
        <div style={s.centered}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /><p>Memuat...</p></div>
      ) : (
        <>
          {/* ── COURSE LIST ── */}
          {view === 'courses' && (
            <div style={s.grid}>
              {courses.length === 0 ? (
                <div style={s.emptyState}><BookOpen size={48} color="var(--border-color)" /><h3>Belum ada kelas</h3><p>Anda belum terdaftar di kelas manapun.</p></div>
              ) : (() => {
                const getLevelScore = (title: string): number => {
                  const t = title.toLowerCase();
                  if (t.includes('lanjut') || t.includes('advance')) return 3;
                  if (t.includes('menengah') || t.includes('intermediate')) return 2;
                  if (t.includes('dasar') || t.includes('foundation')) return 1;
                  return 0;
                };
                const passedLevels = courses.filter(c => c.is_passed === true).map(c => getLevelScore(c.title));
                const getIsUnlocked = (courseTitle: string): boolean => {
                  const lvl = getLevelScore(courseTitle);
                  if (lvl <= 1) return true;
                  if (lvl === 2) return passedLevels.includes(1);
                  if (lvl === 3) return passedLevels.includes(2);
                  return false;
                };
                const maxUnlockedLevel = Math.max(
                  ...courses.filter(c => getIsUnlocked(c.title)).map(c => getLevelScore(c.title)),
                  0
                );
                return courses.map(course => {
                  const isLocked = !getIsUnlocked(course.title);
                  const isHighestUnlocked = !isLocked && getLevelScore(course.title) === maxUnlockedLevel;
                return (
                  <div
                    key={course.id}
                    className="glass-panel"
                    style={{
                      ...s.card,
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      opacity: isLocked ? 0.7 : 1,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onClick={() => openCourse(course)}
                  >
                    {/* Lock overlay badge */}
                    {isLocked && (
                      <div style={{
                        position: 'absolute', top: 10, right: 10,
                        background: 'rgba(239,68,68,0.15)',
                        border: '1px solid rgba(239,68,68,0.35)',
                        borderRadius: 6, padding: '3px 8px',
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: '0.65rem', fontWeight: 700, color: '#FF5252',
                        letterSpacing: '0.04em'
                      }}>
                        🔒 TERKUNCI
                      </div>
                    )}
                    <div style={s.cardIconWrap}>
                      <BookOpen size={22} color={isLocked ? '#888' : 'var(--azure)'} />
                    </div>
                    <h3 style={{ ...s.cardTitle, color: isLocked ? 'var(--grey-blue)' : undefined }}>{course.title}</h3>
                    {isLocked ? (
                      <p style={{ ...s.cardDesc, color: '#FF5252', fontSize: '0.8rem' }}>
                        {/* ⚠️ Selesaikan dan lulus <strong>{course.prerequisite_name || 'kelas sebelumnya'}</strong> terlebih dahulu untuk membuka kelas ini. */}
                      </p>
                    ) : (
                      <p style={s.cardDesc}>{course.description || 'Klik untuk melihat modul dan materi.'}</p>
                    )}
                    <div style={s.cardFooter}>
                      <span style={{ ...s.footerText, color: isLocked ? '#888' : undefined }}>
                        {isLocked ? '🔒 Perlu Lulus Prasyarat' : <><Layers size={13} /> Lihat Modul</>}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {!isLocked && isHighestUnlocked && (
                          <button
                            onClick={(e) => handleDownloadCertificate(course, e)}
                            disabled={downloadingCertId === course.id}
                            title="Unduh Sertifikat"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '5px 10px', borderRadius: 7,
                              background: downloadingCertId === course.id
                                ? 'rgba(96,113,240,0.1)'
                                : 'rgba(96,113,240,0.12)',
                              border: '1px solid rgba(96,113,240,0.3)',
                              color: '#8B9CF8', fontSize: '0.72rem', fontWeight: 700,
                              cursor: downloadingCertId === course.id ? 'wait' : 'pointer',
                              letterSpacing: '0.02em',
                            }}
                          >
                            {downloadingCertId === course.id
                              ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                              : <Award size={11} />}
                            Sertifikat
                          </button>
                        )}
                        {!isLocked && <ChevronRight size={16} color="var(--azure)" />}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
            </div>
          )}

          {/* ── MODULE LIST ── */}
          {view === 'modules' && (
            <>
              <div style={s.sectionTitle}>Modul di "{selectedCourse?.title}"</div>
              {modules.length === 0 ? (
                <div style={s.emptyState}><Layers size={48} color="var(--border-color)" /><h3>Belum ada modul</h3><p>Modul akan ditambahkan oleh dosen.</p></div>
              ) : (
                <div style={s.grid}>
                  {modules.map((mod, idx) => (
                    <div key={mod.id} className="glass-panel" style={s.card} onClick={() => openModule(mod)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={s.moduleNum}>{String(idx + 1).padStart(2, '0')}</div>
                        {mod.difficulty && (
                          <span style={{ ...s.diffBadge, background: mod.difficulty === 'Hard' ? 'rgba(255,82,82,0.1)' : mod.difficulty === 'Medium' ? 'rgba(255,178,64,0.1)' : 'rgba(0,200,83,0.1)', color: mod.difficulty === 'Hard' ? '#FF5252' : mod.difficulty === 'Medium' ? '#FFB240' : '#00C853' }}>
                            {mod.difficulty}
                          </span>
                        )}
                      </div>
                      <h3 style={s.cardTitle}>{mod.title}</h3>
                      <p style={s.cardDesc}>{mod.description || 'Klik untuk melihat materi.'}</p>
                      <div style={s.cardFooter}>
                        <span style={s.footerText}><FileText size={13} /> Lihat Materi</span>
                        <ChevronRight size={16} color="var(--azure)" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── MATERI LIST ── */}
          {view === 'materi' && (
            <>
              <div style={s.sectionTitle}>Materi di "{selectedModule?.title}"</div>
              {materiList.length === 0 ? (
                <div style={s.emptyState}><FileText size={48} color="var(--border-color)" /><h3>Belum ada materi</h3><p>Materi akan ditambahkan oleh dosen.</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {materiList.map((materi, idx) => {
                    const tc = typeColor[materi.type] || typeColor.Reading;
                    return (
                      <div key={materi.id} className="glass-panel" style={s.materiRow} onClick={() => openMateri(materi)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                          <div style={s.materiNum}>{String(idx + 1).padStart(2, '0')}</div>
                          <div style={{ ...s.typeIconBox, background: tc.bg }}>
                            {typeIcon[materi.type] || typeIcon.Reading}
                          </div>
                          <div>
                            <h4 style={s.materiTitle}>{materi.title}</h4>
                            <span style={{ ...s.typeBadge, color: tc.text }}>{materi.type}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--azure)' }}>
                          {materi.type === 'Video' ? <Play size={15} /> : <Eye size={15} />}
                          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                            {materi.type === 'Video' ? 'Tonton' : 'Baca'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Reading Modal */}
      {readingModal && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, maxWidth: 700 }} className="glass-panel">
            <div style={s.modalHead}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{readingModal.title}</h3>
              <button onClick={() => setReadingModal(null)} style={s.closeBtn}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: '65vh' }}>
              {readingModal.content ? (
                <div style={{ color: '#CBD5E1', lineHeight: 1.8, fontSize: '0.92rem', whiteSpace: 'pre-wrap' }}>
                  {typeof readingModal.content === 'string'
                    ? readingModal.content
                    : readingModal.content?.content?.map((block: any) => block?.content?.map((node: any) => node.text).join('')).join('\n\n') || JSON.stringify(readingModal.content, null, 2)
                  }
                </div>
              ) : (
                <p style={{ color: 'var(--grey-blue)' }}>Konten materi tidak tersedia.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { padding: '4px 0', color: '#E2E8F0' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontSize: '1.75rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', margin: 0 },
  pageSubtitle: { fontSize: '0.85rem', color: 'var(--grey-blue)', marginTop: 4, margin: 0 },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: '0.85rem' },
  bcItem: { background: 'none', border: 'none', color: 'var(--azure)', cursor: 'pointer', fontWeight: 500, padding: 0, fontSize: '0.85rem' },
  sectionTitle: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--grey-blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 },
  errorBanner: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 16px', color: '#EF4444', marginBottom: 16 },
  centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--grey-blue)', gap: 12 },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.08)', borderRadius: 14, gridColumn: '1 / -1' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 },
  card: { borderRadius: 14, padding: 22, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, transition: 'transform 0.15s ease', userSelect: 'none' },
  cardIconWrap: { width: 44, height: 44, borderRadius: 12, background: 'rgba(6,113,224,0.1)', border: '1px solid rgba(6,113,224,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 },
  cardDesc: { fontSize: '0.83rem', color: 'var(--grey-blue)', margin: 0, lineHeight: 1.5, flexGrow: 1 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4 },
  footerText: { display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--grey-blue)', fontWeight: 600 },
  moduleNum: { fontSize: '1.5rem', fontWeight: 800, color: 'rgba(6,113,224,0.4)', fontFamily: 'var(--font-display)', lineHeight: 1 },
  diffBadge: { fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10 },
  materiRow: { borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.12s ease' },
  materiNum: { fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', minWidth: 26 },
  typeIconBox: { width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  materiTitle: { margin: '0 0 3px', fontSize: '0.92rem', fontWeight: 600, color: '#fff' },
  typeBadge: { fontSize: '0.72rem', fontWeight: 600 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 },
  modal: { width: '100%', maxWidth: 580, maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: 16 },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--grey-blue)', cursor: 'pointer' },
};

export default function StudentKelasPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--grey-blue)', fontFamily: 'sans-serif' }}>
        Memuat Halaman Kelas...
      </div>
    }>
      <StudentKelasPageInner />
    </Suspense>
  );
}
