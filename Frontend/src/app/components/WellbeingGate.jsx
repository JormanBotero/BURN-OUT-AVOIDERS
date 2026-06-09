import { useState, useEffect } from 'react'
import { Btn, Input, Textarea } from './ui.jsx'
import { wellbeingController } from '../controllers/wellbeingController.js'

const MOODS = [
  { emoji: '😄', label: 'Excelente', value: 'excellent', color: '#0ea47a' },
  { emoji: '😊', label: 'Bien', value: 'good', color: '#3b82f6' },
  { emoji: '😐', label: 'Neutral', value: 'neutral', color: '#d97706' },
  { emoji: '😔', label: 'Triste', value: 'sad', color: '#ec4899' },
  { emoji: '😫', label: 'Muy mal', value: 'very_bad', color: '#ef4444' },
]

export function WellbeingGate({ children }) {
  const [checking, setChecking] = useState(true)
  const [needsEntry, setNeedsEntry] = useState(false)
  const [mood, setMood] = useState(null)
  const [note, setNote] = useState('')
  const [sleepHours, setSleepHours] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    wellbeingController.checkToday().then(entry => {
      if (entry && !entry.skipped) {
        setNeedsEntry(false)
      } else {
        setNeedsEntry(true)
      }
      setChecking(false)
    })
  }, [])

  const handleSave = async () => {
    if (!mood) { setError('Selecciona tu estado de ánimo'); return }
    const hrs = sleepHours ? Number(sleepHours) : null
    if (hrs !== null && (hrs < 0 || hrs > 24)) { setError('Ingresa horas de sueño válidas (0–24)'); return }
    setSaving(true); setError('')
    try {
      await wellbeingController.saveEntry({ mood: mood.value, note, sleepHours: hrs })
      setNeedsEntry(false)
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  if (checking) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div className="spinner" />
    </div>
  )

  if (needsEntry) return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-base)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 'var(--r-xl)',
        width: '100%', maxWidth: '420px', padding: '2rem 1.5rem 1.5rem',
        boxShadow: 'var(--sh-xl)', textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌅</div>
        <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>¡Buenos días!</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Antes de continuar, cuéntanos cómo estás hoy
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.625rem' }}>Estado de ánimo</p>
            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
              {MOODS.map(m => (
                <button key={m.value} type="button" onClick={() => { setMood(m); setError('') }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                    padding: '0.5rem 0.35rem', borderRadius: 'var(--r-md)',
                    background: mood?.value === m.value ? `${m.color}18` : 'var(--bg-elevated)',
                    border: mood?.value === m.value ? `2px solid ${m.color}` : '2px solid transparent',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                    minWidth: '52px',
                  }}>
                  <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{m.emoji}</span>
                  <span style={{ fontSize: '0.55rem', fontWeight: 600, color: mood?.value === m.value ? m.color : 'var(--text-muted)' }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Input label="Horas de sueño" type="number" min="0" max="12" step="0.5"
            value={sleepHours} onChange={e => setSleepHours(e.target.value)}
            placeholder="Ej. 7.5" hint="¿Cuántas horas dormiste anoche?"
          />

          <Textarea label="¿Algo más que quieras compartir?" value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Opcional — cómo te sientes, qué pasó ayer..." rows={2}
          />

          {error && <p style={{ fontSize: '0.78rem', color: 'var(--danger)', textAlign: 'center', fontWeight: 500 }}>{error}</p>}

          <Btn onClick={handleSave} loading={saving} style={{ width: '100%', height: '40px', marginTop: '0.5rem' }}>
            Comenzar día
          </Btn>
        </div>
      </div>
    </div>
  )

  return children
}
