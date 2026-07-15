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
        sessionStorage.setItem('show_login_toast', 'true');
        
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

  return (
    <>
      <style>{`
        @keyframes floatGentle {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes glowPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
        @keyframes floatParticle1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -40px); }
        }
        @keyframes floatParticle2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-40px, 30px); }
        }
        @keyframes floatParticle3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(25px, 25px); }
        }

        .login-card {
          animation: scaleUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, floatGentle 8s infinite ease-in-out 0.8s;
          max-width: 460px;
          width: 100%;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 24px;
          padding: 3rem 2.5rem;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
          z-index: 10;
        }

        .input-field {
          width: 100%;
          padding: 0.85rem 1rem 0.85rem 2.75rem;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.03);
          color: var(--white);
          font-size: 0.95rem;
          outline: none;
          transition: all 0.25s ease;
        }

        .input-field:focus {
          border-color: var(--azure);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 3px rgba(6, 99, 199, 0.2);
        }

        .login-btn {
          width: 100%;
          padding: 0.85rem;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          background: var(--azure);
          color: var(--white);
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 14px rgba(6, 99, 199, 0.3);
        }

        .login-btn:hover:not(:disabled) {
          background: var(--azure-hover, #0b76ee);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(6, 99, 199, 0.4);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner-custom {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: var(--white);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={styles.container}>
        {/* Background Gradients from ComingSoon */}
        <div style={{ ...styles.glow1, animation: 'glowPulse 12s infinite ease-in-out' }} />
        <div style={{ ...styles.glow2, animation: 'glowPulse 15s infinite ease-in-out 3s' }} />

        {/* Floating Sparkles / Particles for Tech Feel */}
        <div style={styles.particleContainer}>
          <div style={{ ...styles.particle, width: '6px', height: '6px', top: '12%', left: '8%', animation: 'floatParticle1 8s infinite ease-in-out' }} />
          <div style={{ ...styles.particle, width: '9px', height: '9px', top: '20%', left: '88%', animation: 'floatParticle2 10s infinite ease-in-out' }} />
          <div style={{ ...styles.particle, width: '7px', height: '7px', top: '82%', left: '10%', animation: 'floatParticle3 9s infinite ease-in-out' }} />
          <div style={{ ...styles.particle, width: '5px', height: '5px', top: '85%', left: '85%', animation: 'floatParticle2 12s infinite ease-in-out reverse' }} />
          <div style={{ ...styles.particle, width: '8px', height: '8px', top: '50%', left: '5%', animation: 'floatParticle1 11s infinite ease-in-out reverse' }} />
        </div>

        {/* Centered Login Card */}
        <div className="login-card">
          {/* Logo */}
          <div style={styles.logoContainer}>
            <img src="/image/logonalara2.png" alt="Nalara Academy Logo" style={{ height: '70px', objectFit: 'contain' }} />
          </div>

          {!session ? (
            <>
              {/* Form Header */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={styles.formTitle}>Welcome Nalarians!</h1>
                <p style={styles.formSubtitle}>Sign in with your credentials to access your workspace.</p>
              </div>

              {/* Error Banner */}
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

              {/* Login Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Username Input */}
                <div style={styles.inputGroup}>
                  <label htmlFor="username" style={styles.label}>Username</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
                      className="input-field"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div style={styles.inputGroup}>
                  <label htmlFor="password" style={styles.label}>Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
                      className="input-field"
                      style={{ paddingRight: '2.75rem' }}
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

                {/* Remember Me Checkbox */}
                <div style={styles.rememberRow}>
                  <label htmlFor="rememberMe" style={styles.checkboxLabel}>
                    <input
                      id="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={styles.checkbox}
                    />
                    <span>Remember me</span>
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="login-btn"
                >
                  {loading ? (
                    <>
                      <div className="spinner-custom" />
                      <span>Signing in...</span>
                    </>
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
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--lemon)" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 style={styles.successTitle}>Success!</h1>
              <p style={styles.successSub}>
                Welcome back, <strong>{session.user.name}</strong>.
                <br /><br />
                Redirecting to dashboard...
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={styles.footerText}>
          &copy; 2026 Nalara Academy. All rights reserved.
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0B0E14',
    position: 'relative',
    overflow: 'hidden',
    padding: '2rem 1.5rem',
  },
  glow1: {
    position: 'absolute',
    width: '450px',
    height: '450px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(6,99,199,0.15) 0%, transparent 70%)',
    top: '-100px',
    left: '-100px',
    pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,168,38,0.08) 0%, transparent 70%)',
    bottom: '-150px',
    right: '-100px',
    pointerEvents: 'none',
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    background: 'var(--azure)',
    borderRadius: '50%',
    boxShadow: '0 0 10px var(--azure)',
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  formTitle: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--white)',
    marginBottom: '0.5rem',
  },
  formSubtitle: {
    fontSize: '0.875rem',
    color: 'var(--grey-blue)',
    lineHeight: 1.4,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#D1D5DB',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#6B7280',
    pointerEvents: 'none',
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
    fontSize: '0.85rem',
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
    width: '15px',
    height: '15px',
    cursor: 'pointer',
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
  successState: {
    textAlign: 'center',
    padding: '1.5rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  successIconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(255, 168, 38, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.25rem',
  },
  successTitle: {
    fontSize: '1.75rem',
    fontWeight: 800,
    marginBottom: '0.75rem',
    color: 'var(--white)',
  },
  successSub: {
    fontSize: '0.95rem',
    color: 'var(--grey-blue)',
    lineHeight: 1.5,
  },
  footerText: {
    position: 'absolute',
    bottom: '1.5rem',
    width: '100%',
    textAlign: 'center',
    fontSize: '0.75rem',
    color: '#4b5563',
  },
};
