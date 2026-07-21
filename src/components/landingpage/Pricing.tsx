'use client';

import React from 'react';

const waves = [
  {
    name: 'Early Bird',
    period: '20 – 27 Juni 2026',
    highlight: 'Pendaftaran tahap awal dengan kuota khusus',
    badge: 'CLOSED',
    icon: '🐣',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  {
    name: 'Wave 1',
    period: '27 Juni – 10 Juli 2026',
    highlight: 'Pendaftaran reguler gelombang pertama',
    badge: 'CLOSED',
    icon: '🌊',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  {
    name: 'Wave 2',
    period: '11 – 15 Juli 2026',
    highlight: 'Pendaftaran reguler gelombang kedua',
    badge: 'CLOSED',
    icon: '🌊',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  {
    name: 'Last Wave',
    period: '16 – 18 Juli 2026',
    highlight: 'Penutupan seluruh pendaftaran bootcamp',
    badge: 'CLOSED',
    icon: '❗',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
];

export default function Pricing() {
  return (
    <section style={styles.section} id="pricing">
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Gelombang Pendaftaran</h2>
        <p style={styles.sectionDesc}>
          Seluruh gelombang pendaftaran telah <strong>DITUTUP (CLOSED)</strong>. Silakan masuk ke portal untuk mengakses kelas bagi peserta terdaftar.
        </p>
      </div>

      {/* Waves Grid */}
      <div style={styles.wavesGrid}>
        {waves.map((wave, idx) => (
          <div
            key={idx}
            style={{
              ...styles.waveCard,
              border: `1px solid ${wave.borderColor}`,
              background: 'rgba(255, 255, 255, 0.01)',
            }}
          >
            <span
              style={{
                ...styles.cardBadge,
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.3)',
              }}
            >
              {wave.badge}
            </span>
            <span style={styles.waveIcon}>{wave.icon}</span>
            <h3 style={styles.waveName}>{wave.name}</h3>
            <span style={styles.wavePeriod}>{wave.period}</span>
            <p style={{ ...styles.waveHighlight, marginBottom: 0 }}>{wave.highlight}</p>
          </div>
        ))}
      </div>

      {/* Referral Booster Banner */}
      <div style={styles.referralBanner}>
        <div style={styles.referralContent}>
          <div style={styles.referralIcon}>🎁</div>
          <div style={styles.referralText}>
            <h3 style={styles.referralTitle}>
              Informasi Peserta Terdaftar
            </h3>
            <p style={styles.referralDesc}>
              Bagi peserta yang telah melakukan registrasi, silakan masuk ke portal Nalara Academy menggunakan akun yang telah terdaftar untuk melihat status kelas dan materi.
            </p>
            <div style={styles.referralSteps}>
              <div style={styles.stepChip}>
                <span style={styles.stepNum}>1</span>
                Masuk via tombol Sign In / Masuk Ke Portal dengan credentials Anda.
              </div>
              <div style={styles.stepChip}>
                <span style={styles.stepNum}>2</span>
                Akses Dashboard Student untuk mengikuti jadwal dan pengerjaan tugas.
              </div>
            </div>
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={styles.referralNote}>
                * Jika membutuhkan bantuan kendala login, silakan hubungi tim panitia Nalara Academy:
              </span>
              <a
                href="https://wa.me/6285190946554"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: 'rgba(37, 211, 102, 0.12)',
                  border: '1px solid rgba(37, 211, 102, 0.3)',
                  color: '#25D366',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                +62 851-9094-6554 (Nalara Academy)
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
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
    fontWeight: 800,
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
  wavesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem',
    marginBottom: '4rem',
  },
  waveCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '2.5rem 1.5rem 2rem',
    borderRadius: '16px',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(16px)',
  },
  cardBadge: {
    position: 'absolute',
    top: '-10px',
    fontSize: '0.7rem',
    fontWeight: 800,
    padding: '0.3rem 0.8rem',
    borderRadius: '9999px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    letterSpacing: '0.05em',
  },
  waveIcon: {
    fontSize: '2.2rem',
    marginBottom: '0.75rem',
  },
  waveName: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#FFFFFF',
    marginBottom: '0.35rem',
  },
  wavePeriod: {
    fontSize: '0.95rem',
    color: '#38bdf8',
    fontWeight: 600,
    marginBottom: '1rem',
  },
  waveHighlight: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    lineHeight: 1.5,
    marginBottom: '1.5rem',
    flex: 1,
  },
  waveBtn: {
    marginTop: 'auto',
    width: '100%',
    padding: '0.7rem 1.25rem',
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#FFFFFF',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
  },

  /* Referral Banner */
  referralBanner: {
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255,255,255,0.01)',
    padding: '2.5rem',
  },
  referralContent: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  referralIcon: {
    fontSize: '3rem',
    lineHeight: 1,
  },
  referralText: {
    flex: 1,
    minWidth: '280px',
  },
  referralTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#FFFFFF',
    marginBottom: '0.75rem',
  },
  referralDesc: {
    fontSize: '1rem',
    color: '#94a3b8',
    lineHeight: 1.6,
    marginBottom: '1.25rem',
  },
  referralSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
    marginBottom: '1.25rem',
  },
  stepChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.9rem',
    color: '#f8fafc',
  },
  stepNum: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#0252a3',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '0.8rem',
    flexShrink: 0,
  },
  referralNote: {
    fontSize: '0.8rem',
    color: '#64748b',
    fontStyle: 'italic',
  },
};
