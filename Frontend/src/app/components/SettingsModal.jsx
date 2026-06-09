import { useState, useEffect } from 'react'
import { api } from '../utils/api.js'
import { X, Clock, Calendar, Bell, Save } from 'lucide-react'
import { Btn, Input } from './ui.jsx'

export function SettingsModal({ onClose }) {
  const [form, setForm] = useState({
    studyHoursPerWeek: 20,
    preferredStudyTime: '',
    semesterStart: '',
    semesterEnd: '',
    notificationsEnabled: true,
    notificationEmail: '',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const setBool = k => e => setForm(p => ({ ...p, [k]: e.target.checked }))

  useEffect(() => {
    api.getSettings().then(s => {
      if (s) {
        setForm({
          studyHoursPerWeek: s.studyHoursPerWeek || 20,
          preferredStudyTime: s.preferredStudyTime || '',
          semesterStart: s.semesterStart ? s.semesterStart.split('T')[0] : '',
          semesterEnd: s.semesterEnd ? s.semesterEnd.split('T')[0] : '',
          notificationsEnabled: s.notificationsEnabled != null ? s.notificationsEnabled : true,
          notificationEmail: s.notificationEmail || '',
        })
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateSettings({
        ...form,
        studyHoursPerWeek: Number(form.studyHoursPerWeek),
        semesterStart: form.semesterStart || null,
        semesterEnd: form.semesterEnd || null,
        notificationEmail: form.notificationEmail || null,
      })
      onClose()
    } catch { setSaving(false) }
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 190, backdropFilter: 'blur(3px)', animation: 'fadeIn 0.15s ease both' }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '460px',
        background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
        zIndex: 200, display: 'flex', flexDirection: 'column', boxShadow: 'var(--sh-xl)',
        animation: 'slideIn 0.22s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Configuración de estudio</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>Para planes de estudio personalizados</p>
          </div>
          <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: 'var(--r-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Cargando...
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} /> Disponibilidad semanal
              </p>
              <Input label="Horas de estudio por semana" type="number" min="1" max="168" value={form.studyHoursPerWeek} onChange={set('studyHoursPerWeek')} />
              <div style={{ marginTop: '0.75rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Horario preferido de estudio</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {['mañana', 'tarde', 'noche'].map(t => (
                    <button key={t} type="button" onClick={() => setForm(p => ({ ...p, preferredStudyTime: t }))}
                      style={{ flex: 1, height: '34px', borderRadius: 'var(--r-md)', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.12s', border: `1px solid ${form.preferredStudyTime === t ? 'var(--accent)' : 'var(--border)'}`, background: form.preferredStudyTime === t ? 'var(--accent-soft)' : 'var(--bg-surface)', color: form.preferredStudyTime === t ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {t === 'mañana' ? '🌅 Mañana' : t === 'tarde' ? '☀️ Tarde' : '🌙 Noche'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={16} /> Fechas del semestre
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Input label="Inicio" type="date" value={form.semesterStart} onChange={set('semesterStart')} />
                <Input label="Fin" type="date" value={form.semesterEnd} onChange={set('semesterEnd')} />
              </div>
            </div>

            <div>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Bell size={16} /> Notificaciones
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                <input type="checkbox" checked={form.notificationsEnabled} onChange={setBool('notificationsEnabled')} style={{ accentColor: 'var(--accent)' }} />
                Activar notificaciones
              </label>
              <Input label="Email para notificaciones" type="email" value={form.notificationEmail} onChange={set('notificationEmail')} placeholder={form.notificationsEnabled ? 'correo@ejemplo.com' : ''} disabled={!form.notificationsEnabled} />
            </div>
          </div>
        )}

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', background: 'var(--bg-surface)' }}>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={handleSave} loading={saving} icon={Save}>Guardar configuración</Btn>
        </div>
      </div>
    </>
  )
}
