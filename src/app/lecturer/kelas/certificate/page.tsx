/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import {
  Award, Upload, Save, X, Loader2, AlertCircle, CheckCircle2,
  ChevronLeft, Image as ImageIcon, Move, Type, Palette, Eye,
  Trash2
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { getStoredToken } from '@/services/auth';
import { useRouter, useSearchParams } from 'next/navigation';

function getAuthHeaders() {
  const token = getStoredToken();
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) headers['x-api-key'] = apiKey;
  else if (token) headers['x-api-key'] = token;
  return { token: token || undefined, headers };
}

interface Course {
  id: string;
  title: string;
  certificate_template_url?: string | null;
  certificate_name_position_x?: number | null;
  certificate_name_position_y?: number | null;
  certificate_name_font_size?: number | null;
  certificate_name_color?: string | null;
  certificate_code_position_x?: number | null;
  certificate_code_position_y?: number | null;
  certificate_code_font_size?: number | null;
  certificate_code_color?: string | null;
}

function CertificatePreview({
  templateUrl,
  nameX,
  nameY,
  nameFontSize,
  nameColor,
  previewName,
  onNamePositionChange,
  codeX,
  codeY,
  codeFontSize,
  codeColor,
  previewCode,
  onCodePositionChange,
}: {
  templateUrl: string;
  nameX: number;
  nameY: number;
  nameFontSize: number;
  nameColor: string;
  previewName: string;
  onNamePositionChange: (x: number, y: number) => void;
  codeX: number;
  codeY: number;
  codeFontSize: number;
  codeColor: string;
  previewCode: string;
  onCodePositionChange: (x: number, y: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState<'name' | 'code' | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [scale, setScale] = useState(1);

  const updateScale = useCallback(() => {
    if (imgRef.current) {
      const naturalWidth = imgRef.current.naturalWidth || 1684;
      const clientWidth = imgRef.current.clientWidth || 500;
      setScale(clientWidth / naturalWidth);
    }
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
    };
  }, [imgLoaded, updateScale]);

  const handleMouseDownName = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging('name');
  };

  const handleMouseDownCode = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging('code');
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      if (dragging === 'name') {
        onNamePositionChange(parseFloat(x.toFixed(1)), parseFloat(y.toFixed(1)));
      } else if (dragging === 'code') {
        onCodePositionChange(parseFloat(x.toFixed(1)), parseFloat(y.toFixed(1)));
      }
    },
    [dragging, onNamePositionChange, onCodePositionChange]
  );

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!dragging || !containerRef.current) return;
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));
      if (dragging === 'name') {
        onNamePositionChange(parseFloat(x.toFixed(1)), parseFloat(y.toFixed(1)));
      } else if (dragging === 'code') {
        onCodePositionChange(parseFloat(x.toFixed(1)), parseFloat(y.toFixed(1)));
      }
    },
    [dragging, onNamePositionChange, onCodePositionChange]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#1a1a2e',
        border: '1px solid rgba(255,255,255,0.1)',
        cursor: dragging ? 'grabbing' : 'default',
        userSelect: 'none',
        minHeight: 200,
      }}
    >
      {/* Template image */}
      <img
        ref={imgRef}
        src={templateUrl}
        alt="Template sertifikat"
        style={{ width: '100%', display: 'block', opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
        onLoad={() => { setImgLoaded(true); setTimeout(updateScale, 100); }}
        crossOrigin="anonymous"
        draggable={false}
      />
      {!imgLoaded && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', gap: 8
        }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          Memuat template...
        </div>
      )}

      {/* Draggable name indicator */}
      {imgLoaded && (
        <div
          onMouseDown={handleMouseDownName}
          onTouchStart={(e) => { e.preventDefault(); setDragging('name'); }}
          style={{
            position: 'absolute',
            left: `${nameX}%`,
            top: `${nameY}%`,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'grab',
          }}
        >
          {/* Centered text */}
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: `${nameFontSize * scale}px`,
              background: nameColor === 'grad-blue-design' ? 'linear-gradient(to right, #2563EB, #153885)' : undefined,
              WebkitBackgroundClip: nameColor === 'grad-blue-design' ? 'text' : undefined,
              WebkitTextFillColor: nameColor === 'grad-blue-design' ? 'transparent' : undefined,
              color: nameColor === 'grad-blue-design' ? undefined : nameColor,
              textShadow: nameColor === '#ffffff' || nameColor === '#FFFFFF'
                ? '0 0 6px rgba(0,0,0,0.8)'
                : '0 0 6px rgba(255,255,255,0.6)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              lineHeight: 1,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {previewName}
          </span>
          {/* Drag handle absolutely placed below the center point */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translate(-50%, 8px)',
              background: 'rgba(6,113,224,0.85)',
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: '0.5rem',
              color: '#fff',
              fontWeight: 700,
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <Move size={9} />
            NAMA
          </div>
        </div>
      )}

      {/* Draggable code indicator */}
      {imgLoaded && (
        <div
          onMouseDown={handleMouseDownCode}
          onTouchStart={(e) => { e.preventDefault(); setDragging('code'); }}
          style={{
            position: 'absolute',
            left: `${codeX}%`,
            top: `${codeY}%`,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'grab',
          }}
        >
          {/* Centered text */}
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: `${codeFontSize * scale}px`,
              color: codeColor,
              textShadow: codeColor === '#ffffff' || codeColor === '#FFFFFF'
                ? '0 0 6px rgba(0,0,0,0.8)'
                : '0 0 6px rgba(255,255,255,0.6)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              lineHeight: 1,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {previewCode}
          </span>
          {/* Drag handle absolutely placed below the center point */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translate(-50%, 8px)',
              background: 'rgba(224,64,251,0.85)',
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: '0.5rem',
              color: '#fff',
              fontWeight: 700,
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <Move size={9} />
            KODE
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function CertificatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || '';

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [settings, setSettings] = useState<Course | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Template upload state
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Position & style state for Name
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#000000');
  const [previewName, setPreviewName] = useState('Nama Lengkap Siswa');

  // Position & style state for Certificate Code
  const [codePosX, setCodePosX] = useState(50);
  const [codePosY, setCodePosY] = useState(80);
  const [codeFontSize, setCodeFontSize] = useState(16);
  const [codeColor, setCodeColor] = useState('#000000');
  // Derived Preview Certificate Code
  const getLevelCode = (title: string): string => {
    const t = title.toLowerCase();
    if (t.includes('foundation') || t.includes('dasar')) return 'FND';
    if (t.includes('intermediate') || t.includes('menengah')) return 'INT';
    if (t.includes('advance') || t.includes('lanjut')) return 'ADV';
    return 'CMP';
  };
  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const previewCode = selectedCourse
    ? `NLR-CERT-${getLevelCode(selectedCourse.title)}-B01-0001`
    : 'NLR-CERT-CMP-B01-0001';

  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch courses list
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const auth = getAuthHeaders();
        const res = await apiGet<any>('/api/pembelajaran', { token: auth.token, headers: auth.headers });
        const list = Array.isArray(res) ? res : (res?.data || []);
        const mapped: Course[] = list.map((c: any) => ({
          id: c.uuid_pembelajaran || c.id,
          title: c.nama_pembelajaran || c.title || 'Untitled',
        }));
        setCourses(mapped);
        if (!initialCourseId && mapped.length > 0) {
          setSelectedCourseId(mapped[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [initialCourseId]);

  // Fetch certificate settings when course changes
  useEffect(() => {
    if (!selectedCourseId) return;
    const fetchSettings = async () => {
      setLoadingSettings(true);
      try {
        const auth = getAuthHeaders();
        const res = await apiGet<any>(`/api/pembelajaran/${selectedCourseId}/certificate`, {
          token: auth.token, headers: auth.headers
        });
        const data = res?.data || res || null;
        if (data) {
          setSettings(data);
          setPreviewUrl(data.certificate_template_url || null);
          setPosX(data.certificate_name_position_x ?? 50);
          setPosY(data.certificate_name_position_y ?? 50);
          setFontSize(data.certificate_name_font_size ?? 48);
          setColor(data.certificate_name_color ?? '#000000');

          setCodePosX(data.certificate_code_position_x ?? 50);
          setCodePosY(data.certificate_code_position_y ?? 80);
          setCodeFontSize(data.certificate_code_font_size ?? 16);
          setCodeColor(data.certificate_code_color ?? '#000000');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, [selectedCourseId]);



  // Upload template
  const handleUploadFile = async (file: File) => {
    setUploadError('');
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('Format tidak valid. Gunakan JPG, PNG, atau WEBP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 10MB.');
      return;
    }
    if (!selectedCourseId) {
      setUploadError('Pilih kelas terlebih dahulu.');
      return;
    }
    setUploading(true);
    try {
      const token = getStoredToken();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      const formData = new FormData();
      formData.append('file', file);

      const baseUrl = '/api-proxy';
      const headers: Record<string, string> = {};
      if (apiKey) headers['x-api-key'] = apiKey;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${baseUrl}/pembelajaran/${selectedCourseId}/certificate/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Upload gagal');
      }

      const newUrl = json.data?.certificate_template_url;
      setPreviewUrl(newUrl);
      setSettings(prev => prev ? { ...prev, certificate_template_url: newUrl } : prev);
      showToast('Template berhasil diupload!', 'success');
    } catch (e: any) {
      setUploadError(e.message || 'Upload gagal. Coba lagi.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUploadFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadFile(file);
  };

  // Save settings
  const handleSave = async () => {
    if (!selectedCourseId) return;
    setSaving(true);
    try {
      const token = getStoredToken();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-api-key'] = apiKey;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api-proxy/pembelajaran/${selectedCourseId}/certificate/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          certificate_name_position_x: posX,
          certificate_name_position_y: posY,
          certificate_name_font_size: fontSize,
          certificate_name_color: color,
          certificate_code_position_x: codePosX,
          certificate_code_position_y: codePosY,
          certificate_code_font_size: codeFontSize,
          certificate_code_color: codeColor,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'Gagal menyimpan');
      showToast('Pengaturan sertifikat berhasil disimpan!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Gagal menyimpan pengaturan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Remove template
  const handleRemoveTemplate = async () => {
    if (!selectedCourseId) return;
    if (!confirm('Hapus template sertifikat?')) return;
    setSaving(true);
    try {
      const token = getStoredToken();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-api-key'] = apiKey;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api-proxy/pembelajaran/${selectedCourseId}/certificate/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ certificate_template_url: null }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'Gagal menghapus template');
      setPreviewUrl(null);
      showToast('Template dihapus.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Gagal menghapus template.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '4px 0', color: '#E2E8F0', fontFamily: 'var(--font-display, Inter, sans-serif)' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'success' ? 'rgba(0,200,83,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(0,200,83,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: 12, padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
          color: toast.type === 'success' ? '#00C853' : '#EF4444',
          fontSize: '0.88rem', fontWeight: 600,
          backdropFilter: 'blur(12px)',
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: '#94A3B8',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem',
            transition: 'all 0.15s'
          }}
        >
          <ChevronLeft size={15} /> Kembali
        </button>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award size={24} color="#6071F0" /> Pengaturan Sertifikat
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.82rem', margin: '4px 0 0' }}>
            Upload template dan atur posisi nama siswa pada sertifikat
          </p>
        </div>
      </div>

      {/* Course Selector */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          Pilih Kelas
        </label>
        {loadingCourses ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', fontSize: '0.85rem' }}>
            <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Memuat kelas...
          </div>
        ) : (
          <select
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, padding: '10px 14px', color: '#E2E8F0', fontSize: '0.9rem',
              outline: 'none', cursor: 'pointer', width: '100%', maxWidth: 480,
            }}
          >
            <option value="" disabled style={{ background: '#1e293b' }}>— Pilih kelas —</option>
            {courses.map(c => (
              <option key={c.id} value={c.id} style={{ background: '#1e293b' }}>{c.title}</option>
            ))}
          </select>
        )}
      </div>

      {loadingSettings && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748B', padding: '40px 0' }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Memuat pengaturan sertifikat...</span>
        </div>
      )}

      {!loadingSettings && selectedCourseId && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 28, alignItems: 'start' }}>

          {/* ── Left Panel: Upload + Settings ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Upload Template */}
            <div className="glass-panel" style={{ borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '0.9rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ImageIcon size={16} color="#6071F0" /> Template Sertifikat
              </h3>

              {/* Upload zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#6071F0' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 12,
                  padding: '28px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragOver ? 'rgba(96,113,240,0.06)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s',
                  marginBottom: 12,
                }}
              >
                {uploading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#6071F0' }}>
                    <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mengupload...</span>
                  </div>
                ) : (
                  <>
                    <Upload size={28} color="#6071F0" style={{ marginBottom: 10 }} />
                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: '#E2E8F0' }}>
                      {previewUrl ? 'Ganti Template' : 'Upload Template'}
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                      Seret file ke sini atau klik untuk browse
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#475569' }}>
                      JPG, PNG, WEBP — Maks. 10MB
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileInput}
              />

              {uploadError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  color: '#EF4444', fontSize: '0.8rem', marginBottom: 8
                }}>
                  <AlertCircle size={14} /> {uploadError}
                </div>
              )}

              {previewUrl && (
                <button
                  onClick={handleRemoveTemplate}
                  style={{
                    width: '100%', padding: '8px', background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8,
                    color: '#EF4444', fontSize: '0.8rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    fontWeight: 600,
                  }}
                >
                  <Trash2 size={13} /> Hapus Template
                </button>
              )}
            </div>

            {/* Text Settings */}
            <div className="glass-panel" style={{ borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '0.9rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Type size={16} color="#6071F0" /> Pengaturan Teks Nama
              </h3>

              {/* Preview Name Input */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Nama Preview</label>
                <input
                  value={previewName}
                  onChange={e => setPreviewName(e.target.value)}
                  placeholder="Contoh nama untuk preview"
                  style={inputStyle}
                />
              </div>

              {/* Position */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>
                  Posisi Horizontal (X): <span style={{ color: '#6071F0', fontWeight: 700 }}>{posX}%</span>
                </label>
                <input
                  type="range" min={0} max={100} step={0.5} value={posX}
                  onChange={e => setPosX(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#6071F0' }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>
                  Posisi Vertikal (Y): <span style={{ color: '#6071F0', fontWeight: 700 }}>{posY}%</span>
                </label>
                <input
                  type="range" min={0} max={100} step={0.5} value={posY}
                  onChange={e => setPosY(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#6071F0' }}
                />
              </div>

              {/* Font Size */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>
                  Ukuran Font: <span style={{ color: '#6071F0', fontWeight: 700 }}>{fontSize}px</span>
                </label>
                <input
                  type="range" min={12} max={120} step={2} value={fontSize}
                  onChange={e => setFontSize(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#6071F0' }}
                />
              </div>

              {/* Color */}
              <div style={{ marginBottom: 4 }}>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Palette size={13} /> Warna Teks
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    style={{
                      width: 48, height: 48, border: 'none', borderRadius: 8,
                      cursor: 'pointer', background: 'none', padding: 0,
                    }}
                  />
                  <input
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    placeholder="#000000"
                    style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              {/* Preset colors */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                {[
                  { value: '#000000', style: { background: '#000000' } },
                  { value: '#ffffff', style: { background: '#ffffff' } },
                  { value: '#1a1a2e', style: { background: '#1a1a2e' } },
                  { value: '#C9A84C', style: { background: '#C9A84C' } },
                  { value: '#1e3a5f', style: { background: '#1e3a5f' } },
                  { value: '#4a0e2e', style: { background: '#4a0e2e' } },
                  { value: 'grad-blue-design', style: { background: 'linear-gradient(135deg, #2563EB, #153885)' }, title: 'Gradient Muda Design' },
                ].map(p => (
                  <button
                    key={p.value}
                    onClick={() => setColor(p.value)}
                    title={p.title || p.value}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: p.style.background,
                      border: color === p.value ? '3px solid #6071F0' : '2px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Certificate Code Settings */}
            <div className="glass-panel" style={{ borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '0.9rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Type size={16} color="#E040FB" /> Pengaturan Teks Nomor Sertifikat
              </h3>

              {/* Preview Code Input */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Nomor Preview</label>
                <input
                  value={previewCode}
                  onChange={e => setPreviewCode(e.target.value)}
                  placeholder="Contoh nomor sertifikat untuk preview"
                  style={inputStyle}
                />
              </div>

              {/* Position */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>
                  Posisi Horizontal (X): <span style={{ color: '#E040FB', fontWeight: 700 }}>{codePosX}%</span>
                </label>
                <input
                  type="range" min={0} max={100} step={0.5} value={codePosX}
                  onChange={e => setCodePosX(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#E040FB' }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>
                  Posisi Vertikal (Y): <span style={{ color: '#E040FB', fontWeight: 700 }}>{codePosY}%</span>
                </label>
                <input
                  type="range" min={0} max={100} step={0.5} value={codePosY}
                  onChange={e => setCodePosY(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#E040FB' }}
                />
              </div>

              {/* Font Size */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>
                  Ukuran Font: <span style={{ color: '#E040FB', fontWeight: 700 }}>{codeFontSize}px</span>
                </label>
                <input
                  type="range" min={8} max={80} step={1} value={codeFontSize}
                  onChange={e => setCodeFontSize(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#E040FB' }}
                />
              </div>

              {/* Color */}
              <div style={{ marginBottom: 4 }}>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Palette size={13} /> Warna Teks
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <input
                     type="color"
                     value={codeColor}
                     onChange={e => setCodeColor(e.target.value)}
                     style={{
                       width: 48, height: 48, border: 'none', borderRadius: 8,
                       cursor: 'pointer', background: 'none', padding: 0,
                     }}
                  />
                  <input
                    value={codeColor}
                    onChange={e => setCodeColor(e.target.value)}
                    placeholder="#000000"
                    style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              {/* Preset colors */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                {['#000000', '#ffffff', '#1a1a2e', '#C9A84C', '#1e3a5f', '#4a0e2e'].map(c => (
                  <button
                    key={c}
                    onClick={() => setCodeColor(c)}
                    title={c}
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: c,
                      border: codeColor === c ? '3px solid #E040FB' : '2px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer', padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || !previewUrl}
              style={{
                padding: '14px 24px',
                background: saving || !previewUrl ? 'rgba(96,113,240,0.3)' : 'linear-gradient(135deg, #6071F0, #8B9CF8)',
                border: 'none', borderRadius: 12,
                color: '#fff', fontWeight: 700, fontSize: '0.92rem',
                cursor: saving || !previewUrl ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {saving
                ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</>
                : <><Save size={17} /> Simpan Pengaturan</>
              }
            </button>
            {!previewUrl && (
              <p style={{ margin: '-12px 0 0', fontSize: '0.75rem', color: '#475569', textAlign: 'center' }}>
                Upload template terlebih dahulu untuk menyimpan pengaturan
              </p>
            )}
          </div>

          {/* ── Right Panel: Preview ── */}
          <div>
            <div className="glass-panel" style={{ borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '0.9rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={16} color="#6071F0" /> Preview Sertifikat
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.78rem', color: '#64748B' }}>
                Drag teks nama di bawah untuk mengatur posisi, atau gunakan slider di kiri.
              </p>

              {previewUrl ? (
                <CertificatePreview
                  templateUrl={previewUrl}
                  nameX={posX}
                  nameY={posY}
                  nameFontSize={fontSize}
                  nameColor={color}
                  previewName={previewName}
                  onNamePositionChange={(x, y) => { setPosX(x); setPosY(y); }}
                  codeX={codePosX}
                  codeY={codePosY}
                  codeFontSize={codeFontSize}
                  codeColor={codeColor}
                  previewCode={previewCode}
                  onCodePositionChange={(x, y) => { setCodePosX(x); setCodePosY(y); }}
                />
              ) : (
                <div style={{
                  borderRadius: 12, border: '2px dashed rgba(255,255,255,0.08)',
                  padding: '80px 20px', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                }}>
                  <ImageIcon size={48} color="rgba(255,255,255,0.1)" />
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.85rem' }}>
                    Upload template sertifikat terlebih dahulu untuk melihat preview
                  </p>
                </div>
              )}

              {/* Position info */}
              {previewUrl && (
                <div style={{
                  marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10
                }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6071F0', width: '100%' }}>Posisi Nama:</span>
                    {[
                      { label: 'X', value: `${posX}%` },
                      { label: 'Y', value: `${posY}%` },
                      { label: 'Font', value: `${fontSize}px` },
                      { label: 'Warna', value: color },
                    ].map(item => (
                      <div key={item.label} style={{
                        background: 'rgba(255,255,255,0.04)', borderRadius: 8,
                        padding: '6px 12px', fontSize: '0.72rem',
                      }}>
                        <span style={{ color: '#64748B' }}>{item.label}: </span>
                        <span style={{ color: '#E2E8F0', fontWeight: 600, fontFamily: 'monospace' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E040FB', width: '100%' }}>Posisi Nomor:</span>
                    {[
                      { label: 'X', value: `${codePosX}%` },
                      { label: 'Y', value: `${codePosY}%` },
                      { label: 'Font', value: `${codeFontSize}px` },
                      { label: 'Warna', value: codeColor },
                    ].map(item => (
                      <div key={item.label} style={{
                        background: 'rgba(255,255,255,0.04)', borderRadius: 8,
                        padding: '6px 12px', fontSize: '0.72rem',
                      }}>
                        <span style={{ color: '#64748B' }}>{item.label}: </span>
                        <span style={{ color: '#E2E8F0', fontWeight: 600, fontFamily: 'monospace' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!loadingSettings && !selectedCourseId && !loadingCourses && (
        <div style={{
          textAlign: 'center', padding: '80px 20px', border: '2px dashed rgba(255,255,255,0.06)',
          borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <Award size={48} color="rgba(255,255,255,0.1)" />
          <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>Pilih kelas untuk mulai mengatur sertifikat</p>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .cert-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B',
  letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 9, color: '#E2E8F0', fontSize: '0.88rem', outline: 'none',
};

export default function CertificatePage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
        Memuat halaman sertifikat...
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <CertificatePageInner />
    </Suspense>
  );
}
