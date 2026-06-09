// ─────────────────────────────────────────────────────────────────
// Contexto de Autenticación
// Gestiona el estado de sesión del usuario: login, registro,
// logout y verificación del token al cargar la app.
// ─────────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api.js'

const ContextoAuth = createContext(null)

// Clave del token en localStorage
const CLAVE_TOKEN = 'studymind_token'

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Al montar, verifica si hay un token guardado y carga el perfil
  useEffect(() => {
    const token = localStorage.getItem(CLAVE_TOKEN)
    if (!token) { setCargando(false); return }

    api.getMe()
      .then(datos => setUsuario(datos))
      .catch(() => {
        // Token inválido o expirado — limpiarlo
        localStorage.removeItem(CLAVE_TOKEN)
      })
      .finally(() => setCargando(false))
  }, [])

  // Inicia sesión con correo y contraseña
  const login = useCallback(async (correo, contrasena) => {
    const { token, user } = await api.login({ email: correo, password: contrasena })
    localStorage.setItem(CLAVE_TOKEN, token)
    setUsuario(user)
    return user
  }, [])

  // Registra un nuevo usuario y lo deja autenticado automáticamente
  const registro = useCallback(async (datos) => {
    const { token, user } = await api.register(datos)
    localStorage.setItem(CLAVE_TOKEN, token)
    setUsuario(user)
    return user
  }, [])

  // Inicia sesión con Google
  const loginGoogle = useCallback(async (credencial) => {
    const { token, user } = await api.googleAuth(credencial)
    localStorage.setItem(CLAVE_TOKEN, token)
    setUsuario(user)
    return user
  }, [])

  // Actualiza los datos del perfil en el estado local
  const actualizarUsuario = useCallback((datosNuevos) => {
    setUsuario(prev => ({ ...prev, ...datosNuevos }))
  }, [])

  // Cierra la sesión y limpia el token
  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(CLAVE_TOKEN)
    setUsuario(null)
  }, [])

  // Enviar código de verificación
  const enviarCodigo = useCallback(async () => {
    await api.sendCode()
  }, [])

  // Verificar código
  const verificarCodigo = useCallback(async (code) => {
    await api.verifyCode(code)
    setUsuario(prev => ({ ...prev, emailVerified: true }))
  }, [])

  return (
    <ContextoAuth.Provider value={{
      user: usuario,
      loading: cargando,
      login,
      loginWithGoogle: loginGoogle,
      register: registro,
      updateUser: actualizarUsuario,
      logout: cerrarSesion,
      sendVerificationCode: enviarCodigo,
      verifyEmail: verificarCodigo,
    }}>
      {children}
    </ContextoAuth.Provider>
  )
}

// Hook para consumir el contexto en cualquier componente
export const useAuth = () => useContext(ContextoAuth)
