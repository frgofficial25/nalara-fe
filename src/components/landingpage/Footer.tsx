import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={styles.footer}>
      <div style={styles.footerInner}>
        {/* Left Column */}
        <div style={styles.left}>
          <div style={styles.logoContainer}>
            <img src="/image/logonalara2.png" alt="Nalara Academy" style={styles.logoImg} />
          </div>
          <p style={styles.description}>
            Struktur tata kelola dan tim pelaksana operasional bootcamp Nalara Academy yang terorganisir untuk memastikan standar akademik & keberhasilan program.
          </p>
        </div>

        {/* Right Columns */}
        <div style={styles.rightGroup}>
          {/* Nalara Col */}
          <div style={styles.col}>
            <span style={styles.colTitle}>Nalara</span>
            <a href="#hero" style={styles.link}>Ecosystem</a>
            <a href="#pathway" style={styles.link}>Learning Path</a>
            <a href="#syllabus" style={styles.link}>Curriculum</a>
            <a href="#team" style={styles.link}>Team</a>
          </div>

          {/* Resources Col */}
          <div style={styles.col}>
            <span style={styles.colTitle}>Resources</span>
            <a href="#" style={styles.link}>Documentation</a>
            <a href="#" style={styles.link}>Help Center</a>
            <a href="#" style={styles.link}>Community</a>
            <a href="#" style={styles.link}>Blog</a>
          </div>

          {/* Social Media Col */}
          <div style={styles.col}>
            <span style={styles.colTitle}>Social Media</span>
            <a href="https://www.instagram.com/nalaraacademy/" style={styles.link}>Instagram</a>
            <a href="https://www.linkedin.com/company/nalara-academy" style={styles.link}>LinkedIn</a>
            <a href="https://www.youtube.com/@NalaraAcademy" style={styles.link}>Youtube</a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={styles.bottomBar}>
        <span>&copy; {currentYear} Nalara Academy. All rights reserved.</span>
        <span style={styles.guidedBy}>Guided by FRG University of Brawijaya</span>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '4rem 1.5rem 2rem 1.5rem',
    background: '#070708',
    width: '100%',
  },
  footerInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '3rem',
    paddingBottom: '3rem',
  },
  left: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    flex: '1 1 350px',
    maxWidth: '450px',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  logoImg: {
    height: '32px',
    width: 'auto',
  },
  logoTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.1,
  },
  logoTitle: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: '#38bdf8',
    letterSpacing: '0.15em',
  },
  logoSubtitle: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#ffa826',
    letterSpacing: '0.08em',
  },
  description: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    lineHeight: 1.6,
  },
  rightGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '3rem',
    flex: '2 1 450px',
    justifyContent: 'space-between',
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    minWidth: '120px',
  },
  colTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#FFFFFF',
    marginBottom: '0.25rem',
  },
  link: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  },
  bottomBar: {
    maxWidth: '1100px',
    margin: '0 auto',
    paddingTop: '1.5rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
    fontSize: '0.85rem',
    color: '#64748b',
  },
  guidedBy: {
    color: '#64748b',
  },
};
