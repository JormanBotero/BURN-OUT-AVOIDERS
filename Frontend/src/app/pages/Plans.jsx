import { useEffect, useState } from 'react'
import { Sparkles, Calendar, Clock, ChevronRight, Loader2 } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { api } from '../utils/api.js'
import { Btn, Badge, EmptyState } from '../components/ui.jsx'

const COLORS = ['#7265f8', '#0ea47a', '#d97706', '#3b82f6', '#ec4899', '#a855f7', '#ef4444']

export function Plans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const load = () => {
    setLoading(true)
    api.getPlans()
      .then(d => setPlans(d || []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await api.generatePlan(new Date().toISOString().split('T')[0])
      load()
    } catch { setGenerating(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--text-muted)' }}>
      <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite', marginRight: '0.5rem' }} />
      Cargando planes...
    </div>
  )

  return (
    <div className="page-wrap" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Plan de estudio</h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Distribución semanal personalizada</p>
        </div>
        <Btn onClick={handleGenerate} loading={generating} icon={Sparkles}>Generar plan semanal</Btn>
      </div>

      {plans.length === 0 ? (
        <EmptyState icon={Calendar} title="Sin planes aún" message="Genera tu primer plan de estudio semanal para organizar tus tareas y evaluaciones." action="Generar plan" onAction={handleGenerate} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {plans.map(p => {
            const data = typeof p.planData === 'string' ? JSON.parse(p.planData) : p.planData
            const weekLabel = `${format(new Date(p.weekStart), 'd MMM', { locale: es })} – ${format(new Date(p.weekEnd), 'd MMM', { locale: es })}`
            return (
              <details key={p.id} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', overflow: 'hidden' }} open>
                <summary style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', userSelect: 'none' }}>
                  <span><Calendar size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />{weekLabel}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{data?.hoursPerWeek || 0}h/sem · {data?.dailyHours || 0}h/día</span>
                </summary>
                <div style={{ padding: '0 1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {data?.days?.map((day, i) => (
                    <div key={day.date} style={{ padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', borderLeft: `3px solid ${COLORS[i % COLORS.length]}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{day.label}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{day.hours}h</span>
                      </div>
                      {day.evaluations?.length > 0 && (
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--warning)' }}>Evaluaciones:</span>
                          {day.evaluations.map(e => (
                            <span key={e.id} style={{ display: 'inline-block', margin: '2px 4px 2px 0', padding: '1px 6px', borderRadius: 'var(--r-sm)', background: `${e.subjectColor}18`, color: e.subjectColor, fontWeight: 500 }}>{e.title}</span>
                          ))}
                        </div>
                      )}
                      {day.tasks?.length > 0 && (
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          <span style={{ fontWeight: 600 }}>Tareas:</span>
                          {day.tasks.map(t => (
                            <span key={t.id} style={{ display: 'inline-block', margin: '2px 4px 2px 0', padding: '1px 6px', borderRadius: 'var(--r-sm)', background: `${t.subjectColor}18`, color: t.subjectColor, fontWeight: 500 }}>{t.title}</span>
                          ))}
                        </div>
                      )}
                      {(!day.evaluations?.length && !day.tasks?.length) && (
                        <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>Sin actividades programadas</span>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
