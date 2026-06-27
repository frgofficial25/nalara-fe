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
  Layers
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
        ],
      },
    ];
  } else if (cleanRole === 'lecture' || cleanRole === 'lecturer') {
    return [
      {
        group: 'OVERVIEW',
        items: [
          { label: 'Dashboard', href: '/lecturer/dashboard', icon: LayoutDashboard },
          { label: 'Courses', href: '/lecturer/courses', icon: Layers },
          { label: 'Tugas', href: '/lecturer/tugas', icon: FileText },
          { label: 'Quiz Bank', href: '/lecturer/quizzes', icon: Brain },
          { label: 'Grade Center', href: '/lecturer/grades', icon: TrendingUp },
        ],
      },
      {
        group: 'ACCOUNT',
        items: [
          { label: 'Profile', href: '/lecturer/profile', icon: User },
        ],
      },
    ];
  } else {
    return [
      {
        group: 'OVERVIEW',
        items: [
          { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
          { label: 'Courses', href: '/student/courses', icon: Layers },
          { label: 'Study Cases', href: '/student/study-case-submissions', icon: FileText },
        ],
      },
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
      width: isCollapsed ? '72px' : '250px',
    }}>
      {/* Logo Area */}
      <div style={s.logoArea}>
        <div style={s.logoIcon}>
          <span style={s.logoInitials}>N</span>
        </div>
        {!isCollapsed && (
          <div style={s.logoText}>
            <span style={s.logoTitle}>Nalara</span>
            <span style={s.logoSubtitle}>Admin Console</span>
          </div>
        )}
      </div>

      {/* Role Badge */}
      {!isCollapsed && (
        <div style={s.roleBadgeWrap}>
          <div style={s.roleBadge}>
            <Shield size={14} color="var(--m-yellow)" />
            <span style={s.roleBadgeText}>{roleName}</span>
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
                      style={{
                        ...s.menuItem,
                        ...(isActive ? s.menuItemActive : {}),
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        padding: isCollapsed ? '10px' : '10px 12px',
                      }}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon size={18} color={isActive ? 'var(--azure)' : 'var(--grey-blue)'} />
                      {!isCollapsed && (
                        <span style={{
                          ...s.menuLabel,
                          color: isActive ? 'var(--azure)' : 'var(--grey-blue)',
                        }}>
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
        <button style={s.bottomBtn} onClick={handleLogout} title={isCollapsed ? "Logout" : undefined}>
          <LogOut size={18} color="var(--error)" />
          {!isCollapsed && <span style={{...s.bottomBtnLabel, color: 'var(--error)'}}>Logout</span>}
        </button>
        <button style={s.bottomBtn} onClick={onToggleCollapse} title={isCollapsed ? "Expand" : "Collapse"}>
          {isCollapsed ? <ChevronRight size={18} color="var(--grey)" /> : <ChevronLeft size={18} color="var(--grey)" />}
          {!isCollapsed && <span style={s.bottomBtnLabel}>Collapse</span>}
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
    background: 'rgba(25, 25, 25, 0.97)',
    borderRight: '1px solid var(--border-color)',
    transition: 'width 0.25s ease',
    zIndex: 40,
    flexShrink: 0,
    overflow: 'hidden',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 20px',
    borderBottom: '1px solid var(--border-color)',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--navy), var(--m-blue))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoInitials: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    color: '#fff',
    fontSize: '0.85rem',
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
    fontSize: '0.95rem',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  },
  logoSubtitle: {
    fontSize: '0.7rem',
    color: 'var(--grey-blue)',
    whiteSpace: 'nowrap',
  },
  roleBadgeWrap: {
    padding: '16px 16px 4px',
  },
  roleBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '8px',
    background: 'rgba(255, 178, 64, 0.08)',
    border: '1px solid rgba(255, 178, 64, 0.15)',
  },
  roleBadgeText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '0.8rem',
    color: 'var(--m-yellow)',
    whiteSpace: 'nowrap',
  },
  nav: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '12px 12px',
  },
  menuGroup: {
    marginBottom: '20px',
  },
  groupLabel: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--grey)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '0 8px',
    marginBottom: '6px',
  },
  menuList: {
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    transition: 'background 0.15s ease, color 0.15s ease',
    cursor: 'pointer',
  },
  menuItemActive: {
    background: 'rgba(6, 113, 224, 0.12)',
  },
  menuLabel: {
    fontWeight: 500,
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
  },
  bottomActions: {
    padding: '12px',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  bottomBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  bottomBtnLabel: {
    fontWeight: 500,
    fontSize: '0.85rem',
    color: 'var(--grey-blue)',
    whiteSpace: 'nowrap',
  },
};
