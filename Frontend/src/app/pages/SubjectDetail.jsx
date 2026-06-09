import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { api } from '../utils/api.js'
import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft, BookOpen, User, Award, Clock, CheckCircle2, Circle,
  AlertTriangle, Calendar, Plus, Trash2,
  Target, TrendingUp, GraduationCap
} from 'lucide-react'
import { Btn, Badge, EmptyState, StatCard } from '../components/ui.jsx'

const diffMap = {
  low:    { label: 'Fácil',    color: 'var(--success)' },
  medium: { label: 'Moderado', color: 'var(--warning)' },
  high:   { label: 'Difícil',  color: 'var(--danger)'  },
}
const TYPE_LABELS = {
  assignment: 'Tarea', reading: 'Lectura', project: 'Proyecto',
  lab: 'Laboratorio', presentation: 'Presentación',
  exam: 'Examen', quiz: 'Quiz', final: 'Final', midterm: 'Parcial',
  oral: 'Oral', workshop: 'Taller', homework: 'Deber',
}
const PRIORITY_CFG = {
  high:   { label: 'Alta',  color: 'var(--danger)'  },
  medium: { label: 'Media', color: 'var(--warning)' },
  low:    { label: 'Baja',  color: 'var(--success)' },
}
const DIFFICULTY_CFG = {
  easy:      { label: 'Fácil',       color: 'var(--success)' },
  medium:    { label: 'Moderado',    color: 'var(--warning)' },
  hard:      { label: 'Difícil',     color: 'var(--danger)'  },
  very_hard: { label: 'Muy difícil', color: 'var(--danger)'  },
}
const STATUS_CFG = {
  pending:     { label: 'Pendiente',    color: 'var(--text-muted)' },
  in_progress: { label: 'En progreso',  color: 'var(--info)' },
  completed:   { label: 'Completada',   color: 'var(--success)' },
  passed:      { label: 'Aprobada',     color: 'var(--success)' },
  failed:      { label: 'Reprobada',    color: 'var(--danger)'  },
}
const gradedTypes = new Set(['exam','quiz','final','midterm','oral','workshop','homework','assignment','project','lab','presentation'])

