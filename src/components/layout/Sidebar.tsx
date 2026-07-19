"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
  BookOpen,
  Brain,
  GraduationCap,
  TrendingUp,
  Inbox,
  FileText,
  User,
  Layers,
  Users,
  ClipboardList,
  Award,
  Gem,
  Menu
} from 'lucide-react';
import { logoutApi } from '@/services/auth';

// Define the menu structures per role
export const getMenuForRole = (role?: string) => {
  const cleanRole = role?.toLowerCase() || '';
  if (cleanRole === 'superadmin') {
    return [
      {
        group: 'OVERVIEW',
        items: [
          { label: 'Dashboard', href: '/superadmin/dashboard', icon: LayoutDashboard },
          { label: 'Manage Users', href: '/superadmin/users', icon: Users },
        ],
      },
    ];
  } else if (cleanRole === 'lecture' || cleanRole === 'lecturer') {
    return [
      {
        group: 'OVERVIEW',
        items: [
          { label: 'Dashboard', href: '/lecturer/dashboard', icon: LayoutDashboard },
          { label: 'Kelas (Level)', href: '/lecturer/kelas', icon: Gem },
          { label: 'Evaluasi', href: '/lecturer/evaluasi', icon: Brain },
          { label: 'Penilaian', href: '/lecturer/penilaian', icon: TrendingUp },
        ],
      },
      {
        group: 'ACCOUNT',
        items: [
          { label: 'Profile', href: '/lecturer/profile', icon: User },
        ]
      }
    ];
  } else if (cleanRole === 'mentor' || cleanRole === 'tentor') {
    return [
      {
        group: 'OVERVIEW',
        items: [
          { label: 'Dashboard', href: '/tentor/dashboard', icon: LayoutDashboard },
          { label: 'Tugas (Review)', href: '/tentor/tugas', icon: FileText },
          { label: 'Penilaian', href: '/tentor/penilaian', icon: TrendingUp },
          { label: 'Kelulusan', href: '/tentor/kelulusan', icon: GraduationCap },
        ],
      },
      {
        group: 'ACCOUNT',
        items: [
          { label: 'Profile', href: '/tentor/profile', icon: User },
        ]
      }
    ];
  } else {
    return [
      {
        group: 'OVERVIEW',
        items: [
          { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
          { label: 'Kelas', href: '/student/kelas', icon: Layers },
          { label: 'Penugasan', href: '/student/penugasan', icon: ClipboardList },
          { label: 'Leaderboard', href: '/student/leaderboard', icon: TrendingUp },
        ],
      },
      {
        group: 'ACCOUNT',
        items: [
          { label: 'Profile', href: '/student/profile', icon: User },
        ]
      }
    ];
  }
};

interface SidebarProps {
  menu?: any[];
  roleName?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClickLink?: () => void;
  isMobileOpen?: boolean;
}

export default function Sidebar({ 
  menu, 
  roleName = "System Owner",
  isCollapsed = false,
  onToggleCollapse,
  onClickLink,
  isMobileOpen = false
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.error('Logout error on server:', e);
    } finally {
      localStorage.removeItem('nalara_user_info');
      sessionStorage.removeItem('nalara_user_info');
      router.push('/login');
    }
  };

  const activeMenu = menu || getMenuForRole(roleName);

  return (
    <aside 
      className={`sidebar-layout ${isMobileOpen ? 'open' : ''}`}
      style={{
        ...s.sidebar,
        width: isCollapsed ? '72px' : '260px',
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseGlow {
          0% {
            transform: scale(0.95);
            opacity: 0.5;
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
            box-shadow: 0 0 8px 2px rgba(34, 197, 94, 0.6);
          }
          100% {
            transform: scale(0.95);
            opacity: 0.5;
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }
        .pulse-dot {
          width: 8px;
          height: 8px;
          background-color: #10b981;
          border-radius: 50%;
          display: inline-block;
          margin-right: 8px;
          animation: pulseGlow 2s infinite ease-in-out;
        }
        .menu-item-transition {
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
        }
        .menu-item-transition:hover {
          background-color: rgba(255, 255, 255, 0.03);
          transform: translateX(4px);
        }
        .menu-item-active {
          background: linear-gradient(90deg, rgba(14, 165, 233, 0.12) 0%, rgba(14, 165, 233, 0.02) 100%) !important;
          border: 1px solid rgba(14, 165, 233, 0.45) !important;
          box-shadow: inset 0 0 10px rgba(14, 165, 233, 0.08), 0 4px 12px rgba(0, 0, 0, 0.25);
        }
        .menu-item-active .active-label {
          color: #ffffff !important;
          font-weight: 600;
        }
        .menu-item-active .active-icon {
          color: #38bdf8 !important;
        }
        .left-indicator {
          position: absolute;
          left: 0;
          top: 15%;
          height: 70%;
          width: 5px;
          background-color: #0ea5e9;
          border-top-right-radius: 4px;
          border-bottom-right-radius: 4px;
          box-shadow: 0 0 10px rgba(14, 165, 233, 0.8);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bottom-logout-btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bottom-logout-btn:hover {
          background-color: rgba(239, 68, 68, 0.08) !important;
          transform: translateX(4px);
        }
      `}} />

      {/* Sidebar Header with Logo and Collapse/Expand Toggle */}
      <div style={{
        ...s.logoArea,
        flexDirection: isCollapsed ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        padding: isCollapsed ? '24px 10px' : '24px 20px',
        gap: isCollapsed ? '16px' : '0px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        {/* Logo container */}
        <div style={{
          width: isCollapsed ? '32px' : '150px',
          height: isCollapsed ? '32px' : '38px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          overflow: 'hidden',
        }}>
          <img 
            src={isCollapsed ? "/image/logonalara.png" : "/image/logonalara2.png"} 
            alt="Nalara Logo" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }} 
          />
        </div>

        {/* Collapse toggle button next to logo */}
        {onToggleCollapse && (
          <button
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            onMouseEnter={() => setIsBtnHovered(true)}
            onMouseLeave={() => setIsBtnHovered(false)}
            style={{
              background: isBtnHovered ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
            }}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu size={18} color="#94a3b8" />
          </button>
        )}
      </div>

      {/* Role Badge */}
      <div style={{
        ...s.roleBadgeWrap,
        opacity: isCollapsed ? 0 : 1,
        maxHeight: isCollapsed ? '0px' : '50px',
        transform: isCollapsed ? 'scale(0.8) translateY(-10px)' : 'scale(1) translateY(0)',
        overflow: 'hidden',
        padding: isCollapsed ? '0' : '16px 20px 16px 20px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={s.roleBadge}>
          <span className="pulse-dot" />
          <span style={s.roleBadgeText}>
            {roleName === 'SuperAdmin' ? 'SuperAdmin Portal' : 
             roleName === 'Lecturer' ? 'Lecturer Portal' : 
             roleName === 'Tentor' ? 'Tentor Portal' : 'Student Portal'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={s.nav}>
        {activeMenu.map((group, index) => (
          <div key={index} style={s.menuGroup}>
            <div style={{
              ...s.groupLabel,
              opacity: isCollapsed ? 0 : 1,
              maxHeight: isCollapsed ? '0px' : '20px',
              transform: isCollapsed ? 'scale(0.8) translateY(-10px)' : 'scale(1) translateY(0)',
              overflow: 'hidden',
              marginBottom: isCollapsed ? '0px' : '8px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              {group.group}
            </div>
            <ul style={s.menuList}>
              {group.items.map((item: any, itemIndex: number) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
                const Icon = item.icon;
                return (
                  <li key={itemIndex} style={{ listStyle: 'none' }}>
                    <Link
                      href={item.href}
                      onClick={onClickLink}
                      className={`menu-item-transition ${isActive ? 'menu-item-active' : ''}`}
                      style={{
                        ...s.menuItem,
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        padding: isCollapsed ? '12px' : '11px 14px',
                        gap: isCollapsed ? '0' : '12px',
                      }}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {isActive && !isCollapsed && <div className="left-indicator" />}
                      <Icon 
                        size={18} 
                        className={isActive ? 'active-icon' : ''} 
                        color={isActive ? '#0ea5e9' : '#64748b'} 
                        style={{ transition: 'color 0.25s', flexShrink: 0 }}
                      />
                      <span 
                        className={isActive ? 'active-label' : ''}
                        style={{
                          ...s.menuLabel,
                          color: isActive ? '#ffffff' : '#94a3b8',
                          opacity: isCollapsed ? 0 : 1,
                          transform: isCollapsed ? 'translateX(-10px)' : 'translateX(0)',
                          maxWidth: isCollapsed ? '0px' : '200px',
                          visibility: isCollapsed ? 'hidden' : 'visible',
                          overflow: 'hidden',
                          display: 'inline-block',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div style={s.bottomActions}>
        <button 
          className="bottom-logout-btn"
          style={s.bottomBtn} 
          onClick={handleLogout} 
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          <span style={{ 
            ...s.bottomBtnLabel, 
            color: '#ef4444', 
            fontWeight: 600,
            opacity: isCollapsed ? 0 : 1,
            transform: isCollapsed ? 'translateX(-10px)' : 'translateX(0)',
            maxWidth: isCollapsed ? '0px' : '200px',
            visibility: isCollapsed ? 'hidden' : 'visible',
            overflow: 'hidden',
            display: 'inline-block',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}

const s: Record<string, React.CSSProperties> = {
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    background: '#0B0E14',
    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 40,
    flexShrink: 0,
    overflow: 'hidden',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '24px 20px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  roleBadgeWrap: {
    padding: '0 20px 16px 20px',
  },
  roleBadge: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  roleBadgeText: {
    fontWeight: 500,
    fontSize: '0.75rem',
    color: '#94a3b8',
    whiteSpace: 'nowrap',
  },
  nav: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '12px 16px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  menuGroup: {
    marginBottom: '24px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  groupLabel: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '0 12px',
    marginBottom: '8px',
  },
  menuList: {
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: '8px',
    textDecoration: 'none',
    cursor: 'pointer',
    background: 'transparent',
    border: '1px solid transparent',
  },
  menuLabel: {
    fontWeight: 500,
    fontSize: '0.875rem',
    whiteSpace: 'nowrap',
    transition: 'color 0.25s',
  },
  bottomActions: {
    padding: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    background: 'rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  bottomBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderRadius: '8px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  bottomBtnLabel: {
    fontWeight: 500,
    fontSize: '0.875rem',
    color: '#94a3b8',
    whiteSpace: 'nowrap',
  },
};
