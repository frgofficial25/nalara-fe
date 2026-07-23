"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, ChevronRight, FileText, Download, Eye, Loader2,
  AlertCircle, BookOpen, Video, BookMarked, FlaskConical,
  File, ExternalLink, ZoomIn, RefreshCw
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import { downloadFile, openInNewTab } from '@/lib/download';

interface MateriFile {
  nama_file?: string;
  format_file?: string;
  ukuran_file?: number | null;
  preview_url?: string;
  export_url?: string;
  url?: string;
}

interface TugasDetail {
  id: string;
  title: string;
  type?: 'Reading' | 'Video' | 'CaseStudy' | 'Practice';
  content?: any;
  youtube_link?: string;
  file_url?: string;
  file_format?: string;
  file?: MateriFile | null;
  pembelajaran?: { title: string };
  modul?: { title: string };
  nomor_urut?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getFileExtension(url?: string) {
  if (!url) return '';
  const cleanUrl = url.split('?')[0];
  const match = cleanUrl.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : '';
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const props = { size: 22, color: '#a5b4fc' };
  switch (type) {
    case 'Reading': return <BookOpen {...props} />;
    case 'Video': return <Video {...props} />;
    case 'CaseStudy': return <FlaskConical {...props} />;
    case 'Practice': return <BookMarked {...props} />;
    default: return <FileText {...props} />;
  }
}

// ─── Rich File Preview (ported from lecturer) ─────────────────────────────────
function FilePreviewSection({
  fileUrl,
  fileName,
  fileFormat,
  fileSize,
  tipe,
}: {
  fileUrl: string;
  fileName?: string;
  fileFormat?: string;
  fileSize?: number | null;
  tipe?: string;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'google' | 'direct'>('google');
  const [previewNonce, setPreviewNonce] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [autoFallback, setAutoFallback] = useState(false);

  const urlExt = getFileExtension(fileUrl);
  const ext = (urlExt || fileFormat || '').trim().toLowerCase();

  const isPDF = ext === 'pdf' || ext.includes('pdf') || (fileName && fileName.toLowerCase().endsWith('.pdf'));
  const isDoc = ['docx', 'doc', 'ppt', 'pptx'].includes(ext) || (fileName && /\.(docx|doc|ppt|pptx)$/i.test(fileName));
  const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(ext) || tipe === 'Video' || (fileName && /\.(mp4|webm|mov|avi)$/i.test(fileName));

  // Normalize URL to ensure it ends with the format extension (critical for Cloudinary raw uploads & Google Viewer)
  let url = fileUrl;
  const canonicalExt = isPDF ? 'pdf' : (isDoc ? ext : (isVideo ? ext : ''));
  if (canonicalExt && !url.split('?')[0].split('#')[0].toLowerCase().endsWith(`.${canonicalExt}`)) {
    const parts = url.split('?');
    const base = parts[0] + `.${canonicalExt}`;
    url = parts[1] ? `${base}?${parts[1]}` : base;
  }

  useEffect(() => {
    if (!isPDF) return;

    setAutoFallback(false);
    setIframeLoaded(false);

    if (viewMode !== 'google') return;

    const fallbackTimer = setTimeout(() => {
      setIframeLoaded(currentLoaded => {
        if (!currentLoaded) {
          setViewMode('direct');
          setAutoFallback(true);
        }
        return currentLoaded;
      });
    }, 4500);

    return () => clearTimeout(fallbackTimer);
  }, [isPDF, viewMode, previewNonce]);

  // ── PDF ──────────────────────────────────────────────────────────────────────
  if (isPDF) {
    const pdfUrl = url.split('?')[0].toLowerCase().endsWith('.pdf')
      ? url
      : url.split('?')[0] + '.pdf' + (url.includes('?') ? '?' + url.split('?')[1] : '');
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
    return (
      <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', background: '#1e1e2e', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'rgba(30,30,46,0.95)', borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={14} color="#a5b4fc" />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{fileName || 'PDF'}</span>
            {fileSize && <span style={fileSizeBadge}>{formatFileSize(fileSize)}</span>}
            <span style={{ ...fileSizeBadge, background: 'rgba(239,68,68,0.1)', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.2)' }}>PDF</span>
          </div>
        </div>
        <div style={{ width: '100%', height: '680px', background: '#fff' }}>
          <iframe
            key={previewNonce}
            src={googleViewerUrl}
            title={fileName || 'PDF Preview'}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            allow="fullscreen"
          />
        </div>
      </div>
    );
  }

  // ── DOCX / PPT / PPTX ────────────────────────────────────────────────────────
  if (isDoc) {
    const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={previewToolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <File size={14} color="#a5b4fc" />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
              {fileName || `file.${ext}`}
            </span>
            {fileSize && <span style={fileSizeBadge}>{formatFileSize(fileSize)}</span>}
            <span style={{ ...fileSizeBadge, background: 'rgba(59,130,246,0.1)', color: '#93c5fd', borderColor: 'rgba(59,130,246,0.2)' }}>
              {ext.toUpperCase()}
            </span>
          </div>
        </div>
        <div style={{ width: '100%', height: '700px', borderRadius: '0 0 14px 14px', background: '#fff', position: 'relative' }}>
          <iframe
            src={officeUrl}
            title={fileName || 'Document Preview'}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </div>
      </div>
    );
  }

  // ── Video file ────────────────────────────────────────────────────────────────
  if (isVideo) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={previewToolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Video size={14} color="#a5b4fc" />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
              {fileName || `video.${ext}`}
            </span>
            {fileSize && <span style={fileSizeBadge}>{formatFileSize(fileSize)}</span>}
            <span style={{ ...fileSizeBadge, background: 'rgba(139,92,246,0.1)', color: '#c4b5fd', borderColor: 'rgba(139,92,246,0.2)' }}>VIDEO</span>
          </div>
        </div>
        <div style={{ width: '100%', borderRadius: '0 0 14px 14px', overflow: 'hidden', background: '#000' }}>
          <video
            src={url}
            controls
            style={{ width: '100%', display: 'block', maxHeight: 560 }}
          />
        </div>
      </div>
    );
  }

  // ── Generic fallback ──────────────────────────────────────────────────────────
  return (
    <div style={genericFileCard}>
      <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <FileText size={26} color="#a5b4fc" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color: '#e2e8f0', fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>
          {fileName || 'File Terlampir'}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          {fileFormat && <span style={fileSizeBadge}>{fileFormat}</span>}
          {fileSize && <span style={fileSizeBadge}>{formatFileSize(fileSize)}</span>}
        </div>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" style={downloadBigBtn}>
        <ExternalLink size={14} /> Buka File
      </a>
      <button onClick={() => downloadFile(url, fileName || 'materi')} style={{ ...downloadBigBtn, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer' }}>
        <Download size={14} /> Download
      </button>
    </div>
  );
}

// ─── Rich Content Renderer ────────────────────────────────────────────────────
function renderContent(content: any): React.ReactNode {
  if (!content) return null;
  if (typeof content === 'string') return <span>{content}</span>;
  if (content.type === 'doc' && Array.isArray(content.content)) {
    return content.content.map((block: any, idx: number) => {
      if (block.type === 'paragraph' && Array.isArray(block.content)) {
        return (
          <p key={idx} style={{ margin: '0 0 12px 0', lineHeight: 1.7 }}>
            {block.content.map((span: any, sIdx: number) => span.text || '')}
          </p>
        );
      }
      if (block.type === 'heading') {
        const level = block.attrs?.level || 2;
        const text = block.content?.map((s: any) => s.text || '').join('');
        return <p key={idx} style={{ fontWeight: 700, fontSize: level <= 2 ? '1.1rem' : '1rem', margin: '14px 0 6px', color: '#e2e8f0' }}>{text}</p>;
      }
      if (block.type === 'bulletList' && Array.isArray(block.content)) {
        return (
          <ul key={idx} style={{ paddingLeft: 20, margin: '0 0 12px' }}>
            {block.content.map((item: any, iIdx: number) => (
              <li key={iIdx} style={{ color: '#cbd5e1', lineHeight: 1.7, marginBottom: 4 }}>
                {item.content?.map((p: any) => p.content?.map((s: any) => s.text || '').join('')).join('')}
              </li>
            ))}
          </ul>
        );
      }
      return null;
    });
  }
  return <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{JSON.stringify(content, null, 2)}</pre>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MateriDetailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId') || '';
  const tugasId = searchParams.get('tugasId') || '';

  const [tugas, setTugas] = useState<TugasDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to parse any YouTube URL into embed format
  const getYoutubeEmbedUrl = (url?: string | null): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|live\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  const fetchTugas = useCallback(async () => {
    if (!tugasId) return;
    try {
      setLoading(true);
      setError(null);
      const auth = getAuth();
      const res = await apiGet<any>(
        `/api/materi/${tugasId}`,
        { token: auth.token, headers: auth.headers }
      );
      const rawData = (res && 'data' in res) ? res.data : res;

      const mappedData: TugasDetail = {
        id: rawData.id || rawData.uuid_materi || rawData.uuid_tugas,
        title: rawData.nama_materi || rawData.title,
        type: rawData.tipe || rawData.type,
        nomor_urut: rawData.nomor_urut,
        youtube_link: rawData.video_url || rawData.youtube_link,
        file_url: rawData.file?.preview_url || rawData.file?.export_url || rawData.file?.url || rawData.file_url,
        file_format: rawData.file?.format_file || rawData.file_format,
        file: rawData.file ?? null,
        pembelajaran: { title: rawData.nama_pembelajaran || rawData.pembelajaran?.title || 'Detail Kelas' },
        modul: { title: rawData.nama_modul || rawData.modul?.title || 'Modul' },
        content: rawData.content,
      };

      setTugas(mappedData);

      // Record completed material locally in browser
      if (typeof window !== 'undefined' && tugasId) {
        try {
          const localUser = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
          const userId = localUser ? JSON.parse(localUser).uuid_user || JSON.parse(localUser).id || 'default' : 'default';
          const storageKey = `nalara_completed_materi_${userId}`;
          const currentList = JSON.parse(localStorage.getItem(storageKey) || '[]');
          if (!currentList.includes(tugasId)) {
            currentList.push(tugasId);
            localStorage.setItem(storageKey, JSON.stringify(currentList));
          }
        } catch (e) {
          console.warn('Failed to save progress locally:', e);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail materi.');
    } finally {
      setLoading(false);
    }
  }, [tugasId]);

  useEffect(() => { fetchTugas(); }, [fetchTugas]);

  if (loading) {
    return (
      <div style={pageWrap}>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 360, gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={26} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Memuat detail materi...</span>
        </div>
      </div>
    );
  }

  const fileUrl = tugas?.file_url;
  const hasFile = !!fileUrl;
  const hasYouTube = tugas?.type === 'Video' && !!getYoutubeEmbedUrl(tugas?.youtube_link);
  const hasDirectVideo = tugas?.type === 'Video' && !!tugas?.youtube_link && !getYoutubeEmbedUrl(tugas?.youtube_link);
  const hasVideo = tugas?.type === 'Video' && !!tugas?.youtube_link;
  const hasContent = (tugas?.type === 'Reading' || tugas?.type === 'CaseStudy' || tugas?.type === 'Practice') && !!tugas?.content;
  const hasAnything = hasFile || hasVideo || hasContent;

  return (
    <div style={pageWrap}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .materi-card{animation:fadeIn 0.3s ease both}
      `}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/student/kelas')} style={backBtn}>
          <ArrowLeft size={15} />
        </button>
        <span style={crumb} onClick={() => router.push('/student/kelas')}>Kelas</span>
        <ChevronRight size={13} color="#475569" />
        <span style={crumb} onClick={() => router.push(`/student/kelas/detail?id=${courseId}`)}>
          {tugas?.pembelajaran?.title ?? 'Detail Kelas'}
        </span>
        <ChevronRight size={13} color="#475569" />
        <span style={{ ...crumb, color: '#e2e8f0', cursor: 'default' }}>{tugas?.title ?? 'Detail Materi'}</span>
      </div>

      {error && (
        <div style={errBox}>
          <AlertCircle size={16} />
          <span>{error}</span>
          <button
            onClick={() => { setError(null); fetchTugas(); }}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
          >
            <RefreshCw size={13} /> Coba Lagi
          </button>
        </div>
      )}

      {tugas && (
        <div className="materi-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Header Card ── */}
          <div style={headerCard} className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={typeIconBox}>
                <TypeIcon type={tugas.type} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <h1 style={mainTitle}>{tugas.title}</h1>
                  {tugas.type && <span style={typeBadge}>{tugas.type}</span>}
                  {tugas.nomor_urut !== undefined && (
                    <span style={{ ...typeBadge, background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                      Materi #{tugas.nomor_urut}
                    </span>
                  )}
                  {hasFile && (
                    <span style={{ ...typeBadge, background: 'rgba(0,200,83,0.08)', color: '#4ade80', border: '1px solid rgba(0,200,83,0.2)' }}>
                      ✓ File Tersedia
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {tugas.pembelajaran?.title && <span style={metaItem}>{tugas.pembelajaran.title}</span>}
                  {tugas.modul?.title && <span style={metaItem}>{tugas.modul.title}</span>}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
              <button onClick={() => router.push(`/student/kelas/detail?id=${courseId}`)} style={secondaryBtn}>
                <ArrowLeft size={14} /> Kembali ke Kelas
              </button>
              {hasFile && fileUrl && (
                <button onClick={() => downloadFile(fileUrl, tugas.file?.nama_file || tugas.title)} style={{ ...primaryBtn, cursor: 'pointer' }}>
                  <Download size={14} /> Download
                </button>
              )}
            </div>
          </div>

          {/* ── Content / Preview Card ── */}
          <div style={contentCard} className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 style={sectionTitle}>
                {tugas.type === 'Video' ? '🎬 Konten Video' : tugas.type === 'Reading' ? '📖 Konten Bacaan' : tugas.type === 'CaseStudy' ? '🔬 Studi Kasus' : tugas.type === 'Practice' ? '✏️ Latihan' : '📄 Preview Materi'}
              </h2>
              {hasFile && tugas.file_format && (
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                  {tugas.file_format.toUpperCase()}
                </span>
              )}
            </div>

            {/* ── YouTube / Video URL ── */}
            {hasYouTube && (
              <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
                <iframe
                  src={getYoutubeEmbedUrl(tugas.youtube_link)!}
                  style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={tugas.title}
                />
              </div>
            )}

            {/* ── Direct Video URL (non-YouTube) ── */}
            {hasDirectVideo && (
              <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
                <video
                  src={tugas.youtube_link}
                  controls
                  style={{ width: '100%', display: 'block', maxHeight: 520 }}
                />
              </div>
            )}

            {/* ── Reading Content ── */}
            {hasContent && (
              <div style={readingContent}>
                <div style={{ margin: 0, fontFamily: 'inherit', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.7 }}>
                  {renderContent(tugas.content)}
                </div>
              </div>
            )}

            {/* ── File Preview ── */}
            {hasFile && fileUrl && (
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(99,102,241,0.15)' }}>
                <FilePreviewSection
                  fileUrl={fileUrl}
                  fileName={tugas.file?.nama_file}
                  fileFormat={tugas.file_format || tugas.file?.format_file}
                  fileSize={tugas.file?.ukuran_file}
                  tipe={tugas.type}
                />
              </div>
            )}

            {/* ── Empty state ── */}
            {!hasAnything && (
              <div style={emptyContent}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Eye size={28} color="#4a5568" />
                </div>
                <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>Belum ada konten untuk materi ini.</p>
                <p style={{ color: '#334155', fontSize: '0.8rem', margin: '6px 0 0' }}>Konten akan segera ditambahkan oleh dosen.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const pageWrap: React.CSSProperties = {
  padding: '4px 0',
  fontFamily: "'Inter', 'Outfit', sans-serif",
  color: '#e2e8f0',
};

const backBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', color: '#e2e8f0', flexShrink: 0,
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
  borderRadius: 16, padding: '24px',
};

const typeIconBox: React.CSSProperties = {
  width: 50, height: 50, borderRadius: 12, flexShrink: 0,
  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const mainTitle: React.CSSProperties = {
  fontSize: '1.35rem', fontWeight: 700, color: '#fff', margin: 0,
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
  borderRadius: 16, padding: '24px',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', margin: 0,
};

const previewToolbar: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '10px 16px',
  background: 'rgba(15,15,30,0.85)',
  borderRadius: '14px 14px 0 0',
};

const toolbarBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, borderRadius: 7,
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#94a3b8', cursor: 'pointer', textDecoration: 'none',
};

const fileSizeBadge: React.CSSProperties = {
  fontSize: '0.7rem', fontWeight: 600, padding: '2px 7px', borderRadius: 4,
  background: 'rgba(99,102,241,0.12)', color: '#a5b4fc',
  border: '1px solid rgba(99,102,241,0.18)',
};

const genericFileCard: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 16,
  padding: '20px', borderRadius: 12,
  background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)',
};

const downloadBigBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '9px 16px', borderRadius: 9, border: 'none',
  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  color: '#fff', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer',
  textDecoration: 'none', flexShrink: 0,
};

const readingContent: React.CSSProperties = {
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 10, padding: 18,
  maxHeight: 500, overflowY: 'auto',
};

const emptyContent: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', padding: '52px 24px', textAlign: 'center',
};
