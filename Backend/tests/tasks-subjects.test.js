// ─────────────────────────────────────────────────────────────────
// Tests de Tareas — GET / POST / PUT / DELETE /api/tasks
// ─────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'studymind-dev-secret-change-in-production'

// ── Helper: genera un token válido para los tests ─────────────────
const tokenPara = (userId = 'user-test-1') =>
  `Bearer ${jwt.sign({ userId }, JWT_SECRET)}`

// ── Mocks ─────────────────────────────────────────────────────────
vi.mock('../src/models/database.js', () => ({
  getUserTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  getUserSubjects: vi.fn(),
  createSubject: vi.fn(),
  updateSubject: vi.fn(),
  deleteSubject: vi.fn(),
}))

import {
  getUserTasks, createTask, updateTask, deleteTask,
  getUserSubjects, createSubject, updateSubject, deleteSubject,
} from '../src/models/database.js'

import { authenticateToken } from '../src/middleware/auth.js'
import tasksRoutes from '../src/routes/tasks.js'
import subjectsRoutes from '../src/routes/subjects.js'

// ── App de prueba ─────────────────────────────────────────────────
const app = express()
app.use(express.json())
app.use('/api/tasks', authenticateToken, tasksRoutes)
app.use('/api/subjects', authenticateToken, subjectsRoutes)

// ═════════════════════════════════════════════════════════════════
// TAREAS
// ═════════════════════════════════════════════════════════════════
describe('GET /api/tasks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('devuelve la lista de tareas del usuario autenticado', async () => {
    getUserTasks.mockResolvedValue([
      { id: 't1', title: 'Entregar parcial', userId: 'user-test-1' },
      { id: 't2', title: 'Leer capítulo 3', userId: 'user-test-1' },
    ])

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', tokenPara())

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(getUserTasks).toHaveBeenCalledWith('user-test-1')
  })

  it('devuelve lista vacía si no hay tareas', async () => {
    getUserTasks.mockResolvedValue([])
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', tokenPara())

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/tasks')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/tasks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('crea una tarea y devuelve 201 con los datos creados', async () => {
    const nueva = {
      title: 'Estudiar para el examen',
      dueDate: '2025-12-01',
      priority: 'high',
    }
    createTask.mockResolvedValue({ id: 'nueva-1', userId: 'user-test-1', ...nueva })

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', tokenPara())
      .send(nueva)

    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Estudiar para el examen')
    expect(createTask).toHaveBeenCalledWith('user-test-1', nueva)
  })

  it('devuelve 403 con token inválido', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', 'Bearer token.invalido')
      .send({ title: 'Test' })

    expect(res.status).toBe(403)
  })
})

describe('PUT /api/tasks/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('actualiza la tarea y devuelve los datos actualizados', async () => {
    updateTask.mockResolvedValue({ id: 't1', title: 'Actualizada', completed: true })

    const res = await request(app)
      .put('/api/tasks/t1')
      .set('Authorization', tokenPara())
      .send({ title: 'Actualizada', completed: true })

    expect(res.status).toBe(200)
    expect(res.body.completed).toBe(true)
  })

  it('devuelve 404 si la tarea no existe o no pertenece al usuario', async () => {
    updateTask.mockResolvedValue(null)

    const res = await request(app)
      .put('/api/tasks/no-existe')
      .set('Authorization', tokenPara())
      .send({ title: 'X' })

    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/tarea no encontrada/i)
  })
})

describe('DELETE /api/tasks/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('elimina la tarea y confirma con mensaje', async () => {
    deleteTask.mockResolvedValue(true)

    const res = await request(app)
      .delete('/api/tasks/t1')
      .set('Authorization', tokenPara())

    expect(res.status).toBe(200)
    expect(res.body.mensaje).toMatch(/eliminada/i)
    expect(deleteTask).toHaveBeenCalledWith('t1', 'user-test-1')
  })
})

// ═════════════════════════════════════════════════════════════════
// MATERIAS
// ═════════════════════════════════════════════════════════════════
describe('GET /api/subjects', () => {
  beforeEach(() => vi.clearAllMocks())

  it('devuelve las materias del usuario', async () => {
    getUserSubjects.mockResolvedValue([
      { id: 's1', name: 'Cálculo', userId: 'user-test-1' },
    ])

    const res = await request(app)
      .get('/api/subjects')
      .set('Authorization', tokenPara())

    expect(res.status).toBe(200)
    expect(res.body[0].name).toBe('Cálculo')
  })

  it('devuelve 401 sin autenticación', async () => {
    const res = await request(app).get('/api/subjects')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/subjects', () => {
  beforeEach(() => vi.clearAllMocks())

  it('crea una materia nueva con 201', async () => {
    const nueva = { name: 'Álgebra', code: 'MAT101', credits: 4 }
    createSubject.mockResolvedValue({ id: 's-nueva', userId: 'user-test-1', ...nueva })

    const res = await request(app)
      .post('/api/subjects')
      .set('Authorization', tokenPara())
      .send(nueva)

    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Álgebra')
    expect(createSubject).toHaveBeenCalledWith('user-test-1', nueva)
  })
})

describe('PUT /api/subjects/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('actualiza una materia existente', async () => {
    updateSubject.mockResolvedValue({ id: 's1', name: 'Cálculo II' })

    const res = await request(app)
      .put('/api/subjects/s1')
      .set('Authorization', tokenPara())
      .send({ name: 'Cálculo II' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Cálculo II')
  })

  it('devuelve 404 si la materia no existe', async () => {
    updateSubject.mockResolvedValue(null)

    const res = await request(app)
      .put('/api/subjects/no-existe')
      .set('Authorization', tokenPara())
      .send({ name: 'X' })

    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/subjects/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('elimina una materia y responde con mensaje', async () => {
    deleteSubject.mockResolvedValue(true)

    const res = await request(app)
      .delete('/api/subjects/s1')
      .set('Authorization', tokenPara())

    expect(res.status).toBe(200)
    expect(res.body.mensaje).toMatch(/eliminada/i)
    expect(deleteSubject).toHaveBeenCalledWith('s1', 'user-test-1')
  })
})
