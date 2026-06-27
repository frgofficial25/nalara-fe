'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginApi } from '@/services/auth';
import type { LoginData } from '@/types/auth.types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  
  // State for handling API consumption
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [session, setSession] = useState<LoginData | null>(null);

  // Auto-redirect if already logged in
  useEffect(() => {
    const data = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
    if (data) {
      try {
        const userObj = JSON.parse(data);
        const role = userObj.role?.toLowerCase();
        if (role === 'superadmin') {
          router.push('/superadmin/dashboard');
        } else if (role === 'lecture' || role === 'lecturer') {
          router.push('/lecturer/dashboard');
        } else if (role === 'mentor' || role === 'tentor') {
          router.push('/tentor/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      } catch (e) {
        console.error('Failed to auto-redirect:', e);
      }
    }
  }, [router]);

  // Carousel State for Left Panel
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselSlides = [
    {
      title: 'Akselerasi Belajar AI Lebih Cepat',
      desc: 'Pelajari machine learning, deep learning, dan MLOps langsung dari riset dan standar industri terdepan bersama FR Group FILKOM UB.',
    },
    {
      title: 'Engine Evaluasi Cerdas Berbasis AI',
      desc: 'Dapatkan koreksi jawaban instan, feedback personal, dan rekomendasi jalur belajar dinamis yang menyesuaikan pemahaman Anda.',
    },
    {
      title: 'Akses GPU Node Eksklusif',
      desc: 'Setiap level pembelajaran dilengkapi akses cluster komputasi khusus untuk pelatihan model AI berukuran besar secara langsung.',
    }
  ];

  // Auto-slide carousel
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 6000);
    return () => clearInterval(slideInterval);
  }, [carouselSlides.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await loginApi({ email, password, rememberMe });
      if (response.success && response.data) {
        setSuccessMsg(response.message);
        setSession(response.data);
        
        // Simpan data user ke storage untuk layout/header info
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('nalara_user_info', JSON.stringify(response.data.user));
        
        // Redirect based on role
        const role = response.data.user.role.toLowerCase();
        if (role === 'superadmin') {
          router.push('/superadmin/dashboard');
        } else if (role === 'lecture' || role === 'lecturer') {
          router.push('/lecturer/dashboard');
        } else if (role === 'mentor' || role === 'tentor') {
          router.push('/tentor/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      } else {
        setErrorMsg(response.message || 'Terjadi kesalahan saat masuk.');
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Gagal terhubung ke server. Periksa koneksi internet Anda.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Social login tidak tersedia di API saat ini

  const handleLogout = () => {
    setSession(null);
    setSuccessMsg('');
    setEmail('');
    setPassword('');
  };

  return (
    <div style={styles.pageContainer}>
      {/* LEFT PANEL: Showcase (Hidden on Mobile) */}
      <div style={styles.leftPanel} className="login-left-panel">
        {/* Glow backgrounds */}
        <div style={styles.glow1} />
        <div style={styles.glow2} />


        {/* Glassmorphic Presentation Wrapper */}
        <div style={styles.showcaseContent}>
          {/* Visual Presentation Section (Mock IDE / Terminal Window) */}
          <div style={styles.ideShowcaseWrapper}>
            <div style={styles.ideWindow}>
              {/* Window Bar */}
              <div style={styles.ideHeader}>
                <div style={styles.windowDots}>
                  <span style={{ ...styles.dotDot, background: '#FF5F56' }} />
                  <span style={{ ...styles.dotDot, background: '#FFBD2E' }} />
                  <span style={{ ...styles.dotDot, background: '#27C93F' }} />
                </div>
                <span style={styles.ideTitle}>nalara_net.py</span>
                <span style={styles.ideLang}>python</span>
              </div>
              
              {/* Code Editor Body */}
              <div style={styles.ideBody}>
                <div style={styles.codeLine}><span style={{ color: 'var(--lemon)' }}>import</span> torch</div>
                <div style={styles.codeLine}><span style={{ color: 'var(--lemon)' }}>import</span> torch.nn <span style={{ color: 'var(--lemon)' }}>as</span> nn</div>
                <div style={styles.codeLine} />
                <div style={styles.codeLine}><span style={{ color: 'var(--azure)' }}>class</span> <span style={{ color: 'var(--white)', fontWeight: 600 }}>NalaraNet</span>(nn.Module):</div>
                <div style={styles.codeLine}>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--azure)' }}>def</span> <span style={{ color: 'var(--white)' }}>__init__</span>(self):</div>
                <div style={styles.codeLine}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;super().__init__()</div>
                <div style={styles.codeLine}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;self.model = nn.Sequential(</div>
                <div style={styles.codeLine}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;nn.Linear(<span style={{ color: 'var(--lemon)' }}>512</span>, <span style={{ color: 'var(--lemon)' }}>128</span>),</div>
                <div style={styles.codeLine}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;nn.ReLU(),</div>
                <div style={styles.codeLine}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;nn.Linear(<span style={{ color: 'var(--lemon)' }}>128</span>, <span style={{ color: 'var(--lemon)' }}>10</span>)</div>
                <div style={styles.codeLine}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div>
              </div>

              {/* Terminal Execution Output */}
              <div style={styles.ideTerminal}>
                <div style={styles.terminalHeader}>
                  <span style={styles.terminalDot} />
                  <span>Terminal - GPU Cluster Node #4</span>
                </div>
                <div style={styles.terminalOutput}>
                  <span style={{ color: 'var(--grey)' }}>$ python train.py</span>
                  <br />
                  <span style={{ color: 'var(--azure)' }}>[Nalara Engine]</span> Epoch 5/5 | Loss: 0.0143 | Acc: 99.1%
                  <span style={styles.terminalCursor} />
                </div>
              </div>
            </div>

            {/* Floating GPU Status Badge */}
            <div style={styles.gpuWidget}>
              <div style={styles.gpuPulseDot} />
              <div style={styles.gpuText}>
                <div style={styles.gpuLabel}>GPU Node #4 Active</div>
                <div style={styles.gpuValue}>V100 - Temp 68°C</div>
              </div>
            </div>
          </div>

          {/* Core Feature Text Carousel */}
          <div style={styles.carouselSection}>
            <div style={styles.carouselSlideContainer}>
              <h2 style={styles.carouselTitle}>
                {carouselSlides[activeSlide].title}
              </h2>
              <p style={styles.carouselDesc}>
                {carouselSlides[activeSlide].desc}
              </p>
            </div>

            {/* Dots */}
            <div style={styles.carouselDots}>
              {carouselSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  style={{
                    ...styles.dot,
                    background: idx === activeSlide ? 'var(--lemon)' : 'rgba(255, 255, 255, 0.2)',
                    width: idx === activeSlide ? '24px' : '8px',
                  }}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Form Container */}
      <div style={styles.rightPanel} className="login-right-panel">
        <div style={styles.formWrapper}>
          {/* Logo */}
          <div style={styles.logoContainer}>
            <img src="/image/logonalara2.png" alt="Nalara Academy Logo" style={{ height: '80px', objectFit: 'contain' }} />
          </div>

          {!session ? (
            <>
              {/* Form Headers */}
              <h1 style={styles.formTitle}>Welcome Nalarians!</h1>
              <p style={styles.formSubtitle}>Sign in with your Nalara accounts credentials to access your learning workspace.</p>

              {/* API Alert Banners */}
              {errorMsg && (
                <div style={styles.errorBanner}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSubmit} style={styles.form}>
                {/* Username Field */}
                <div style={styles.inputGroup}>
                  <label htmlFor="username" style={styles.label}>Username</label>
                  <div style={styles.inputIconWrapper}>
                    <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={styles.inputWithLeftIcon}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div style={styles.inputGroup}>
                  <label htmlFor="password" style={styles.label}>Password</label>
                  <div style={styles.passwordWrapper}>
                    <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0110 0v4"></path>
                    </svg>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={styles.inputWithBothIcons}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={styles.passwordToggleBtn}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={styles.submitButton}
                >
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <div style={styles.spinner} />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>

            </>
          ) : (
            /* Logged in success state */
            <div style={styles.successState}>
              <div style={styles.successIconWrapper}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--lemon)" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 style={styles.successTitle}>Login Successful!</h1>
              <p style={styles.successSub}>
                Welcome back, <strong>{session.user.name}</strong> ({session.user.email}). You are logged in as <strong>{session.user.role}</strong>.
                <br /><br />
                Redirecting to dashboard...
              </p>

              <div style={styles.successActions}>
                <a href="/" style={{ ...styles.submitButton, textDecoration: 'none', textAlign: 'center', display: 'block' }}>
                  Go to Dashboard
                </a>
              </div>
            </div>
          )}
        </div>
        <div style={styles.footerText}>
            @ 2026 Nalara Academy. All rights reserved.
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    background: 'var(--bg-darker)',
    color: 'var(--white)',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  // Showcase Panel (Left)
  leftPanel: {
    flex: '1.2 1 0%',
    background: 'var(--bg-dark)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    borderRight: '1px solid var(--border-color)',
    padding: '3rem',
    justifyContent: 'space-between',
    // We handle responsive hiding via styles + media queries or checking client widths if needed, 
    // but a standard responsive flex-wrap will also handle it.
  },
  glow1: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(6,99,199,0.15) 0%, transparent 75%)',
    top: '-200px',
    left: '-200px',
    pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,168,38,0.08) 0%, transparent 75%)',
    bottom: '-200px',
    right: '-100px',
    pointerEvents: 'none',
  },
  supportHeader: {
    display: 'flex',
    justifyContent: 'flex-start',
    zIndex: 5,
  },
  supportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--grey-blue)',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: 600,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-color)',
    padding: '0.6rem 1.2rem',
    borderRadius: '9999px',
    transition: 'all var(--transition-fast)',
  },
  showcaseContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
    zIndex: 5,
    maxWidth: '550px',
    margin: '0 auto',
    width: '100%',
    gap: '4rem',
  },
  ideShowcaseWrapper: {
    position: 'relative',
    display: 'flex',
    height: '340px',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  ideWindow: {
    width: '100%',
    maxWidth: '420px',
    background: 'rgba(25, 25, 25, 0.75)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '0.8rem',
  },
  ideHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.6rem 1rem',
    background: 'rgba(0, 0, 0, 0.3)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  windowDots: {
    display: 'flex',
    gap: '6px',
    marginRight: '1.5rem',
  },
  dotDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  ideTitle: {
    color: 'var(--grey-blue)',
    flex: 1,
    textAlign: 'center',
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
  },
  ideLang: {
    color: 'var(--grey)',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
  },
  ideBody: {
    padding: '1.25rem',
    color: 'var(--grey-blue)',
    lineHeight: '1.5',
    textAlign: 'left',
    background: 'rgba(0, 0, 0, 0.15)',
  },
  codeLine: {
    whiteSpace: 'pre',
  },
  ideTerminal: {
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    background: 'rgba(0, 0, 0, 0.5)',
    padding: '0.75rem 1.25rem',
    textAlign: 'left',
  },
  terminalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.7rem',
    color: 'var(--grey)',
    marginBottom: '0.35rem',
  },
  terminalDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--lemon)',
  },
  terminalOutput: {
    color: 'var(--white)',
    lineHeight: '1.4',
  },
  terminalCursor: {
    display: 'inline-block',
    width: '6px',
    height: '13px',
    background: 'var(--lemon)',
    marginLeft: '5px',
  },
  gpuWidget: {
    position: 'absolute',
    bottom: '-15px',
    right: '-10px',
    background: 'rgba(33, 33, 33, 0.85)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '0.6rem 1rem',
    boxShadow: '0 12px 24px rgba(0,0,0,0.5)',
    zIndex: 5,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  gpuPulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#27C93F',
    boxShadow: '0 0 8px #27C93F',
  },
  gpuText: {
    textAlign: 'left',
  },
  gpuLabel: {
    fontSize: '0.65rem',
    color: 'var(--grey-blue)',
    fontWeight: 600,
  },
  gpuValue: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--white)',
  },
  // Carousel Section
  carouselSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  carouselSlideContainer: {
    minHeight: '120px',
  },
  carouselTitle: {
    fontSize: '1.75rem',
    fontWeight: 800,
    lineHeight: 1.3,
    marginBottom: '0.75rem',
  },
  carouselDesc: {
    fontSize: '0.95rem',
    color: 'var(--grey-blue)',
    lineHeight: 1.6,
  },
  carouselDots: {
    display: 'flex',
    gap: '6px',
  },
  dot: {
    height: '8px',
    borderRadius: '99px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  
  // Right Panel: Form
  rightPanel: {
    flex: '1 1 0%',
    background: '#111827',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2rem',
    position: 'relative',
    zIndex: 5,
  },
  formWrapper: {
    maxWidth: '400px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '2rem',
  },
  logoIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  logoTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: '2px',
  },
  logoNalara: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#3B82F6',
    letterSpacing: '0.3em',
  },
  logoAcademy: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#F59E0B',
    letterSpacing: '0.35em',
  },
  formTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#F9FAFB',
    marginBottom: '0.75rem',
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: '0.875rem',
    color: '#9CA3AF',
    marginBottom: '2rem',
    textAlign: 'center',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#D1D5DB',
  },
  inputIconWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#6B7280',
  },
  inputWithLeftIcon: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 2.5rem',
    borderRadius: '6px',
    border: '1px solid #374151',
    background: '#1F2937',
    color: '#F9FAFB',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  inputWithBothIcons: {
    width: '100%',
    padding: '0.75rem 2.5rem 0.75rem 2.5rem',
    borderRadius: '6px',
    border: '1px solid #374151',
    background: '#1F2937',
    color: '#F9FAFB',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  passwordToggleBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberRow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.875rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    color: '#9CA3AF',
  },
  checkbox: {
    accentColor: '#3B82F6',
    width: '14px',
    height: '14px',
    cursor: 'pointer',
  },
  submitButton: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: 600,
    marginTop: '0.5rem',
    background: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#FFFFFF',
    borderRadius: '50%',
    animation: 'pulse 1s infinite linear',
  },
  supportText: {
    textAlign: 'center',
    fontSize: '0.75rem',
    color: '#9CA3AF',
    marginTop: '1rem',
    lineHeight: '1.5',
  },
  supportLink: {
    color: '#3B82F6',
    textDecoration: 'none',
  },
  footerText: {
    position: 'absolute',
    bottom: '2rem',
    width: '100%',
    textAlign: 'center',
    fontSize: '0.75rem',
    color: '#6B7280',
  },
  separator: {
    display: 'flex',
    alignItems: 'center',
    margin: '2rem 0',
    width: '100%',
  },
  line: {
    flex: 1,
    height: '1px',
    background: 'var(--border-color)',
  },
  separatorText: {
    padding: '0 1rem',
    fontSize: '0.75rem',
    color: 'var(--grey)',
    fontWeight: 700,
    letterSpacing: '0.05em',
  },
  socialGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  socialBtn: {
    width: '100%',
    padding: '0.85rem',
    borderRadius: '10px',
    background: 'transparent',
    border: '1px solid var(--border-color)',
    color: 'var(--white)',
    fontWeight: 600,
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  socialIcon: {
    flexShrink: 0,
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: 'rgba(234, 67, 53, 0.1)',
    border: '1px solid rgba(234, 67, 53, 0.25)',
    color: '#EA4335',
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    fontSize: '0.85rem',
    marginBottom: '1.5rem',
    lineHeight: 1.4,
  },
  // Success state UI
  successState: {
    textAlign: 'center',
    padding: '2rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  successIconWrapper: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'rgba(255, 168, 38, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  successTitle: {
    fontSize: '2rem',
    fontWeight: 800,
    marginBottom: '1rem',
  },
  successSub: {
    fontSize: '1rem',
    color: 'var(--grey-blue)',
    lineHeight: 1.6,
    marginBottom: '2rem',
  },
  tokenBox: {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '1rem',
    textAlign: 'left',
    marginBottom: '2rem',
  },
  tokenLabel: {
    fontSize: '0.7rem',
    color: 'var(--grey)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
  },
  tokenText: {
    fontSize: '0.8rem',
    fontFamily: 'monospace',
    color: 'var(--azure)',
    wordBreak: 'break-all',
  },
  successActions: {
    display: 'flex',
    gap: '1rem',
    width: '100%',
  },
};
