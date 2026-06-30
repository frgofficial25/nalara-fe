'use client';

import React from 'react';
import Hero from '../components/landingpage/Hero';
import Pathway from '../components/landingpage/Pathway';
import Curriculum from '../components/landingpage/Curriculum';
import Pricing from '../components/landingpage/Pricing';
import Team from '../components/landingpage/Team';
import Footer from '../components/landingpage/Footer';

export default function LandingPage() {
  const [activeItem, setActiveItem] = React.useState('ECOSYSTEM');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const handleLinkClick = (e: React.MouseEvent, name: string, id: string) => {
    e.preventDefault();
    setActiveItem(name);
    scrollToSection(id);
  };

  return (
    <>
      {/* Ambient Floating Glow Blobs */}
      <div className="ambient-glows-container">
        <div className="ambient-blob blob-blue-1"></div>
        <div className="ambient-blob blob-yellow-2"></div>
        <div className="ambient-blob blob-blue-3"></div>
      </div>
      {/* Navigation Bar */}
      <nav style={styles.navbar}>
        <div style={styles.navInner}>
          <div style={styles.logoContainer}>
            <img src="/image/logonalara2.png" alt="Nalara Academy" style={styles.logoImg} />
          </div>
          
          <div className="nav-links-desktop" style={styles.navLinks}>
            <a 
              href="#syllabus" 
              className={`nav-link ${activeItem === 'ECOSYSTEM' ? 'active' : ''}`}
              onClick={(e) => handleLinkClick(e, 'ECOSYSTEM', 'syllabus')}
            >
              ECOSYSTEM
            </a>
            <a 
              href="#pathway" 
              className={`nav-link ${activeItem === 'LEARNING PATH' ? 'active' : ''}`}
              onClick={(e) => handleLinkClick(e, 'LEARNING PATH', 'pathway')}
            >
              LEARNING PATH
            </a>
            <a 
              href="#syllabus" 
              className={`nav-link ${activeItem === 'CURRICULUM' ? 'active' : ''}`}
              onClick={(e) => handleLinkClick(e, 'CURRICULUM', 'syllabus')}
            >
              CURRICULUM
            </a>
            <a 
              href="#team" 
              className={`nav-link ${activeItem === 'TEAM' ? 'active' : ''}`}
              onClick={(e) => handleLinkClick(e, 'TEAM', 'team')}
            >
              TEAM
            </a>
            <button
              className="nalara-btn"
              style={styles.navCta}
              onClick={() => scrollToSection('pricing')}
            >
              SIGN IN
            </button>
          </div>

          <button 
            className={`hamburger-btn ${isMobileMenuOpen ? 'open' : ''}`} 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`} style={styles.mobileMenu}>
          <a 
            href="#syllabus" 
            className={activeItem === 'ECOSYSTEM' ? 'active' : ''}
            onClick={(e) => handleLinkClick(e, 'ECOSYSTEM', 'syllabus')}
          >
            ECOSYSTEM
          </a>
          <a 
            href="#pathway" 
            className={activeItem === 'LEARNING PATH' ? 'active' : ''}
            onClick={(e) => handleLinkClick(e, 'LEARNING PATH', 'pathway')}
          >
            LEARNING PATH
          </a>
          <a 
            href="#syllabus" 
            className={activeItem === 'CURRICULUM' ? 'active' : ''}
            onClick={(e) => handleLinkClick(e, 'CURRICULUM', 'syllabus')}
          >
            CURRICULUM
          </a>
          <a 
            href="#team" 
            className={activeItem === 'TEAM' ? 'active' : ''}
            onClick={(e) => handleLinkClick(e, 'TEAM', 'team')}
          >
            TEAM
          </a>
          <button
            className="nalara-btn"
            style={{ ...styles.navCta, width: '100%' }}
            onClick={() => scrollToSection('pricing')}
          >
            SIGN IN
          </button>
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
    position: 'fixed',
    top: '1.25rem',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 100,
    background: 'rgba(11, 11, 12, 0.15)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '50px',
    maxWidth: '1100px',
    width: 'calc(100% - 2rem)',
  },
  navInner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.6rem 1.5rem',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  logoImg: {
    height: '38px',
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
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  navLink: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#94a3b8',
    textDecoration: 'none',
    letterSpacing: '0.05em',
    transition: 'color 0.2s ease',
  },
  navCta: {
    padding: '0.5rem 1.5rem',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#FFFFFF',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
  },
  sectionDivider: {
    maxWidth: '1100px',
    margin: '0 auto',
    height: '1px',
    background:
      'linear-gradient(90deg, transparent, var(--border-color) 30%, var(--border-color) 70%, transparent)',
  },
  mobileMenu: {
    display: 'none',
    flexDirection: 'column',
    background: 'rgba(11, 11, 12, 0.95)',
    borderRadius: '20px',
    marginTop: '0.5rem',
    padding: '1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    gap: '1rem',
  },
};
