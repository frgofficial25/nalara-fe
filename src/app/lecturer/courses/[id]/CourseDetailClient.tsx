"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, BookOpen, Layers, Plus, Trash2, FileText,
  ChevronRight, X, AlertCircle, Loader2, Upload, Eye,
  Download, Package
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { apiGet, apiPost, apiPut, apiDelete, apiUploadPost } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Pembelajaran {
  id: string;
  uuid_pembelajaran?: string;
  title: string;
  description?: string;
  slug?: string;
  createdAt?: string;
}

interface Modul {
  id: string;
  uuid_modul?: string;
  uuid_pembelajaran?: string;
  title: string;
  description?: string;
  difficulty?: string;
  slug?: string;
  createdAt?: string;
}

interface Materi {
  id: string;
  uuid_materi?: string;
  title: string;
  type: 'Reading' | 'Video';
  video_url?: string;
  file_url?: string;
  order_index?: number;
  createdAt?: string;
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

// ─── Edit Materi Modal ──────────────────────────────────────────────────────────
function EditMateriModal({
  materi,
  onSuccess,
  onClose,
}: {
  materi: Materi;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(materi.title);
  const [type, setType] = useState(materi.type);
  const [videoUrl, setVideoUrl] = useState(materi.video_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      await apiPut(`/api/materi/${materi.id}`, {
        title,
        type,
        video_url: type === 'Video' ? videoUrl : undefined
      }, { token: auth.token, headers: auth.headers });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui materi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={modalHeader}>
          <h3 style={modalTitle}>Edit Materi</h3>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>
        {error && (
          <div style={errBox}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={formGroup}>
            <label style={label}>Nama Materi</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={input}
            />
          </div>
          <div style={formGroup}>
            <label style={label}>Tipe Materi</label>
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)} style={input}>
              <option value="Reading">Reading</option>
              <option value="Video">Video</option>
            </select>
          </div>
          {type === 'Video' && (
            <div style={formGroup}>
              <label style={label}>URL Video / YouTube</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                style={input}
              />
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ ...btnBase, flex: 1, background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>Batal</button>
            <button type="submit" disabled={loading} style={{ ...btnBase, flex: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
              {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Preview Materi Modal ──────────────────────────────────────────────────────
function PreviewMateriModal({
  materi,
  onClose,
}: {
  materi: Materi;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const auth = getAuth();
        const res = await apiGet<any>(`/api/materi/${materi.id}`, { token: auth.token, headers: auth.headers });
        setDetail(res?.data || res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat detail materi.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [materi.id]);

  const fileUrl = detail?.file_url || detail?.fileUrl || materi.file_url;
  const isVideo = materi.type === 'Video';
  const youtubeUrl = detail?.video_url || detail?.videoUrl || materi.video_url;
  const previewUrl = buildDocumentPreviewUrl(fileUrl);
  const isPdf = getFileExtension(fileUrl) === '.pdf';
  const isSupportedDocument = Boolean(previewUrl);

  return (
    <div style={overlay}>
      <div style={{ ...modal, maxWidth: 800, width: '90%' }}>
        <div style={modalHeader}>
          <h3 style={modalTitle}>Preview: {materi.title}</h3>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={24} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={errBox}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isVideo ? (
              <div>
                {youtubeUrl ? (
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8, background: '#000' }}>
                    <iframe
                      src={youtubeUrl.includes('youtube.com') || youtubeUrl.includes('youtu.be')
                        ? `https://www.youtube.com/embed/${youtubeUrl.split('v=')[1]?.split('&')[0] || youtubeUrl.split('/').pop()}`
                        : youtubeUrl
                      }
                      title={materi.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    />
                  </div>
                ) : fileUrl ? (
                  <video controls style={{ width: '100%', borderRadius: 8, maxHeight: 400, background: '#000' }}>
                    <source src={fileUrl} />
                    Browser Anda tidak mendukung pemutaran video.
                  </video>
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                    <p style={{ color: '#94a3b8', margin: 0 }}>Belum ada video atau file yang diupload.</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {fileUrl ? (
                  isPdf ? (
                    <iframe
                      src={fileUrl}
                      title={materi.title}
                      style={{ width: '100%', height: 500, borderRadius: 8, border: 'none' }}
                    />
                  ) : isSupportedDocument ? (
                    <iframe
                      src={previewUrl!}
                      title={materi.title}
                      style={{ width: '100%', height: 500, borderRadius: 8, border: 'none' }}
                    />
                  ) : (
                    <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                      <p style={{ color: '#e2e8f0', fontWeight: 600, margin: '0 0 8px' }}>Dokumen terlampir</p>
                      <a href={fileUrl} target="_blank" rel="noreferrer" style={{ ...btnBase, display: 'inline-flex', background: '#6366f1', color: '#fff', textDecoration: 'none' }}>
                        <Download size={14} /> Unduh File
                      </a>
                    </div>
                  )
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                    <p style={{ color: '#94a3b8', margin: 0 }}>Belum ada dokumen yang diupload.</p>
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button onClick={onClose} style={{ ...btnBase, background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>Tutup</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Auth Helper ──────────────────────────────────────────────────────────────
function getAuth() {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return { token: token ?? undefined, headers };
}

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────
function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={overlay}>
      <div style={{ ...modal, maxWidth: 400 }}>
        <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Trash2 size={22} color="#ef4444" />
          </div>
          <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: '0 0 8px' }}>Konfirmasi Hapus</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ ...btnBase, flex: 1, background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>Batal</button>
          <button onClick={onConfirm} style={{ ...btnBase, flex: 1, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff' }}>Hapus</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Materi Modal (2-step: create + upload) ────────────────────────────────
function AddMateriModal({
  modulId,
  pembelajaranId,
  onSuccess,
  onClose,
}: {
  modulId: string;
  pembelajaranId: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'Reading' | 'Video'>('Reading');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMateriId, setCreatedMateriId] = useState<string | null>(null);

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const READING_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
  const READING_EXTS = ['.pdf', '.docx', '.ppt', '.pptx'];
  const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.avi'];
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB

  const validateFile = (f: File): string | null => {
    const allowedTypes = type === 'Reading' ? READING_TYPES : VIDEO_TYPES;
    const allowedExts = type === 'Reading' ? READING_EXTS : VIDEO_EXTS;
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(f.type) && !allowedExts.includes(ext)) {
      return `Tipe file tidak didukung. Gunakan: ${allowedExts.join(', ')}`;
    }
    if (f.size > MAX_SIZE) {
      return `Ukuran file terlalu besar (max 100MB). File Anda: ${(f.size / 1024 / 1024).toFixed(1)}MB`;
    }
    return null;
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      const body: any = {
        title,
        type,
        uuid_pembelajaran: pembelajaranId,
        uuid_modul: modulId,
      };
      if (type === 'Video' && videoUrl.trim()) {
        body.video_url = videoUrl.trim();
      }
      const res = await apiPost<any>('/api/materi', body, { token: auth.token, headers: auth.headers });
      const materiId = res?.data?.uuid_materi || res?.uuid_materi || res?.data?.id || res?.id;
      if (materiId) {
        setCreatedMateriId(materiId);
        setStep(2);
      } else {
        // If no ID returned, just close and refresh
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan materi.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      const err = validateFile(f);
      if (err) { setError(err); return; }
      setError(null);
      setFile(f);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const err = validateFile(f);
      if (err) { setError(err); return; }
      setError(null);
      setFile(f);
    }
  };

  const handleUpload = async () => {
    if (!file || !createdMateriId) return;
    setUploading(true);
    setError(null);
    setUploadProgress(10);
    try {
      const auth = getAuth();
      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress(30);
      await apiUploadPost(`/api/materi/${createdMateriId}/upload`, formData, { token: auth.token, headers: auth.headers });
      setUploadProgress(90);
      setUploadProgress(100);
      setUploadSuccess(true);
      setTimeout(() => onSuccess(), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengupload file.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleSkipUpload = () => {
    onSuccess();
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  return (
    <div style={overlay}>
      <div style={{ ...modal, maxWidth: 520 }}>
        <div style={modalHeader}>
          <h3 style={modalTitle}>{step === 1 ? 'Tambah Materi' : 'Upload File'}</h3>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: step >= 1 ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>1</div>
          <div style={{ flex: 1, height: 2, background: step >= 2 ? '#6366f1' : 'rgba(255,255,255,0.1)', borderRadius: 2 }} />
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: step >= 2 ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: step >= 2 ? '#fff' : '#64748b' }}>2</div>
        </div>

        {error && (
          <div style={errBox}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={formGroup}>
              <label style={label}>Nama Materi</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Bacaan Bab 1 — Pengantar Akuntansi" style={input} />
            </div>
            <div style={formGroup}>
              <label style={label}>Tipe Materi</label>
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)} style={input}>
                <option value="Reading">Reading (PDF/DOCX/PPT)</option>
                <option value="Video">Video</option>
              </select>
            </div>
            {type === 'Video' && (
              <div style={formGroup}>
                <label style={label}>URL YouTube (opsional)</label>
                <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." style={input} />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Atau upload file video di langkah berikutnya</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={onClose} style={{ ...btnBase, flex: 1, background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>Batal</button>
              <button type="submit" disabled={loading} style={{ ...btnBase, flex: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
                {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : 'Lanjut →'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              style={{
                border: `2px dashed ${isDragOver ? '#6366f1' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: 12,
                padding: '32px 20px',
                textAlign: 'center',
                background: isDragOver ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('materi-file-input')?.click()}
            >
              <input
                id="materi-file-input"
                type="file"
                accept={type === 'Reading' ? '.pdf,.docx,.ppt,.pptx' : '.mp4,.webm,.mov,.avi'}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <Upload size={32} color={isDragOver ? '#6366f1' : '#64748b'} style={{ marginBottom: 10 }} />
              <p style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600, margin: '0 0 4px' }}>
                {file ? file.name : 'Drag & drop file di sini'}
              </p>
              <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0 }}>
                {type === 'Reading' ? 'PDF, DOCX, PPT, PPTX' : 'MP4, WebM, MOV, AVI'} • Max 100MB
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.72rem', margin: '6px 0 0' }}>
                File akan dikirim ke Supabase Storage dan metadata materi akan tersimpan otomatis ke database.
              </p>
              {file && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <FileText size={14} color="#a5b4fc" />
                  <span style={{ color: '#a5b4fc', fontSize: '0.8rem' }}>{formatSize(file.size)}</span>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.78rem' }}>Hapus</button>
                </div>
              )}
            </div>

            {/* Upload progress */}
            {uploadProgress > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden', height: 6 }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: uploadSuccess ? '#10b981' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  borderRadius: 8,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            )}

            {uploadSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                <Download size={16} /> File berhasil diupload!
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={handleSkipUpload} style={{ ...btnBase, flex: 1, background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>
                Lewati
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading || uploadSuccess}
                style={{ ...btnBase, flex: 2, background: file && !uploadSuccess ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.08)', color: file && !uploadSuccess ? '#fff' : '#64748b' }}
              >
                {uploading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : uploadSuccess ? '✓ Selesai' : '⬆ Upload File'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Modul Modal ───────────────────────────────────────────────────────────
function AddModulModal({
  pembelajaranId,
  onSuccess,
  onClose,
}: {
  pembelajaranId: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      await apiPost('/api/modul', {
        title,
        description,
        difficulty,
        uuid_pembelajaran: pembelajaranId,
      }, { token: auth.token, headers: auth.headers });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat modul.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={modalHeader}>
          <h3 style={modalTitle}>Tambah Modul</h3>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>
        {error && (
          <div style={errBox}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={formGroup}>
            <label style={label}>Nama Modul</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Modul 1 — Pengantar Akuntansi"
              style={input}
            />
          </div>
          <div style={formGroup}>
            <label style={label}>Deskripsi (opsional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat modul..."
              style={{ ...input, minHeight: 80, resize: 'vertical' }}
            />
          </div>
          <div style={formGroup}>
            <label style={label}>Tingkat Kesulitan</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} style={input}>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ ...btnBase, flex: 1, background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>Batal</button>
            <button type="submit" disabled={loading} style={{ ...btnBase, flex: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
              {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : 'Buat Modul'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CourseDetailClient() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Pembelajaran | null>(null);
  const [moduls, setModuls] = useState<Modul[]>([]);
  const [materiMap, setMateriMap] = useState<Record<string, Materi[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddModul, setShowAddModul] = useState(false);
  const [addMateriForModul, setAddMateriForModul] = useState<string | null>(null);
  const [deleteModul, setDeleteModul] = useState<Modul | null>(null);
  const [deleteMateri, setDeleteMateri] = useState<{ materi: Materi; modulId: string } | null>(null);
  const [editMateri, setEditMateri] = useState<Materi | null>(null);
  const [previewMateri, setPreviewMateri] = useState<Materi | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const auth = getAuth();
      const opts = { token: auth.token, headers: auth.headers };

      // Fetch course detail
      const courseRes = await apiGet<{ data?: Pembelajaran } | Pembelajaran>(
        `/api/pembelajaran/${courseId}`, opts
      );
      const rawCourse = (courseRes && 'data' in courseRes && courseRes.data) ? courseRes.data : courseRes as any;
      const courseData: Pembelajaran = {
        ...rawCourse,
        id: rawCourse.uuid_pembelajaran || rawCourse.id,
        title: rawCourse.nama_pembelajaran || rawCourse.title || '',
        description: rawCourse.deskripsi || rawCourse.description || '',
      };
      setCourse(courseData);

      // Fetch moduls for this course
      const modulRes = await apiGet<Modul[] | { data?: Modul[] }>(
        `/api/modul?uuid_pembelajaran=${courseId}`, opts
      );
      let modulList: Modul[] = Array.isArray(modulRes)
        ? modulRes
        : (modulRes as any).data ?? [];
      modulList = modulList
        .filter(m => m.uuid_pembelajaran === courseId)
        .map(m => ({ ...m, id: m.uuid_modul || m.id }));
      setModuls(modulList);

      // Fetch materi for each modul
      const newMateriMap: Record<string, Materi[]> = {};
      await Promise.all(
        modulList.map(async (m) => {
          try {
            const materiRes = await apiGet<Materi[] | { data?: Materi[] } | any>(
              `/api/materi?uuid_modul=${m.id}`, opts
            );
            let materiList: any[] = [];
            if (Array.isArray(materiRes)) {
              materiList = materiRes;
            } else if (materiRes && 'data' in materiRes && Array.isArray(materiRes.data)) {
              materiList = materiRes.data;
            } else if (materiRes && Array.isArray(materiRes.materi)) {
              materiList = materiRes.materi;
            }
            materiList = materiList.map(item => ({
              ...item,
              id: item.uuid_materi || item.id,
              title: item.title || item.nama_materi || '',
            }));
            newMateriMap[m.id] = materiList;
          } catch (e) {
            newMateriMap[m.id] = [];
          }
        })
      );
      setMateriMap(newMateriMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data kelas.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Delete Handlers ────────────────────────────────────────────────────────
  const confirmDeleteModul = async () => {
    if (!deleteModul) return;
    try {
      const auth = getAuth();
      await apiDelete(`/api/modul/${deleteModul.id}`, { token: auth.token, headers: auth.headers });
      setDeleteModul(null);
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus modul.');
      setDeleteModul(null);
    }
  };

  const confirmDeleteMateri = async () => {
    if (!deleteMateri) return;
    try {
      const auth = getAuth();
      await apiDelete(`/api/materi/${deleteMateri.materi.id}`, { token: auth.token, headers: auth.headers });
      setDeleteMateri(null);
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus materi.');
      setDeleteMateri(null);
    }
  };

  const handleDeleteFile = async (materiId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus file dari materi ini?')) return;
    try {
      const auth = getAuth();
      await apiDelete(`/api/materi/${materiId}/file`, { token: auth.token, headers: auth.headers });
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus file.');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={pageWrap}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
          <Loader2 size={36} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Memuat data kelas...</span>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Breadcrumb / Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <button onClick={() => router.push('/lecturer/courses')} style={backBtn}>
          <ArrowLeft size={16} />
        </button>
        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Courses</span>
        <ChevronRight size={14} color="#475569" />
        <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>{course?.title ?? '...'}</span>
      </div>

      {/* Course Header */}
      {course && (
        <div style={courseHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={courseIcon}>
              <BookOpen size={22} color="#6366f1" />
            </div>
            <div>
              <h1 style={courseTitle}>{course.title}</h1>
              {course.description && <p style={courseDesc}>{course.description}</p>}
            </div>
          </div>
          <button onClick={() => setShowAddModul(true)} style={addModulBtn}>
            <Plus size={15} />
            Tambah Modul
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={errBox}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Modules */}
      {moduls.length === 0 ? (
        <div style={emptyState}>
          <Package size={42} color="#4a5568" />
          <p style={{ color: '#94a3b8', fontWeight: 600, marginTop: 12 }}>Belum ada modul</p>
          <p style={{ color: '#64748b', fontSize: '0.82rem' }}>Tambahkan modul pertama untuk kelas ini.</p>
          <button onClick={() => setShowAddModul(true)} style={{ ...addModulBtn, marginTop: 12 }}>
            <Plus size={14} /> Tambah Modul
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {moduls.map((modul) => {
            const materiList = materiMap[modul.id] ?? [];
            return (
              <div key={modul.id} style={modulCard}>
                {/* Modul Header */}
                <div style={modulHeaderRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={modulIcon}>
                      <Layers size={16} color="#8b5cf6" />
                    </div>
                    <div>
                      <h2 style={modulTitle}>{modul.title}</h2>
                      {modul.difficulty && (
                        <span style={{ ...diffBadge, ...diffColor(modul.difficulty) }}>{modul.difficulty}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => setAddMateriForModul(modul.id)} style={addMateriBtn}>
                      <Plus size={13} /> Tambah Materi
                    </button>
                    <button onClick={() => setDeleteModul(modul)} style={iconDanger}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Materi List */}
                {materiList.length === 0 ? (
                  <div style={emptyMateri}>
                    <FileText size={18} color="#4a5568" />
                    <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Belum ada materi di modul ini.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                    {materiList.map((t, idx) => (
                      <div key={t.id} style={tugasRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={tugasOrder}>{idx + 1}</span>
                          <div>
                            <p style={tugasTitle}>{t.title}</p>
                            {t.type && <span style={typeBadge}>{t.type}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            onClick={() => setPreviewMateri(t)}
                            style={detailBtn}
                          >
                            <Eye size={13} /> Preview
                          </button>
                          <button
                            onClick={() => setEditMateri(t)}
                            style={{ ...detailBtn, background: 'rgba(255,255,255,0.03)' }}
                          >
                            Edit
                          </button>
                          {(t.file_url || (t as any).fileUrl) && (
                            <button
                              onClick={() => handleDeleteFile(t.id)}
                              style={{ ...detailBtn, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                              title="Hapus File Lampiran"
                            >
                              Hapus File
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteMateri({ materi: t, modulId: modul.id })}
                            style={iconDanger}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showAddModul && (
        <AddModulModal
          pembelajaranId={courseId}
          onSuccess={() => { setShowAddModul(false); fetchAll(); }}
          onClose={() => setShowAddModul(false)}
        />
      )}
      {addMateriForModul && (
        <AddMateriModal
          modulId={addMateriForModul}
          pembelajaranId={courseId}
          onSuccess={() => { setAddMateriForModul(null); fetchAll(); }}
          onClose={() => setAddMateriForModul(null)}
        />
      )}
      {deleteModul && (
        <ConfirmModal
          message={`Apakah yakin ingin menghapus modul "${deleteModul.title}"? Semua materi di dalamnya akan ikut terhapus.`}
          onConfirm={confirmDeleteModul}
          onCancel={() => setDeleteModul(null)}
        />
      )}
      {deleteMateri && (
        <ConfirmModal
          message={`Apakah yakin ingin menghapus materi "${deleteMateri.materi.title}"?`}
          onConfirm={confirmDeleteMateri}
          onCancel={() => setDeleteMateri(null)}
        />
      )}
      {editMateri && (
        <EditMateriModal
          materi={editMateri}
          onSuccess={() => { setEditMateri(null); fetchAll(); }}
          onClose={() => setEditMateri(null)}
        />
      )}
      {previewMateri && (
        <PreviewMateriModal
          materi={previewMateri}
          onClose={() => setPreviewMateri(null)}
        />
      )}
    </div>
  );
}

// ─── Shared Styles ─────────────────────────────────────────────────────────────
const pageWrap: React.CSSProperties = {
  padding: '4px 0',
  fontFamily: "'Inter', 'Outfit', sans-serif",
  color: '#e2e8f0',
  minHeight: '100vh',
};

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.75)',
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 200, padding: 20,
};

const modal: React.CSSProperties = {
  background: '#1e1e2e',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 24,
  width: '100%',
  maxWidth: 480,
};

const modalHeader: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  paddingBottom: 14, marginBottom: 18,
};

const modalTitle: React.CSSProperties = { fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 };
const closeBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' };

const formGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 7 };
const label: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' };
const input: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '9px 13px',
  color: '#e2e8f0', fontSize: '0.9rem', outline: 'none', width: '100%',
};

const btnBase: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 8, border: 'none',
  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
};

const errBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 14px', borderRadius: 8,
  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
  color: '#f87171', fontSize: '0.82rem', marginBottom: 14,
};

const backBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', color: '#e2e8f0',
};

const courseHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
  flexWrap: 'wrap', gap: 16, marginBottom: 28,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14, padding: '20px 24px',
};

const courseIcon: React.CSSProperties = {
  width: 46, height: 46, borderRadius: 12,
  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

const courseTitle: React.CSSProperties = { fontSize: '1.3rem', fontWeight: 700, color: '#fff', margin: 0 };
const courseDesc: React.CSSProperties = { color: '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0' };

const addModulBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '9px 16px', borderRadius: 8, border: 'none',
  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  color: '#fff', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer',
};

const emptyState: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', padding: '60px 24px', textAlign: 'center',
  background: 'rgba(255,255,255,0.02)',
  border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 14,
};

const modulCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14, padding: '20px 22px',
};

const modulHeaderRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  flexWrap: 'wrap', gap: 12,
};

const modulIcon: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 9,
  background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

const modulTitle: React.CSSProperties = { fontSize: '0.98rem', fontWeight: 700, color: '#e2e8f0', margin: 0 };

const diffBadge: React.CSSProperties = {
  display: 'inline-block', fontSize: '0.68rem', fontWeight: 700,
  padding: '2px 8px', borderRadius: 6, marginTop: 4, textTransform: 'capitalize',
};

function diffColor(d: string): React.CSSProperties {
  if (d === 'Beginner') return { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' };
  if (d === 'Advanced') return { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' };
  return { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' };
}

const addMateriBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '7px 13px', borderRadius: 7,
  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
  color: '#a5b4fc', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
};

const iconDanger: React.CSSProperties = {
  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
  borderRadius: 7, width: 30, height: 30,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: '#f87171',
};

const emptyMateri: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '14px 16px', marginTop: 12,
  background: 'rgba(255,255,255,0.02)',
  border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10,
};

const tugasRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '11px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
  gap: 12, flexWrap: 'wrap',
};

const tugasOrder: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 6,
  background: 'rgba(99,102,241,0.15)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '0.72rem', fontWeight: 700, color: '#a5b4fc', flexShrink: 0,
};

const tugasTitle: React.CSSProperties = { color: '#e2e8f0', fontSize: '0.88rem', fontWeight: 600, margin: 0 };

const typeBadge: React.CSSProperties = {
  display: 'inline-block', fontSize: '0.68rem', fontWeight: 600,
  padding: '2px 7px', borderRadius: 5, marginTop: 3,
  background: 'rgba(99,102,241,0.1)', color: '#a5b4fc',
  border: '1px solid rgba(99,102,241,0.2)',
};

const detailBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '6px 12px', borderRadius: 7,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
};
