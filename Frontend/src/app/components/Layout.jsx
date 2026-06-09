import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router'
import {
  LayoutDashboard, BookOpen, CheckSquare, Calendar,
  BarChart3, GraduationCap, Moon, Sun, LogOut, ChevronRight, Sparkles, Smile, Settings, Mail
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { Avatar } from './ui.jsx'

import { SettingsModal } from './SettingsModal.jsx'

const NAV = [
  { path: '/app',           label: 'Dashboard', icon: LayoutDashboard, color: '#7265f8' },
  { path: '/app/subjects',  label: 'Materias',  icon: BookOpen,        color: '#0ea47a' },
  { path: '/app/tasks',     label: 'Tareas',    icon: CheckSquare,     color: '#d97706' },
  { path: '/app/schedule',  label: 'Horario',   icon: Calendar,        color: '#3b82f6' },
  { path: '/app/wellbeing', label: 'Bienestar', icon: Smile,           color: '#ec4899' },
  { path: '/app/analytics', label: 'Análisis',  icon: BarChart3,       color: '#a855f7' },
  { path: '/app/plans',    label: 'Plan diario', icon: Sparkles,       color: '#f97316' },
]

const SIDEBAR_W = 220

export function Layout() {
  const loc = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex' }}>
      <style>{`
        .sidebar {
          position: fixed; top: 0; left: 0; height: 100vh;
          width: ${SIDEBAR_W}px;
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
          z-index: 50; display: flex; flex-direction: column;
          transition: width 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 2px 0 16px rgba(0,0,0,0.04);
        }
        .logo-wrap {
          height: 62px; display: flex; align-items: center;
          padding: 0 18px; gap: 0.75rem;
          border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .logo-icon {
          width: 36px; height: 36px; border-radius: 11px; flex-shrink: 0;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px var(--accent-glow);
          transition: transform 0.2s ease;
        }
        .logo-icon:hover { transform: scale(1.05); }
        .nav-section { padding: 12px 10px 4px; flex-shrink: 0; }
        .nav-section-label {
          font-size: 0.6rem; font-weight: 700; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.1em;
          padding: 0 8px; margin-bottom: 6px;
        }
        .nav-list { display: flex; flex-direction: column; gap: 2px; }
        .nav-item {
          display: flex; align-items: center; gap: 0.7rem;
          padding: 0 12px; height: 44px; border-radius: 12px;
          margin: 0 2px; cursor: pointer; text-decoration: none;
          transition: all 0.18s cubic-bezier(0.22,1,0.36,1);
          white-space: nowrap; overflow: hidden; position: relative;
          flex-shrink: 0;
        }
        .nav-item:hover {
          background: var(--bg-elevated);
          transform: translateX(3px);
        }
        .nav-icon {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.18s;
        }
        .nav-item:hover .nav-icon {
          transform: scale(1.08);
        }
        .nav-label {
          font-size: 0.84rem; font-weight: 600; letter-spacing: -0.01em;
          flex: 1; overflow: hidden; text-overflow: ellipsis;
        }
        .active-indicator {
          position: absolute; left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 60%; border-radius: 0 3px 3px 0;
          transition: all 0.2s ease;
        }
        .nav-spacer { flex: 1; }
        .bottom-section {
          padding: 8px 10px 14px;
          display: flex; flex-direction: column; gap: 2px; flex-shrink: 0;
          border-top: 1px solid var(--border); margin-top: 4px;
        }
        .bottom-item {
          display: flex; align-items: center; gap: 0.7rem;
          padding: 0 12px; height: 42px; border-radius: 12px;
          cursor: pointer; transition: all 0.15s;
          white-space: nowrap; overflow: hidden; flex-shrink: 0;
          font-family: inherit; font-size: 0.82rem; font-weight: 500;
          border: none; background: none; width: 100%; text-align: left;
          text-decoration: none;
        }
        .bottom-item:hover {
          background: var(--bg-elevated);
        }
        .profile-item {
          display: flex; align-items: center; gap: 0.7rem;
          padding: 6px 12px; margin: 2px 2px 0; border-radius: 12px;
          cursor: pointer; overflow: hidden; white-space: nowrap;
          text-decoration: none; transition: all 0.15s;
        }
        .profile-item:hover { background: var(--bg-elevated); }
        .main-wrap {
          flex: 1; display: flex; flex-direction: column;
          min-height: 100vh; min-width: 0;
          margin-left: ${SIDEBAR_W}px;
        }
        @media(max-width: 700px) {
          .sidebar { width: 60px !important; }
          .sidebar .nav-label,
          .sidebar .logo-text,
          .sidebar .nav-section-label,
          .sidebar .profile-text,
          .sidebar .bottom-item .nav-label { display: none !important; }
          .sidebar .nav-item { justify-content: center; padding: 0; }
          .sidebar .bottom-item { justify-content: center; padding: 0; }
          .sidebar .profile-item { justify-content: center; }
          .sidebar .logo-wrap { justify-content: center; padding: 0; }
          .main-wrap { margin-left: 60px !important; }
        }
        @media(max-width: 480px) {
          .sidebar { display: none; }
          .main-wrap { margin-left: 0 !important; }
        }
      `}</style>

      <aside className="sidebar">
        {/* Logo */}
        <div className="logo-wrap">
          <div className="logo-icon"><GraduationCap size={19} color="white" strokeWidth={2.2} /></div>
          <div className="logo-text">
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>StudyMind</p>
            <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Sparkles size={8} /> con IA
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="nav-section">
            <p className="nav-section-label">Navegación</p>
            <div className="nav-list">
              {NAV.map(({ path, label, icon: Icon, color }) => {
                const isActive = path === '/app' ? loc.pathname === '/app' : loc.pathname.startsWith(path)
                return (
                  <Link
                    key={path}
                    to={path}
                    className="nav-item"
                    style={{
                      background: isActive ? `${color}14` : 'transparent',
                      color: isActive ? color : 'var(--text-secondary)',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = `${color}0a`
                        e.currentTarget.style.color = color
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }
                    }}
                  >
                    <div
                      className="nav-icon"
                      style={{
                        background: isActive ? `${color}20` : 'var(--bg-elevated)',
                        boxShadow: isActive ? `0 2px 8px ${color}30` : 'none',
                      }}
                    >
                      <Icon
                        size={16}
                        strokeWidth={isActive ? 2.4 : 1.8}
                        color={isActive ? color : 'var(--text-secondary)'}
                      />
                    </div>
                    <span className="nav-label">{label}</span>
                    {isActive && (
                      <span
                        className="active-indicator"
                        style={{ background: color }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Bottom section */}
        <div className="bottom-section">
          <button
            onClick={toggleTheme}
            className="bottom-item"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <div className="nav-icon" style={{ background: 'var(--bg-elevated)' }}>
              {isDark ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
            </div>
            <span className="nav-label">{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="bottom-item"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <div className="nav-icon" style={{ background: 'var(--bg-elevated)' }}>
              <Settings size={14} strokeWidth={1.8} />
            </div>
            <span className="nav-label">Configuración</span>
          </button>

          <Link
            to="/app/profile"
            className="profile-item"
            style={{
              background: loc.pathname === '/app/profile' ? 'var(--bg-elevated)' : 'none',
            }}
          >
            <Avatar src={user?.avatar} initials={user?.initials} size={32} radius={10} />
            <div className="profile-text" style={{ minWidth: 0, flex: 1 }}>
              <p style={{
                fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.name}
              </p>
              <p style={{
                fontSize: '0.64rem', color: 'var(--text-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.career || 'Ver perfil'}
              </p>
            </div>
          </Link>

          <button
            onClick={logout}
            className="bottom-item"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-soft)'; e.currentTarget.style.color = 'var(--danger)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <div className="nav-icon" style={{ background: 'var(--bg-elevated)' }}>
              <LogOut size={14} strokeWidth={1.8} />
            </div>
            <span className="nav-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="main-wrap">
        <header style={{
          height: '54px', background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem', position: 'sticky', top: 0,
          zIndex: 30, flexShrink: 0,
        }}>
          <PaginaBreadcrumb pathname={loc.pathname} />
          <Link to="/app/profile" style={{
            textDecoration: 'none', display: 'flex',
            alignItems: 'center', gap: '0.5rem',
          }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {user?.name}
            </span>
            <Avatar src={user?.avatar} initials={user?.initials} size={26} radius={8} />
          </Link>
        </header>
        {user && !user.emailVerified && (
          <div style={{
            padding: '0.5rem 1.5rem', background: 'var(--warning-soft, #fef3c7)',
            borderBottom: '1px solid var(--border)', fontSize: '0.78rem',
            color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <Mail size={14} />
            <span>Verifica tu correo para acceder a todas las funciones — <Link to="/register" style={{ color:'var(--accent)', fontWeight:600 }}>Verificar ahora</Link></span>
          </div>
        )}
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <div className="page-enter"><Outlet /></div>
        </main>
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}

function PaginaBreadcrumb({ pathname }) {
  const segmentos = pathname.split('/').filter(Boolean)
  const base = segmentos[1] || segmentos[0]
  const etiquetas = { subjects: 'Materias', tasks: 'Tareas', schedule: 'Horario', analytics: 'Análisis', profile: 'Perfil', wellbeing: 'Bienestar', plans: 'Plan diario' }
  const colores   = { subjects: '#0ea47a', tasks: '#d97706', schedule: '#3b82f6', analytics: '#a855f7', profile: '#7265f8', wellbeing: '#ec4899', plans: '#f97316' }
  if (!base || base === 'app') return <span style={{ fontSize: '0.845rem', fontWeight: 700, color: 'var(--text-primary)' }}>Dashboard</span>
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
      <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>StudyMind</span>
      <ChevronRight size={11} color="var(--text-muted)" />
      <span style={{ fontWeight: 700, color: colores[base] || 'var(--text-primary)' }}>{etiquetas[base] || base}</span>
      {segmentos[2] && (<><ChevronRight size={11} color="var(--text-muted)" /><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Detalle</span></>)}
    </div>
  )
}
