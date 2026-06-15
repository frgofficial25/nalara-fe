'use client';

import React, { useState, useEffect } from 'react';

export default function ComingSoonPage() {
  // Let's set a target date for the launch: Wednesday, 22 Juli 2026 13:00 (Technical Meeting)
  const targetDate = new Date('2026-07-20T13:00:00').getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div style={styles.container}>
      {/* Background Gradients */}
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      {/* Floating Sparkles / Particles for Tech Feel */}
      <div style={styles.particleContainer}>
        <div style={{ ...styles.particle, top: '15%', left: '25%', animationDelay: '0s' }} />
        <div style={{ ...styles.particle, top: '45%', left: '75%', animationDelay: '2s' }} />
        <div style={{ ...styles.particle, top: '75%', left: '15%', animationDelay: '4s' }} />
      </div>

      <div style={styles.contentCard}>
        {/* Badge */}
        <span className="badge-tech badge-tech-accent" style={{ alignSelf: 'center', marginBottom: '1.5rem' }}>
          nalara.academy
        </span>

        {/* Heading */}
        <h1 style={styles.heading}>
          <span style={styles.gradientText}>COMING SOON</span>
        </h1>

        {/* Description */}
        <p style={styles.description}>
          Sistem manajemen pembelajaran interaktif berbasis AI, bank soal evaluasi otomatis, serta visualisasi progres pembelajaran sedang dalam proses pengembangan akhir oleh Divisi PIT (Platform, Information &amp; Technology).
        </p>

        {/* Countdown */}
        <div style={styles.countdownContainer}>
          <div style={styles.countdownItem}>
            <span style={styles.countdownNumber}>{String(timeLeft.days).padStart(2, '0')}</span>
            <span style={styles.countdownLabel}>Hari</span>
          </div>
          <div style={styles.countdownSeparator}>:</div>
          <div style={styles.countdownItem}>
            <span style={styles.countdownNumber}>{String(timeLeft.hours).padStart(2, '0')}</span>
            <span style={styles.countdownLabel}>Jam</span>
          </div>
          <div style={styles.countdownSeparator}>:</div>
          <div style={styles.countdownItem}>
            <span style={styles.countdownNumber}>{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span style={styles.countdownLabel}>Menit</span>
          </div>
          <div style={styles.countdownSeparator}>:</div>
          <div style={styles.countdownItem}>
            <span style={{ ...styles.countdownNumber, color: 'var(--lemon)' }}>{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span style={styles.countdownLabel}>Detik</span>
          </div>
        </div>

        {/* Subscription Form */}
        <div style={styles.formContainer}>
          {!subscribed ? (
            <form onSubmit={handleSubscribe} style={styles.form}>
              <input
                type="email"
                placeholder="Masukkan email Anda..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
              <button type="submit" className="nalara-btn nalara-btn-cta" style={styles.submitBtn}>
                Kabari Saya
              </button>
            </form>
          ) : (
            <div style={styles.successMessage}>
              <span style={styles.successIcon}>✓</span>
              <span>Terima kasih! Kami akan mengirimkan notifikasi saat platform diluncurkan.</span>
            </div>
          )}
        </div>

        {/* Actions / Social / Links */}
        <div style={styles.actions}>
          <a href="/" style={styles.backLink}>
            ← Kembali ke Landing Page
          </a>
          <div style={styles.actionDivider} />
          <a href="/quiz" style={styles.backLink}>
            Coba Demo Quiz Engine →
          </a>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-dark)',
    position: 'relative',
    overflow: 'hidden',
    padding: '2rem 1.5rem',
  },
  glow1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
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
    width: '6px',
    height: '6px',
    background: 'var(--azure)',
    borderRadius: '50%',
    boxShadow: '0 0 10px var(--azure)',
    animation: 'pulse 3s infinite ease-in-out',
  },
  contentCard: {
    maxWidth: '750px',
    width: '100%',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--border-color)',
    borderRadius: '24px',
    padding: '3.5rem 2.5rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
  heading: {
    fontSize: '3rem',
    fontWeight: 800,
    lineHeight: 1.2,
    marginBottom: '1.5rem',
    letterSpacing: '-0.02em',
  },
  gradientText: {
    background: 'linear-gradient(90deg, var(--azure) 0%, var(--lemon) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  description: {
    fontSize: '1.05rem',
    color: 'var(--grey-blue)',
    lineHeight: 1.6,
    maxWidth: '600px',
    margin: '0 auto 3rem auto',
  },
  countdownContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '3.5rem',
    flexWrap: 'wrap',
  },
  countdownItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '80px',
  },
  countdownNumber: {
    fontSize: '3.5rem',
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    color: 'var(--white)',
    lineHeight: 1,
  },
  countdownLabel: {
    fontSize: '0.8rem',
    color: 'var(--l-grey)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginTop: '0.5rem',
  },
  countdownSeparator: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: 'var(--border-color)',
    paddingBottom: '1.5rem',
  },
  formContainer: {
    maxWidth: '500px',
    width: '100%',
    margin: '0 auto 3rem auto',
  },
  form: {
    display: 'flex',
    gap: '0.75rem',
    width: '100%',
    flexWrap: 'wrap',
  },
  input: {
    flex: '1 1 250px',
    padding: '0.85rem 1.25rem',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--white)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.25s ease',
  },
  submitBtn: {
    padding: '0.85rem 1.75rem',
    borderRadius: '10px',
  },
  successMessage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    color: 'var(--lemon)',
    fontSize: '0.95rem',
    background: 'rgba(255, 168, 38, 0.08)',
    border: '1px solid rgba(255, 168, 38, 0.2)',
    padding: '1rem',
    borderRadius: '10px',
  },
  successIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'var(--lemon)',
    color: 'var(--bg-dark)',
    fontWeight: 800,
    fontSize: '0.8rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1.5rem',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '2rem',
    flexWrap: 'wrap',
  },
  backLink: {
    color: 'var(--azure)',
    fontSize: '0.95rem',
    textDecoration: 'none',
    fontWeight: 600,
    transition: 'color 0.2s ease',
  },
  actionDivider: {
    width: '1px',
    height: '15px',
    background: 'var(--border-color)',
  },
};
