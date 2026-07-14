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
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes glowPulseDashboard {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }
        @keyframes floatDashboardParticle1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(25px, -30px); }
        }
        @keyframes floatDashboardParticle2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 20px); }
        }
        @keyframes floatDashboardParticle3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, 20px); }
        }
        .dashboard-glow1 {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(6, 99, 199, 0.07) 0%, transparent 70%);
          top: -150px;
          left: -150px;
          pointer-events: none;
          z-index: 1;
          animation: glowPulseDashboard 12s infinite ease-in-out;
        }
        .dashboard-glow2 {
          position: absolute;
          width: 650px;
          height: 650px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 168, 38, 0.04) 0%, transparent 70%);
          bottom: -250px;
          right: -150px;
          pointer-events: none;
          z-index: 1;
          animation: glowPulseDashboard 15s infinite ease-in-out 3s;
        }
        .dashboard-particle {
          position: absolute;
          background: var(--azure);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--azure);
          pointer-events: none;
          z-index: 1;
        }
      `}} />

      {/* Sidebar */}
      <Sidebar 
        roleName={getRoleName(userInfo?.role)}
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      {/* Main Content Area */}
      <div style={s.mainArea}>
        {/* Animated Glows & Particles */}
        <div className="dashboard-glow1" />
        <div className="dashboard-glow2" />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden', zIndex: 1 }}>
          <div className="dashboard-particle" style={{ width: '4px', height: '4px', top: '15%', left: '15%', opacity: 0.25, animation: 'floatDashboardParticle1 12s infinite ease-in-out' }} />
          <div className="dashboard-particle" style={{ width: '5px', height: '5px', top: '25%', left: '80%', opacity: 0.2, animation: 'floatDashboardParticle2 15s infinite ease-in-out' }} />
          <div className="dashboard-particle" style={{ width: '4px', height: '4px', top: '75%', left: '12%', opacity: 0.25, animation: 'floatDashboardParticle3 14s infinite ease-in-out' }} />
          <div className="dashboard-particle" style={{ width: '5px', height: '5px', top: '80%', left: '85%', opacity: 0.2, animation: 'floatDashboardParticle2 18s infinite ease-in-out reverse' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 10 }}>
          <Header 
            userName={userInfo?.name || "Nalara User"}
            userRole={getRoleName(userInfo?.role)}
            userInitial={userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : "N"}
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
