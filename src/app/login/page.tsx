'use client';

import React, { useState, useEffect } from 'react';
import { loginApi } from '@/services/auth';
import type { LoginData } from '@/types/auth.types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // State for handling API consumption
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [session, setSession] = useState<LoginData | null>(null);

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
          {/* Logo (Inverted to show on dark panel) */}
          <div style={styles.logoContainer}>
            <span style={styles.logoText}>⚡ Nalara</span>
          </div>

          {!session ? (
            <>
              {/* Form Headers */}
              <h1 style={styles.formTitle}>Sign In</h1>

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
                {/* Email Field */}
                <div style={styles.inputGroup}>
                  <label htmlFor="email" style={styles.label}>E-mail</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={styles.input}
                    disabled={loading}
                  />
                </div>

                {/* Password Field */}
                <div style={styles.inputGroup}>
                  <label htmlFor="password" style={styles.label}>Password</label>
                  <div style={styles.passwordWrapper}>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan password..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={styles.inputWithIcon}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={styles.passwordToggleBtn}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--grey-blue)" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--grey-blue)" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot PW */}
                <div style={styles.rememberRow}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={styles.checkbox}
                      disabled={loading}
                    />
                    <span>Ingat saya</span>
                  </label>
                  <a href="#" style={styles.forgotLink}>Lupa Password?</a>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`nalara-btn nalara-btn-cta ${loading ? 'nalara-btn-disabled' : ''}`}
                  style={styles.submitButton}
                >
                  {loading ? (
                    <>
                      <div style={styles.spinner} />
                      <span>Memproses masuk...</span>
                    </>
                  ) : (
                    <span>Sign in</span>
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
              <h1 style={styles.successTitle}>Login Berhasil!</h1>
              <p style={styles.successSub}>
                Selamat datang kembali, <strong>{session.user.name}</strong> ({session.user.email}). Anda masuk sebagai role <strong>{session.user.role}</strong>.
              </p>

              <div style={styles.tokenBox}>
                <div style={styles.tokenLabel}>JWT Session Token:</div>
                <div style={styles.tokenText}>{session.token}</div>
              </div>

              <div style={styles.successActions}>
                <a href="/" className="nalara-btn nalara-btn-cta" style={{ textDecoration: 'none', flex: 1, textAlign: 'center' }}>
                  Masuk Dashboard
                </a>
                <button
                  onClick={handleLogout}
                  className="nalara-btn nalara-btn-secondary"
                  style={{ flex: 1 }}
                >
                  Keluar
                </button>
              </div>
            </div>
          )}
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
    background: 'var(--bg-darker)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2rem',
    zIndex: 5,
  },
  formWrapper: {
    maxWidth: '440px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  logoContainer: {
    marginBottom: '3rem',
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: 'var(--white)',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.03em',
  },
  formTitle: {
    fontSize: '2.5rem',
    fontWeight: 800,
    marginBottom: '0.5rem',
  },
  formSubtitle: {
    fontSize: '0.95rem',
    color: 'var(--grey-blue)',
    marginBottom: '2.5rem',
  },
  accentLink: {
    color: 'var(--lemon)',
    textDecoration: 'none',
    fontWeight: 600,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--grey-blue)',
  },
  input: {
    width: '100%',
    padding: '0.9rem 1.2rem',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--white)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.25s ease',
  },
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    width: '100%',
  },
  inputWithIcon: {
    width: '100%',
    padding: '0.9rem 3.2rem 0.9rem 1.2rem',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--white)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.25s ease',
  },
  passwordToggleBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
    marginTop: '0.25rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    color: 'var(--grey-blue)',
  },
  checkbox: {
    accentColor: 'var(--lemon)',
    width: '16px',
    height: '16px',
  },
  forgotLink: {
    color: 'var(--grey-blue)',
    textDecoration: 'none',
    fontWeight: 500,
  },
  submitButton: {
    width: '100%',
    padding: '0.95rem',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 700,
    marginTop: '1rem',
    gap: '0.75rem',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(0,0,0,0.1)',
    borderTopColor: 'var(--bg-dark)',
    borderRadius: '50%',
    animation: 'pulse 1s infinite linear',
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
