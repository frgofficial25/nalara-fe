'use client';

import React from 'react';

interface Member {
  name: string;
  role: string;
  image: string;
  isPresident?: boolean;
}

const commissioners: Member[] = [
  {
    name: "Athallah Anargya Mahardika",
    role: "COMMISSIONER",
    image: "/image/team/athalah.png"
  },
  {
    name: "Dr. Ir. Arief Andy Soebroto, S.T., M.Kom.",
    role: "PRESIDENT COMMISSIONER",
    image: "/image/team/aan.png",
    isPresident: true
  },
  {
    name: "Aryan Zaky Prayogo",
    role: "COMMISSIONER",
    image: "/image/team/aryan.png"
  }
];

const boardOfDirectors: Member[] = [
  {
    name: "Ulfa Aulia Sakina",
    role: "CHIEF EXECUTIVE OFFICER (CEO)",
    image: "/image/team/ulfa.png"
  }
];

const cSuiteAndDeputies: Member[] = [
  {
    name: "Raven Ravellyn Sulistyo",
    role: "DEPUTY OF CTO",
    image: "/image/team/raven.png"
  },
  {
    name: "Lintang Muhammad Shiddiq",
    role: "CHIEF TECHNOLOGY OFFICER (CTO)",
    image: "/image/team/lintang.png"
  },
  {
    name: "Noval Zakky Ramadhan",
    role: "CHIEF OPERATING OFFICER (COO)",
    image: "/image/team/nopal.png"
  },
  {
    name: "Muhammad Hafiizh Anindya",
    role: "DEPUTY OF COO",
    image: "/image/team/hapis.png"
  }
];

const boardOfManagers: Member[] = [
  {
    name: "Gerard Breunerd Pangaroan",
    role: "TECHNICAL PROJECT MANAGER",
    image: "/image/team/gerard.png"
  },
  {
    name: "Rifky Cahya Setyaji",
    role: "LMS DEVELOPMENT MANAGER",
    image: "/image/team/rifky.png"
  },
  {
    name: "Sayyid Hasher Ghneimsylmi",
    role: "CREATIVE DESIGN MANAGER",
    image: "/image/team/sayyid.png"
  },
  {
    name: "Athala Muhammad",
    role: "LEARNING & COMMUNITY MANAGER",
    image: "/image/team/athala.png"
  },
  {
    name: "Zaki Arif Efendi",
    role: "GRADUATION & ASSESSMENT MANAGER",
    image: "/image/team/jeki.png"
  },
  {
    name: "Naufal Fadhil Arkani",
    role: "PROGRAM DELIVERY MANAGER",
    image: "/image/team/arkan.png"
  },
  {
    name: "Inas Tuqa Haura",
    role: "PROGRAM DELIVERY MANAGER",
    image: "/image/team/inas.png"
  },
  {
    name: "Akmal Baihaqi",
    role: "PROGRAM DELIVERY MANAGER",
    image: "/image/team/akmal.png"
  }
];

const SafeTeamImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [hasError, setHasError] = React.useState(false);
  if (hasError || !src) {
    return null;
  }
  return (
    <img 
      src={src} 
      alt="" 
      className={className} 
      onError={() => setHasError(true)} 
    />
  );
};

