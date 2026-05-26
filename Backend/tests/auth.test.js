// ─────────────────────────────────────────────────────────────────
// Tests de Autenticación — POST /api/auth/register y /login
// ─────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// ── Mocks de la base de datos ────────────────────────────────────
vi.mock('../src/models/database.js', () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
}))

import { findUserByEmail, findUserById, createUser } from '../src/models/database.js'
import authRoutes from '../src/routes/auth.js'

// ── App de prueba (sin levantar el servidor real) ─────────────────
const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)

const JWT_SECRET = process.env.JWT_SECRET || 'studymind-dev-secret-change-in-production'

// ─────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('registra un usuario nuevo y devuelve token + perfil sin contraseña', async () => {
    findUserByEmail.mockResolvedValue(null) // correo libre
    createUser.mockResolvedValue({
      id: 'abc-123',
      name: 'Ana García',
      email: 'ana@test.com',
      password: 'hashed',
      initials: 'AG',
      career: 'Sistemas',
      semester: '3',
      university: 'UNAL',
    })

    const res = await request(app).post('/api/auth/register').send({
      name: 'Ana García',
      email: 'ana@test.com',
      password: 'segura123',
      career: 'Sistemas',
      semester: '3',
      university: 'UNAL',
    })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('ana@test.com')
    expect(res.body.user.password).toBeUndefined() // nunca exponer la contraseña
  })

  it('devuelve 400 si faltan campos obligatorios', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'ana@test.com',
      // sin name ni password
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/obligatorios/i)
  })

  it('devuelve 409 si el correo ya está registrado', async () => {
    findUserByEmail.mockResolvedValue({ id: 'ya-existe', email: 'ana@test.com' })

    const res = await request(app).post('/api/auth/register').send({
      name: 'Ana García',
      email: 'ana@test.com',
      password: 'segura123',
    })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/registrado/i)
  })

  it('genera iniciales correctamente a partir del nombre', async () => {
    findUserByEmail.mockResolvedValue(null)
    createUser.mockImplementation((datos) => Promise.resolve({
      id: 'xyz',
      ...datos,
    }))

    await request(app).post('/api/auth/register').send({
      name: 'Carlos Perez',
      email: 'carlos@test.com',
      password: '123456',
    })

    // Verifica que createUser fue llamado con las iniciales 'CP'
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ initials: 'CP' })
    )
  })

  it('hashea la contraseña antes de guardar', async () => {
    findUserByEmail.mockResolvedValue(null)
    createUser.mockImplementation((datos) => Promise.resolve({ id: '1', ...datos }))

    await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@test.com',
      password: 'miClave',
    })

    const llamada = createUser.mock.calls[0][0]
    // La contraseña guardada NO debe ser el texto plano
    expect(llamada.password).not.toBe('miClave')
    // Debe ser un hash bcrypt válido
    const esHash = await bcrypt.compare('miClave', llamada.password)
    expect(esHash).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('autentica correctamente con credenciales válidas', async () => {
    const hash = await bcrypt.hash('clave123', 10)
    findUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'ana@test.com',
      password: hash,
      name: 'Ana',
    })

    const res = await request(app).post('/api/auth/login').send({
      email: 'ana@test.com',
      password: 'clave123',
    })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.password).toBeUndefined()
  })

  it('devuelve 401 con contraseña incorrecta', async () => {
    const hash = await bcrypt.hash('correcta', 10)
    findUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'ana@test.com',
      password: hash,
    })

    const res = await request(app).post('/api/auth/login').send({
      email: 'ana@test.com',
      password: 'incorrecta',
    })

    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/credenciales/i)
  })

  it('devuelve 401 si el usuario no existe', async () => {
    findUserByEmail.mockResolvedValue(null)

    const res = await request(app).post('/api/auth/login').send({
      email: 'noexiste@test.com',
      password: 'cualquiera',
    })

    expect(res.status).toBe(401)
  })

  it('devuelve 400 si faltan email o contraseña', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'ana@test.com' })
    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  beforeEach(() => vi.clearAllMocks())

  it('devuelve el perfil con token válido', async () => {
    const token = jwt.sign({ userId: 'user-1' }, JWT_SECRET)
    findUserById.mockResolvedValue({
      id: 'user-1',
      name: 'Ana García',
      email: 'ana@test.com',
      password: 'hashed',
    })

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Ana García')
    expect(res.body.password).toBeUndefined()
  })

  it('devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('devuelve 401 con token inválido', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token.falso.aqui')
    expect(res.status).toBe(401)
  })
})
