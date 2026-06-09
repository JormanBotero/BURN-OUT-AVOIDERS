import { useState, useEffect } from 'react'
import { X, Moon, Filter, Search } from 'lucide-react'
import { wellbeingController } from '../controllers/wellbeingController.js'
import { Input, EmptyState } from './ui.jsx'

const MOOD_EMOJIS = { excellent: '😄', good: '😊', neutral: '😐', sad: '😔', very_bad: '😫' }
const MOOD_LABELS = { excellent: 'Excelente', good: 'Bien', neutral: 'Neutral', sad: 'Triste', very_bad: 'Muy mal' }

export function WellbeingHistory({ onClose }) {
  const [search, setSearch] = useState('')
  const [moodFilter, setMoodFilter] = useState('all')
  const [all, setAll] = useState([])

  useEffect(() => { wellbeingController.getHistory().then(setAll) }, [])

  const filtered = all.filter(r => {
    if (moodFilter !== 'all' && r.mood !== moodFilter) return false
    if (search) {
      const s = search.toLowerCase()
      if (r.note && r.note.toLowerCase().includes(s)) return true
      const d = new Date(r.date)
      if (d.toLocaleDateString('es').includes(s)) return true
      return false
    }
    return true
  })

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease both',
      }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)', width: '100%', maxWidth: '600px',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--sh-xl)', animation: 'modalIn 0.18s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Historial de Bienestar
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {all.length} registro{all.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose}
            style={{ width: '28px', height: '28px', borderRadius: 'var(--r-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '140px' }}>
            <Search size={12} strokeWidth={2} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por fecha o nota..."
              style={{ width: '100%', height: '32px', padding: '0 0.75rem 0 1.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: '0.78rem', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[['all', 'Todos'], ['excellent', '😄'], ['good', '😊'], ['neutral', '😐'], ['sad', '😔'], ['very_bad', '😫']].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setMoodFilter(k)}
                style={{
                  padding: '2px 8px', borderRadius: '99px', border: '1px solid',
                  borderColor: moodFilter === k ? 'var(--accent)' : 'var(--border)',
                  background: moodFilter === k ? 'var(--accent-soft)' : 'transparent',
                  color: moodFilter === k ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.12s',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Filter}
              title="Sin registros"
              description={search || moodFilter !== 'all' ? 'No hay coincidencias para los filtros seleccionados.' : 'Completa el registro diario desde el Dashboard para ver tu historial.'}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filtered.map((r, i) => {
                const d = new Date(r.date)
                const dateStr = d.toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                const isSkipped = r.skipped
                return (
                  <div
                    key={r.id || i}
                    style={{
                      padding: '0.875rem', background: 'var(--bg-elevated)',
                      borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {dateStr}
                      </p>
                    </div>
                    {isSkipped ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        Registro omitido
                      </p>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {r.mood && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>{MOOD_EMOJIS[r.mood]}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {MOOD_LABELS[r.mood]}
                            </span>
                          </div>
                        )}
                        {r.sleepHours != null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Moon size={12} color="var(--accent)" />
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {r.sleepHours}h
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {r.note && !isSkipped && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.4 }}>
                        {r.note}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
