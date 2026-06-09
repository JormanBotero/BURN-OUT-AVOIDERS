import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CheckCircle2, Circle, Clock, TrendingUp,
  ChevronRight, AlertTriangle, Sparkles, Zap,
  Target, Star, ArrowRight, Flame, Moon, Heart,
} from 'lucide-react'
import { StatCard, EmptyState, Badge } from '../components/ui.jsx'
import { WellbeingHistory } from '../components/WellbeingHistory.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../utils/api.js'
import { wellbeingController } from '../controllers/wellbeingController.js'

function urgColor(days) {
  if (days < 0) return 'var(--danger)'
  if (days === 0 || days === 1) return 'var(--danger)'
  if (days <= 4) return 'var(--warning)'
  return 'var(--success)'
}

function urgLabel(days) {
  if (days < 0) return 'Vencida'
  if (days === 0) return '¡Hoy!'
  if (days === 1) return 'Mañana'
  return `${days}d`
}

const MOOD_EMOJIS = { excellent: '😄', good: '😊', neutral: '😐', sad: '😔', very_bad: '😫' }
const MOOD_LABELS = { excellent: 'Excelente', good: 'Bien', neutral: 'Neutral', sad: 'Triste', very_bad: 'Muy mal' }

export function Dashboard() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [wellbeingToday, setWellbeingToday] = useState(null)
  const [recommendations, setRecommendations] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t, e, r] = await Promise.all([api.getSubjects(), api.getTasks(), api.getEvaluations(), api.getRecommendations()])
        setSubjects(s)
        setTasks(t.map(x => ({ ...x, dueDate: new Date(x.dueDate) })))
        setEvaluations(e.map(x => ({ ...x, date: new Date(x.date) })))
        setRecommendations(r)
      } catch {
        setSubjects([])
        setTasks([])
        setEvaluations([])
        setRecommendations([])
      }
    }
    load()
  }, [])

  useEffect(() => {
    wellbeingController.checkToday().then(setWellbeingToday)
  }, [])

  const refreshWellbeing = async () => {
    const entry = await wellbeingController.checkToday()
    setWellbeingToday(entry)
  }

  const now = new Date()
  const pending = tasks.filter(t => !t.completed)
  const done = tasks.filter(t => t.completed)
  const rate = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0
  const upcomingEvals = evaluations.filter(e => e.date >= now).sort((a, b) => a.date - b.date)
  const urgentTasks = [...pending].sort((a, b) => a.dueDate - b.dueDate).slice(0, 4)

  const [avgSleep, setAvgSleep] = useState(null)

  useEffect(() => {
    wellbeingController.getSleepStats().then(stats => {
      if (stats.avg > 0) setAvgSleep(stats.avg)
    })
  }, [])

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id)
    const updated = { ...task, completed: !task.completed }
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
    try { await api.updateTask(id, { completed: updated.completed }) } catch {}
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {showHistory && <WellbeingHistory onClose={() => setShowHistory(false)} />}

      {/* Hero Banner */}
      <div className="page-enter" style={{
        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 60%, #a78bfa 100%)',
        borderRadius: 'var(--r-xl)', padding: '1.5rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-20px', right: '80px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: '-30px', right: '20px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', marginBottom: '0.25rem', fontWeight: 500 }}>
            {format(now, "EEEE, d 'de' MMMM yyyy", { locale: es })}
          </p>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.025em', marginBottom: '0.3rem' }}>
            {greeting}, {user?.name?.split(' ')[0]}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.875rem' }}>
            {pending.length > 0
              ? `Tienes ${pending.length} tarea${pending.length !== 1 ? 's' : ''} pendiente${pending.length !== 1 ? 's' : ''} y ${upcomingEvals.length} evaluación${upcomingEvals.length !== 1 ? 'es' : ''} próxima${upcomingEvals.length !== 1 ? 's' : ''}.`
              : '¡Todo al día! Sigue así.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', position: 'relative' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--r-lg)', padding: '0.875rem 1.25rem', backdropFilter: 'blur(8px)', textAlign: 'center', minWidth: '80px' }}>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{rate}%</p>
            <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500, marginTop: '3px' }}>Progreso</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--r-lg)', padding: '0.875rem 1.25rem', backdropFilter: 'blur(8px)', textAlign: 'center', minWidth: '80px' }}>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{subjects.length}</p>
            <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500, marginTop: '3px' }}>Materias</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
        <StatCard icon={CheckCircle2} label="Completadas" value={done.length} sub={`de ${tasks.length} tareas`} color="var(--success)" />
        <StatCard icon={Clock} label="Pendientes" value={pending.length} sub="por completar" color="var(--warning)" />
        <StatCard icon={Target} label="Evaluaciones" value={upcomingEvals.length} sub="próximas" color="var(--accent)" />
        <StatCard icon={TrendingUp} label="Créditos" value={subjects.reduce((a, s) => a + (s.credits || 0), 0)} sub="en curso" color="var(--accent-dim)" />
      </div>



      {/* Wellbeing summary + Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

        {/* Wellbeing card */}
        <div className="surface" style={{ padding: '1.4rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'linear-gradient(135deg, var(--accent), #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={15} color="white" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>Bienestar</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tu estado diario</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {wellbeingToday && !wellbeingToday.skipped ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)' }}>
                  <span style={{ fontSize: '1.5rem' }}>{MOOD_EMOJIS[wellbeingToday.mood] || '😊'}</span>
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Ánimo: {MOOD_LABELS[wellbeingToday.mood] || 'Bien'}
                    </p>
                    {wellbeingToday.note && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{wellbeingToday.note}</p>
                    )}
                  </div>
                </div>
                {wellbeingToday.sleepHours != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)' }}>
                    <Moon size={14} color="var(--accent)" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {wellbeingToday.sleepHours}h de sueño
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {wellbeingToday?.skipped ? 'Registro omitido hoy' : 'Aún no has registrado tu día'}
                </p>
              </div>
            )}

            {avgSleep && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Promedio de sueño: <strong>{avgSleep}h</strong>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              {wellbeingToday && !wellbeingToday.skipped && (
                <Link to="/app/wellbeing" style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  Bienestar completo <ArrowRight size={11} />
                </Link>
              )}
              <button onClick={() => setShowHistory(true)} style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
                Historial <ChevronRight size={11} />
              </button>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="surface" style={{ padding: '1.4rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.1rem' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'linear-gradient(135deg, var(--accent), #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={15} color="white" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>Recomendaciones</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Análisis de tu carga académica</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(recommendations.length > 0 ? recommendations : []).map((rec, i) => {
              const iconMap = {
                'alert-triangle': AlertTriangle,
                'target': Target,
                'flame': Flame,
                'heart': Heart,
                'star': Star,
                'sparkles': Sparkles,
              }
              const Icon = iconMap[rec.icon] || Sparkles
              const colorMap = { critico: 'var(--danger)', urgente: 'var(--warning)', info: 'var(--accent)', atencion: '#ec4899', exito: 'var(--success)' }
              const bgMap = { critico: 'var(--danger-soft)', urgente: 'var(--warning-soft)', info: 'var(--accent-soft)', atencion: '#fdf2f8', exito: 'var(--success-soft)' }
              const c = colorMap[rec.tipo] || 'var(--accent)'
              const bg = bgMap[rec.tipo] || 'var(--bg-elevated)'
              return (
                <div key={i} style={{ background: bg, border: `1px solid ${c}22`, borderRadius: 'var(--r-md)', padding: '0.875rem' }}>
                  <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${c}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      <Icon size={14} color={c} strokeWidth={2.2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>{rec.titulo}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rec.mensaje}</p>
                      <Link to={rec.accion} style={{ fontSize: '0.72rem', fontWeight: 600, color: c, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '6px' }}>
                        {rec.accionLabel} <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Urgent tasks */}
      <div className="surface" style={{ padding: '1.4rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Próximas a vencer</p>
          <Link to="/app/tasks" style={{ fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
            Ver todas <ChevronRight size={12} />
          </Link>
        </div>

        {urgentTasks.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="¡Todo al día!" description="No hay tareas pendientes." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {urgentTasks.map(task => {
              const sub = subjects.find(s => s.id === task.subjectId)
              const days = differenceInDays(task.dueDate, now)
              const uc = urgColor(days)
              return (
                <div key={task.id} style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', padding: '0.7rem 0.875rem', background: days < 0 ? 'var(--danger-soft)' : 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: days < 0 ? '1px solid var(--danger)22' : '1px solid transparent' }}>
                  <button onClick={() => toggleTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, flexShrink: 0, transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--success)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Circle size={18} />
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                    {sub && <Badge color={sub.color} style={{ marginTop: '2px' }}>{sub.code}</Badge>}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: uc, flexShrink: 0 }}>
                    {days < 0 && <AlertTriangle size={10} style={{ display: 'inline', marginRight: '2px' }} />}
                    {urgLabel(days)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {upcomingEvals.length > 0 && (
          <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={13} color="var(--warning)" /> Evaluación más cercana
            </p>
            {(() => {
              const ev = upcomingEvals[0]
              const sub = subjects.find(s => s.id === ev.subjectId)
              const days = differenceInDays(ev.date, now)
              return (
                <Link to={sub ? `/subjects/${sub.id}` : '/schedule'} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', borderLeft: `3px solid ${sub?.color || 'var(--accent)'}`, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ev.title}</p>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: urgColor(days), flexShrink: 0, marginLeft: '0.5rem' }}>{urgLabel(days)}</span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {sub?.code || '—'} · {ev.weight}% nota final
                    </p>
                  </div>
                </Link>
              )
            })()}
            {upcomingEvals.length > 1 && (
              <Link to="/app/schedule" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '0.5rem', fontWeight: 500 }}>
                +{upcomingEvals.length - 1} más en horario <ChevronRight size={11} />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="appear d5 card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Progreso del Semestre</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>{done.length} de {tasks.length} tareas completadas</p>
          </div>
          <Link to="/app/analytics" style={{ fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
            Ver análisis completo <ChevronRight size={12} />
          </Link>
        </div>
        <div style={{ height: '8px', background: 'var(--bg-elevated)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${rate}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-dim))', borderRadius: '99px', transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{done.length} completadas</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)' }}>{rate}%</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{pending.length} pendientes</span>
        </div>
      </div>
    </div>
  )
}
