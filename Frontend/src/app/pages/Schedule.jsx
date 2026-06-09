import { useEffect, useState } from 'react'
import { api } from '../utils/api.js'
import { format, addDays, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock } from 'lucide-react'
import { EmptyState } from '../components/ui.jsx'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const HORAS = Array.from({ length: 14 }, (_, i) => i + 7)

function tiempoAMin(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function Schedule() {
  const [materias, setMaterias] = useState([])
  const hoy = new Date()
  const inicioSemana = startOfWeek(hoy, { weekStartsOn: 1 })

  useEffect(() => {
    api.getSubjects().then(setMaterias).catch(() => setMaterias([]))
  }, [])

  const fechasDias = DIAS.map((_, i) => addDays(inicioSemana, i))

  const getClasesDia = (dia) => {
    const resultado = []
    materias.forEach(mat => {
      (mat.schedule || []).forEach(sch => {
        if (sch.day === dia) resultado.push({ mat, ...sch })
      })
    })
    return resultado.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-enter" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Horario Académico</h1>
          <p className="page-sub">Semana del {format(inicioSemana, "d 'de' MMMM", { locale: es })}</p>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {format(hoy, "EEEE d 'de' MMMM", { locale: es })}
        </div>
      </div>

      <div className="surface" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={16} color="var(--accent)" />
          <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Vista Semanal</p>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Los bloques provienen del horario configurado en cada materia
          </span>
        </div>
        {materias.length === 0 || !materias.some(m => (m.schedule || []).length > 0) ? (
          <div style={{ padding: '3rem 1.5rem' }}>
            <EmptyState icon={Clock} title="Sin horarios" description="Agrega un horario a tus materias para verlo aquí." />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '700px', position: 'relative' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(6, 1fr)', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 3 }}>
                <div />
                {DIAS.map((dia, i) => {
                  const fecha = fechasDias[i]
                  const esHoy = fecha.toDateString() === hoy.toDateString()
                  return (
                    <div key={dia} style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, color: esHoy ? 'var(--accent)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dia.slice(0, 3)}</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 600, color: esHoy ? 'var(--accent)' : 'var(--text-primary)' }}>{format(fecha, 'd')}</p>
                      {esHoy && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', margin: '2px auto 0' }} />}
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(6, 1fr)' }}>
                <div>
                  {HORAS.map(hora => (
                    <div key={hora} style={{ height: '52px', borderBottom: '1px solid var(--border)', padding: '0.5rem 0.5rem 0 0', textAlign: 'right' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{hora}:00</span>
                    </div>
                  ))}
                </div>
                {DIAS.map(dia => {
                  const clases = getClasesDia(dia)
                  return (
                    <div key={dia} style={{ borderLeft: '1px solid var(--border)', position: 'relative', minHeight: `${HORAS.length * 52}px` }}>
                      {HORAS.map(h => <div key={h} style={{ height: '52px', borderBottom: '1px solid var(--border)' }} />)}
                      {clases.map((cls, i) => {
                        const startMin = tiempoAMin(cls.startTime)
                        const endMin = tiempoAMin(cls.endTime)
                        const top = ((startMin / 60) - 7) * 52
                        const height = ((endMin - startMin) / 60) * 52
                        return (
                          <div key={i} style={{
                            position: 'absolute', top: `${top}px`, left: '2px', right: '2px',
                            height: `${Math.max(height, 20)}px`,
                            background: cls.mat.color, borderRadius: '7px', padding: '4px 7px',
                            overflow: 'hidden', cursor: 'default', zIndex: 2,
                          }}>
                            <p style={{ fontSize: '0.63rem', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>{cls.mat.name}</p>
                            <p style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.85)' }}>{cls.startTime}–{cls.endTime}</p>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
