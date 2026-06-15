import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={styles.footer}>
      <div style={styles.footerInner}>
        <div style={styles.left}>
          <span style={styles.logoText}>⚡ Nalara</span>
          <p style={styles.copyright}>
            &copy; {currentYear} FILKOM Research Group (FRG) — Fakultas Ilmu Komputer, Universitas Brawijaya.
            <br />
            All rights reserved.
          </p>
        </div>

        <div style={styles.right}>
          <span style={styles.linksTitle}>Quick Links</span>
          <a href="/comingsoon" style={styles.link}>
            🌐 Nalara.academy — LMS Platform
          </a>
          <a href="#pricing" style={styles.link}>
            📋 Pendaftaran
          </a>
          <a href="#syllabus" style={styles.link}>
            📚 Silabus
          </a>
          <a href="#team" style={styles.link}>
            👥 Tim Kami
          </a>
        </div>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    borderTop: '1px solid var(--border-color)',
    padding: '3rem 1.5rem 2rem',
    marginTop: '2rem',
    background: 'rgba(0,0,0,0.2)',
  },
  footerInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '2rem',
  },
  left: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  logoText: {
    fontSize: '1.35rem',
    fontWeight: 800,
    color: 'var(--white)',
    fontFamily: 'var(--font-display)',
  },
  copyright: {
    fontSize: '0.85rem',
    color: 'var(--l-grey)',
    lineHeight: 1.6,
    maxWidth: '420px',
  },
  right: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  linksTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--grey-blue)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
  },
  link: {
    fontSize: '0.9rem',
    color: 'var(--silver)',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  },
};