export default function Team() {
  const renderCard = (
    member: Member, 
    theme: 'commissioner' | 'director' | 'manager',
    offsetY?: string
  ) => {
    let themeColor = '#ffffff';
    let borderColor = 'rgba(255, 255, 255, 0.1)';
    let roleColor = '#ffffff';
    let glowColor = 'rgba(255, 255, 255, 0.05)';

    if (theme === 'commissioner') {
      themeColor = '#ffa826';
      borderColor = 'rgba(255, 168, 38, 0.35)';
      roleColor = '#ffa826';
      glowColor = 'rgba(255, 168, 38, 0.1)';
    } else if (theme === 'director') {
      themeColor = '#0671E0';
      borderColor = 'rgba(6, 113, 224, 0.35)';
      roleColor = '#4196F0';
      glowColor = 'rgba(6, 113, 224, 0.1)';
    } else if (theme === 'manager') {
      themeColor = '#10b981';
      borderColor = 'rgba(16, 185, 129, 0.35)';
      roleColor = '#34d399';
      glowColor = 'rgba(16, 185, 129, 0.1)';
    }

    const cardClass = `team-card team-card-${theme} ${member.isPresident ? 'team-card-president' : ''}`;

    return (
      <div 
        className={cardClass} 
        key={member.name}
        style={{
          '--theme-color': themeColor,
          '--border-color-custom': borderColor,
          '--glow-color': glowColor,
          ...(offsetY ? { transform: `translateY(${offsetY})` } : {}),
        } as React.CSSProperties}
      >
        <div className="team-card-photo-container">
          <div className="team-card-placeholder">👤</div>
          <SafeTeamImage 
            src={member.image} 
            alt={member.name} 
            className="team-card-img"
          />
        </div>
        
        <div className="team-card-info">
          <h4 className="team-card-name">{member.name}</h4>
          <span className="team-card-role" style={{ color: roleColor }}>{member.role}</span>
        </div>
      </div>
    );
  };

  const managerOffsets = [
    '-20px', // Gerard (high)
    '-8px',  // Rifky
    '8px',   // Sayyid
    '22px',  // Athala (low center)
    '22px',  // Zaki (low center)
    '8px',   // Arkan
    '-8px',  // Inas
    '-20px', // Akmal (high)
  ];

  return (
    <section className="the-masterminds-section" id="team">
      <div className="section-container">
        {/* Header */}
        <div className="masterminds-header">
          <h2 className="masterminds-title">The Masterminds</h2>
          <p className="masterminds-desc">
            Struktur tata kelola dan tim pelaksana operasional bootcamp Nalara Academy yang terorganisir untuk memastikan standar akademik &amp; keberhasilan program.
          </p>
        </div>

        {/* Tree Layout */}
        <div className="masterminds-tree">
          
          {/* TIER 1: COMMISSIONERS */}
          <div className="tree-tier tier-commissioners">
            <div className="badge-wrapper">
              <span className="tier-badge badge-commissioners">BOARD OF COMMISSIONERS</span>
            </div>
            <div className="tier-cards-row">
              {renderCard(commissioners[0], 'commissioner')}
              {renderCard(commissioners[1], 'commissioner')}
              {renderCard(commissioners[2], 'commissioner')}
            </div>
          </div>

          {/* Connection Line 1 -> 2 */}
          <div className="connector-path">
            <div className="vertical-line"></div>
          </div>

          {/* TIER 2: CEO */}
          <div className="tree-tier tier-director">
            <div className="badge-wrapper">
              <span className="tier-badge badge-directors">BOARD OF DIRECTORS</span>
            </div>
            <div className="tier-cards-row">
              {renderCard(boardOfDirectors[0], 'director')}
            </div>
          </div>

          {/* Connection Line 2 -> 3 */}
          <div className="connector-path csuite-connector">
            <div className="vertical-line"></div>
            <div className="horizontal-branch branch-4"></div>
            <div className="vertical-drops-4">
              <div className="drop-line drop-line-0"></div>
              <div className="drop-line drop-line-1"></div>
              <div className="drop-line drop-line-2"></div>
              <div className="drop-line drop-line-3"></div>
            </div>
          </div>

          {/* TIER 3: DEPUTIES & CTO/COO */}
          <div className="tree-tier tier-csuite">
            <div className="tier-cards-row csuite-row">
              {cSuiteAndDeputies.map(m => renderCard(m, 'director'))}
            </div>
          </div>

          {/* Connection Line 3 -> 4 */}
          <div className="connector-path csuite-join-connector">
            <div className="vertical-joins-4">
              <div className="join-line join-line-0"></div>
              <div className="join-line join-line-1"></div>
              <div className="join-line join-line-2"></div>
              <div className="join-line join-line-3"></div>
            </div>
            <div className="horizontal-branch branch-4-join"></div>
            <div className="vertical-line v-mid-to-managers"></div>
          </div>

          {/* TIER 4: MANAGERS */}
          <div className="tree-tier tier-managers">
            <div className="badge-wrapper">
              <span className="tier-badge badge-managers">BOARD OF MANAGERS</span>
            </div>
            {/* Horizontal Line Branch above managers (8 items) */}
            <div className="managers-connector-top">
              <div className="horizontal-branch branch-8"></div>
              <div className="vertical-drops-8">
                <div className="drop-line drop-m-0"></div>
                <div className="drop-line drop-m-1"></div>
                <div className="drop-line drop-m-2"></div>
                <div className="drop-line drop-m-3"></div>
                <div className="drop-line drop-m-4"></div>
                <div className="drop-line drop-m-5"></div>
                <div className="drop-line drop-m-6"></div>
                <div className="drop-line drop-m-7"></div>
              </div>
            </div>
            <div className="tier-cards-row managers-row">
              {boardOfManagers.map((m, idx) => renderCard(m, 'manager', managerOffsets[idx]))}
            </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        /* Masterminds Section Styling */
        .the-masterminds-section {
          padding: 80px 16px;
          display: flex;
          justify-content: center;
          width: 100%;
          position: relative;
        }

        .section-container {
          max-width: 1480px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .masterminds-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .masterminds-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 40px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 16px;
          color: #ffffff;
        }

        .masterminds-desc {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: #888888;
          max-width: 700px;
          line-height: 1.6;
          margin: 0 auto;
        }

        /* Tree Structure */
        .masterminds-tree {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .tree-tier {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .badge-wrapper {
          margin-bottom: 24px;
          display: flex;
          justify-content: center;
          z-index: 10;
        }

        .tier-badge {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          padding: 6px 16px;
          border-radius: 20px;
          border: 1px solid;
          background: rgba(18, 18, 20, 0.95);
        }

        .badge-commissioners {
          border-color: rgba(255, 168, 38, 0.4);
          color: #ffa826;
        }

        .badge-directors {
          border-color: rgba(6, 113, 224, 0.4);
          color: #4196F0;
        }

        .badge-managers {
          border-color: rgba(16, 185, 129, 0.4);
          color: #10b981;
        }

        /* Cards Row Layouts */
        .tier-cards-row {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 24px;
          width: 100%;
          flex-wrap: wrap;
          z-index: 5;
        }

        .csuite-row {
          width: 912px;
          display: flex;
          justify-content: center;
          gap: 24px;
        }

        /* FORCE ALL 8 MANAGERS IN ONE SINGLE ROW ON DESKTOP */
        .managers-row {
          width: 1244px;
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap !important;
          justify-content: center;
          align-items: flex-end;
          gap: 12px;
          padding-top: 10px;
          padding-bottom: 35px;
        }

        /* Connecting Lines Design */
        .connector-path {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          position: relative;
        }

        .vertical-line {
          width: 1px;
          height: 40px;
          background: rgba(255, 255, 255, 0.25);
        }

        .v-mid-to-managers {
          width: 1px;
          height: 30px;
          background: rgba(255, 255, 255, 0.25);
        }

        .horizontal-branch {
          height: 1px;
          background: rgba(255, 255, 255, 0.25);
          position: relative;
        }

        /* C-Suite Branching (4 items - 912px container) */
        .csuite-connector, .csuite-join-connector {
          width: 912px;
          position: relative;
        }

        .branch-4, .branch-4-join {
          width: 702px;
          left: 0;
          margin: 0 auto;
        }

        .vertical-drops-4, .vertical-joins-4 {
          position: relative;
          width: 912px;
          height: 25px;
        }

        .vertical-drops-4 .drop-line, .vertical-joins-4 .join-line {
          position: absolute;
          width: 1px;
          height: 100%;
          background: rgba(255, 255, 255, 0.25);
        }

        .drop-line-0, .join-line-0 { left: 105px; }
        .drop-line-1, .join-line-1 { left: 339px; }
        .drop-line-2, .join-line-2 { left: 573px; }
        .drop-line-3, .join-line-3 { left: 807px; }

        /* Managers Branching (8 items - 1244px container) */
        .managers-connector-top {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 1244px;
          position: relative;
          margin-bottom: 12px;
        }

        .branch-8 {
          width: 1099px;
          left: 0;
          margin: 0 auto;
        }

        .vertical-drops-8 {
          position: relative;
          width: 1244px;
          height: 20px;
        }

        .vertical-drops-8 .drop-line {
          position: absolute;
          width: 1px;
          height: 100%;
          background: rgba(255, 255, 255, 0.25);
        }

        .drop-m-0 { left: 72.5px; }
        .drop-m-1 { left: 229.5px; }
        .drop-m-2 { left: 386.5px; }
        .drop-m-3 { left: 543.5px; }
        .drop-m-4 { left: 700.5px; }
        .drop-m-5 { left: 857.5px; }
        .drop-m-6 { left: 1014.5px; }
        .drop-m-7 { left: 1171.5px; }

        /* ==================== POP-OUT CARD DESIGN ==================== */
        .team-card {
          border: 1px solid var(--border-color-custom);
          border-radius: 12px;
          background: rgba(21, 21, 23, 0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          flex-direction: column;
          position: relative;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease;
          box-shadow: 0 4px 24px var(--glow-color);
          overflow: visible !important; /* ALLOWS POP-OUT HEAD ABOVE TOP BORDER */
          margin-top: 40px; /* Space for the popped out head */
        }

        .team-card:hover {
          border-color: var(--theme-color) !important;
          box-shadow: 0 12px 32px var(--glow-color);
        }

        /* Card Sizing per Tier */
        .team-card-commissioner {
          width: 220px;
          height: 290px;
        }
        
        .team-card-president {
          width: 250px;
          height: 330px;
          margin-top: 50px;
        }

        .team-card-director {
          width: 210px;
          height: 280px;
        }

        .team-card-manager {
          width: 145px;
          height: 235px;
          flex-shrink: 0;
        }

        /* Photo Pop-out Container */
        .team-card-photo-container {
          position: relative;
          width: 100%;
          overflow: visible !important;
        }

        .team-card-commissioner .team-card-photo-container {
          height: 216px; 
        }

        .team-card-president .team-card-photo-container {
          height: 246px; 
        }

        .team-card-director .team-card-photo-container {
          height: 206px; 
        }

        .team-card-manager .team-card-photo-container {
          height: 170px; 
        }

        /* Placeholder avatar */
        .team-card-placeholder {
          position: absolute;
          bottom: 0;
          left: 5%;
          width: 90%;
          height: 100%;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle, rgba(33, 33, 36, 0.6) 0%, rgba(20, 20, 22, 0.8) 100%);
          font-size: 28px;
          color: rgba(255, 255, 255, 0.1);
          z-index: 1;
        }

        /* Popped out Image (Extends out of top border) */
        .team-card-img {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 120%; /* Taller than container so head pops out */
          object-fit: contain;
          object-position: bottom center;
          z-index: 2;
        }

        /* Bottom Info Bar */
        .team-card-info {
          padding: 10px 6px;
          text-align: center;
          background: rgba(18, 18, 20, 0.95);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          border-bottom-left-radius: 11px;
          border-bottom-right-radius: 11px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 3px;
          height: 74px;
          z-index: 3;
          position: relative;
          margin-top: auto;
        }

        .team-card-president .team-card-info {
          padding: 14px 12px;
          height: 84px;
        }

        .team-card-manager .team-card-info {
          height: 65px;
          padding: 6px 4px;
        }

        .team-card-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11.5px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          line-height: 1.25;
          letter-spacing: 0.1px;
        }

        .team-card-president .team-card-name {
          font-size: 13px;
          font-weight: 800;
        }

        .team-card-manager .team-card-name {
          font-size: 10px;
        }

        .team-card-role {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .team-card-manager .team-card-role {
          font-size: 7.5px;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1200px) {
          .managers-row {
            width: 100%;
            flex-wrap: wrap !important;
            gap: 14px;
          }
          .managers-connector-top, .csuite-connector, .csuite-join-connector {
            display: none;
          }
          .team-card-manager {
            transform: none !important;
            width: 155px;
          }
        }

        @media (max-width: 900px) {
          .csuite-row {
            width: 100%;
          }
          .vertical-line, .v-mid-to-managers {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .masterminds-title {
            font-size: 32px;
          }
          .tier-cards-row {
            gap: 16px;
          }
          .team-card {
            width: 160px !important;
          }
          .team-card-president {
            width: 180px !important;
          }
        }
      `}</style>
    </section>
  );
}
