// ─────────────────────────────────────────────────────────────────
// Rutas de Autenticación
// Maneja registro, inicio de sesión y verificación de token JWT.
// Las contraseñas se hashean con bcrypt antes de guardarse.
// ─────────────────────────────────────────────────────────────────
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import { findUserByEmail, createUser, findUserById, findUserByGoogleId, updateUserGoogleId, setVerificationCode, verifyEmailCode, markEmailVerified } from '../models/database.js'
import { sendVerificationCode } from '../utils/mail.js'
import { generarToken } from '../middleware/auth.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'studymind-dev-secret-change-in-production'

// ── POST /auth/register — Registrar nuevo usuario ──────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, career, semester, university } = req.body

    // Validar campos obligatorios
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' })
    }
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/
    if (!pwRegex.test(password)) {
      return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 carácteres, una mayúscula, una minúscula, un número y un carácter especial' })
    }

    // Verificar que el correo no esté registrado
    const existente = await findUserByEmail(email)
    if (existente) {
      return res.status(409).json({ error: 'Este correo ya está registrado' })
    }

    // Hashear la contraseña antes de guardar
    const contrasenaHash = await bcrypt.hash(password, 10)

    // Generar iniciales automáticamente a partir del nombre
    const iniciales = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

    const usuario = await createUser({
      name, email,
      password: contrasenaHash,
      initials: iniciales,
      career: career || '',
      semester: semester || '',
      university: university || '',
    })

    // Generar y enviar código de verificación
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    await setVerificationCode(usuario.id, code)
    await sendVerificationCode(email, code)

    const { password: _, ...seguro } = usuario
    res.status(201).json({ token: generarToken(usuario.id), user: seguro })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── POST /auth/login — Iniciar sesión ──────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña requeridos' })
    }

    // Buscar usuario por correo
    const usuario = await findUserByEmail(email)
    if (!usuario || !usuario.password) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    // Comparar contraseña ingresada con el hash guardado
    const coincide = await bcrypt.compare(password, usuario.password)
    if (!coincide) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    const { password: _, ...seguro } = usuario
    res.json({ token: generarToken(usuario.id), user: seguro })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── POST /auth/send-code — Reenviar código de verificación ─────────
router.post('/send-code', async (req, res) => {
  try {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token requerido' })
    const { userId } = jwt.verify(auth.slice(7), JWT_SECRET)
    const usuario = await findUserById(userId)
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })
    if (usuario.emailVerified) return res.json({ message: 'Email ya verificado' })

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    await setVerificationCode(userId, code)
    await sendVerificationCode(usuario.email, code)
    res.json({ message: 'Código enviado' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── POST /auth/verify-code — Verificar código ─────────────────────
router.post('/verify-code', async (req, res) => {
  try {
    const { code } = req.body
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token requerido' })
    if (!code) return res.status(400).json({ error: 'Código requerido' })

    const { userId } = jwt.verify(auth.slice(7), JWT_SECRET)
    const ok = await verifyEmailCode(userId, code)
    if (!ok) return res.status(400).json({ error: 'Código inválido o expirado' })

    res.json({ message: 'Email verificado' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── POST /auth/google — Iniciar sesión con Google ───────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential, access_token } = req.body
    if (!credential && !access_token) {
      return res.status(400).json({ error: 'Credencial de Google requerida' })
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
    let payload

    if (credential) {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      })
      payload = ticket.getPayload()
    } else {
      const info = await client.getTokenInfo(access_token)
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      if (!profileRes.ok) throw new Error('No se pudo obtener perfil de Google')
      const profile = await profileRes.json()
      payload = {
        sub: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
      }
    }

    let usuario = await findUserByGoogleId(payload.sub)
    if (!usuario) {
      usuario = await findUserByEmail(payload.email)
      if (usuario) {
        usuario = await updateUserGoogleId(usuario.id, payload.sub)
      } else {
        const iniciales = payload.name
          ? payload.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
          : payload.email[0].toUpperCase()
        usuario = await createUser({
          name: payload.name || payload.email.split('@')[0],
          email: payload.email,
          avatar: payload.picture || null,
          initials: iniciales,
          googleId: payload.sub,
          provider: 'google',
        })
      }
    }

    // Google users are auto-verified
    if (!usuario.emailVerified) {
      await markEmailVerified(usuario.id)
      usuario.emailVerified = true
    }

    const { password: _, ...seguro } = usuario
    res.json({ token: generarToken(usuario.id), user: seguro })
  } catch (e) {
    res.status(500).json({ error: 'Error al autenticar con Google: ' + e.message })
  }
})

export default router
