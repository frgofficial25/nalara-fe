"use client";

import React from 'react';
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
  Gem
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
          { label: 'Level', href: '/lecturer/kelas', icon: Gem },
          { label: 'Assignments', href: '/lecturer/tugas', icon: FileText },
          { label: 'Quiz Bank', href: '/lecturer/evaluasi', icon: Brain },
          { label: 'Grade Center', href: '/lecturer/penilaian', icon: TrendingUp },
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
}

export default function Sidebar({ 
  menu, 
  roleName = "System Owner",
  isCollapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

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
    <aside style={{
      ...s.sidebar,
      width: isCollapsed ? '72px' : '260px',
    }}>
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
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
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
          transition: all 0.25s ease;
        }
        .bottom-logout-btn:hover {
          background-color: rgba(239, 68, 68, 0.08) !important;
          transform: translateX(4px);
        }
        .bottom-collapse-btn {
          transition: all 0.25s ease;
        }
        .bottom-collapse-btn:hover {
          background-color: rgba(255, 255, 255, 0.03) !important;
        }
      `}} />

      {/* Logo Area */}
      <div style={s.logoArea}>
        <div style={s.logoWrapper}>
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="38" height="38" rx="8" fill="white"/>
            <path d="M19 7C12.5 7 7 12.5 7 19C7 23.3 9.4 27.1 13 29.1C13 27 14 23.2 19 23.2C24 23.2 25 27 25 29.1C28.6 27.1 31 23.3 31 19C31 12.5 25.5 7 19 7Z" fill="#0056b3" />
            <path d="M19 10C14.6 10 11 13.6 11 18C11 20.9 12.5 23.4 14.8 24.8C15.8 22.3 17.3 20.5 19 20.5C20.7 20.5 22.2 22.3 23.2 24.8C25.5 23.4 27 20.9 27 18C27 13.6 23.4 10 19 10Z" fill="white" />
            <path d="M19 13C16.2 13 14 15.2 14 18C14 19.8 15 21.4 16.4 22.3C17 20.6 17.9 19.5 19 19.5C20.1 19.5 21 20.6 21.6 22.3C23 21.4 24 19.8 24 18C24 15.2 21.8 13 19 13Z" fill="#0ea5e9" />
            <path d="M19 22L22 27H16L19 22Z" fill="#f59e0b" />
            <circle cx="19" cy="18" r="2.5" fill="#3b82f6" />
          </svg>
        </div>
        {!isCollapsed && (
          <div style={s.logoText}>
            <span style={s.logoTitle}>Nalara Academy</span>
            <span style={s.logoSubtitle}>Admin Console</span>
          </div>
        )}
      </div>

      {/* Role Badge */}
      {!isCollapsed && (
        <div style={s.roleBadgeWrap}>
          <div style={s.roleBadge}>
            <span className="pulse-dot" />
            <span style={s.roleBadgeText}>
              {roleName === 'SuperAdmin' ? 'SuperAdmin Portal' : 
               roleName === 'Lecturer' ? 'Lecturer Portal' : 
               roleName === 'Tentor' ? 'Tentor Portal' : 'Student Portal'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={s.nav}>
        {activeMenu.map((group, index) => (
          <div key={index} style={s.menuGroup}>
            {!isCollapsed && (
              <div style={s.groupLabel}>{group.group}</div>
            )}
            <ul style={s.menuList}>
              {group.items.map((item: any, itemIndex: number) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={itemIndex} style={{ listStyle: 'none' }}>
                    <Link
                      href={item.href}
                      className={`menu-item-transition ${isActive ? 'menu-item-active' : ''}`}
                      style={{
                        ...s.menuItem,
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        padding: isCollapsed ? '10px' : '11px 14px',
                      }}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {isActive && <div className="left-indicator" />}
                      <Icon 
                        size={18} 
                        className={isActive ? 'active-icon' : ''} 
                        color={isActive ? '#0ea5e9' : '#64748b'} 
                        style={{ transition: 'color 0.25s' }}
                      />
                      {!isCollapsed && (
                        <span 
                          className={isActive ? 'active-label' : ''}
                          style={{
                            ...s.menuLabel,
                            color: isActive ? '#ffffff' : '#94a3b8',
                          }}
                        >
                          {item.label}
                        </span>
                      )}
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
          <LogOut size={18} color="#ef4444" />
          {!isCollapsed && <span style={{ ...s.bottomBtnLabel, color: '#ef4444', fontWeight: 600 }}>Sign Out</span>}
        </button>
        <button 
          className="bottom-collapse-btn"
          style={s.bottomBtn} 
          onClick={onToggleCollapse} 
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronRight size={18} color="#64748b" /> : <ChevronLeft size={18} color="#64748b" />}
          {!isCollapsed && <span style={s.bottomBtnLabel}>Collapse Sidebar</span>}
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
    transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 40,
    flexShrink: 0,
    overflow: 'hidden',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '24px 20px',
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  logoTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    color: '#fff',
    fontSize: '1rem',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    letterSpacing: '-0.01em',
  },
  logoSubtitle: {
    fontSize: '0.75rem',
    color: '#64748b',
    whiteSpace: 'nowrap',
    marginTop: '2px',
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
  },
  menuGroup: {
    marginBottom: '24px',
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
    gap: '12px',
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
  },
  bottomBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '8px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  bottomBtnLabel: {
    fontWeight: 500,
    fontSize: '0.875rem',
    color: '#94a3b8',
    whiteSpace: 'nowrap',
  },
};
