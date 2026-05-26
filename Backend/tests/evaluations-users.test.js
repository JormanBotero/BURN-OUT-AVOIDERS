// ─────────────────────────────────────────────────────────────────
// Tests de Evaluaciones — CRUD /api/evaluations
// Tests de Perfil    — GET / PATCH /api/users/me
// Tests de Estadísticas — getUserStats (lógica pura)
// ─────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'studymind-dev-secret-change-in-production'
const tokenPara = (userId = 'user-test-1') =>
  `Bearer ${jwt.sign({ userId }, JWT_SECRET)}`

// ── Mocks — se mockean las funciones async de BD
// getUserStats es lógica pura, se importa real con importOriginal
// ─────────────────────────────────────────────────────────────────
vi.mock('../src/models/database.js', async (importOriginal) => {
  const real = await importOriginal()
  return {
    getUserEvaluations: vi.fn(),
    createEvaluation: vi.fn(),
    updateEvaluation: vi.fn(),
    deleteEvaluation: vi.fn(),
    findUserById: vi.fn(),
    updateUser: vi.fn(),
    // getUserStats es función pura (sin BD), usamos la real
    getUserStats: real.getUserStats,
  }
})

import {
  getUserEvaluations, createEvaluation, updateEvaluation, deleteEvaluation,
  findUserById, updateUser, getUserStats,
} from '../src/models/database.js'

import { authenticateToken } from '../src/middleware/auth.js'
import evaluationsRoutes from '../src/routes/evaluations.js'
import usersRoutes from '../src/routes/users.js'

// ── App de prueba ─────────────────────────────────────────────────
const app = express()
app.use(express.json())
app.use('/api/evaluations', authenticateToken, evaluationsRoutes)
app.use('/api/users', authenticateToken, usersRoutes)

// ═════════════════════════════════════════════════════════════════
// EVALUACIONES
// ═════════════════════════════════════════════════════════════════
describe('GET /api/evaluations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('devuelve evaluaciones del usuario autenticado', async () => {
    getUserEvaluations.mockResolvedValue([
      { id: 'e1', title: 'Parcial 1', type: 'exam', userId: 'user-test-1' },
    ])

    const res = await request(app)
      .get('/api/evaluations')
      .set('Authorization', tokenPara())

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].title).toBe('Parcial 1')
    expect(getUserEvaluations).toHaveBeenCalledWith('user-test-1')
  })

  it('devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/evaluations')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/evaluations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('crea una evaluación con todos los campos extendidos', async () => {
    const datos = {
      title: 'Final Cálculo',
      type: 'final',
      date: '2025-12-15',
      weight: 40,
      estimatedStudyHours: 10,
      difficulty: 'hard',
      topics: ['integrales', 'derivadas'],
      status: 'pending',
    }
    createEvaluation.mockResolvedValue({ id: 'e-nueva', userId: 'user-test-1', ...datos })

    const res = await request(app)
      .post('/api/evaluations')
      .set('Authorization', tokenPara())
      .send(datos)

    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Final Cálculo')
    expect(res.body.difficulty).toBe('hard')
    expect(createEvaluation).toHaveBeenCalledWith('user-test-1', datos)
  })
})

describe('PUT /api/evaluations/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('actualiza el resultado y feedback de una evaluación', async () => {
    updateEvaluation.mockResolvedValue({
      id: 'e1',
      title: 'Parcial 1',
      score: 85,
      status: 'passed',
      feedback: 'Buen trabajo',
    })

    const res = await request(app)
      .put('/api/evaluations/e1')
      .set('Authorization', tokenPara())
      .send({ score: 85, status: 'passed', feedback: 'Buen trabajo' })

    expect(res.status).toBe(200)
    expect(res.body.score).toBe(85)
    expect(res.body.feedback).toBe('Buen trabajo')
  })

  it('devuelve 404 si la evaluación no existe', async () => {
    updateEvaluation.mockResolvedValue(null)

    const res = await request(app)
      .put('/api/evaluations/no-existe')
      .set('Authorization', tokenPara())
      .send({ title: 'X' })

    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/evaluación no encontrada/i)
  })
})

describe('DELETE /api/evaluations/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('elimina la evaluación y responde con mensaje', async () => {
    deleteEvaluation.mockResolvedValue(true)

    const res = await request(app)
      .delete('/api/evaluations/e1')
      .set('Authorization', tokenPara())

    expect(res.status).toBe(200)
    expect(res.body.mensaje).toMatch(/eliminada/i)
    expect(deleteEvaluation).toHaveBeenCalledWith('e1', 'user-test-1')
  })
})

