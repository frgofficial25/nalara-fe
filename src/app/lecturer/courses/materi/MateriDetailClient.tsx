"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, ChevronRight, FileText, Download, Eye, Loader2,
  AlertCircle, BookOpen, Video, BookMarked, FlaskConical
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

interface TugasDetail {
  id: string;
  uuid_tugas?: string;
  title: string;
  type?: 'Reading' | 'Video' | 'CaseStudy' | 'Practice';
  slug?: string;
  content?: Record<string, unknown> | null;
  youtube_link?: string;
  file_url?: string;
  createdAt?: string;
  pembelajaran?: { title: string };
  modul?: { title: string };
}

function getFileExtension(url?: string) {
  if (!url) return '';
  const cleanUrl = url.split('?')[0];
  const match = cleanUrl.match(/\.([a-z0-9]+)$/i);
  return match ? `.${match[1].toLowerCase()}` : '';
}

function buildDocumentPreviewUrl(url?: string) {
  if (!url) return null;
  const ext = getFileExtension(url);
  if (ext === '.pdf') return url;
  if (['.docx', '.ppt', '.pptx'].includes(ext)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
  return null;
}

function getAuth() {
  const token = getStoredToken();
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  } else if (token) {
    headers['x-api-key'] = token;
  }
  return { token: token ?? undefined, headers };
}

function TypeIcon({ type }: { type?: string }) {
  const props = { size: 20, color: '#a5b4fc' };
  switch (type) {
    case 'Reading': return <BookOpen {...props} />;
    case 'Video': return <Video {...props} />;
    case 'CaseStudy': return <FlaskConical {...props} />;
    case 'Practice': return <BookMarked {...props} />;
    default: return <FileText {...props} />;
  }
}

