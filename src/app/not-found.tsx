"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={s.page}>
      {/* Background radial glows */}
      <div style={s.glow1} />
      <div style={s.glow2} />
      <div style={s.glow3} />

      {/* Grid pattern overlay */}
      <div style={s.gridOverlay} />

      <div style={{ ...s.container, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>

        {/* Logo */}
        <div style={s.logoArea}>
          <div style={s.logoIcon}>
            <span style={s.logoInitials}>N</span>
          </div>
          <span style={s.logoTitle}>Nalara</span>
        </div>

        {/* 404 Display */}
        <div style={s.errorCodeWrapper}>
          <span style={s.errorCode}>4</span>
          <div style={s.circleIcon}>
            <Search size={48} color="#4196F0" strokeWidth={1.5} />
          </div>
          <span style={s.errorCode}>4</span>
        </div>

        {/* Glowing line under 404 */}
        <div style={s.glowLine} />

        {/* Message */}
        <div style={s.textBlock}>
          <h1 style={s.title}>Halaman Tidak Ditemukan</h1>
          <p style={s.subtitle}>
            Sepertinya halaman yang kamu cari tidak ada atau sudah dipindahkan.
            <br />
            Periksa kembali URL atau kembali ke halaman utama.
          </p>
        </div>

        {/* Badge */}
        <div style={s.badge}>
          <span style={s.badgeDot} />
          <span>Error 404 — Page Not Found</span>
        </div>

        {/* Actions */}
        <div style={s.actions}>
          <button onClick={() => router.back()} style={s.btnGhost}>
            <ArrowLeft size={16} />
            <span>Kembali</span>
          </button>
          <button onClick={() => router.push('/')} style={s.btnPrimary}>
            <Home size={16} />
            <span>Ke Halaman Utama</span>
          </button>
        </div>

        {/* Decorative bottom text */}
        <p style={s.footerNote}>
          Nalara Academy &nbsp;•&nbsp; Platform Belajar Data Science
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    width: '100%',
    background: '#191919',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'var(--font-sans, Inter, sans-serif)',
  },
  glow1: {
    position: 'absolute',
    top: '-15%',
    left: '-10%',
    width: '55%',
    height: '65%',
    background: 'radial-gradient(circle, rgba(6, 99, 199, 0.14) 0%, transparent 65%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  glow2: {
    position: 'absolute',
    bottom: '-20%',
    right: '-10%',
    width: '55%',
    height: '65%',
    background: 'radial-gradient(circle, rgba(65, 150, 240, 0.10) 0%, transparent 65%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  glow3: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '40%',
    height: '40%',
    background: 'radial-gradient(circle, rgba(255, 168, 38, 0.04) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(65, 150, 240, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(65, 150, 240, 0.04) 1px, transparent 1px)
    `,
    backgroundSize: '48px 48px',
    pointerEvents: 'none',
    zIndex: 0,
  },
  container: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '40px 24px',
    maxWidth: 560,
    width: '100%',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 48,
    opacity: 0.85,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #0663C7, #0671E0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 16px rgba(6, 113, 224, 0.4)',
  },
  logoInitials: {
    fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
    fontWeight: 700,
    color: '#fff',
    fontSize: '0.9rem',
  },
  logoTitle: {
    fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
    fontWeight: 700,
    color: '#F5F7FA',
    fontSize: '1.1rem',
    letterSpacing: '-0.02em',
  },
  errorCodeWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    animation: 'float 4s ease-in-out infinite',
  },
  errorCode: {
    fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
    fontSize: 'clamp(80px, 15vw, 130px)',
    fontWeight: 800,
    lineHeight: 1,
    background: 'linear-gradient(135deg, #4196F0 0%, #0663C7 50%, #ABBED1 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.04em',
  },
  circleIcon: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    background: 'rgba(33, 33, 33, 0.8)',
    border: '1px solid rgba(65, 150, 240, 0.25)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 32px rgba(6, 113, 224, 0.2), inset 0 0 24px rgba(65, 150, 240, 0.05)',
    flexShrink: 0,
  },
  glowLine: {
    width: 180,
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(65, 150, 240, 0.6), transparent)',
    marginTop: 28,
    marginBottom: 32,
    animation: 'pulseGlow 2.5s ease-in-out infinite',
  },
  textBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    fontWeight: 700,
    color: '#F5F7FA',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.92rem',
    color: '#ABBED1',
    lineHeight: 1.7,
    margin: 0,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '5px 14px',
    borderRadius: 20,
    background: 'rgba(65, 150, 240, 0.08)',
    border: '1px solid rgba(65, 150, 240, 0.18)',
    color: '#4196F0',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.03em',
    marginBottom: 32,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#4196F0',
    display: 'inline-block',
    animation: 'pulseGlow 2s ease-in-out infinite',
  },
  actions: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 48,
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'linear-gradient(135deg, #0663C7, #0671E0)',
    color: '#fff',
    border: 'none',
    padding: '11px 22px',
    borderRadius: 10,
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(6, 113, 224, 0.3)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    fontFamily: 'var(--font-sans, Inter, sans-serif)',
  },
  btnGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(33, 33, 33, 0.7)',
    color: '#ABBED1',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '11px 22px',
    borderRadius: 10,
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    backdropFilter: 'blur(12px)',
    transition: 'border-color 0.15s, color 0.15s',
    fontFamily: 'var(--font-sans, Inter, sans-serif)',
  },
  footerNote: {
    fontSize: '0.75rem',
    color: '#4D4D4D',
    letterSpacing: '0.03em',
    margin: 0,
  },
};
