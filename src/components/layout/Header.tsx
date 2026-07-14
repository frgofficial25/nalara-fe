"use client";

import React, { useState } from 'react';
import { ChevronDown, Menu } from 'lucide-react';

interface HeaderProps {
  userName?: string;
  userRole?: string;
  userInitial?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Header({
  userName = "Nalara Chief Administrator",
  userRole = "Owner",
  userInitial = "N",
  isCollapsed = false,
  onToggleCollapse
}: HeaderProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <header style={s.header}>
      {/* Collapse/Expand Toggle on Left */}
      {onToggleCollapse ? (
        <button
          onClick={onToggleCollapse}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            ...s.collapseBtn,
            backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
          }}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu size={20} color="#94a3b8" />
        </button>
      ) : (
        <div /> // Spacer if no toggle
      )}

      {/* User Profile */}
      <div style={s.userProfile}>
        <div style={s.userAvatar}>
          {userInitial}
        </div>
        <div style={s.userInfo}>
          <span style={s.userName}>{userName}</span>
          <span style={s.userRoleText}>{userRole}</span>
        </div>
        <ChevronDown size={14} color="var(--grey)" />
      </div>
    </header>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 24px',
    position: 'sticky',
    top: 0,
    zIndex: 30,
    background: 'rgba(11, 14, 20, 0.75)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  collapseBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: '8px',
  },
  userAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--navy), var(--m-blue))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.85rem',
    fontFamily: 'var(--font-display)',
    boxShadow: '0 0 12px rgba(6, 99, 199, 0.4)',
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#fff',
    whiteSpace: 'nowrap',
  },
  userRoleText: {
    fontSize: '0.68rem',
    color: 'var(--grey-blue)',
  },
};

