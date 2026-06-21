import React from 'react';

interface HeroProps {
  onRegisterClick: () => void;
  onSyllabusClick: () => void;
}

export default function Hero({ onRegisterClick, onSyllabusClick }: HeroProps) {
  return (
    <section style={styles.heroSection} className="animate-fade-in-up">
      <div style={styles.badgeContainer}>
        <span className="badge-tech" style={styles.badgeItem}>
          📅 Total 12 Hari Belajar Instruksional
        </span>
        <span className="badge-tech" style={styles.badgeItem}>
          🌐 Official Domain: nalara.academy
        </span>
      </div>

      <h1 style={styles.mainTitle}>
        National AI & Deep Learning<br />
        <span style={styles.gradientText}>Acceleration Bootcamp</span>
      </h1>

      <p style={styles.subtitle}>
        Pintu gerbang untuk mendalami kecerdasan buatan, dari dasar hingga tingkat lanjut. 
        Pelajari bersama para ahli dan bersiaplah untuk masa depan teknologi.
      </p>

      <div style={styles.ctaGroup}>
        <button 
          id="hero-cta-register"
          onClick={onRegisterClick}
          className="nalara-btn"
          style={styles.ctaPrimary}
        >
          Register Now - Subsidized 100%
        </button>
        <button 
          id="hero-cta-syllabus"
          onClick={onSyllabusClick}
          className="nalara-btn"
          style={styles.ctaSecondary}
        >
          Explore Curriculum
        </button>
      </div>
      
      {/* Premium ambient glows */}
      <div style={styles.glowLeft} />
      <div style={styles.glowRight} />
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heroSection: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '7rem 1.5rem 6rem 1.5rem',
    maxWidth: '950px',
    margin: '0 auto',
    zIndex: 1,
  },
  badgeContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: '2rem',
  },
  badgeItem: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'var(--silver)',
    fontSize: '0.8rem',
    padding: '0.4rem 0.95rem',
  },
  mainTitle: {
    fontSize: '3.6rem',
    fontWeight: '800',
    lineHeight: '1.15',
    marginBottom: '1.5rem',
    letterSpacing: '-0.03em',
    color: '#FFFFFF',
  },
  gradientText: {
    background: 'linear-gradient(135deg, #38bdf8, #0369a1)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline-block',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#94a3b8',
    maxWidth: '720px',
    lineHeight: '1.7',
    marginBottom: '3rem',
  },
  ctaGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.85rem',
    width: '100%',
    maxWidth: '420px',
  },
  ctaPrimary: {
    width: '100%',
    padding: '0.95rem 2rem',
    fontSize: '1rem',
    fontWeight: '700',
    color: '#000000',
    background: '#ffa826',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(255, 168, 38, 0.3)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  ctaSecondary: {
    width: '100%',
    padding: '0.95rem 2rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#FFFFFF',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  glowLeft: {
    position: 'absolute',
    top: '30%',
    left: '-20%',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(228, 137, 0, 0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: -1,
    filter: 'blur(40px)',
  },
  glowRight: {
    position: 'absolute',
    top: '20%',
    right: '-20%',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(65, 150, 240, 0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: -1,
    filter: 'blur(40px)',
  },
};
