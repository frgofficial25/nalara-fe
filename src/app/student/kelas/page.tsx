"use client";

import React, { useState, useEffect } from 'react';
import {
  BookOpen, Layers, ChevronRight, Loader2, AlertCircle,
  FileText, Video, FlaskConical, PencilLine, BookOpenCheck,
  Play, Eye, X, Clock
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Course {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  modulesCount?: number;
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
  Reading:   <BookOpenCheck size={14} color="#4196F0" />,
  Video:     <Video size={14} color="#E040FB" />,
  CaseStudy: <FlaskConical size={14} color="#FF9100" />,
  Practice:  <PencilLine size={14} color="#00C853" />,
};
const typeColor: Record<string, { bg: string; text: string }> = {
  Reading:   { bg: 'rgba(65,150,240,0.1)',  text: '#4196F0' },
  Video:     { bg: 'rgba(224,64,251,0.1)',  text: '#E040FB' },
  CaseStudy: { bg: 'rgba(255,145,0,0.1)',   text: '#FF9100' },
  Practice:  { bg: 'rgba(0,200,83,0.1)',    text: '#00C853' },
};

// ═════════════════════════════════════════════════════════════════════════════
export default function StudentKelasPage() {
  const router = useRouter();

  // Nav state: null=course list, id=module list, {course,module}=materi list
  const [view, setView] = useState<'courses' | 'modules' | 'materi'>('courses');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const [courses, setCourses]   = useState<Course[]>([]);
  const [modules, setModules]   = useState<Module[]>([]);
  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // Reading modal
  const [readingModal, setReadingModal] = useState<Materi | null>(null);

  // ── Fetch courses ──────────────────────────────────────────────────────────
  const fetchCourses = async () => {
    try {
      setLoading(true); setError(null);
      const auth = getAuthHeaders();
      const res = await apiGet<any>('/api/pembelajaran', { token: auth.token, headers: auth.headers });
      const list = Array.isArray(res) ? res : (res?.data || []);
      setCourses(list.map((c: any) => ({
        id: c.uuid_pembelajaran || c.id,
        title: c.nama_pembelajaran || c.title || 'Untitled',
        description: c.deskripsi || c.description || '',
        slug: c.slug,
        modulesCount: c.modulesCount || 0,
      })));
    } catch (e: any) { setError(e.message || 'Gagal memuat kelas.'); }
    finally { setLoading(false); }
  };

  // ── Fetch modules for a course ─────────────────────────────────────────────
  const fetchModules = async (courseId: string) => {
    try {
      setLoading(true); setError(null);
      const auth = getAuthHeaders();
      const res = await apiGet<any>(`/api/modul?uuid_pembelajaran=${courseId}`, { token: auth.token, headers: auth.headers });
      const list = Array.isArray(res) ? res : (res?.data || []);
      setModules(list.map((m: any) => ({
        id: m.uuid_modul || m.id,
        uuid_modul: m.uuid_modul || m.id,
        title: m.nama_modul || m.title || 'Modul',
        description: m.deskripsi || m.description || '',
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
      const list = Array.isArray(res) ? res : (res?.data || []);
      setMateriList(list.map((m: any) => ({
        id: m.uuid_materi || m.id,
        uuid_materi: m.uuid_materi || m.id,
        title: m.title || m.nama_materi || 'Materi',
        type: m.type || 'Reading',
        youtube_link: m.youtube_link || '',
        content: m.content,
        slug: m.slug,
      })));
    } catch (e: any) { setError(e.message || 'Gagal memuat materi.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCourses(); }, []);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const openCourse = (course: Course) => {
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
    if (materi.type === 'Video' && materi.youtube_link) {
      window.open(materi.youtube_link, '_blank');
    } else if (materi.type === 'Reading') {
      setReadingModal(materi);
    } else {
      // CaseStudy / Practice — navigate to materi detail
      router.push(`/student/courses/materi?id=${materi.id}`);
    }
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
  const Breadcrumb = () => (
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

      {view !== 'courses' && <Breadcrumb />}

      {error && <div style={s.errorBanner}><AlertCircle size={16} /><span>{error}</span></div>}

      {loading ? (
        <div style={s.centered}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /><p>Memuat...</p></div>
      ) : (
        <>
          {/* ── COURSE LIST ── */}
          {view === 'courses' && (
            <div style={s.grid}>
              {courses.length === 0 ? (
                <div style={s.emptyState}><BookOpen size={48} color="var(--border-color)" /><h3>Belum ada kelas</h3><p>Anda belum terdaftar di kelas manapun.</p></div>
              ) : courses.map(course => (
                <div key={course.id} className="glass-panel" style={s.card} onClick={() => openCourse(course)}>
                  <div style={s.cardIconWrap}>
                    <BookOpen size={22} color="var(--azure)" />
                  </div>
                  <h3 style={s.cardTitle}>{course.title}</h3>
                  <p style={s.cardDesc}>{course.description || 'Klik untuk melihat modul dan materi.'}</p>
                  <div style={s.cardFooter}>
                    <span style={s.footerText}><Layers size={13} /> Lihat Modul</span>
                    <ChevronRight size={16} color="var(--azure)" />
                  </div>
                </div>
              ))}
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
