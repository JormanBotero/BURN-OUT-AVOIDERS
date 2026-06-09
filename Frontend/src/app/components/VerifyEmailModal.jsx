import { useState, useEffect } from 'react'
import { Mail, RefreshCw, X, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export function VerifyEmailModal({ open, onClose }) {
  const { user, sendVerificationCode, verifyEmail } = useAuth()
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setCode(''); setMsg(''); setVerified(false)
      handleSend()
    }
  }, [open])

  const handleSend = async () => {
    setLoading(true); setMsg('')
    try {
      await sendVerificationCode()
      setMsg('Código enviado a ' + user?.email)
    } catch (e) { setMsg(e.message) }
    setLoading(false)
  }

  const handleVerify = async () => {
    if (code.length < 6) return
    setLoading(true); setMsg('')
    try {
      await verifyEmail(code)
      setVerified(true)
      setTimeout(onClose, 1500)
    } catch (e) { setMsg(e.message) }
    setLoading(false)
  }

  if (!open) return null

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', animation: 'fadeIn 0.15s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-surface)', borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.05)',
        width: '100%', maxWidth: '380px', padding: '2rem',
        animation: 'scaleIn 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '14px',
            background: 'linear-gradient(135deg, #7265f8, #8b7cf9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(114,101,248,0.3)',
          }}>
            <Mail size={20} color="white" />
          </div>
          <button onClick={onClose} style={{
            background: 'var(--bg-elevated)', border: 'none', borderRadius: '50%',
            width: 28, height: 28, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)',
          }}>
            <X size={14} />
          </button>
        </div>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {verified ? '¡Correo verificado!' : 'Verifica tu correo'}
        </h2>
        {!verified && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Ingresa el código de 6 dígitos que enviamos a <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>
          </p>
        )}

        {verified ? (
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <CheckCircle size={40} color="#22c55e" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ya puedes acceder a todas las funciones</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <input
                type="text" maxLength={6} inputMode="numeric" placeholder="000000"
                value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{
                  textAlign: 'center', fontSize: '2rem', letterSpacing: '10px',
                  fontFamily: 'monospace', fontWeight: 700, padding: '0.75rem',
                  borderRadius: '12px', border: '1px solid var(--border)',
                  background: 'var(--bg-base)', color: 'var(--text-primary)',
                  outline: 'none', transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              {msg && (
                <p style={{ fontSize: '0.78rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {msg}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleVerify} disabled={code.length < 6 || loading}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '12px',
                  background: code.length < 6 ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #7265f8, #8b7cf9)',
                  color: code.length < 6 ? 'var(--text-muted)' : 'white',
                  fontWeight: 600, border: 'none', cursor: loading ? 'wait' : 'pointer',
                  fontSize: '0.85rem', transition: 'all 0.15s',
                }}>
                {loading ? 'Enviando...' : code.length < 6 ? 'Ingresa el código' : 'Verificar'}
              </button>
              <button onClick={handleSend} disabled={loading}
                style={{
                  padding: '0.75rem', borderRadius: '12px',
                  background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                  fontWeight: 600, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  fontSize: '0.85rem',
                }}>
                <RefreshCw size={14} /> Reenviar
              </button>
            </div>
          </>
        )}

        <style>{`
          @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
          @keyframes scaleIn { from { transform: scale(0.95); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        `}</style>
      </div>
    </div>
  )
}
