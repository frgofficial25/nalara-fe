"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useRouter, usePathname } from 'next/navigation';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import Portal from '../common/Portal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name?: string; nama_lengkap?: string; username?: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('show_login_toast') === 'true') {
      setToast({ message: 'Login berhasil! Selamat datang.', type: 'success' });
      sessionStorage.removeItem('show_login_toast');
      setTimeout(() => setToast(null), 4000);
    }
  }, []);

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
        @keyframes glowPulseDashboard1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.45; }
          50% { transform: translate(100px, 60px) scale(1.25); opacity: 0.75; }
        }
        @keyframes glowPulseDashboard2 {
          0%, 100% { transform: translate(0, 0) scale(1.2); opacity: 0.35; }
          50% { transform: translate(-100px, -80px) scale(0.95); opacity: 0.65; }
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
        @keyframes fadeInUpDashboard {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleUpModal {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .dashboard-glow1 {
          position: absolute;
          width: 750px;
          height: 750px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(6, 99, 199, 0.12) 0%, transparent 70%);
          top: -200px;
          left: -200px;
          pointer-events: none;
          z-index: 1;
          animation: glowPulseDashboard1 20s infinite ease-in-out;
          filter: blur(40px);
        }
        .dashboard-glow2 {
          position: absolute;
          width: 900px;
          height: 900px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 168, 38, 0.08) 0%, transparent 70%);
          bottom: -300px;
          right: -200px;
          pointer-events: none;
          z-index: 1;
          animation: glowPulseDashboard2 25s infinite ease-in-out;
          filter: blur(50px);
        }
        .dashboard-particle {
          position: absolute;
          background: var(--azure);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--azure);
          pointer-events: none;
          z-index: 1;
        }
        .animate-fade-in-up {
          animation: fadeInUpDashboard 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (max-width: 768px) {
          .header-burger-btn {
            display: flex !important;
          }
          .sidebar-layout {
            position: fixed !important;
            left: -260px;
            width: 260px !important;
            top: 0;
            bottom: 0;
            z-index: 1000 !important;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: 10px 0 30px rgba(0, 0, 0, 0.5);
          }
          .sidebar-layout.open {
            left: 0 !important;
          }
          .sidebar-collapse-btn {
            display: none !important;
          }
          .mobile-sidebar-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 999;
          }
          /* Adjust padding for scrollable content on mobile */
          main {
            padding: 16px 12px !important;
          }
        }
      `}} />

      {/* Backdrop for mobile sidebar */}
      {isMobileSidebarOpen && (
        <div 
          className="mobile-sidebar-backdrop" 
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        roleName={getRoleName(userInfo?.role)}
        isCollapsed={isMobile ? false : isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        onClickLink={() => setIsMobileSidebarOpen(false)}
        isMobileOpen={isMobileSidebarOpen}
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
            userName={userInfo?.nama_lengkap || userInfo?.name || userInfo?.username || "Nalara User"}
            userRole={getRoleName(userInfo?.role)}
            userInitial={
              userInfo?.nama_lengkap ? userInfo.nama_lengkap.charAt(0).toUpperCase() :
              userInfo?.name ? userInfo.name.charAt(0).toUpperCase() :
              userInfo?.username ? userInfo.username.charAt(0).toUpperCase() : "N"
            }
            onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          />
        </div>
        
        {/* Scrollable Content */}
        <main style={s.content}>
          <div style={s.contentInner} key={pathname} className="animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
      {toast && (
        <Portal>
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
          }}>
            <div style={{
              background: '#1e1e2e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px 32px',
              width: '100%',
              maxWidth: '380px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              animation: 'scaleUpModal 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: toast.type === 'success' ? 'rgba(0, 200, 83, 0.12)' : 'rgba(255, 82, 82, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {toast.type === 'success' ? (
                  <CheckCircle2 size={28} color="#00C853" />
                ) : (
                  <AlertCircle size={28} color="#FF5252" />
                )}
              </div>
              <div>
                <h3 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '1.15rem', fontWeight: 700 }}>
                  {toast.type === 'success' ? 'Berhasil' : 'Gagal'}
                </h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  {toast.message}
                </p>
              </div>
              <button 
                onClick={() => setToast(null)} 
                style={{
                  width: '100%',
                  padding: '10px 0',
                  borderRadius: '8px',
                  border: 'none',
                  background: toast.type === 'success' ? 'linear-gradient(135deg, #00C853, #009624)' : 'linear-gradient(135deg, #FF5252, #D32F2F)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </Portal>
      )}
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
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 2,
  },
};
