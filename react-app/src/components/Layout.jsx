import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotifStore } from '../store/notifStore';
import AIAssistant from './AIAssistant';
import CommandPalette from './CommandPalette';
import { useAIStore } from '../store/aiStore';
import { 
  HomeRegular,
  ChatRegular,
  TaskListLtrRegular,
  CalendarRegular,
  TimelineRegular,
  DataTrendingRegular,
  FolderRegular,
  AlertRegular,
  GlobeRegular,
  PeopleRegular,
  PersonRegular,
  NavigationRegular,
  SearchRegular,
  SparkleRegular,
  WeatherMoonRegular,
  WeatherSunnyRegular,
  SignOutRegular
} from '@fluentui/react-icons';

const navItems = [
  { to: '/', label: 'Dashboard', icon: <HomeRegular style={{ width: '16px', height: '16px' }} />, exact: true },
  { to: '/events', label: 'Events', icon: <CalendarRegular style={{ width: '16px', height: '16px' }} /> },
  { to: '/chat', label: 'Chat', icon: <ChatRegular style={{ width: '16px', height: '16px' }} />, badge: true },
  { to: '/tasks', label: 'Tasks', icon: <TaskListLtrRegular style={{ width: '16px', height: '16px' }} /> },
  { to: '/calendar', label: 'Calendar', icon: <CalendarRegular style={{ width: '16px', height: '16px' }} /> },
  { to: '/gantt', label: 'Gantt', icon: <TimelineRegular style={{ width: '16px', height: '16px' }} /> },
];

const insightItems = [
  { to: '/analytics', label: 'Analytics', icon: <DataTrendingRegular style={{ width: '16px', height: '16px' }} /> },
  { to: '/documents', label: 'Documents', icon: <FolderRegular style={{ width: '16px', height: '16px' }} /> },
  { to: '/notifications', label: 'Notifications', icon: <AlertRegular style={{ width: '16px', height: '16px' }} />, notif: true },
];

