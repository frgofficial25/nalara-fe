'use client';

import React from 'react';

const waves = [
  {
    name: 'Early Bird',
    period: '20 – 24 Juni',
    highlight: 'Potongan harga khusus 20% dari tarif normal',
    isFeatured: true,
    badge: '🔥 Terbatas',
    icon: '🐣',
  },
  {
    name: 'Wave 1',
    period: '25 Juni – 08 Juli',
    highlight: 'Tarif normal tahap awal',
    isFeatured: false,
    badge: null,
    icon: '🌊',
  },
  {
    name: 'Wave 2',
    period: '09 – 13 Juli',
    highlight: 'Tarif normal tahap kedua',
    isFeatured: false,
    badge: null,
    icon: '🌊',
  },
  {
    name: 'Last Wave',
    period: '14 – 22 Juli',
    highlight: 'Penutupan pendaftaran menjelang Technical Meeting',
    isFeatured: false,
    badge: '⏳ Terakhir',
    icon: '🚪',
  },
];

export default function Pricing() {
  return (
    <section style={styles.section} id="pricing">
      <div style={styles.sectionHeader}>
        <span className="badge-tech badge-tech-accent">Pendaftaran</span>
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
              ...(wave.isFeatured ? styles.waveCardFeatured : {}),
            }}
          >
            {wave.badge && (
              <span
                style={{
                  ...styles.cardBadge,
                  ...(wave.isFeatured ? styles.cardBadgeFeatured : {}),
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
              <button className="nalara-btn nalara-btn-cta" style={styles.waveBtn}>
                Daftar Early Bird
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
              <strong style={{ color: 'var(--lemon)' }}>
                Hingga 100% bagi Mahasiswa Aktif (via KTM)
              </strong>{' '}
              &amp;{' '}
              <strong style={{ color: 'var(--azure)' }}>
                50–70% bagi peserta Umum
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
    padding: '4rem 1.5rem',
    maxWidth: '1100px',
    margin: '0 auto',
    width: '100%',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '3rem',
  },
  sectionTitle: {
    fontSize: '2.2rem',
    marginTop: '0.75rem',
    marginBottom: '1rem',
    fontWeight: 800,
  },
  sectionDesc: {
    fontSize: '1.05rem',
    maxWidth: '600px',
    margin: '0 auto',
  },
  wavesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem',
  },
  waveCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '2.5rem 1.5rem 2rem',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    background: 'rgba(255,255,255,0.02)',
    transition: 'all 0.3s ease',
  },
  waveCardFeatured: {
    border: '2px solid var(--lemon)',
    background:
      'linear-gradient(180deg, rgba(255,168,38,0.06) 0%, rgba(33,33,33,0.7) 100%)',
    boxShadow: '0 0 30px rgba(255,168,38,0.08)',
  },
  cardBadge: {
    position: 'absolute',
    top: '-12px',
    right: '16px',
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '0.3rem 0.75rem',
    borderRadius: '9999px',
    background: 'var(--d-grey)',
    color: 'var(--silver)',
    border: '1px solid var(--border-color)',
  },
  cardBadgeFeatured: {
    background: 'var(--d-yellow)',
    color: 'var(--bg-dark)',
    border: 'none',
  },
  waveIcon: {
    fontSize: '2rem',
    marginBottom: '0.75rem',
  },
  waveName: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--white)',
    marginBottom: '0.35rem',
  },
  wavePeriod: {
    fontSize: '0.9rem',
    color: 'var(--azure)',
    fontWeight: 600,
    marginBottom: '1rem',
  },
  waveHighlight: {
    fontSize: '0.9rem',
    color: 'var(--grey-blue)',
    lineHeight: 1.5,
    marginBottom: '1.25rem',
    flex: 1,
  },
  waveBtn: {
    marginTop: 'auto',
    padding: '0.75rem 1.5rem',
    fontSize: '0.95rem',
  },

  /* Referral Banner */
  referralBanner: {
    borderRadius: '16px',
    border: '1px solid rgba(6,113,224,0.25)',
    background:
      'linear-gradient(135deg, rgba(6,99,199,0.08) 0%, rgba(255,178,64,0.05) 100%)',
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
    fontSize: '1.35rem',
    fontWeight: 700,
    color: 'var(--white)',
    marginBottom: '0.75rem',
  },
  referralDesc: {
    fontSize: '1rem',
    color: 'var(--grey-blue)',
    lineHeight: 1.6,
    marginBottom: '1.25rem',
  },
  referralSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
    marginBottom: '1rem',
  },
  stepChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.9rem',
    color: 'var(--silver)',
  },
  stepNum: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    background: 'var(--navy)',
    color: 'var(--white)',
    fontWeight: 700,
    fontSize: '0.8rem',
    flexShrink: 0,
  },
  referralNote: {
    fontSize: '0.8rem',
    color: 'var(--l-grey)',
    fontStyle: 'italic',
  },
};
