'use client';

import React from 'react';

const waves = [
  {
    name: 'Early Bird',
    period: '20 – 24 Juni',
    highlight: 'Potongan harga khusus 20% dari tarif normal',
    isFeatured: true,
    badge: 'RECOMMENDED',
    icon: '🐣',
    borderColor: '#ffa826',
  },
  {
    name: 'Wave 1',
    period: '25 Juni – 08 Juli',
    highlight: 'Tarif normal tahap awal',
    isFeatured: false,
    badge: null,
    icon: '🌊',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  {
    name: 'Wave 2',
    period: '09 – 13 Juli',
    highlight: 'Tarif normal tahap kedua',
    isFeatured: false,
    badge: null,
    icon: '🌊',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  {
    name: 'Last Wave',
    period: '14 – 22 Juli',
    highlight: 'Penutupan pendaftaran menjelang Technical Meeting',
    isFeatured: false,
    badge: 'LATE REGISTRATION',
    icon: '❗',
    borderColor: '#ef4444',
  },
];

export default function Pricing() {
  return (
    <section style={styles.section} id="pricing">
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Gelombang Pendaftaran</h2>
        <p style={styles.sectionDesc}>
          Pilih gelombang yang sesuai. Semakin awal mendaftar, semakin besar keuntungan yang Anda dapatkan.
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
              boxShadow: wave.isFeatured ? '0 0 30px rgba(255,168,38,0.1)' : 'none',
              background: wave.isFeatured 
                ? 'linear-gradient(180deg, rgba(255,168,38,0.03) 0%, rgba(11,11,12,0.8) 100%)'
                : 'rgba(255,255,255,0.01)',
            }}
          >
            {wave.badge && (
              <span
                style={{
                  ...styles.cardBadge,
                  background: wave.isFeatured ? '#ffa826' : 'rgba(255,255,255,0.08)',
                  color: wave.isFeatured ? '#000000' : '#94a3b8',
                }}
              >
                {wave.badge}
              </span>
            )}
            <span style={styles.waveIcon}>{wave.icon}</span>
            <h3 style={styles.waveName}>{wave.name}</h3>
            <span style={styles.wavePeriod}>{wave.period}</span>
            <p style={styles.waveHighlight}>{wave.highlight}</p>
            {wave.isFeatured && (
              <button className="nalara-btn" style={styles.waveBtn}>
                Daftar Sekarang
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Referral Booster Banner */}
      <div style={styles.referralBanner}>
        <div style={styles.referralContent}>
          <div style={styles.referralIcon}>🎁</div>
          <div style={styles.referralText}>
            <h3 style={styles.referralTitle}>
              Referral Booster — Subsidi Hingga 100%!
            </h3>
            <p style={styles.referralDesc}>
              Dapatkan potongan harga tambahan:{' '}
              <strong style={{ color: '#ffa826' }}>
                Hingga 100% bagi Mahasiswa Aktif (via KTM)
              </strong>{' '}
              &amp;{' '}
              <strong style={{ color: '#38bdf8' }}>
                50–75% bagi peserta Umum
              </strong>
              .
            </p>
            <div style={styles.referralSteps}>
              <div style={styles.stepChip}>
                <span style={styles.stepNum}>1</span>
                Share poster ke min. 5 grup WhatsApp (≥100 anggota)
              </div>
              <div style={styles.stepChip}>
                <span style={styles.stepNum}>2</span>
                Post official Twibbon di Instagram Feed / Story
              </div>
            </div>
            <span style={styles.referralNote}>
              * Syarat &amp; ketentuan berlaku, sedang dalam konfirmasi dengan Dosen Pembina.
            </span>
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
    maxWidth: '600px',
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
    color: '#000000',
    background: '#ffa826',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(255, 168, 38, 0.2)',
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
