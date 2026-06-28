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
    <>
      <style>{`
        .content-card-custom {
          max-width: 1000px !important;
          min-height: 75vh !important;
          padding: 3.5rem 3rem !important;
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 4.5rem !important;
          text-align: left !important;
        }
        .card-left {
          flex: 1.1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .card-right {
          flex: 0.9;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .logo-img {
          max-width: 220px;
          margin-bottom: 2rem;
        }
        .poster-img {
          width: 100%;
          max-width: 450px;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          object-fit: contain;
          transition: transform 0.3s ease;
        }
        .poster-img:hover {
          transform: translateY(-3px) scale(1.02);
        }
        .countdown-container-custom {
          justify-content: flex-start !important;
        }
        .mobile-hint {
          display: none;
        }
        @media (max-width: 900px) {
          .content-card-custom {
            flex-direction: column !important;
            padding: 2.5rem 1.5rem !important;
            gap: 2.5rem !important;
            text-align: center !important;
          }
          .card-left {
            align-items: center;
            text-align: center;
            order: 1;
            display: flex;
            flex-direction: column;
          }
          .card-right {
            order: 2;
          }
          .poster-img {
            max-width: 320px;
          }
          .cta-container-inner {
            order: -1 !important;
            align-items: center !important;
            width: 100% !important;
            background: rgba(255, 168, 38, 0.05);
            padding: 1.5rem;
            border-radius: 16px;
            border: 1px solid rgba(255, 168, 38, 0.2);
            margin-bottom: 2rem !important;
          }
          .mobile-hint {
            display: inline-block !important;
            font-size: 0.75rem !important;
            font-weight: 600 !important;
            color: var(--sky) !important;
            background: rgba(6, 99, 199, 0.4) !important;
            padding: 0.35rem 0.85rem !important;
            border-radius: 20px !important;
            margin-bottom: 1rem !important;
            border: 1px solid rgba(65, 150, 240, 0.3) !important;
            letter-spacing: 0.05em !important;
            order: 1 !important;
          }
          .nalara-btn-cta {
            order: 2 !important;
            width: 100%;
            max-width: 300px;
          }
          .cta-heading-inner {
            order: 3 !important;
            font-size: 0.85rem !important;
            font-weight: 600 !important;
            margin-top: 1rem !important;
            margin-bottom: 0 !important;
            text-align: center !important;
            width: 100% !important;
          }
          .countdown-container-custom {
            justify-content: center !important;
            flex-wrap: nowrap !important;
            gap: 0.5rem !important;
          }
          .countdown-container-custom > div {
            min-width: 45px !important;
          }
          .countdown-container-custom > div:nth-child(even) {
            min-width: auto !important;
            font-size: 1.5rem !important;
            padding-bottom: 0.5rem !important;
          }
          .countdown-container-custom > div:nth-child(odd) > span:first-child {
            font-size: 1.8rem !important;
          }
          .countdown-container-custom > div:nth-child(odd) > span:last-child {
            font-size: 0.7rem !important;
          }
        }
      `}</style>
      <div style={styles.container}>
        {/* Background Gradients */}
        <div style={{ ...styles.glow1, animation: 'glowPulse 12s infinite ease-in-out' }} />
        <div style={{ ...styles.glow2, animation: 'glowPulse 15s infinite ease-in-out 3s' }} />

        {/* Floating Sparkles / Particles for Tech Feel */}
        <div style={styles.particleContainer}>
          <div style={{ ...styles.particle, width: '6px', height: '6px', top: '12%', left: '8%', animation: 'pulse 4s infinite ease-in-out, floatParticle1 8s infinite ease-in-out' }} />
          <div style={{ ...styles.particle, width: '9px', height: '9px', top: '20%', left: '88%', animation: 'pulse 5s infinite ease-in-out, floatParticle2 10s infinite ease-in-out' }} />
          <div style={{ ...styles.particle, width: '7px', height: '7px', top: '82%', left: '10%', animation: 'pulse 6s infinite ease-in-out, floatParticle3 9s infinite ease-in-out' }} />
          <div style={{ ...styles.particle, width: '5px', height: '5px', top: '85%', left: '85%', animation: 'pulse 4.5s infinite ease-in-out, floatParticle2 12s infinite ease-in-out reverse' }} />
          <div style={{ ...styles.particle, width: '8px', height: '8px', top: '50%', left: '5%', animation: 'pulse 5.5s infinite ease-in-out, floatParticle1 11s infinite ease-in-out reverse' }} />
        </div>

        <div className="content-card-custom" style={{ ...styles.contentCard, animation: 'scaleUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards, floatGentle 8s infinite ease-in-out 1s' }}>

          <div className="card-left">
            {/* Logo */}
            <img src="/image/logonalara2.png" alt="Logo Nalara" className="logo-img stagger-in" />

            {/* Heading */}
            <h1 style={{ ...styles.heading, fontSize: '3rem', marginBottom: '0.8rem', textAlign: 'inherit' }} className="stagger-in animate-delay-2">
              <span style={styles.gradientText}>COMING SOON</span>
            </h1>

            {/* Description */}
            <p style={{ ...styles.description, fontSize: '1.1rem', margin: '0 0 2rem 0', maxWidth: 'none', textAlign: 'inherit' }} className="stagger-in animate-delay-3">
              Tim PIT Nalara sedang memasak sesuatu yang besar untuk para Future Nalarians.
              <br />
              <span style={{ fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.75rem', padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'rgba(228, 64, 95, 0.1)', border: '1px solid rgba(228, 64, 95, 0.3)', color: '#E1306C', fontWeight: 600 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                instagram : <a href="https://www.instagram.com/nalaraacademy" target="_blank" rel="noopener noreferrer" style={{ color: '#E1306C', textDecoration: 'none' }}>@nalaraacademy</a>
              </span>
            </p>

            {/* CTA Button */}
            <div className="stagger-in animate-delay-4 cta-container-inner" style={{ ...styles.ctaContainer, flexDirection: 'column', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
              <div className="mobile-hint">
                KLIK DAFTAR SEKARANG
              </div>
              <h3 className="cta-heading-inner" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--lemon)', marginBottom: '1rem', marginTop: 0, letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1.4, textAlign: 'left' }}>
                LIMITED SEATS! ONLY 150! JOINN NOW! 100% OFF! T&C Applied!
              </h3>
              <a
                href="https://forms.gle/mRVMULpuokZpVLJZ9"
                target="_blank"
                rel="noopener noreferrer"
                className="nalara-btn-cta"
                style={{ ...styles.ctaButton, padding: '1rem 2rem', fontSize: '1.1rem' }}
              >
                DAFTAR SEKARANG!
              </a>
            </div>

            {/* Countdown */}
            <div className="countdown-container-custom stagger-in animate-delay-5" style={{ ...styles.countdownContainer, marginBottom: '0', gap: '1rem' }}>
              <div style={{ ...styles.countdownItem, minWidth: '65px' }}>
                <span style={{ ...styles.countdownNumber, fontSize: '2.5rem' }}>{String(timeLeft.days).padStart(2, '0')}</span>
                <span style={{ ...styles.countdownLabel, fontSize: '0.85rem', marginTop: '0.5rem' }}>Hari</span>
              </div>
              <div style={{ ...styles.countdownSeparator, fontSize: '2rem', paddingBottom: '0.8rem' }}>:</div>
              <div style={{ ...styles.countdownItem, minWidth: '65px' }}>
                <span style={{ ...styles.countdownNumber, fontSize: '2.5rem' }}>{String(timeLeft.hours).padStart(2, '0')}</span>
                <span style={{ ...styles.countdownLabel, fontSize: '0.85rem', marginTop: '0.5rem' }}>Jam</span>
              </div>
              <div style={{ ...styles.countdownSeparator, fontSize: '2rem', paddingBottom: '0.8rem' }}>:</div>
              <div style={{ ...styles.countdownItem, minWidth: '65px' }}>
                <span style={{ ...styles.countdownNumber, fontSize: '2.5rem' }}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span style={{ ...styles.countdownLabel, fontSize: '0.85rem', marginTop: '0.5rem' }}>Menit</span>
              </div>
              <div style={{ ...styles.countdownSeparator, fontSize: '2rem', paddingBottom: '0.8rem' }}>:</div>
              <div style={{ ...styles.countdownItem, minWidth: '65px' }}>
                <span style={{ ...styles.countdownNumber, fontSize: '2.5rem', color: 'var(--lemon)' }}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span style={{ ...styles.countdownLabel, fontSize: '0.85rem', marginTop: '0.5rem' }}>Detik</span>
              </div>
            </div>
          </div>

          <div className="card-right">
            {/* Poster */}
            <img src="/image/PosterNalara.png" alt="Poster" className="poster-img stagger-in animate-delay-1" />
          </div>

          {/* Subscription Form
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
        </div> */}

          {/* Actions / Social / Links
        <div style={styles.actions}>
          <a href="/" style={styles.backLink}>
            ← Kembali ke Landing Page
          </a>
          <div style={styles.actionDivider} />
          <a href="/quiz" style={styles.backLink}>
            Coba Demo Quiz Engine →
          </a>
        </div> */}
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
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
    margin: 'auto',
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
  ctaContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '3rem',
  },
  ctaButton: {
    padding: '1rem 2rem',
    fontSize: '1.1rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderRadius: '12px',
    boxShadow: '0 0 20px rgba(255, 168, 38, 0.4)',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
  },
};
