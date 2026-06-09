import { useState, useEffect } from 'react'
import { Mail, RefreshCw, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const style = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 999,
    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    background: 'var(--bg-surface)', borderRadius: 'var(--r-xl)',
    boxShadow: 'var(--sh-xl)', width: '100%', maxWidth: '420px',
    padding: '2rem', animation: 'modalIn 0.2s ease',
  },
}

export function VerifyEmailModal() {
  const { user, sendVerificationCode, verifyEmail, logout } = useAuth()
  const [code, setCode] = useState('')
  const [step, setStep] = useState('enter') // enter | success | error
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (user?.emailVerified) setStep('success') }, [user])

  if (!user || user.emailVerified) return null

  const handleSend = async () => {
    setLoading(true); setMsg('')
    try {
      await sendVerificationCode()
      setMsg('Código enviado a ' + user.email)
    } catch (e) { setMsg(e.message) }
    setLoading(false)
  }

  const handleVerify = async () => {
    if (code.length < 6) return
    setLoading(true); setMsg('')
    try {
      await verifyEmail(code)
      setStep('success')
    } catch (e) { setMsg(e.message); setStep('error') }
    setLoading(false)
  }

  return (
    <div style={style.overlay}>
      <div style={style.modal}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: 42, height: 42, borderRadius: 'var(--r-md)',
            background: 'var(--accent-soft)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Mail size={20} color="var(--accent)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Verifica tu correo</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Te enviamos un código a <strong>{user.email}</strong>
            </p>
          </div>
        </div>

        {step === 'success' ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <CheckCircle size={40} color="var(--success)" style={{ marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>¡Email verificado!</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              <input
                type="text" maxLength={6} inputMode="numeric" placeholder="000000"
                value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{
                  textAlign: 'center', fontSize: '1.8rem', letterSpacing: '8px',
                  fontFamily: 'var(--font-mono)', fontWeight: 700,
                  padding: '0.75rem', borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)', background: 'var(--bg-base)',
                  color: 'var(--text-primary)', outline: 'none',
                }}
              />
              {msg && (
                <p style={{
                  fontSize: '0.78rem', textAlign: 'center',
                  color: step === 'error' ? 'var(--danger)' : 'var(--text-muted)',
                }}>
                  {msg}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleVerify} disabled={code.length < 6 || loading}
                style={{
                  flex: 1, padding: '0.7rem', borderRadius: 'var(--r-md)',
                  background: code.length < 6 ? 'var(--bg-elevated)' : 'var(--accent)',
                  color: code.length < 6 ? 'var(--text-muted)' : 'white',
                  fontWeight: 600, border: 'none', cursor: loading ? 'wait' : 'pointer',
                }}>
                {loading ? <span className="spinner" style={{ opacity: 1 }} /> : 'Verificar'}
              </button>
              <button onClick={handleSend} disabled={loading}
                style={{
                  padding: '0.7rem', borderRadius: 'var(--r-md)',
                  background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                  fontWeight: 600, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                }}>
                <RefreshCw size={14} /> Reenviar
              </button>
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button onClick={logout}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline',
                }}>
                Usar otra cuenta
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
