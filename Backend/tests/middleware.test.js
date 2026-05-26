// ─────────────────────────────────────────────────────────────────
// Tests del Middleware — authenticateToken
// Verifica que protege las rutas correctamente en todos los casos
// ─────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'
import { authenticateToken, generarToken } from '../src/middleware/auth.js'

const JWT_SECRET = process.env.JWT_SECRET || 'studymind-dev-secret-change-in-production'

// ── App mínima que usa el middleware ─────────────────────────────
const app = express()
app.use(express.json())
app.get('/ruta-protegida', authenticateToken, (req, res) => {
  res.json({ userId: req.userId, ok: true })
})

describe('Middleware authenticateToken', () => {
  it('permite acceso con token válido e inyecta req.userId', async () => {
    const token = jwt.sign({ userId: 'user-abc' }, JWT_SECRET)

    const res = await request(app)
      .get('/ruta-protegida')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.userId).toBe('user-abc')
  })

  it('devuelve 401 cuando no hay encabezado Authorization', async () => {
    const res = await request(app).get('/ruta-protegida')
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/token.*requerido/i)
  })

  it('devuelve 403 cuando el encabezado no tiene formato "Bearer <token>"', async () => {
    // El middleware extrae lo que venga después del espacio e intenta verificarlo
    // como JWT — falla la verificación y responde 403 (no 401)
    const res = await request(app)
      .get('/ruta-protegida')
      .set('Authorization', 'Basic usuario:clave')

    expect(res.status).toBe(403)
  })

  it('devuelve 403 con token firmado con clave incorrecta', async () => {
    const tokenFalso = jwt.sign({ userId: 'hacker' }, 'clave-incorrecta')

    const res = await request(app)
      .get('/ruta-protegida')
      .set('Authorization', `Bearer ${tokenFalso}`)

    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/inválido|expirado/i)
  })

  it('devuelve 403 con token expirado', async () => {
    // Token que expiró hace 1 segundo
    const tokenVencido = jwt.sign({ userId: 'user-abc' }, JWT_SECRET, { expiresIn: -1 })

    const res = await request(app)
      .get('/ruta-protegida')
      .set('Authorization', `Bearer ${tokenVencido}`)

    expect(res.status).toBe(403)
  })

  it('devuelve 403 con un string que no es JWT', async () => {
    const res = await request(app)
      .get('/ruta-protegida')
      .set('Authorization', 'Bearer esto-no-es-un-jwt')

    expect(res.status).toBe(403)
  })
})

describe('generarToken', () => {
  it('genera un JWT que contiene el userId correcto', () => {
    const token = generarToken('user-123')
    const payload = jwt.verify(token, JWT_SECRET)
    expect(payload.userId).toBe('user-123')
  })

  it('el token generado tiene fecha de expiración', () => {
    const token = generarToken('user-123')
    const payload = jwt.decode(token)
    expect(payload.exp).toBeDefined()
    expect(payload.exp).toBeGreaterThan(Date.now() / 1000)
  })
})