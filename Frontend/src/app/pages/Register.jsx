import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useGoogleSignIn } from '../utils/useGoogleSignIn.js'
import { GraduationCap, Eye, EyeOff, Moon, Sun, ArrowRight, Mail, RefreshCw, CheckCircle } from 'lucide-react'
import { Btn, Input, Select, Alert } from '../components/ui.jsx'

const CAREERS = ['Ingeniería de Sistemas','Ingeniería Civil','Medicina','Derecho','Administración de Empresas','Psicología','Arquitectura','Contaduría','Enfermería','Comunicación Social','Otra']
const SEMESTERS = Array.from({length:10},(_,i)=>`${i+1}${i===0?'er':'o'} Semestre`)

export function RegisterPage() {
  const { register, loginWithGoogle, sendVerificationCode, verifyEmail } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'', career:'', semester:'', university:'' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('form')
  const [code, setCode] = useState('')
  const [verifyMsg, setVerifyMsg] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleGoogleCredential = async (credential) => {
    setError(''); setLoading(true)
    try { await loginWithGoogle(credential) } catch (e) { setError(e.message) }
    setLoading(false)
  }
  const { prompt: googlePrompt, enabled: googleEnabled } = useGoogleSignIn(handleGoogleCredential)

  const handleSubmit = async e => {
    e.preventDefault(); setError('')
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/
    if (!pwRegex.test(form.password)) return setError('Mínimo 8 carácteres, una mayúscula, una minúscula, un número y un carácter especial')
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden')
    setLoading(true)
    try {
      await register({ name:form.name, email:form.email, password:form.password, career:form.career, semester:form.semester, university:form.university })
      setStep('verify')
      setVerifyMsg('Código enviado a ' + form.email)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const handleSendCode = async () => {
    setVerifyLoading(true)
    try {
      await sendVerificationCode()
      setVerifyMsg('Código reenviado a ' + form.email)
    } catch (e) { setVerifyMsg(e.message) }
    setVerifyLoading(false)
  }

  const handleVerifyCode = async () => {
    if (code.length < 6) return
    setVerifyLoading(true)
    try {
      await verifyEmail(code)
      setStep('success')
    } catch (e) { setVerifyMsg(e.message) }
    setVerifyLoading(false)
  }

  const formStyles = (show) => show ? {} : { display: 'none' }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      padding:'1.5rem', position:'relative', overflow:'hidden',
      background: isDark
        ? 'linear-gradient(135deg, #0c0a1a 0%, #1a1040 30%, #0f172a 60%, #0c0a1a 100%)'
        : 'linear-gradient(135deg, #f0f4ff 0%, #e8e0ff 30%, #fef3c7 60%, #f0f4ff 100%)',
    }}>
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0) rotate(0deg) } 50% { transform: translateY(-20px) rotate(5deg) } }
        @keyframes float2 { 0%,100% { transform: translateY(0) rotate(0deg) } 50% { transform: translateY(-15px) rotate(-3deg) } }
        @keyframes pulse-slow { 0%,100% { opacity: 0.3 } 50% { opacity: 0.6 } }
      `}</style>

      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        <div style={{
          position:'absolute', top:'10%', left:'5%', width:'300px', height:'300px',
          borderRadius:'50%', animation:'float 8s ease-in-out infinite',
          background: isDark
            ? 'radial-gradient(circle, rgba(114,101,248,0.15) 0%, transparent 60%)'
            : 'radial-gradient(circle, rgba(114,101,248,0.12) 0%, transparent 60%)',
        }} />
        <div style={{
          position:'absolute', bottom:'15%', right:'8%', width:'400px', height:'400px',
          borderRadius:'50%', animation:'float2 10s ease-in-out infinite',
          background: isDark
            ? 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 60%)'
            : 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 60%)',
        }} />
        <div style={{
          position:'absolute', top:'40%', right:'20%', width:'200px', height:'200px',
          borderRadius:'30% 70% 70% 30% / 30% 30% 70% 70%',
          animation:'float 12s ease-in-out infinite reverse',
          background: isDark
            ? 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 60%)'
            : 'radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 60%)',
        }} />
      </div>

      <button onClick={toggleTheme} style={{
        position:'fixed', top:'1.25rem', right:'1.25rem', zIndex:10,
        background:'var(--bg-surface)', border:'1px solid var(--border)',
        borderRadius:'50%', width:'36px', height:'36px',
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', color:'var(--text-muted)', boxShadow:'var(--sh-sm)',
        backdropFilter:'blur(8px)',
      }}>
        {isDark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
      </button>

      <div className="appear" style={{ width:'100%', maxWidth:'460px', position:'relative', zIndex:1, paddingBlock:'1rem' }}>
        <div style={{ marginBottom:'1.75rem', display:'flex', alignItems:'center', gap:'0.75rem', justifyContent:'center' }}>
          <div style={{
            width:'40px', height:'40px', borderRadius:'12px',
            background:'linear-gradient(135deg, var(--accent), var(--accent-dim))',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 16px var(--accent-glow)',
          }}>
            <GraduationCap size={20} color="white" strokeWidth={2} />
          </div>
          <div>
            <p style={{ fontSize:'1.05rem', fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.02em', lineHeight:1.2 }}>StudyMind</p>
            <p style={{ fontSize:'0.68rem', color:'var(--text-muted)', letterSpacing:'0.03em' }}>Sistema Académico</p>
          </div>
        </div>

        <div className="surface" style={{
          padding:'2rem', borderRadius:'var(--r-xl)',
          boxShadow: isDark
            ? '0 8px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)'
            : '0 8px 40px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)',
          backdropFilter:'blur(12px)',
          background: isDark ? 'rgba(15,15,30,0.85)' : 'rgba(255,255,255,0.85)',
        }}>
          {/* Step 1: Formulario de registro */}
          {step === 'form' && (
            <>
              <h1 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.02em', marginBottom:'4px' }}>Crear cuenta</h1>
              <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:'1.5rem' }}>Completa tus datos para comenzar</p>

              {googleEnabled && (
                <>
                  <button type="button" onClick={googlePrompt} disabled={loading}
                    style={{
                      width:'100%', height:'42px', display:'flex', alignItems:'center',
                      justifyContent:'center', gap:'0.625rem', cursor:'pointer',
                      fontFamily:'inherit', fontSize:'0.84rem', fontWeight:600,
                      borderRadius:'var(--r-md)', transition:'all 0.15s',
                      background: isDark ? '#1a1a2e' : 'white',
                      color: isDark ? '#e4e4e7' : '#1f2937',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #d1d5db',
                      boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = isDark ? '#222240' : '#f9fafb'; e.currentTarget.style.boxShadow = isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = isDark ? '#1a1a2e' : 'white'; e.currentTarget.style.boxShadow = isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.04)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                    </svg>
                    Registrarse con Google
                  </button>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', margin:'1.25rem 0', color:'var(--text-muted)', fontSize:'0.72rem', fontWeight:500 }}>
                    <div style={{ flex:1, height:'1px', background:'var(--border)' }} />
                    <span>o con correo</span>
                    <div style={{ flex:1, height:'1px', background:'var(--border)' }} />
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                <Input label="Nombre completo" required placeholder="Juan García" value={form.name} onChange={set('name')} />
                <Input label="Correo electrónico" type="email" required placeholder="correo@universidad.edu" value={form.email} onChange={set('email')} />

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <Select label="Carrera" value={form.career} onChange={set('career')}>
                    <option value="">Seleccionar</option>
                    {CAREERS.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                  <Select label="Semestre" value={form.semester} onChange={set('semester')}>
                    <option value="">Seleccionar</option>
                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>

                <Input label="Universidad (opcional)" placeholder="Nombre de tu institución" value={form.university} onChange={set('university')} />

                <div style={{ position:'relative' }}>
                  <Input label="Contraseña" type={showPass?'text':'password'} required placeholder="Mín. 8 carácteres: mayúscula, minúscula, número y símbolo" value={form.password} onChange={set('password')} style={{ paddingRight:'2.5rem' }} />
                  <button type="button" onClick={() => setShowPass(p=>!p)} style={{ position:'absolute', right:'0.75rem', bottom:'10px', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:'1px' }}>
                    {showPass ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
                  </button>
                </div>

                <Input label="Confirmar contraseña" type="password" required placeholder="Repite la contraseña" value={form.confirm} onChange={set('confirm')} />

                {error && <Alert type="error">{error}</Alert>}

                <Btn type="submit" loading={loading} icon={ArrowRight} style={{ width:'100%', height:'38px', marginTop:'0.25rem' }}>
                  Crear cuenta
                </Btn>
              </form>

              <p style={{ textAlign:'center', marginTop:'1.25rem', color:'var(--text-muted)', fontSize:'0.8rem' }}>
                Ya tienes cuenta — <Link to="/login" style={{ color:'var(--accent)', fontWeight:600, textDecoration:'none' }}>Inicia sesión</Link>
              </p>
            </>
          )}

          {/* Step 2: Verificación de correo inline */}
          {step === 'verify' && (
            <>
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
                    Ingresa el código de 6 dígitos enviado a <strong>{form.email}</strong>
                  </p>
                </div>
              </div>

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
                {verifyMsg && (
                  <p style={{ fontSize: '0.78rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {verifyMsg}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleVerifyCode} disabled={code.length < 6 || verifyLoading}
                  style={{
                    flex: 1, padding: '0.7rem', borderRadius: 'var(--r-md)',
                    background: code.length < 6 ? 'var(--bg-elevated)' : 'var(--accent)',
                    color: code.length < 6 ? 'var(--text-muted)' : 'white',
                    fontWeight: 600, border: 'none', cursor: verifyLoading ? 'wait' : 'pointer',
                  }}>
                  {verifyLoading ? <span className="spinner" style={{ opacity: 1 }} /> : 'Verificar'}
                </button>
                <button onClick={handleSendCode} disabled={verifyLoading}
                  style={{
                    padding: '0.7rem', borderRadius: 'var(--r-md)',
                    background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                    fontWeight: 600, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                  }}>
                  <RefreshCw size={14} /> Reenviar
                </button>
              </div>

              <p style={{ textAlign:'center', marginTop:'1.25rem', color:'var(--text-muted)', fontSize:'0.8rem' }}>
                <button onClick={() => { setStep('form'); setError('') }}
                  style={{ background:'none', border:'none', color:'var(--accent)', fontWeight:600, cursor:'pointer', fontFamily:'inherit', fontSize:'0.8rem', textDecoration:'underline' }}>
                  Volver al registro
                </button>
              </p>
            </>
          )}

          {/* Step 3: Verificado exitosamente */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '0.75rem' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                ¡Email verificado!
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Tu cuenta está lista. Ahora puedes acceder a todas las funciones.
              </p>
              <Btn onClick={() => navigate('/app')} icon={ArrowRight} style={{ width:'100%', height:'38px' }}>
                Ir al Dashboard
              </Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