export default function MateriDetailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId') || '';
  const tugasId = searchParams.get('tugasId') || '';

  const [tugas, setTugas] = useState<TugasDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTugas = useCallback(async () => {
    if (!tugasId) return;
    try {
      setLoading(true);
      setError(null);
      const auth = getAuth();
      const res = await apiGet<TugasDetail | { data?: TugasDetail }>(
        `/api/tugas/${tugasId}`,
        { token: auth.token, headers: auth.headers }
      );
      const data: TugasDetail = ('data' in res && (res as any).data)
        ? { ...(res as any).data, id: (res as any).data.uuid_tugas || (res as any).data.id }
        : { ...(res as TugasDetail), id: (res as any).uuid_tugas || (res as TugasDetail).id };
      setTugas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail materi.');
    } finally {
      setLoading(false);
    }
  }, [tugasId]);

  useEffect(() => { fetchTugas(); }, [fetchTugas]);

  const handleDownload = () => {
    if (!tugas?.file_url) return;
    window.open(tugas.file_url, '_blank');
  };

  const previewUrl = buildDocumentPreviewUrl(tugas?.file_url);
  const isPdf = getFileExtension(tugas?.file_url) === '.pdf';

  if (loading) {
    return (
      <div style={pageWrap}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
          <Loader2 size={36} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Memuat detail materi...</span>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/lecturer/courses')} style={backBtn}>
          <ArrowLeft size={15} />
        </button>
        <span style={crumb} onClick={() => router.push('/lecturer/courses')}>Courses</span>
        <ChevronRight size={13} color="#475569" />
        <span style={crumb} onClick={() => router.push(`/lecturer/courses/detail?id=${courseId}`)}>
          {tugas?.pembelajaran?.title ?? 'Detail Kelas'}
        </span>
        <ChevronRight size={13} color="#475569" />
        <span style={{ ...crumb, color: '#e2e8f0', cursor: 'default' }}>{tugas?.title ?? 'Detail Materi'}</span>
      </div>

      {/* Error */}
      {error && (
        <div style={errBox}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {tugas && (
        <>
          {/* Header Card */}
          <div style={headerCard}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={typeIconBox}>
                <TypeIcon type={tugas.type} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h1 style={mainTitle}>{tugas.title}</h1>
                  {tugas.type && <span style={typeBadge}>{tugas.type}</span>}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                  {tugas.pembelajaran?.title && (
                    <span style={metaItem}>📚 {tugas.pembelajaran.title}</span>
                  )}
                  {tugas.modul?.title && (
                    <span style={metaItem}>📦 {tugas.modul.title}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => router.push(`/lecturer/courses/detail?id=${courseId}`)} style={secondaryBtn}>
                <ArrowLeft size={14} /> Kembali ke Kelas
              </button>
              {tugas.file_url && (
                <button onClick={handleDownload} style={primaryBtn}>
                  <Download size={14} /> Download / Export
                </button>
              )}
            </div>
          </div>

          {/* Content Preview */}
          <div style={contentCard}>
            <h2 style={sectionTitle}>Preview Materi</h2>

            {/* Video */}
            {tugas.type === 'Video' && tugas.youtube_link && (
              <div style={videoWrap}>
                <iframe
                  src={tugas.youtube_link.replace('watch?v=', 'embed/')}
                  style={{ width: '100%', height: '100%', border: 'none', borderRadius: 10 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Reading / Content */}
            {tugas.type === 'Reading' && tugas.content && (
              <div style={readingContent}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.7 }}>
                  {JSON.stringify(tugas.content, null, 2)}
                </pre>
              </div>
            )}

            {/* File */}
            {tugas.file_url && (
              <div style={{ ...filePreview, flexDirection: 'column', alignItems: 'stretch' }}>
                {previewUrl ? (
                  <div style={{ width: '100%', marginBottom: 12 }}>
                    <iframe
                      src={previewUrl}
                      title={tugas.title}
                      style={{ width: '100%', minHeight: 520, borderRadius: 12, border: 'none', background: '#fff' }}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <FileText size={32} color="#6366f1" />
                    <div>
                      <p style={{ color: '#e2e8f0', fontWeight: 600, margin: 0 }}>File Terlampir</p>
                      <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '4px 0 0' }}>
                        <a href={tugas.file_url} target="_blank" rel="noopener noreferrer" style={{ color: '#a5b4fc' }}>
                          {tugas.file_url}
                        </a>
                      </p>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button onClick={handleDownload} style={{ ...primaryBtn }}>
                    <Download size={13} /> {isPdf ? 'Buka PDF' : 'Download'}
                  </button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!tugas.content && !tugas.file_url && !tugas.youtube_link && (
              <div style={emptyContent}>
                <Eye size={32} color="#4a5568" />
                <p style={{ color: '#64748b', marginTop: 12 }}>Belum ada konten untuk materi ini.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const pageWrap: React.CSSProperties = {
  padding: '4px 0',
  fontFamily: "'Inter', 'Outfit', sans-serif",
  color: '#e2e8f0',
};

const backBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', color: '#e2e8f0',
};

const crumb: React.CSSProperties = {
  color: '#64748b', fontSize: '0.82rem', cursor: 'pointer',
};

const errBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 14px', borderRadius: 8,
  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
  color: '#f87171', fontSize: '0.82rem', marginBottom: 20,
};

const headerCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16, padding: '24px', marginBottom: 20,
};

const typeIconBox: React.CSSProperties = {
  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const mainTitle: React.CSSProperties = {
  fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: 0,
};

const typeBadge: React.CSSProperties = {
  fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px',
  borderRadius: 6, background: 'rgba(99,102,241,0.15)',
  color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)',
};

const metaItem: React.CSSProperties = {
  fontSize: '0.82rem', color: '#64748b',
};

const primaryBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '9px 18px', borderRadius: 9, border: 'none',
  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  color: '#fff', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '9px 18px', borderRadius: 9,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#e2e8f0', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer',
};

const contentCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16, padding: '24px',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '1rem', fontWeight: 700, color: '#e2e8f0',
  margin: '0 0 18px',
  paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.07)',
};

const videoWrap: React.CSSProperties = {
  width: '100%', aspectRatio: '16/9',
  borderRadius: 10, overflow: 'hidden',
  background: '#000',
};

const readingContent: React.CSSProperties = {
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 10, padding: 18,
  maxHeight: 500, overflowY: 'auto',
};

const filePreview: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 16,
  padding: '16px 18px', borderRadius: 10,
  background: 'rgba(99,102,241,0.05)',
  border: '1px solid rgba(99,102,241,0.15)',
};

const emptyContent: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', padding: '48px 24px', textAlign: 'center',
};
