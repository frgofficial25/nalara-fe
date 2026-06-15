'use client';

import React from 'react';

interface Member {
  name: string;
  title: string;
  // focus: string;
  initials: string;
  vacant?: boolean;
}

const commissioners: Member[] = [
  {
    name: "Dr. Ir. Arief Andy Soebroto, S.T., M.Kom.",
    title: "President Commissioner",
    // focus: "Mutu Akademik & Pengawasan Strategis",
    initials: "AS",
  },
  {
    name: "Aryan Zaky Prayogo",
    title: "Independent Commissioner",
    // focus: "Monitoring Capaian Target & Evaluasi Independen",
    initials: "AZ",
  },
];

const directors: Member[] = [
  {
    name: "Ulfa Aulia Sakina",
    title: "Chief Executive Officer (CEO) / Project Lead",
    // focus: "Executive Leadership & General Operations", 
    initials: "UA",
  },
  {
    name: "Lintang Muhammad Shiddiq",
    title: "Chief Technology Officer (CTO)",
    // focus: "Tech Architecture, Infrastructure & UI/UX Strategy",
    initials: "LM",
  },
  {
    name: "Noval Zakky Ramadhan",
    title: "Chief Operating Officer (COO)",

    // focus: "Systems Integration, Technical Quality & Assets",
    initials: "NZ",
  },
  {
    name: "Raven Ravellyn Sulistyo",
    title: "Deputy Chief Technology Officer (Deputy CTO)",
    // focus: "Event Execution, Operational Timelines & Logistics",
    initials: "RR",
  },
  {
    name: "Muhammad Hafiizh Anindya",
    title: "Deputy Chief Operating Officer (Deputy COO)",
    // focus: "Session Operations Support & Level Dasar Moderator",
    initials: "MH",
  },
];

const programManagers: Member[] = [
  {
    name: "Naufal Fadhil Arkani",
    title: "Program Delivery Manager",
    // focus: "PIC Level Dasar & Menengah",
    initials: "NF",
  },
  {
    name: "Muhammad Zaki Arif Efendi",
    title: "Graduation & Assessment Manager",
    // focus: "PIC Level Lanjut, Pitching & Graduation",
    initials: "MZ",
  },
  {
    name: "Asfar Addien / Fajar / Tristan",
    title: "Session Operations Manager",
    // focus: "Timekeeper All Levels",
    initials: "AFT",
  },
  {
    name: "[Hiring / Vacant]",
    title: "Session Engagement Manager",
    // focus: "Moderator Level Lanjut",
    initials: "HV",
    vacant: true,
  },
];

const techManagers: Member[] = [
  {
    name: "Gerrard",
    title: "Technical Project Manager (TPM)",
    // focus: "Technical Coordination & Agile Delivery",
    initials: "G",
  },
  {
    name: "Sayyid",
    title: "Creative Design Manager",
    // focus: "UI/UX, Visual Design & Brand Identity Assets",
    initials: "S",
  },
  {
    name: "Rifky",
    title: "LMS Development Manager",
    // focus: "LMS Platform & Fullstack Development",
    initials: "R",
  },
];

