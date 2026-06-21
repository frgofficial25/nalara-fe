import React from 'react';
import Card from '../quiz/Card';

export default function Pathway() {
  return (
    <section style={styles.pathwaySection}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Kurikulum Berjenjang & Sistem Prasyarat</h2>
        <p style={styles.sectionDesc}>
          Berikut jenjang kelas yang akan kamu lalui untuk mendiseminasikan kompetensi yang siap industri.
        </p>
      </div>

      <div style={styles.cardsGrid}>
        {/* Level Dasar */}
        <Card glow style={{ ...styles.card, borderTop: '3px solid #10b981' }}>
          <div style={styles.cardHeader}>
            <span style={styles.levelNum}>01</span>
            <span className="badge-tech" style={styles.badgeGreen}>OPEN REGISTRATION</span>
          </div>
          <h3 style={styles.cardTitle}>Level Dasar (Preparatory)</h3>
          <p style={styles.cardDesc}>
            Memulai dasar pemrograman python, pemrosesan citra, matematika dasar dan eksplorasi data analisis untuk AI.
          </p>
          <div style={styles.prereqBox}>
            <span style={styles.prereqLabel}>Penerimaan:</span>
            <span style={styles.prereqValue}>Angkatan 1 & Angkatan 2</span>
          </div>
        </Card>

        {/* Level Menengah */}
        <Card glow style={{ ...styles.card, borderTop: '3px solid #f59e0b' }}>
          <div style={styles.cardHeader}>
            <span style={styles.levelNum}>02</span>
            <span className="badge-tech" style={styles.badgeOrange}>PLACEMENT TEST</span>
          </div>
          <h3 style={styles.cardTitle}>Level Menengah (Intermediate)</h3>
          <p style={styles.cardDesc}>
            Membangun model machine learning, deep learning, computer vision, natural language processing...
          </p>
          <div style={styles.prereqBox}>
            <span style={styles.prereqLabel}>Syarat Masuk:</span>
            <span style={styles.prereqValue}>Lolos Level Dasar ATAU Jalur Test Mandiri</span>
          </div>
        </Card>

        {/* Level Advanced */}
        <Card glow style={{ ...styles.card, borderTop: '3px solid #ef4444' }}>
          <div style={styles.cardHeader}>
            <span style={styles.levelNum}>03</span>
            <span className="badge-tech" style={styles.badgeRed}>LIMITED SEATS</span>
          </div>
          <h3 style={styles.cardTitle}>Level Lanjut (Advanced)</h3>
          <p style={styles.cardDesc}>
            Mempelajari AI Agent, LLM, deployment model ke production, hingga optimasi performa model.
          </p>
          <div style={styles.prereqBox}>
            <span style={styles.prereqLabel}>Syarat Masuk:</span>
            <span style={styles.prereqValue}>Lulusan Level Menengah & Portofolio Ketat</span>
          </div>
        </Card>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pathwaySection: {
    padding: '5rem 1.5rem',
    maxWidth: '1100px',
    margin: '0 auto',
    width: '100%',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '3.5rem',
  },
  sectionTitle: {
    fontSize: '2.5rem',
    marginTop: '0.75rem',
    marginBottom: '1rem',
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
  },
  sectionDesc: {
    fontSize: '1.1rem',
    maxWidth: '650px',
    margin: '0 auto',
    color: '#94a3b8',
    lineHeight: '1.6',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  card: {
    padding: '2.2rem',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    backdropFilter: 'blur(16px)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  levelNum: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#3b82f6',
    fontFamily: 'var(--font-display)',
  },
  badgeGreen: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '0.3rem 0.8rem',
    borderRadius: '9999px',
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
    border: '1px solid rgba(16, 185, 129, 0.25)',
  },
  badgeOrange: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '0.3rem 0.8rem',
    borderRadius: '9999px',
    background: 'rgba(245, 158, 11, 0.1)',
    color: '#f59e0b',
    border: '1px solid rgba(245, 158, 11, 0.25)',
  },
  badgeRed: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '0.3rem 0.8rem',
    borderRadius: '9999px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.25)',
  },
  cardTitle: {
    fontSize: '1.4rem',
    fontWeight: '700',
    marginBottom: '1rem',
    color: '#FFFFFF',
  },
  cardDesc: {
    fontSize: '0.95rem',
    flex: 1,
    marginBottom: '1.5rem',
    lineHeight: '1.6',
    color: '#94a3b8',
  },
  prereqBox: {
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  prereqLabel: {
    fontSize: '0.8rem',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  prereqValue: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#f8fafc',
  },
};
