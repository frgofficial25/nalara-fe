"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, ChevronRight, FileText, Download, Loader2,
  AlertCircle, BookOpen, Video, Trash2, Upload, File,
  ExternalLink, RefreshCw, ZoomIn
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet, apiUploadPost, apiDelete, apiPut } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

interface MateriFile {
  nama_file?: string;
  format_file?: string;
  ukuran_file?: number | null;
  preview_url?: string;
  export_url?: string;
  url?: string;
}

interface MateriDetail {
  id: string;
  nama_materi: string;
  tipe?: 'Reading' | 'Video';
  nomor_urut?: number;
  nama_pembelajaran?: string;
  nama_modul?: string;
  file?: MateriFile | null;
  video_url?: string | null;
  tanggal_dibuat?: string;
  terakhir_diperbarui?: string;
  uuid_modul?: string;
}

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

// ─── File Preview Component ───────────────────────────────────────────────────
function FilePreviewSection({ file, tipe }: { file: MateriFile; tipe?: string }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'google' | 'direct'>('google');
  const url = file.preview_url || file.export_url || file.url || '';
  const urlExt = getFileExtension(url);
  const ext = urlExt || (file.format_file || '').toLowerCase();

  // PDF — Google Docs Viewer (handles cross-origin PDFs + built-in scrolling)
  if (ext === 'pdf') {
    const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    const directUrl = `${url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`;
    const iframeSrc = viewMode === 'google' ? googleDocsUrl : directUrl;
    const previewHeight = fullscreen ? '88vh' : '700px';

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div style={previewToolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <File size={14} color="#a5b4fc" />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
              {file.nama_file || 'file.pdf'}
            </span>
            {file.ukuran_file && (
              <span style={fileSizeBadge}>{formatFileSize(file.ukuran_file)}</span>
            )}
            <span style={{ ...fileSizeBadge, background: 'rgba(239,68,68,0.1)', color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}>PDF</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Toggle viewer */}
            <button
              onClick={() => setViewMode(v => v === 'google' ? 'direct' : 'google')}
              style={{ ...toolbarBtn, fontSize: '0.65rem', width: 'auto', padding: '0 8px', gap: 4, display: 'flex', alignItems: 'center' }}
              title={viewMode === 'google' ? 'Coba preview langsung' : 'Gunakan Google Viewer'}
            >
              {viewMode === 'google' ? '⚡ Direct' : '🔍 Google'}
            </button>
            <button onClick={() => setFullscreen(!fullscreen)} style={toolbarBtn} title="Toggle tinggi preview">
              <ZoomIn size={13} />
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" style={toolbarBtn} title="Buka di tab baru">
              <ExternalLink size={13} />
            </a>
            <a href={url} download style={toolbarBtn} title="Download">
              <Download size={13} />
            </a>
          </div>
        </div>

        {/* Preview iframe — scrolling handled inside iframe by Google Docs / browser PDF viewer */}
        <div style={{
          width: '100%',
          height: previewHeight,
          borderRadius: '0 0 14px 14px',
          background: '#fff',
          transition: 'height 0.35s ease',
          position: 'relative',
        }}>
          <iframe
            key={`${iframeSrc}-${fullscreen}`}
            src={iframeSrc}
            title={file.nama_file || 'PDF Preview'}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            }}
            allow="fullscreen"
          />
        </div>

        <p style={{ fontSize: '0.72rem', color: '#475569', margin: '6px 0 0', textAlign: 'center' }}>
          {viewMode === 'google'
            ? '🔍 Menggunakan Google Docs Viewer — jika tidak muncul, klik "⚡ Direct" atau "Buka di tab baru"'
            : '⚡ Preview langsung — jika tidak muncul, klik "🔍 Google" atau "Buka di tab baru"'
          }
        </p>
      </div>
    );
  }

  // DOCX / PPT / PPTX — Office Online viewer (handles scrolling internally)
  if (['docx', 'doc', 'ppt', 'pptx'].includes(ext)) {
    const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={previewToolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <File size={14} color="#a5b4fc" />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
              {file.nama_file || `file.${ext}`}
            </span>
            {file.ukuran_file && (
              <span style={fileSizeBadge}>{formatFileSize(file.ukuran_file)}</span>
            )}
            <span style={{ ...fileSizeBadge, background: 'rgba(59,130,246,0.1)', color: '#93c5fd', borderColor: 'rgba(59,130,246,0.2)' }}>
              {ext.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noopener noreferrer" style={toolbarBtn}><ExternalLink size={13} /></a>
            <a href={url} download style={toolbarBtn}><Download size={13} /></a>
          </div>
        </div>
        {/* Office Online viewer — scroll handled internally */}
        <div style={{ width: '100%', height: '700px', borderRadius: '0 0 14px 14px', background: '#fff', position: 'relative' }}>
          <iframe
            src={officeUrl}
            title={file.nama_file || 'Document Preview'}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </div>
      </div>
    );
  }

  // Video file — native HTML5 player with controls + scrollable page
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext) || tipe === 'Video') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={previewToolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Video size={14} color="#a5b4fc" />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
              {file.nama_file || `video.${ext}`}
            </span>
            {file.ukuran_file && <span style={fileSizeBadge}>{formatFileSize(file.ukuran_file)}</span>}
            <span style={{ ...fileSizeBadge, background: 'rgba(139,92,246,0.1)', color: '#c4b5fd', borderColor: 'rgba(139,92,246,0.2)' }}>VIDEO</span>
          </div>
          <a href={url} download style={toolbarBtn}><Download size={13} /></a>
        </div>
        <div style={{ width: '100%', borderRadius: '0 0 14px 14px', overflow: 'hidden', background: '#000' }}>
          <video
            src={url}
            controls
            controlsList="nodownload"
            style={{ width: '100%', display: 'block', maxHeight: 560 }}
          />
        </div>
      </div>
    );
  }


  // Generic fallback
  return (
    <div style={genericFileCard}>
      <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <FileText size={26} color="#a5b4fc" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color: '#e2e8f0', fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>
          {file.nama_file || 'File Terlampir'}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          {file.format_file && <span style={fileSizeBadge}>{file.format_file}</span>}
          {file.ukuran_file && <span style={fileSizeBadge}>{formatFileSize(file.ukuran_file)}</span>}
        </div>
      </div>
      <a href={url} download style={downloadBigBtn}><Download size={14} /> Download</a>
    </div>
  );
}