export default function Team() {
  const renderCard = (member: Member, theme: 'commissioner' | 'director' | 'manager') => {
    const isVacant = member.vacant;

    // Determine gradient/colors for avatar & border
    let avatarBg = 'linear-gradient(135deg, #0053AD, #0663C7)';
    let titleColor = 'var(--white)';

    if (theme === 'commissioner') {
      avatarBg = 'linear-gradient(135deg, #0053AD, #4196F0)';
      titleColor = '#4196F0';
    } else if (theme === 'director') {
      avatarBg = 'linear-gradient(135deg, #0663C7, #0671E0)';
      titleColor = '#FFA826'; // Executive highlights
    } else {
      avatarBg = 'linear-gradient(135deg, #4D4D4D, #717171)';
      titleColor = 'var(--azure)';
    }

    if (isVacant) {
      avatarBg = 'linear-gradient(135deg, #212121, #4D4D4D)';
      titleColor = 'var(--l-grey)';
    }

    return (
      <div
        style={{
          ...styles.card,
          ...(isVacant ? styles.cardVacant : {}),
        }}
        key={member.name}
      >
        <div style={{ ...styles.avatar, background: avatarBg }}>
          <span style={styles.avatarText}>{member.initials}</span>
        </div>
        <div style={styles.cardInfo}>
          <h4 style={styles.cardName}>{member.name}</h4>
          <span style={{ ...styles.cardTitle, color: titleColor }}>{member.title}</span>
          {/* <p style={styles.cardFocus}>{member.focus}</p> */}
        </div>
      </div>
    );
  };

  return (
    <section style={styles.section} id="team">
      <div style={styles.sectionHeader}>
        <span className="badge-tech">Organisasi</span>
        <h2 style={styles.sectionTitle}>Meet The Team</h2>
        <p style={styles.sectionDesc}>
          Struktur tata kelola dan tim pelaksana operasional bootcamp Nalara yang terorganisir untuk memastikan standar akademik & keberhasilan program.
        </p>
      </div>

      <div style={styles.treeContainer}>
        {/* Tier 1: Board of Commissioners */}
        <div style={styles.tierContainer}>
          <div style={styles.tierHeader}>
            <span style={styles.tierBadge}>Strategic Oversight</span>
            <h3 style={styles.tierTitle}>Board of Commissioners (Dewan Komisaris)</h3>
          </div>
          <div style={styles.commissionersGrid}>
            {commissioners.map(m => renderCard(m, 'commissioner'))}
          </div>
        </div>

        {/* Tree Line Connector */}
        <div style={styles.connectorVertical} />

        {/* Tier 2: Board of Directors */}
        <div style={styles.tierContainer}>
          <div style={styles.tierHeader}>
            <span style={{ ...styles.tierBadge, background: 'rgba(255, 168, 38, 0.15)', color: 'var(--lemon)', border: '1px solid rgba(255, 168, 38, 0.3)' }}>Executive Leadership</span>
            <h3 style={styles.tierTitle}>Board of Directors (Dewan Direksi)</h3>
          </div>
          <div style={styles.directorsGrid}>
            {directors.map(m => renderCard(m, 'director'))}
          </div>
        </div>

        {/* Tree Line Connector Branch */}
        <div style={styles.connectorVertical} />
        <div style={styles.connectorHorizontalRow}>
          <div style={styles.connectorHorizontalLine} />
        </div>

        {/* Tier 3: Board of Managers (Two Pillars) */}
        <div style={styles.pillarsContainer}>
          {/* Pillar A: Dept. Program */}
          <div style={styles.pillar}>
            <div style={styles.pillarHeader}>
              <span style={styles.pillarBadge}>Dept. Program</span>
              <h4 style={styles.pillarTitle}>Event Division</h4>
              <p style={styles.pillarDesc}>Operational, Delivery & Timeline Operations</p>
            </div>
            <div style={styles.managersGrid}>
              {programManagers.map(m => renderCard(m, 'manager'))}
            </div>
          </div>

          {/* Pillar B: Dept. Tech */}
          <div style={styles.pillar}>
            <div style={styles.pillarHeader}>
              <span style={{ ...styles.pillarBadge, background: 'rgba(6, 113, 224, 0.15)', color: 'var(--azure)', border: '1px solid rgba(6, 113, 224, 0.3)' }}>Dept. Tech</span>
              <h4 style={styles.pillarTitle}>PIT Division</h4>
              <p style={styles.pillarDesc}>Technical Development, Platform & Visual Assets</p>
            </div>
            <div style={styles.managersGrid}>
              {techManagers.map(m => renderCard(m, 'manager'))}
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
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '4rem',
  },
  sectionTitle: {
    fontSize: '2.5rem',
    marginTop: '0.75rem',
    marginBottom: '1rem',
    fontWeight: 800,
  },
  sectionDesc: {
    fontSize: '1.1rem',
    color: 'var(--grey-blue)',
    maxWidth: '700px',
    margin: '0 auto',
    lineHeight: 1.6,
  },
  treeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  tierContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  tierHeader: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  tierBadge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '0.35rem 0.85rem',
    borderRadius: '9999px',
    background: 'rgba(65, 150, 240, 0.15)',
    color: '#4196F0',
    border: '1px solid rgba(65, 150, 240, 0.3)',
    display: 'inline-block',
    marginBottom: '0.75rem',
  },
  tierTitle: {
    fontSize: '1.6rem',
    fontWeight: 800,
    color: 'var(--white)',
  },
  commissionersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '750px',
  },
  directorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '1100px',
  },
  pillarsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '3rem',
    width: '100%',
    marginTop: '1rem',
  },
  pillar: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '2rem 1.5rem',
  },
  pillarHeader: {
    textAlign: 'center',
    marginBottom: '2rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1.5rem',
  },
  pillarBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '0.3rem 0.75rem',
    borderRadius: '9999px',
    background: 'rgba(255, 178, 64, 0.15)',
    color: 'var(--lemon)',
    border: '1px solid rgba(255, 178, 64, 0.3)',
    display: 'inline-block',
    marginBottom: '0.5rem',
  },
  pillarTitle: {
    fontSize: '1.35rem',
    fontWeight: 750,
    color: 'var(--white)',
    marginBottom: '0.35rem',
  },
  pillarDesc: {
    fontSize: '0.85rem',
    color: 'var(--grey-blue)',
  },
  managersGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  card: {
    background: '#212121', // Neutral deep gray requested
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    padding: '1.25rem',
    display: 'flex',
    gap: '1.25rem',
    alignItems: 'flex-start',
    transition: 'all 0.25s ease',
  },
  cardVacant: {
    borderStyle: 'dashed',
    background: '#212121',
    opacity: 0.65,
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: 'var(--white)',
    fontWeight: 800,
    fontSize: '0.9rem',
  },
  cardInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    flex: 1,
  },
  cardName: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--white)',
  },
  cardTitle: {
    fontSize: '0.8rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  cardFocus: {
    fontSize: '0.85rem',
    color: 'var(--l-grey)',
    lineHeight: 1.4,
  },
  connectorVertical: {
    width: '2px',
    height: '40px',
    background: 'linear-gradient(180deg, var(--border-color), var(--azure))',
    margin: '1.5rem 0',
  },
  connectorHorizontalRow: {
    width: '100%',
    maxWidth: '800px',
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '2rem',
  },
  connectorHorizontalLine: {
    width: '50%',
    height: '2px',
    background: 'var(--border-color)',
  },
};