export function SubjectDetail() {
  const { id } = useParams()
  const [subject, setSubject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [activeTab, setActiveTab] = useState('tasks')
  const [loading, setLoading] = useState(true)

  const isEvalType = t => ['exam','quiz','final','midterm','oral','workshop','homework'].includes(t.type)

  useEffect(() => {
    const load = async () => {
      try {
        const [subjects, allTasks] = await Promise.all([
          api.getSubjects(), api.getTasks()
        ])
        const sub = subjects.find(s => s.id === id)
        setSubject(sub)
        setTasks(allTasks.filter(t => t.subjectId === id).map(t => ({ ...t, dueDate: new Date(t.dueDate) })))
      } catch {
        setSubject(null)
        setTasks([])
      }
      setLoading(false)
    }
    load()
  }, [id])

  const toggleTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    const completed = !task.completed
    const status = completed ? 'completed' : 'pending'
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed, status } : t))
    try { await api.updateTask(taskId, { completed, status }) } catch {}
  }

  const deleteActividad = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    try { await api.deleteTask(taskId) } catch {}
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
      Cargando materia...
    </div>
  )
  if (!subject) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
      <BookOpen size={40} color="var(--text-muted)" strokeWidth={1.2} />
      <p style={{ color: 'var(--text-muted)' }}>Materia no encontrada</p>
      <Link to="/app/subjects"><Btn variant="secondary" icon={ArrowLeft}>Volver</Btn></Link>
    </div>
  )

  const diff = diffMap[subject.difficulty] || diffMap.medium
  const allActivities = [...tasks].sort((a, b) => a.dueDate - b.dueDate)
  const taskActivities = allActivities.filter(t => !isEvalType(t))
  const evalActivities = allActivities.filter(t => isEvalType(t))
  const pending = tasks.filter(t => !t.completed)
  const done = tasks.filter(t => t.completed)
  const completionRate = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0
  const now = new Date()

  const TABS = [
    { id: 'tasks',       label: `Tareas (${taskActivities.length})`,       icon: CheckCircle2 },
    { id: 'evaluations', label: `Evaluaciones (${evalActivities.length})`, icon: Target   },
    { id: 'grades',      label: 'Notas',                                     icon: GraduationCap },
    { id: 'schedule',    label: 'Horario',                                  icon: Calendar },
  ]

  const ActividadRow = ({ act }) => {
    const days = differenceInDays(act.dueDate, now)
    const overdue = !act.completed && days < 0
    const pc = PRIORITY_CFG[act.priority] || PRIORITY_CFG.medium
    return (
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', background: overdue ? 'var(--danger-soft)' : act.completed ? 'var(--success-soft)' : 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: overdue ? '1px solid var(--danger)22' : '1px solid transparent' }}>
        <button onClick={() => toggleTask(act.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: act.completed ? 'var(--success)' : 'var(--text-muted)', padding: 0, flexShrink: 0, transition: 'color 0.15s' }}>
          {act.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: act.completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: act.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.title}</p>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '3px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge color={pc.color}>{pc.label}</Badge>
            <Badge color="var(--text-muted)">{TYPE_LABELS[act.type] || act.type}</Badge>
            <span style={{ fontSize: '0.7rem', color: overdue ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>
              {act.completed ? '✓ Completa' : overdue ? `Vencida hace ${-days}d` : days === 0 ? '¡Hoy!' : days === 1 ? 'Mañana' : format(act.dueDate, "d MMM", { locale: es })}
            </span>
            {act.estimatedHours && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>~{act.estimatedHours}h</span>}
            {act.weight > 0 && <Badge color="var(--accent)">{act.weight}%</Badge>}
            {act.score != null && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: act.score >= (act.maxScore || 5) * 0.6 ? 'var(--success)' : 'var(--danger)' }}>
                {act.score}/{act.maxScore}
              </span>
            )}
          </div>
          {act.topics?.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '0.35rem', flexWrap: 'wrap' }}>
              {act.topics.slice(0, 3).map((t, i) => <Badge key={i} color="var(--accent)">{t}</Badge>)}
              {act.topics.length > 3 && <Badge color="var(--text-muted)">+{act.topics.length - 3}</Badge>}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button onClick={() => deleteActividad(act.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', transition: 'color 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      <Link to="/app/subjects" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
        <ArrowLeft size={14} /> Volver a Materias
      </Link>

      <div className="surface" style={{ overflow: 'hidden' }}>
        <div style={{ height: '5px', background: subject.color }} />
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '15px', flexShrink: 0, background: `${subject.color}18`, border: `2px solid ${subject.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={22} color={subject.color} strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{subject.name}</h1>
              <Badge color={subject.color}>{subject.code}</Badge>
              <Badge color={diff.color}>{diff.label}</Badge>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {subject.professor && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={12} /> {subject.professor}
                </span>
              )}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Award size={12} /> {subject.credits} créditos
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <TrendingUp size={12} /> {completionRate}% completado
              </span>
            </div>
          </div>
          <Link to="/app/tasks">
            <Btn icon={Plus} size="sm">Nueva tarea</Btn>
          </Link>
        </div>

        <div style={{ padding: '0 1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.625rem' }}>
            <StatCard icon={CheckCircle2} label="Completadas" value={done.length} sub={`de ${tasks.length}`} color="var(--success)" />
            <StatCard icon={Clock} label="Pendientes" value={pending.length} color="var(--warning)" />
            <StatCard icon={Target} label="Evaluaciones" value={evalActivities.length} sub={`${evalActivities.filter(e => e.dueDate >= now).length} próx.`} color="var(--accent)" />
          </div>
          <div style={{ height: '5px', background: 'var(--bg-elevated)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${completionRate}%`, background: subject.color, borderRadius: '99px', transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', padding: '3px', gap: '2px', width: 'fit-content' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ padding: '0.4rem 0.875rem', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600, background: activeTab === id ? 'var(--bg-surface)' : 'transparent', color: activeTab === id ? subject.color : 'var(--text-muted)', boxShadow: activeTab === id ? 'var(--sh-sm)' : 'none', transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
            <Icon size={13} strokeWidth={activeTab === id ? 2.3 : 1.8} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <div className="surface" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{taskActivities.length} tarea{taskActivities.length !== 1 ? 's' : ''}</p>
            <Link to="/app/tasks"><Btn icon={Plus} size="sm">Nueva</Btn></Link>
          </div>
          {taskActivities.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Sin tareas" description="Crea una tarea desde la página de Tareas." action={<Link to="/app/tasks"><Btn icon={Plus}>Ir a Tareas</Btn></Link>} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {taskActivities.map(act => <ActividadRow key={act.id} act={act} />)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'evaluations' && (
        <div className="surface" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{evalActivities.length} evaluacione{evalActivities.length !== 1 ? 's' : ''}</p>
            <Link to="/app/tasks"><Btn icon={Plus} size="sm">Nueva</Btn></Link>
          </div>
          {evalActivities.length === 0 ? (
            <EmptyState icon={Target} title="Sin evaluaciones" description="Registra evaluaciones desde la página de Tareas." action={<Link to="/app/tasks"><Btn icon={Plus}>Ir a Tareas</Btn></Link>} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {evalActivities.map(act => <ActividadRow key={act.id} act={act} />)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="surface" style={{ padding: '1.25rem 1.5rem' }}>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Calificaciones</p>
          {tasks.filter(t => t.weight > 0).length === 0 ? (
            <EmptyState icon={GraduationCap} title="Sin calificaciones" description="Crea tareas con peso > 0% para registrar notas." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tasks.filter(t => t.weight > 0).sort((a, b) => b.dueDate - a.dueDate).map(act => {
                const sc = STATUS_CFG[act.status] || STATUS_CFG.pending
                const Icon = act.completed ? CheckCircle2 : Clock
                return (
                  <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                    <Icon size={14} color={sc.color} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{act.title}</p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{act.weight}% · {sc.label}</p>
                    </div>
                    {act.score != null ? (
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: act.score >= (act.maxScore || 5) * 0.6 ? 'var(--success)' : 'var(--danger)' }}>
                        {act.score}/{act.maxScore}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>—</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="surface" style={{ padding: '1.25rem 1.5rem' }}>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Clases de {subject.name}</p>
          {!subject.schedule || subject.schedule.length === 0 ? (
            <EmptyState icon={Calendar} title="Sin horario" description="Edita la materia para agregar el horario de clases." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {subject.schedule.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', borderLeft: `3px solid ${subject.color}` }}>
                  <div style={{ width: '80px', flexShrink: 0 }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: subject.color }}>{s.day}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.startTime} – {s.endTime}</p>
                    {s.room && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.room}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
