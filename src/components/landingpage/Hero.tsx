import React from 'react';

interface HeroProps {
  onRegisterClick: () => void;
  onSyllabusClick: () => void;
}

export default function Hero({ onRegisterClick, onSyllabusClick }: HeroProps) {
  return (
    <section style={styles.heroSection} className="animate-fade-in-up">
      <div style={styles.badgeContainer}>
        <span className="badge-tech">
          📅 Total 12 Hari Belajar Instruksional
        </span>
        <span className="badge-tech">
          🌐 Official Domain: nalara.academy
        </span>
      </div>

      <h1 style={styles.mainTitle}>
        National AI & Deep Learning<br />
        <span style={styles.gradientText}>Acceleration Bootcamp</span>
      </h1>

      <p style={styles.subtitle}>
        Program bootcamp intensif di bawah naungan FILKOM Research Group (FRG) Universitas Brawijaya. 
        Dirancang masif dengan beban 32 jam instruksional penuh per level untuk mencetak talenta AI, 
        Deep Learning, hingga MLOps tingkat industri.
      </p>

      <div style={styles.ctaGroup}>
        <button 
          id="hero-cta-register"
          onClick={onRegisterClick}
          className="nalara-btn nalara-btn-cta"
          style={styles.ctaPrimary}
        >
          Daftar Sekarang (Early Bird -20%)
        </button>
        <button 
          id="hero-cta-syllabus"
          onClick={onSyllabusClick}
          className="nalara-btn nalara-btn-secondary"
          style={styles.ctaSecondary}
        >
          Lihat Silabus
        </button>
      </div>
      
      <div style={styles.glowBg} />
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
    padding: '6rem 1.5rem 5rem 1.5rem',
    maxWidth: '900px',
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
  mainTitle: {
    fontSize: '3.2rem',
    fontWeight: '800',
    lineHeight: '1.15',
    marginBottom: '1.5rem',
    letterSpacing: '-0.03em',
  },
  gradientText: {
    background: 'linear-gradient(135deg, var(--azure), var(--navy))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline-block',
  },
  subtitle: {
    fontSize: '1.15rem',
    color: 'var(--grey-blue)',
    maxWidth: '720px',
    lineHeight: '1.7',
    marginBottom: '3rem',
  },
  ctaGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '1rem',
    width: '100%',
    maxWidth: '500px',
  },
  ctaPrimary: {
    padding: '1rem 2rem',
    fontSize: '1.05rem',
    flex: '1 1 auto',
  },
  ctaSecondary: {
    padding: '1rem 2rem',
    fontSize: '1.05rem',
    flex: '1 1 auto',
  },
  glowBg: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(6, 113, 224, 0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: -1,
  },
};