// ═════════════════════════════════════════════════════════════════
// PERFIL DE USUARIO
// ═════════════════════════════════════════════════════════════════
describe('GET /api/users/me', () => {
  beforeEach(() => vi.clearAllMocks())

  it('devuelve perfil sin campo password', async () => {
    findUserById.mockResolvedValue({
      id: 'user-test-1',
      name: 'Ana García',
      email: 'ana@test.com',
      password: 'hash-secreto',
      initials: 'AG',
    })

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', tokenPara())

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Ana García')
    expect(res.body.password).toBeUndefined() // seguridad
  })

  it('devuelve 404 si el usuario no existe en la BD', async () => {
    findUserById.mockResolvedValue(null)

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', tokenPara())

    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/users/me', () => {
  beforeEach(() => vi.clearAllMocks())

  it('actualiza el perfil y recalcula iniciales si cambia el nombre', async () => {
    findUserById.mockResolvedValue({
      id: 'user-test-1',
      name: 'Ana García',
      initials: 'AG',
      career: 'Sistemas',
      semester: '3',
      university: 'UNAL',
      bio: '',
      avatar: null,
    })
    updateUser.mockResolvedValue({
      id: 'user-test-1',
      name: 'Carlos Pérez',
      initials: 'CP',
    })

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', tokenPara())
      .send({ name: 'Carlos Pérez' })

    expect(res.status).toBe(200)
    // Verifica que se calcularon nuevas iniciales
    expect(updateUser).toHaveBeenCalledWith(
      'user-test-1',
      expect.objectContaining({ initials: 'CP' })
    )
  })

  it('no expone la contraseña en la respuesta de actualización', async () => {
    findUserById.mockResolvedValue({
      id: 'user-test-1', name: 'Ana', initials: 'A',
      career: '', semester: '', university: '', bio: '', avatar: null,
    })
    updateUser.mockResolvedValue({
      id: 'user-test-1', name: 'Ana', password: 'hash', initials: 'A',
    })

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', tokenPara())
      .send({ bio: 'Nueva bio' })

    expect(res.body.password).toBeUndefined()
  })
})

describe('PATCH /api/users/me/password', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cambia la contraseña con la contraseña actual correcta', async () => {
    const { default: bcrypt } = await import('bcryptjs')
    const hash = await bcrypt.hash('claveActual', 10)
    findUserById.mockResolvedValue({
      id: 'user-test-1', provider: 'local', password: hash,
    })
    updateUser.mockResolvedValue({ id: 'user-test-1' })

    const res = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', tokenPara())
      .send({ currentPassword: 'claveActual', newPassword: 'nuevaClave123' })

    expect(res.status).toBe(200)
    expect(res.body.mensaje).toMatch(/actualizada/i)
  })

  it('devuelve 401 si la contraseña actual es incorrecta', async () => {
    const { default: bcrypt } = await import('bcryptjs')
    const hash = await bcrypt.hash('correcta', 10)
    findUserById.mockResolvedValue({
      id: 'user-test-1', provider: 'local', password: hash,
    })

    const res = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', tokenPara())
      .send({ currentPassword: 'incorrecta', newPassword: 'nueva123' })

    expect(res.status).toBe(401)
  })

  it('devuelve 400 para cuentas de Google (sin contraseña local)', async () => {
    findUserById.mockResolvedValue({
      id: 'user-test-1', provider: 'google', password: null,
    })

    const res = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', tokenPara())
      .send({ currentPassword: 'x', newPassword: 'nueva123' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/google/i)
  })

  it('devuelve 400 si la nueva contraseña es muy corta', async () => {
    const { default: bcrypt } = await import('bcryptjs')
    const hash = await bcrypt.hash('actual', 10)
    findUserById.mockResolvedValue({
      id: 'user-test-1', provider: 'local', password: hash,
    })

    const res = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', tokenPara())
      .send({ currentPassword: 'actual', newPassword: '123' }) // < 6 chars

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/6 caracteres/i)
  })
})

// ═════════════════════════════════════════════════════════════════
// ESTADÍSTICAS — lógica pura (sin HTTP, sin mock de BD)
// getUserStats se importa real gracias a importOriginal en vi.mock
// ═════════════════════════════════════════════════════════════════
describe('getUserStats (lógica de estadísticas)', () => {
  const userId = 'u1'

  const db = {
    tasks: [
      { id: 't1', userId, status: 'pending', dueDate: '2099-01-01' },
      { id: 't2', userId, status: 'completed', dueDate: '2020-01-01' },
      { id: 't3', userId, status: 'pending', dueDate: '2020-01-01' }, // vencida
    ],
    subjects: [
      { id: 's1', userId, name: 'Cálculo' },
    ],
    evaluations: [
      { id: 'e1', userId, subjectId: 's1', grade: 4.0 },
      { id: 'e2', userId, subjectId: 's1', grade: 3.5 },
    ],
  }

  it('cuenta tareas pendientes, completadas y vencidas correctamente', () => {
    const stats = getUserStats(userId, db)
    expect(stats.pending).toBe(2)    // t1 y t3
    expect(stats.completed).toBe(1)  // t2
    expect(stats.overdue).toBe(1)    // t3 (pendiente y fecha pasada)
  })

  it('calcula promedio de notas correctamente', () => {
    const stats = getUserStats(userId, db)
    expect(Number(stats.avgGrade)).toBeCloseTo(3.75, 1)
  })

  it('devuelve avgGrade null si no hay evaluaciones', () => {
    const stats = getUserStats(userId, { ...db, evaluations: [] })
    expect(stats.avgGrade).toBeNull()
  })

  it('cuenta el total de materias y evaluaciones', () => {
    const stats = getUserStats(userId, db)
    expect(stats.totalSubjects).toBe(1)
    expect(stats.totalEvaluations).toBe(2)
  })

  it('devuelve promedios por materia', () => {
    const stats = getUserStats(userId, db)
    expect(stats.gradesBySubject[0].name).toBe('Cálculo')
    expect(Number(stats.gradesBySubject[0].avg)).toBeCloseTo(3.75, 1)
  })
})