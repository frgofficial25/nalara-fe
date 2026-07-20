'use client';

import React from 'react';

interface TimelineEvent {
  title: string;
  subtitle?: string;
  date: string;
  type: 'gold' | 'red' | 'blue';
  status: 'closed' | 'upcoming' | 'final';
  isHighlighted?: boolean;
}

const timelineData: TimelineEvent[] = [
  {
    title: 'Early Bird Registration',
    date: '20 - 27 Juni 2026',
    type: 'gold',
    status: 'closed',
  },
  {
    title: 'Wave 1 Registration',
    date: '27 Juni - 10 Juli 2026',
    type: 'gold',
    status: 'closed',
  },
  {
    title: 'Wave 2 Registration',
    date: '11 - 15 Juli 2026',
    type: 'gold',
    status: 'closed',
  },
  {
    title: 'Last Wave Registration',
    date: '16 - 18 Juli 2026',
    type: 'red',
    status: 'closed',
    isHighlighted: true,
  },
  {
    title: 'Technical Meeting',
    date: '22 Juli 2026',
    type: 'gold',
    status: 'upcoming',
  },
  {
    title: 'Level Dasar',
    subtitle: '(Foundations)',
    date: '23 - 26 Juli 2026',
    type: 'gold',
    status: 'upcoming',
  },
  {
    title: 'Level Menengah',
    subtitle: '(Intermediate)',
    date: '30 Juli - 2 Agustus 2026',
    type: 'gold',
    status: 'upcoming',
  },
  {
    title: 'Level Advanced',
    subtitle: '(MLOps)',
    date: '6 - 9 Agustus 2026',
    type: 'gold',
    status: 'upcoming',
  },
  {
    title: 'Graduation',
    date: '14 Agustus 2026',
    type: 'blue',
    status: 'final',
  },
];

export default function Timeline() {
  return (
    <section style={styles.section} id="timeline">
      <div style={styles.sectionHeader}>
        <span style={styles.badgeLabel}>SCHEDULE & ROADMAP</span>
        <h2 style={styles.sectionTitle}>Timeline Pendaftaran & Program</h2>
        <p style={styles.sectionDesc}>
          Jadwal resmi pelaksanaan Nalara AI &amp; Deep Learning Acceleration Bootcamp 2026.
        </p>
      </div>

      {/* Interactive Timeline Board */}
      <div style={styles.timelineContainer}>
        <div style={styles.timelineGrid}>
          {timelineData.map((item, index) => {
            const isRed = item.type === 'red';
            const isBlue = item.type === 'blue';
            const dotColor = isRed ? '#ef4444' : isBlue ? '#3b82f6' : '#ffa826';
            const dotGlow = isRed
              ? '0 0 15px rgba(239, 68, 68, 0.6)'
              : isBlue
              ? '0 0 15px rgba(59, 130, 246, 0.6)'
              : '0 0 15px rgba(255, 168, 38, 0.5)';

            return (
              <div key={index} style={styles.timelineCardWrapper}>
                {/* Node Indicator Dot */}
                <div style={styles.nodeHeader}>
                  <div
                    style={{
                      ...styles.nodeDot,
                      backgroundColor: dotColor,
                      boxShadow: dotGlow,
                      border: `3px solid ${isRed ? '#991b1b' : isBlue ? '#1e40af' : '#b45309'}`,
                    }}
                  />
                  {index < timelineData.length - 1 && (
                    <div style={styles.connectorLine} />
                  )}
                </div>

                {/* Event Card Content */}
                <div
                  style={{
                    ...styles.eventCard,
                    borderColor: isRed
                      ? 'rgba(239, 68, 68, 0.3)'
                      : isBlue
                      ? 'rgba(59, 130, 246, 0.3)'
                      : 'rgba(255, 255, 255, 0.08)',
                    background: item.isHighlighted
                      ? 'rgba(239, 68, 68, 0.04)'
                      : isBlue
                      ? 'rgba(59, 130, 246, 0.04)'
                      : 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <div style={styles.cardHeaderRow}>
                    <h3
                      style={{
                        ...styles.eventTitle,
                        color: item.isHighlighted ? '#f87171' : isBlue ? '#60a5fa' : '#FFFFFF',
                      }}
                    >
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <span style={styles.eventSubtitle}>{item.subtitle}</span>
                    )}
                  </div>

                  <span style={styles.eventDate}>📅 {item.date}</span>

                  <div style={styles.statusRow}>
                    {item.status === 'closed' && (
                      <span style={styles.badgeClosed}>Closed</span>
                    )}
                    {item.status === 'upcoming' && (
                      <span style={styles.badgeUpcoming}>Scheduled</span>
                    )}
                    {item.status === 'final' && (
                      <span style={styles.badgeFinal}>Ceremony</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
  badgeLabel: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#ffa826',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '0.5rem',
  },
  sectionTitle: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
    marginBottom: '0.75rem',
  },
  sectionDesc: {
    fontSize: '1.1rem',
    color: '#94a3b8',
    maxWidth: '650px',
    margin: '0 auto',
    lineHeight: '1.6',
  },
  timelineContainer: {
    position: 'relative',
    background: 'rgba(15, 23, 42, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '2.5rem 2rem',
    backdropFilter: 'blur(16px)',
  },
  timelineGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
  },
  timelineCardWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    position: 'relative',
  },
  nodeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  nodeDot: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'transform 0.2s ease',
  },
  connectorLine: {
    flex: 1,
    height: '2px',
    background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 5px, transparent 5px, transparent 10px)',
  },
  eventCard: {
    padding: '1.25rem 1.5rem',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
  },
  cardHeaderRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  eventTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    lineHeight: '1.3',
  },
  eventSubtitle: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    fontWeight: 500,
  },
  eventDate: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#ffa826',
    marginTop: '0.25rem',
  },
  statusRow: {
    display: 'flex',
    marginTop: '0.5rem',
  },
  badgeClosed: {
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '0.25rem 0.65rem',
    borderRadius: '9999px',
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    textTransform: 'uppercase',
  },
  badgeUpcoming: {
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '0.25rem 0.65rem',
    borderRadius: '9999px',
    background: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    textTransform: 'uppercase',
  },
  badgeFinal: {
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '0.25rem 0.65rem',
    borderRadius: '9999px',
    background: 'rgba(168, 85, 247, 0.15)',
    color: '#c084fc',
    border: '1px solid rgba(168, 85, 247, 0.3)',
    textTransform: 'uppercase',
  },
};
