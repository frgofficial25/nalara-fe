"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

import { useRouter, usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; role: string } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const getRoleName = (role?: string) => {
    if (!role) return "System Owner";
    const cleanRole = role.toLowerCase();
    if (cleanRole === 'superadmin') return "SuperAdmin";
    if (cleanRole === 'lecture' || cleanRole === 'lecturer') return "Lecturer";
    if (cleanRole === 'mentor' || cleanRole === 'tentor') return "Tentor";
    return "Student";
  };

  const redirectToCorrectDashboard = (role: string) => {
    if (role === 'superadmin') {
      router.push('/superadmin/dashboard');
    } else if (role === 'lecture' || role === 'lecturer') {
      router.push('/lecturer/dashboard');
    } else if (role === 'mentor' || role === 'tentor') {
      router.push('/tentor/dashboard');
    } else {
      router.push('/student/dashboard');
    }
  };

  useEffect(() => {
    const data = localStorage.getItem('nalara_user_info') || sessionStorage.getItem('nalara_user_info');
    if (!data) {
      router.push('/login');
      return;
    }
    try {
      const user = JSON.parse(data);
      setUserInfo(user);
      
      const role = user.role?.toLowerCase() || '';
      // Middleware guard check
      if (pathname.startsWith('/superadmin') && role !== 'superadmin') {
        redirectToCorrectDashboard(role);
      } else if (pathname.startsWith('/lecturer') && role !== 'lecture' && role !== 'lecturer' && role !== 'mentor' && role !== 'tentor') {
        redirectToCorrectDashboard(role);
      } else if (pathname.startsWith('/tentor') && role !== 'mentor' && role !== 'tentor') {
        redirectToCorrectDashboard(role);
      }
    } catch (e) {
      console.error('Failed to parse user info:', e);
      router.push('/login');
    }
  }, [pathname, router]);

  return (
    <div style={s.wrapper}>
      {/* Sidebar */}
      <Sidebar 
        roleName={getRoleName(userInfo?.role)}
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      {/* Main Content Area */}
      <div style={s.mainArea}>
        {/* Ambient Glowing Blobs */}
        <div style={s.glowRed} />
        <div style={s.glowYellow} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <Header 
            userName={userInfo?.name || "Nalara User"}
            userRole={getRoleName(userInfo?.role)}
            userInitial={userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : "N"}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>
        
        {/* Scrollable Content */}
        <main style={s.content}>
          <div style={s.contentInner}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    background: '#0B0E14',
    overflow: 'hidden',
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    minWidth: 0,
    background: '#0B0E14',
    position: 'relative',
  },
  glowRed: {
    position: 'absolute',
    top: '-150px',
    right: '-100px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(239, 68, 68, 0.07) 0%, rgba(239, 68, 68, 0) 70%)',
    filter: 'blur(60px)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  glowYellow: {
    position: 'absolute',
    bottom: '-150px',
    left: '20%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0) 70%)',
    filter: 'blur(80px)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '28px 32px',
    position: 'relative',
    zIndex: 2,
  },
  contentInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 2,
  },
};