const adminItems = [
  { to: '/domains', label: 'Domains', icon: <GlobeRegular style={{ width: '16px', height: '16px' }} /> },
  { to: '/users', label: 'Users & Roles', icon: <PeopleRegular style={{ width: '16px', height: '16px' }} /> },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotifStore();
  const { isOpen, setIsOpen, setCommandPaletteOpen } = useAIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sliderStyle, setSliderStyle] = useState({ top: 0, height: 0, opacity: 0 });
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('eventops-theme');
    if (saved) return saved;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('eventops-theme', theme);
  }, [theme]);

  useEffect(() => {
    const updateSlider = () => {
      const activeEl = document.querySelector('.sb-item.active');
      if (activeEl) {
        setSliderStyle({
          top: activeEl.offsetTop,
          height: activeEl.offsetHeight,
          opacity: 1,
        });
      } else {
        setSliderStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    };

    // Run immediately and after a short delay to account for rendering shifts
    updateSlider();
    const timer = setTimeout(updateSlider, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setCommandPaletteOpen]);

  const isAdmin = user?.role === 'admin';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'transparent' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '230px' : '0',
        flexShrink: 0,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(14px) saturate(190%)',
        WebkitBackdropFilter: 'blur(14px) saturate(190%)',
        borderRight: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '10px 0 30px -10px var(--glass-shadow)',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" alt="EventOps Logo" style={{ width: '22px', height: '22px', borderRadius: '5px' }} />
            <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>EventOps Platform</div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '3px', fontWeight: 500 }}>Internal Coordination System</div>
          {user && (
            <div style={{ marginTop: '10px' }}>
              <span className={`tag tag-${isAdmin ? 'blue' : 'teal'}`} style={{ borderRadius: 'var(--radius-full)' }}>
                {user.role === 'admin' ? 'Admin' : user.role}
              </span>
            </div>
          )}
        </div>

        {/* Main nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0', position: 'relative' }}>
          {/* Sliding Glass Backdrop */}
          <div style={{
            position: 'absolute',
            left: '10px',
            right: '10px',
            top: `${sliderStyle.top}px`,
            height: `${sliderStyle.height}px`,
            opacity: sliderStyle.opacity,
            background: 'linear-gradient(135deg, var(--blue-bg) 0%, rgba(59, 130, 246, 0.05) 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.15)',
            borderRadius: 'var(--radius)',
            transition: 'top 0.3s cubic-bezier(0.25, 1, 0.5, 1), height 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s',
            pointerEvents: 'none',
            zIndex: 0,
          }} />
          <div className="sb-section">Main</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}
              style={{ borderRadius: 'var(--radius)' }}
            >
              <span className="ico">{item.icon}</span>
              {item.label}
              {item.badge && unreadCount > 0 && (
                <span className="bdg">{unreadCount}</span>
              )}
            </NavLink>
          ))}

          <div className="sb-section">Insights</div>
          {insightItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}
              style={{ borderRadius: 'var(--radius)' }}
            >
              <span className="ico">{item.icon}</span>
              {item.label}
              {item.notif && unreadCount > 0 && (
                <span className="bdg">{unreadCount}</span>
              )}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="sb-section">Admin</div>
              {adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <span className="ico">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}

          <div className="sb-section">Account</div>
          <NavLink to="/profile" className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`} style={{ borderRadius: 'var(--radius)' }}>
            <span className="ico"><PersonRegular style={{ width: '16px', height: '16px' }} /></span>Profile
          </NavLink>
        </nav>

        {/* User footer */}
        {user && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255, 255, 255, 0.05)' }}>
            <div className="av av-blue" style={{ width: '32px', height: '32px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}>
              {user.name?.slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{user.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 500 }}>{user.role}</div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '4px', transition: 'var(--transition-all)', display: 'flex', alignItems: 'center' }}
              title="Sign out"
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text3)'}
            >
              <SignOutRegular style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{
          height: '58px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(14px) saturate(190%)',
          WebkitBackdropFilter: 'blur(14px) saturate(190%)',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: '14px',
          flexShrink: 0,
          boxShadow: '0 4px 20px var(--glass-shadow)',
          zIndex: 5,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', transition: 'var(--transition-all)', display: 'flex', alignItems: 'center', padding: '6px' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text2)'}
            title="Toggle Sidebar"
          >
            <NavigationRegular style={{ width: '20px', height: '20px' }} />
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="topbar-search"
            style={{
              width: '240px',
              padding: '8px 14px',
              fontSize: '12px',
              border: '1px solid var(--border2)',
              borderRadius: 'var(--radius)',
              background: 'var(--surface2)',
              color: 'var(--text3)',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'var(--transition-all)',
              outline: 'none',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface2)'}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SearchRegular style={{ width: '15px', height: '15px' }} /> Search or ask AI...
            </span>
            <span style={{
              fontSize: '10px',
              background: 'var(--surface)',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              color: 'var(--text3)',
              fontWeight: 600,
            }}>
              Ctrl+K
            </span>
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border2)',
              background: isOpen ? 'var(--blue-bg)' : 'var(--surface)',
              color: isOpen ? 'var(--blue-t)' : 'var(--text)',
              fontSize: '15px',
              transition: 'var(--transition-all)',
              boxShadow: isOpen ? 'inset 0 0 0 1px rgba(16, 185, 129, 0.2)' : 'none',
            }}
            title="Toggle AI Assistant Panel"
          >
            <SparkleRegular style={{ width: '16px', height: '16px' }} />
          </button>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border2)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '15px',
              transition: 'var(--transition-all)'
            }}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <WeatherMoonRegular style={{ width: '16px', height: '16px' }} />
            ) : (
              <WeatherSunnyRegular style={{ width: '16px', height: '16px' }} />
            )}
          </button>
          <NavLink
            to="/notifications"
            className="btn"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border2)',
              background: 'var(--surface)',
              color: 'var(--text)',
              textDecoration: 'none',
              fontSize: '15px',
              transition: 'var(--transition-all)'
            }}
          >
            <AlertRegular style={{ width: '16px', height: '16px' }} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '5px', right: '5px', width: '8px', height: '8px', borderRadius: 'var(--radius-full)', background: 'var(--red)', border: '2px solid var(--surface)' }} />
            )}
          </NavLink>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <Outlet />
        </main>
      </div>
      <AIAssistant />
      <CommandPalette />
    </div>
  );
}
