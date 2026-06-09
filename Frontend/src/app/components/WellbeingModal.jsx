import { useState } from 'react'
import { Btn, Input, Textarea } from './ui.jsx'
import { wellbeingController } from '../controllers/wellbeingController.js'

const MOODS = [
  { emoji: '😄', label: 'Excelente', value: 'excellent', color: '#0ea47a' },
  { emoji: '😊', label: 'Bien', value: 'good', color: '#3b82f6' },
  { emoji: '😐', label: 'Neutral', value: 'neutral', color: '#d97706' },
  { emoji: '😔', label: 'Triste', value: 'sad', color: '#ec4899' },
  { emoji: '😫', label: 'Muy mal', value: 'very_bad', color: '#ef4444' },
]

export function WellbeingModal({ onComplete }) {
  const [mood, setMood] = useState(null)
  const [note, setNote] = useState('')
  const [sleepHours, setSleepHours] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!mood) { setError('Selecciona tu estado de ánimo'); return }
    const hrs = sleepHours ? Number(sleepHours) : null
    if (hrs !== null && (hrs < 0 || hrs > 24)) { setError('Las horas de sueño deben estar entre 0 y 24'); return }
    setSaving(true); setError('')
    try {
      await wellbeingController.saveEntry({ mood: mood.value, note, sleepHours: hrs })
      onComplete()
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  const handleSkip = async () => {
    try {
      await wellbeingController.skipToday()
      onComplete()
    } catch (e) { setError(e.message) }
  }

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
        borderRadius: 'var(--r-xl)', width: '100%', maxWidth: '440px',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--sh-xl)', animation: 'modalIn 0.18s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        <div style={{ padding: '1.5rem 1.5rem 1rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Registro diario de bienestar</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>¿Cómo te sientes hoy?</p>
        </div>

        <div style={{ padding: '1rem 1.5rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Emoji mood selector */}
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.625rem' }}>Estado de ánimo</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              {MOODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => { setMood(m); setError('') }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    padding: '0.625rem 0.5rem', borderRadius: 'var(--r-md)',
                    background: mood?.value === m.value ? `${m.color}18` : 'var(--bg-elevated)',
                    border: mood?.value === m.value ? `2px solid ${m.color}` : '2px solid transparent',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                    minWidth: '60px',
                  }}
                  onMouseEnter={e => { if (mood?.value !== m.value) e.currentTarget.style.background = 'var(--bg-surface)' }}
                  onMouseLeave={e => { if (mood?.value !== m.value) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                >
                  <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{m.emoji}</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 600, color: mood?.value === m.value ? m.color : 'var(--text-muted)' }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <Textarea
            label="¿Por qué te sientes así hoy?"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Opcional — escribe cómo te sientes..."
            rows={2}
          />

          {/* Sleep hours */}
          <Input
            label="Horas de sueño"
            type="number"
            min="0"
            max="12"
            step="0.5"
            value={sleepHours}
            onChange={e => setSleepHours(e.target.value)}
            placeholder="Ej. 7.5"
            hint="¿Cuántas horas dormiste?"
          />

          {error && (
            <div style={{ fontSize: '0.78rem', color: 'var(--danger)', textAlign: 'center', fontWeight: 500 }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
            <Btn onClick={handleSave} loading={saving} style={{ width: '100%', height: '38px' }}>
              Guardar registro
            </Btn>
            <button
              type="button"
              onClick={handleSkip}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500,
                fontFamily: 'inherit', textDecoration: 'underline',
                padding: '0.25rem',
              }}
            >
              Omitir por hoy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
