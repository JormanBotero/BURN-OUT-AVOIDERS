// Home Page — Landing page de StudyMind
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useTheme } from '../context/ThemeContext.jsx'
import {
  GraduationCap, ArrowRight, BookOpen, Calendar,
  BarChart2, CheckSquare, Moon, Sun, Sparkles, Star, Zap
} from 'lucide-react'

// Partículas flotantes del fondo
function Particle({ style }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', ...style }} />
}

// Tarjeta de feature con hover
function FeatureCard({ icon: Icon, title, desc, color, delay }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${hovered ? color + '55' : 'var(--border)'}`,
        borderRadius: 'var(--r-xl)',
        padding: '1.5rem',
        cursor: 'default',
        transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 20px 40px ${color}22, 0 4px 12px rgba(0,0,0,0.08)`
          : 'var(--sh-sm)',
        animation: `fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
      }}
    >
      <div style={{
        width: '42px', height: '42px', borderRadius: 'var(--r-md)',
        background: color + '18', display: 'flex', alignItems: 'center',
        justifyContent: 'center', marginBottom: '1rem',
        border: `1px solid ${color}30`,
        transition: 'transform 0.2s',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
      }}>
        <Icon size={20} color={color} strokeWidth={1.8} />
      </div>
      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{title}</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{desc}</div>
    </div>
  )
}

// Stat animada
function StatItem({ value, label, delay }) {
  const [count, setCount] = useState(0)
  const target = parseInt(value)
  useEffect(() => {
    let start = null
    const duration = 1200
    const step = (ts) => {
      if (!start) start = ts
      const prog = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - prog, 3)
      setCount(Math.floor(eased * target))
      if (prog < 1) requestAnimationFrame(step)
    }
    const timer = setTimeout(() => requestAnimationFrame(step), delay * 1000)
    return () => clearTimeout(timer)
  }, [target, delay])

  return (
    <div style={{ textAlign: 'center', animation: `fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s both` }}>
      <div style={{
        fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.04em',
        background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        lineHeight: 1,
      }}>
        {count}{value.includes('+') ? '+' : value.includes('%') ? '%' : ''}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

export function HomePage() {
  const { isDark, toggleTheme } = useTheme()
  const heroRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Efecto de luz que sigue al cursor
  useEffect(() => {
    const handler = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  const features = [
    { icon: BookOpen,    title: 'Gestión de Materias',  color: '#4f3ef4', desc: 'Organiza todas tus asignaturas, profesores y horarios en un solo lugar.' },
    { icon: CheckSquare, title: 'Control de Tareas',    color: '#0d7a5f', desc: 'Prioriza entregas, asigna tiempo estimado y nunca pierdas un plazo.' },
    { icon: Calendar,    title: 'Agenda Semanal',       color: '#b45309', desc: 'Visualiza tu semana completa y planifica sesiones de estudio.' },
    { icon: BarChart2,   title: 'Análisis de Progreso', color: '#1d4ed8', desc: 'Sigue tu rendimiento académico con gráficas claras y detalladas.' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)', overflowX: 'hidden' }}>

      {/* Luz dinámica que sigue al cursor */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, var(--accent-glow), transparent 40%)`,
        transition: 'background 0.1s ease',
      }} />

      {/* Fondo con partículas y orbes */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {/* Orbe grande superior derecha */}
        <div style={{
          position: 'absolute', top: '-15%', right: '-8%',
          width: '650px', height: '650px', borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(114,101,248,0.15) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(79,62,244,0.10) 0%, transparent 65%)',
        }} />
        {/* Orbe mediano inferior izquierda */}
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%',
          width: '450px', height: '450px', borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(114,101,248,0.10) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(79,62,244,0.07) 0%, transparent 65%)',
        }} />
        {/* Grid de puntos decorativos */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle, var(--border) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          opacity: isDark ? 0.4 : 0.6,
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 100%)',
        }} />
        {/* Partículas flotantes */}
        {[
          { top: '15%', left: '12%',  w: 6,  h: 6,  bg: 'var(--accent)',      op: 0.35, anim: 'float1' },
          { top: '28%', right: '18%', w: 4,  h: 4,  bg: 'var(--accent-dim)', op: 0.25, anim: 'float2' },
          { top: '55%', left: '7%',   w: 8,  h: 8,  bg: 'var(--accent)',      op: 0.20, anim: 'float3' },
          { top: '70%', right: '10%', w: 5,  h: 5,  bg: 'var(--accent-dim)', op: 0.30, anim: 'float1' },
          { top: '42%', left: '85%',  w: 3,  h: 3,  bg: 'var(--accent)',      op: 0.40, anim: 'float2' },
          { top: '82%', left: '25%',  w: 6,  h: 6,  bg: 'var(--accent-dim)', op: 0.20, anim: 'float3' },
        ].map((p, i) => (
          <Particle key={i} style={{
            top: p.top, left: p.left, right: p.right,
            width: p.w, height: p.h,
            background: p.bg, opacity: p.op,
            animation: `${p.anim} ${4 + i * 0.8}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      {/* Keyframes de animación */}
      <style>{`
        @keyframes float1 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-14px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-9px)} }
        @keyframes float3 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-18px)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.4} 100%{transform:scale(1.5);opacity:0} }
        @keyframes badge-float { 0%,100%{transform:translateY(0px) rotate(-2deg)} 50%{transform:translateY(-6px) rotate(-2deg)} }
      `}</style>

      {/* ── NAVBAR ───────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 2rem',
        background: isDark ? 'rgba(9,7,26,0.75)' : 'rgba(245,244,251,0.75)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        animation: 'fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px var(--accent-glow)',
          }}>
            <GraduationCap size={17} color="white" strokeWidth={2} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Study<span style={{ color: 'var(--accent)' }}>Mind</span>
          </span>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={toggleTheme} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: '50%', width: '34px', height: '34px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)', boxShadow: 'var(--sh-xs)',
            transition: 'all 0.2s',
          }}>
            {isDark ? <Sun size={14} strokeWidth={2} /> : <Moon size={14} strokeWidth={2} />}
          </button>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', padding: '0.45rem 1rem',
              fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-sans)',
            }}>
              Iniciar sesión
            </button>
          </Link>
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
              border: 'none', borderRadius: 'var(--r-md)', padding: '0.45rem 1rem',
              fontSize: '0.82rem', fontWeight: 600, color: 'white',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 12px var(--accent-glow)',
              fontFamily: 'var(--font-sans)',
            }}>
              Registrarse
            </button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section ref={heroRef} style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '8rem 1.5rem 4rem', textAlign: 'center', position: 'relative', zIndex: 1,
      }}>

        {/* Badge animado */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          background: 'var(--accent-soft)', border: '1px solid var(--accent)33',
          borderRadius: '99px', padding: '0.35rem 0.9rem',
          fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)',
          marginBottom: '2rem', letterSpacing: '0.02em',
          animation: 'badge-float 3s ease-in-out infinite',
        }}>
          <Sparkles size={11} strokeWidth={2.5} />
          Tu compañero académico inteligente
        </div>

        {/* Título principal */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
          fontWeight: 800, letterSpacing: '-0.04em',
          lineHeight: 1.1, maxWidth: '700px',
          color: 'var(--text-primary)',
          animation: 'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s both',
          marginBottom: '1.25rem',
        }}>
          Organiza tu vida{' '}
          <span style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, var(--accent) 0%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            académica
          </span>
          {' '}sin estrés
        </h1>

        {/* Subtítulo */}
        <p style={{
          fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
          color: 'var(--text-muted)', maxWidth: '520px',
          lineHeight: 1.65, marginBottom: '2.5rem',
          animation: 'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.2s both',
          fontWeight: 400,
        }}>
          Materias, tareas, exámenes y horarios — todo en un solo lugar.
          StudyMind te ayuda a enfocarte en lo que importa: aprender.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center',
          animation: 'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.3s both',
          marginBottom: '4rem',
        }}>
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
              color: 'white', border: 'none', borderRadius: 'var(--r-lg)',
              padding: '0.8rem 1.75rem', fontSize: '0.9rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.25s',
              boxShadow: '0 8px 24px var(--accent-glow)',
              fontFamily: 'var(--font-sans)',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 32px var(--accent-glow)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px var(--accent-glow)' }}
            >
              Comenzar
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          </Link>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--bg-surface)', color: 'var(--text-secondary)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
              padding: '0.8rem 1.5rem', fontSize: '0.9rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.25s', boxShadow: 'var(--sh-sm)',
              fontFamily: 'var(--font-sans)',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--sh-md)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--sh-sm)' }}
            >
              Ya tengo cuenta
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center',
          padding: '1.75rem 2.5rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-2xl)',
          boxShadow: 'var(--sh-md)',
          animation: 'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.4s both',
        }}>
          <StatItem value="500+"  label="Estudiantes" delay={0.5} />
          <div style={{ width: '1px', background: 'var(--border)', alignSelf: 'stretch' }} />
          <StatItem value="12+"   label="Universidades" delay={0.6} />
          <div style={{ width: '1px', background: 'var(--border)', alignSelf: 'stretch' }} />
          <StatItem value="98%"   label="Satisfacción" delay={0.7} />
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section style={{
        padding: '5rem 1.5rem', maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1,
      }}>
        {/* Encabezado de sección */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'var(--accent-soft)', border: '1px solid var(--accent)33',
            borderRadius: '99px', padding: '0.3rem 0.85rem',
            fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)',
            marginBottom: '1rem', letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            <Zap size={10} strokeWidth={2.5} />
            Funcionalidades
          </div>
          <h2 style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800,
            letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.2,
          }}>
            Todo lo que necesitas para{' '}
            <span style={{ color: 'var(--accent)' }}>triunfar</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', fontSize: '0.9rem', maxWidth: '400px', margin: '0.75rem auto 0' }}>
            Herramientas pensadas para estudiantes universitarios que quieren rendir mejor.
          </p>
        </div>

        {/* Grid de features */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem',
        }}>
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={0.1 + i * 0.08} />
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────── */}
      <section style={{
        padding: '5rem 1.5rem 7rem', textAlign: 'center', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          maxWidth: '580px', margin: '0 auto',
          background: 'linear-gradient(135deg, var(--accent)18 0%, var(--accent-dim)10 100%)',
          border: '1px solid var(--accent)25',
          borderRadius: 'var(--r-2xl)', padding: '3.5rem 2rem',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 24px 64px var(--accent-glow)',
        }}>
          {/* Destellos decorativos dentro del CTA */}
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-glow), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-glow), transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>🎓</div>
            <h2 style={{
              fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', fontWeight: 800,
              letterSpacing: '-0.03em', color: 'var(--text-primary)',
              marginBottom: '0.75rem', lineHeight: 1.2,
            }}>
              Empieza hoy mismo
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              Únete a cientos de estudiantes que ya organizan mejor su vida académica con StudyMind.
            </p>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
                color: 'white', border: 'none', borderRadius: 'var(--r-lg)',
                padding: '0.85rem 2rem', fontSize: '0.9rem', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.25s',
                boxShadow: '0 8px 24px var(--accent-glow)',
                fontFamily: 'var(--font-sans)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 16px 36px var(--accent-glow)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px var(--accent-glow)' }}
              >
                <Star size={15} strokeWidth={2.5} />
                Crear tu cuenta ahora!
                <ArrowRight size={15} strokeWidth={2.5} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border)', padding: '1.5rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.75rem',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GraduationCap size={12} color="white" strokeWidth={2} />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>StudyMind</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Hecho con ❤️ para estudiantes
        </div>
      </footer>

    </div>
  )
}