// ─── Upload Section ───────────────────────────────────────────────────────────
function UploadSection({ tugasId, onSuccess }: { tugasId: string; onSuccess: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) setSelectedFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const auth = getAuth();
      const formData = new FormData();
      formData.append('file', selectedFile);
      await apiUploadPost(`/api/materi/${tugasId}/upload`, formData, { token: auth.token, headers: auth.headers });
      setSelectedFile(null);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload gagal');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {error && (
        <div style={{ ...errBoxSmall, marginBottom: 12 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('materi-file-input')?.click()}
        style={{
          border: `2px dashed ${dragging ? '#6366f1' : 'rgba(99,102,241,0.3)'}`,
          borderRadius: 12,
          padding: '32px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          background: dragging ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.03)',
          transition: 'all 0.2s ease',
        }}
      >
        <Upload size={30} color={dragging ? '#6366f1' : '#475569'} />
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>
          {selectedFile
            ? <span style={{ color: '#a5b4fc', fontWeight: 600 }}>✅ {selectedFile.name} ({formatFileSize(selectedFile.size)})</span>
            : <>Drag & drop file atau <span style={{ color: '#a5b4fc', fontWeight: 600 }}>klik untuk pilih</span></>
          }
        </p>
        <p style={{ color: '#475569', fontSize: '0.75rem', margin: 0 }}>
          PDF, DOCX, PPT, PPTX, MP4, WEBM • Maks. 100MB
        </p>
        <input
          id="materi-file-input"
          type="file"
          onChange={(e) => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }}
          accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.webm,.mov,.avi"
          style={{ display: 'none' }}
        />
      </div>
      {selectedFile && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
          <button onClick={() => setSelectedFile(null)} style={secondaryBtnSm}>Batal</button>
          <button onClick={handleUpload} disabled={uploading} style={{ ...primaryBtnSm, opacity: uploading ? 0.7 : 1 }}>
            {uploading
              ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...</>
              : <><Upload size={13} /> Upload File</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MateriDetailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId') || '';
  const tugasId = searchParams.get('tugasId') || '';

  const [materi, setMateri] = useState<MateriDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [savingYoutube, setSavingYoutube] = useState(false);
  const [editYoutubeMode, setEditYoutubeMode] = useState(false);

  // Helper to parse any YouTube URL into embed format
  const getYoutubeEmbedUrl = (url?: string | null): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  const handleSaveYoutube = async () => {
    if (!tugasId) return;
    setSavingYoutube(true);
    setError(null);
    try {
      const auth = getAuth();
      await apiPut(`/api/materi/${tugasId}`, {
        video_url: youtubeUrl.trim() || null
      }, { token: auth.token, headers: auth.headers });
      setEditYoutubeMode(false);
      await fetchMateri();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan link YouTube.');
    } finally {
      setSavingYoutube(false);
    }
  };

  const fetchMateri = useCallback(async () => {
    if (!tugasId) return;
    try {
      setLoading(true);
      setError(null);
      const auth = getAuth();
      const res = await apiGet<any>(`/api/materi/${tugasId}`, { token: auth.token, headers: auth.headers });
      // Backend: { success, data: { id, nama_materi, tipe, file: { preview_url, ... }, ... } }
      const raw = res?.data ?? res;
      const data: MateriDetail = {
        id: raw.id || raw.uuid_materi || tugasId,
        nama_materi: raw.nama_materi || raw.title || '',
        tipe: raw.tipe || raw.type,
        nomor_urut: raw.nomor_urut,
        nama_pembelajaran: raw.nama_pembelajaran,
        nama_modul: raw.nama_modul,
        file: raw.file ?? null,
        video_url: raw.video_url ?? null,
        tanggal_dibuat: raw.tanggal_dibuat,
        terakhir_diperbarui: raw.terakhir_diperbarui,
      };
      setMateri(data);
      if (data.video_url) setYoutubeUrl(data.video_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail materi.');
    } finally {
      setLoading(false);
    }
  }, [tugasId]);

  useEffect(() => { fetchMateri(); }, [fetchMateri]);

  const handleDeleteFile = async () => {
    if (!confirm('Hapus file ini? Materi tetap ada, hanya filenya yang dihapus.')) return;
    setDeletingFile(true);
    try {
      const auth = getAuth();
      await apiDelete(`/api/materi/${tugasId}/file`, { token: auth.token, headers: auth.headers });
      await fetchMateri();
      setShowUpload(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus file');
    } finally {
      setDeletingFile(false);
    }
  };

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

  const file = materi?.file;
  const fileUrl = file?.preview_url || file?.export_url || file?.url;
  const hasFile = !!fileUrl;

  return (
    <div style={pageWrap}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .materi-card{animation:fadeIn 0.3s ease both}
      `}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        <button onClick={() => router.push(`/lecturer/kelas/detail?id=${courseId}`)} style={backBtn}>
          <ArrowLeft size={15} />
        </button>
        <span style={crumb} onClick={() => router.push('/lecturer/kelas')}>Kelas</span>
        <ChevronRight size={13} color="#475569" />
        <span style={crumb} onClick={() => router.push(`/lecturer/kelas/detail?id=${courseId}`)}>
          {materi?.nama_pembelajaran ?? 'Detail Kelas'}
        </span>
        <ChevronRight size={13} color="#475569" />
        <span style={{ ...crumb, cursor: 'default' }}>
          {materi?.nama_modul ?? 'Detail Modul'}
        </span>
        <ChevronRight size={13} color="#475569" />
        <span style={{ ...crumb, color: '#e2e8f0', cursor: 'default' }}>{materi?.nama_materi ?? 'Detail Materi'}</span>
      </div>

      {error && (
        <div style={errBox}>
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 16 }}>✕</button>
        </div>
      )}

      {materi && (
        <div className="materi-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Header Card ── */}
          <div style={headerCard}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={typeIconBox}>
                {materi.tipe === 'Video' ? <Video size={22} color="#a5b4fc" /> : <BookOpen size={22} color="#a5b4fc" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <h1 style={mainTitle}>{materi.nama_materi}</h1>
                  {materi.tipe && <span style={typeBadge}>{materi.tipe}</span>}
                  {materi.nomor_urut !== undefined && (
                    <span style={{ ...typeBadge, background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                      Materi #{materi.nomor_urut}
                    </span>
                  )}
                  {hasFile && (
                    <span style={{ ...typeBadge, background: 'rgba(0,200,83,0.08)', color: '#4ade80', border: '1px solid rgba(0,200,83,0.2)' }}>
                      ✓ File Tersedia
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {materi.nama_pembelajaran && <span style={metaItem}>Kelas: {materi.nama_pembelajaran}</span>}
                  {materi.nama_modul && <span style={metaItem}>Modul: {materi.nama_modul}</span>}
                  {materi.tanggal_dibuat && (
                    <span style={metaItem}>Dibuat: {new Date(materi.tanggal_dibuat).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
              <button onClick={() => router.push(`/lecturer/kelas/detail?id=${courseId}`)} style={secondaryBtn}>
                <ArrowLeft size={14} /> Kembali ke Kelas
              </button>
              {hasFile && !showUpload && (
                <>
                  <button onClick={() => setShowUpload(true)} style={secondaryBtn}>
                    <RefreshCw size={14} /> Ganti File
                  </button>
                  <button
                    onClick={handleDeleteFile}
                    disabled={deletingFile}
                    style={{ ...secondaryBtn, color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}
                  >
                    {deletingFile
                      ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      : <Trash2 size={14} />
                    }
                    Hapus File
                  </button>
                  <a href={fileUrl} download style={{ ...primaryBtn, textDecoration: 'none' }}>
                    <Download size={14} /> Download
                  </a>
                </>
              )}
              {!hasFile && !showUpload && (
                <button onClick={() => setShowUpload(true)} style={primaryBtn}>
                  <Upload size={14} /> Upload File
                </button>
              )}
              {showUpload && (
                <button onClick={() => setShowUpload(false)} style={secondaryBtn}>
                  Batal Upload
                </button>
              )}
            </div>
          </div>

          {/* ── Preview Card ── */}
          <div style={contentCard}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 style={sectionTitle}>Preview Materi</h2>
              {hasFile && file?.format_file && (
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                  {file.format_file}
                </span>
              )}
            </div>

            {/* File Preview */}
            {hasFile && !showUpload && (
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(99,102,241,0.15)' }}>
                <FilePreviewSection file={file!} tipe={materi.tipe} />
              </div>
            )}

            {/* YouTube / Video URL embed */}
            {materi.tipe === 'Video' && materi.video_url && !hasFile && !showUpload && !editYoutubeMode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {getYoutubeEmbedUrl(materi.video_url) ? (
                  <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
                    <iframe
                      src={getYoutubeEmbedUrl(materi.video_url)!}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: 8, fontSize: '0.85rem' }}>
                    Link video tidak valid: {materi.video_url}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setEditYoutubeMode(true)} style={secondaryBtn}>Edit Link YouTube</button>
                  <button 
                    onClick={async () => {
                      if (confirm('Hapus link YouTube ini?')) {
                        setSavingYoutube(true);
                        try {
                          const auth = getAuth();
                          await apiPut(`/api/materi/${tugasId}`, { video_url: null }, { token: auth.token, headers: auth.headers });
                          setYoutubeUrl('');
                          await fetchMateri();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Gagal menghapus link YouTube.');
                        } finally {
                          setSavingYoutube(false);
                        }
                      }
                    }} 
                    style={{ ...secondaryBtn, color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}
                  >
                    Hapus Link YouTube
                  </button>
                </div>
              </div>
            )}

            {materi.tipe === 'Video' && (editYoutubeMode || !materi.video_url) && !hasFile && !showUpload && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Link YouTube / Video URL</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                  <button 
                    onClick={handleSaveYoutube} 
                    disabled={savingYoutube || !youtubeUrl.trim()} 
                    style={primaryBtn}
                  >
                    {savingYoutube ? 'Menyimpan...' : 'Simpan Link'}
                  </button>
                  {materi.video_url && (
                    <button onClick={() => { setEditYoutubeMode(false); setYoutubeUrl(materi.video_url || ''); }} style={secondaryBtn}>
                      Batal
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Upload Section */}
            {(showUpload || !hasFile) && !materi.video_url && (
              <UploadSection
                tugasId={tugasId}
                onSuccess={async () => {
                  setShowUpload(false);
                  await fetchMateri();
                }}
              />
            )}

            {/* Empty state */}
            {!hasFile && !materi.video_url && !showUpload && (
              <div style={emptyContent}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <FileText size={28} color="#4a5568" />
                </div>
                <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>Belum ada file untuk materi ini.</p>
                <p style={{ color: '#334155', fontSize: '0.8rem', margin: '6px 0 0' }}>Klik "Upload File" untuk menambahkan konten.</p>
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

const errBoxSmall: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '8px 12px', borderRadius: 7,
  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
  color: '#f87171', fontSize: '0.78rem',
};

const headerCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
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

const primaryBtnSm: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 16px', borderRadius: 8, border: 'none',
  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '9px 18px', borderRadius: 9,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#e2e8f0', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer',
};

const secondaryBtnSm: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 8,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
};

const contentCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
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

const emptyContent: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', padding: '52px 24px', textAlign: 'center',
};

