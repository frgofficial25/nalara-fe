import React from 'react';
import Card from '../quiz/Card';

export default function Pathway() {
  return (
    <section style={styles.pathwaySection}>
      <div style={styles.sectionHeader}>
        <span className="badge-tech badge-tech-accent">Level Pathway</span>
        <h2 style={styles.sectionTitle}>Kurikulum Berjenjang & Sistem Prasyarat</h2>
        <p style={styles.sectionDesc}>
          Bootcamp dirancang berjenjang untuk memastikan transisi pemahaman dari konsep dasar hingga siap produksi di industri.
        </p>
      </div>

      <div style={styles.cardsGrid}>
        {/* Level Dasar */}
        <Card glow style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.levelNum}>01</span>
            <span className="badge-tech" style={styles.openBadge}>Terbuka Langsung</span>
          </div>
          <h3 style={styles.cardTitle}>Level Dasar (Foundations)</h3>
          <p style={styles.cardDesc}>
            Menjaring talenta potensial secara luas. Berfokus pada pemahaman logika AI, pemrograman Python, dasar pemrosesan citra digital, dan alur kerja Machine Learning.
          </p>
          <div style={styles.prereqBox}>
            <span style={styles.prereqLabel}>Penerimaan:</span>
            <span style={styles.prereqValue}>Angkatan 1 & Angkatan 2</span>
          </div>
        </Card>

        {/* Level Menengah */}
        <Card glow style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.levelNum}>02</span>
            <span className="badge-tech badge-tech-accent" style={styles.openBadge}>Placement Test</span>
          </div>
          <h3 style={styles.cardTitle}>Level Menengah (Intermediate)</h3>
          <p style={styles.cardDesc}>
            Mendalami segmentasi gambar tingkat lanjut, arsitektur deep learning modern (ResNet, ViT), Transfer Learning, serta metodologi evaluasi performa model.
          </p>
          <div style={styles.prereqBox}>
            <span style={styles.prereqLabel}>Syarat Masuk:</span>
            <span style={styles.prereqValue}>Lolos Level Dasar ATAU Lulus Jalur Test Mandiri</span>
          </div>
        </Card>

        {/* Level Advanced */}
        <Card glow style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.levelNum}>03</span>
            <span className="badge-tech badge-tech-accent" style={{ ...styles.openBadge, color: 'var(--lemon)', borderColor: 'rgba(255, 168, 38, 0.3)' }}>Terbatas</span>
          </div>
          <h3 style={styles.cardTitle}>Level Lanjut (Advanced)</h3>
          <p style={styles.cardDesc}>
            Melangkah ke tahap MLOps, deployment model ke production, orkestrasi pipeline data hybrid, serta pitching proyek yang dinilai langsung oleh tim penguji eksternal.
          </p>
          <div style={styles.prereqBox}>
            <span style={styles.prereqLabel}>Syarat Masuk:</span>
            <span style={styles.prereqValue}>Lulusan Level Menengah & Seleksi Portofolio Ketat</span>
          </div>
        </Card>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pathwaySection: {
    padding: '4rem 1.5rem',
    maxWidth: '1100px',
    margin: '0 auto',
    width: '100%',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '3.5rem',
  },
  sectionTitle: {
    fontSize: '2.2rem',
    marginTop: '0.75rem',
    marginBottom: '1rem',
    fontWeight: '800',
  },
  sectionDesc: {
    fontSize: '1.05rem',
    maxWidth: '650px',
    margin: '0 auto',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '2rem',
  },
  card: {
    padding: '2.2rem',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
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
    color: 'var(--m-blue)',
    fontFamily: 'var(--font-display)',
  },
  openBadge: {
    fontSize: '0.75rem',
  },
  cardTitle: {
    fontSize: '1.35rem',
    marginBottom: '1rem',
  },
  cardDesc: {
    fontSize: '0.95rem',
    flex: 1,
    marginBottom: '1.5rem',
    lineHeight: '1.6',
  },
  prereqBox: {
    borderTop: '1px solid var(--border-color)',
    paddingTop: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  prereqLabel: {
    fontSize: '0.8rem',
    color: 'var(--l-grey)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  prereqValue: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--white)',
  },
};
