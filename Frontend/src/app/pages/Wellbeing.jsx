import { useState, useEffect } from 'react'
import { Smile, Moon, Activity, History, RefreshCw, TrendingUp, Calendar, Sparkles } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { Btn, Badge, StatCard, EmptyState } from '../components/ui.jsx'
import { WellbeingModal } from '../components/WellbeingModal.jsx'
import { wellbeingController } from '../controllers/wellbeingController.js'

const MOOD_MAP = {
  excellent: { emoji: '😄', label: 'Excelente', color: '#0ea47a' },
  good:      { emoji: '😊', label: 'Bien',      color: '#3b82f6' },
  neutral:   { emoji: '😐', label: 'Neutral',   color: '#d97706' },
  sad:       { emoji: '😔', label: 'Triste',    color: '#ec4899' },
  very_bad:  { emoji: '😫', label: 'Muy mal',   color: '#ef4444' },
}

const MOOD_SCORE = { excellent: 5, good: 4, neutral: 3, sad: 2, very_bad: 1 }

export function Wellbeing() {
  const [todayEntry, setTodayEntry] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [history, setHistory] = useState([])
  const [sleepStats, setSleepStats] = useState({ avg: 0, min: 0, max: 0 })
  const [moodFreq, setMoodFreq] = useState([])
  const [weeklyTrend, setWeeklyTrend] = useState([])

  const load = async () => {
    const [entry, hist, sleep, freq, trend] = await Promise.all([
      wellbeingController.checkToday(),
      wellbeingController.getHistory(),
      wellbeingController.getSleepStats(),
      wellbeingController.getMoodFrequency(),
      wellbeingController.getWeeklyTrend(),
    ])
    setTodayEntry(entry)
    setHistory(hist)
    setSleepStats(sleep)
    setMoodFreq(freq)
    setWeeklyTrend(trend)
  }

  useEffect(() => { load() }, [])

  const handleComplete = () => { setShowModal(false); load() }

  const now = new Date()
  const dateStr = now.toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const totalRecords = history.length
  const hasEntry = todayEntry && !todayEntry.skipped
  const totalMoods = moodFreq.reduce((a, m) => a + m.value, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Bienestar</h1>
          <p className="page-sub">{dateStr}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Btn variant="secondary" icon={RefreshCw} onClick={load}>Actualizar</Btn>
          {!hasEntry && <Btn icon={Smile} onClick={() => setShowModal(true)}>Registrar hoy</Btn>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.875rem' }}>
        <StatCard icon={Smile} label="Registros totales" value={totalRecords} color="var(--accent)" />
        <StatCard icon={Moon} label="Sueño promedio" value={sleepStats.avg ? `${sleepStats.avg}h` : '—'} color="var(--success)" />
        <StatCard icon={Activity} label="Estado de hoy" value={hasEntry ? MOOD_MAP[todayEntry.mood]?.emoji || '—' : '—'} color="var(--warning)" />
        <StatCard icon={Sparkles} label="Días con registro" value={`${totalRecords}d`} color="var(--accent)" />
      </div>

      {/* Today's entry card */}
      <div className="surface" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: hasEntry ? 'var(--accent-soft)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {hasEntry ? <Smile size={22} color="var(--accent)" /> : <Calendar size={22} color="var(--text-muted)" />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {hasEntry ? 'Registro de hoy completado' : 'Hoy aún no te has registrado'}
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {hasEntry
                ? `${MOOD_MAP[todayEntry.mood]?.emoji} ${MOOD_MAP[todayEntry.mood]?.label} · ${todayEntry.sleepHours != null ? `${todayEntry.sleepHours}h de sueño` : 'sin registro de sueño'}`
                : 'Cuéntanos cómo te sientes para llevar un seguimiento de tu bienestar'}
            </p>
          </div>
          {hasEntry
            ? <Btn variant="secondary" size="sm" icon={RefreshCw} onClick={() => setShowModal(true)}>Actualizar</Btn>
            : <Btn size="sm" icon={Smile} onClick={() => setShowModal(true)}>Registrar</Btn>
          }
        </div>
      </div>

      {/* Charts section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Weekly mood trend */}
        <div className="surface" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={16} color="var(--accent)" />
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Tendencia semanal</p>
          </div>
          {weeklyTrend.length === 0 ? (
            <EmptyState icon={Activity} title="Sin datos" description="Registra tu estado de ánimo para ver la tendencia." />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyTrend.map(d => ({ ...d, score: d.mood ? (MOOD_SCORE[d.mood] || 0) : 0 }))}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={20} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.78rem' }}
                  formatter={(val, name, props) => [MOOD_MAP[props.payload.mood]?.emoji + ' ' + MOOD_MAP[props.payload.mood]?.label || '—', 'Ánimo']}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {weeklyTrend.map((d, i) => (
                    <Cell key={i} fill={d.mood ? (MOOD_MAP[d.mood]?.color || '#8e8aad') : '#eeecf9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Mood frequency */}
        <div className="surface" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Activity size={16} color="var(--accent)" />
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Frecuencia de estados</p>
          </div>
          {moodFreq.length === 0 || totalMoods === 0 ? (
            <EmptyState icon={Activity} title="Sin datos" description="Registra tu estado de ánimo para ver la frecuencia." />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={moodFreq} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {moodFreq.map((m, i) => (
                    <Cell key={i} fill={m.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.78rem' }}
                  formatter={(val, name) => [val + ' días', name]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          {moodFreq.length > 0 && totalMoods > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {moodFreq.map(m => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '2px', background: m.color }} />
                  {m.emoji} {m.name}: {m.value}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sleep stats */}
      <div className="surface" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Moon size={16} color="var(--success)" />
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Estadísticas de sueño</p>
        </div>
        {sleepStats.avg > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{sleepStats.avg}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Promedio (h)</p>
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{sleepStats.min}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Mínimo (h)</p>
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{sleepStats.max}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Máximo (h)</p>
            </div>
          </div>
        ) : (
          <EmptyState icon={Moon} title="Sin datos de sueño" description="Registra tus horas de sueño al registrar tu estado de ánimo." />
        )}
      </div>

      {/* History */}
      <div className="surface" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <History size={16} color="var(--accent)" />
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Historial</p>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{history.length} registro{history.length !== 1 ? 's' : ''}</span>
        </div>
        {history.length === 0 ? (
          <EmptyState icon={History} title="Sin historial" description="Completa el registro diario de bienestar para ver tu historial aquí." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
            {history.map((r, i) => {
              const d = new Date(r.date)
              const dateStr = d.toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              return (
                <div key={r.id || i} style={{ padding: '0.875rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>{dateStr}</p>
                  </div>
                  {r.skipped ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Registro omitido</p>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {r.mood && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>{MOOD_MAP[r.mood]?.emoji || '—'}</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{MOOD_MAP[r.mood]?.label || r.mood}</span>
                        </div>
                      )}
                      {r.sleepHours != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Moon size={11} color="var(--accent)" />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{r.sleepHours}h</span>
                        </div>
                      )}
                    </div>
                  )}
                  {r.note && !r.skipped && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>{r.note}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && <WellbeingModal onComplete={handleComplete} />}
    </div>
  )
}
