'use client';

import React from 'react';
import Hero from '../components/landingpage/Hero';
import Pathway from '../components/landingpage/Pathway';
import Curriculum from '../components/landingpage/Curriculum';
import Pricing from '../components/landingpage/Pricing';
import Team from '../components/landingpage/Team';
import Footer from '../components/landingpage/Footer';

export default function LandingPage() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Navigation Bar */}
      <nav style={styles.navbar}>
        <div style={styles.navInner}>
          <span style={styles.navLogo}>⚡ Nalara</span>
          <div style={styles.navLinks}>
            <a href="#syllabus" style={styles.navLink}>Silabus</a>
            <a href="#pricing" style={styles.navLink}>Pendaftaran</a>
            <a href="#team" style={styles.navLink}>Tim</a>
            <button
              className="nalara-btn nalara-btn-cta"
              style={styles.navCta}
              onClick={() => scrollToSection('pricing')}
            >
              Daftar Sekarang
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* Section 1: Hero */}
        <Hero
          onRegisterClick={() => scrollToSection('pricing')}
          onSyllabusClick={() => scrollToSection('syllabus')}
        />

        {/* Divider */}
        <div style={styles.sectionDivider} />

        {/* Section 2: Level Pathway */}
        <Pathway />

        <div style={styles.sectionDivider} />

        {/* Section 3: Curriculum & Timeline */}
        <Curriculum />

        <div style={styles.sectionDivider} />

        {/* Section 4: Registration Waves & Referral */}
        <Pricing />

        <div style={styles.sectionDivider} />

        {/* Section 5: Meet The Team */}
        <Team />
      </main>

      {/* Section 6: Footer */}
      <Footer />
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: '1px solid var(--border-color)',
    background: 'rgba(33, 33, 33, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  },
  navInner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '0.85rem 1.5rem',
  },
  navLogo: {
    fontSize: '1.3rem',
    fontWeight: 800,
    color: 'var(--white)',
    fontFamily: 'var(--font-display)',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  navLink: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--grey-blue)',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  },
  navCta: {
    padding: '0.55rem 1.15rem',
    fontSize: '0.85rem',
  },
  sectionDivider: {
    maxWidth: '1100px',
    margin: '0 auto',
    height: '1px',
    background:
      'linear-gradient(90deg, transparent, var(--border-color) 30%, var(--border-color) 70%, transparent)',
  },
};
