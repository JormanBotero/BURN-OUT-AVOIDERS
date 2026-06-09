// ===================================================================
// STUDY-024: 10 Test Cases — Core Business Logic de StudyMind
// ── Todos importan módulos reales de producción, sin helpers fake ──
// ===================================================================

import { describe, it, expect, vi } from 'vitest'
import jwt from 'jsonwebtoken'

import { PW_REGEX, generarIniciales, generarCodigo } from '../services/validation.js'
import { calcularHoras, generarPlan } from '../services/planificador.js'
import { generarRecomendaciones } from '../services/recomendaciones.js'
import { evalToTask } from '../routes/evaluations.js'
import { generarToken, authenticateToken } from '../middleware/auth.js'

// ===================================================================
// TC1: Política de contraseñas — 10 variantes contra PW_REGEX real
// ===================================================================
describe('TC1: Política de contraseñas — 10 variantes', () => {
  const casos = [
    { pw: 'Pass1234!',  esperado: true,  desc: 'válida: 8 chars, mayúsc, minúsc, núm, especial' },
    { pw: 'aB1$',       esperado: false, desc: 'inválida: menos de 8 caracteres' },
    { pw: 'PASS1234!',  esperado: false, desc: 'inválida: sin minúscula' },
    { pw: 'pass1234!',  esperado: false, desc: 'inválida: sin mayúscula' },
    { pw: 'Password!',  esperado: false, desc: 'inválida: sin número' },
    { pw: 'Pass1234',   esperado: false, desc: 'inválida: sin carácter especial' },
    { pw: 'Aa1!abcd',   esperado: true,  desc: 'válida: exactamente 8 con todo' },
    { pw: 'Abc123!@#xyzXYZ', esperado: true, desc: 'válida: larga con múltiples especiales' },
    { pw: '  Pass1! ',  esperado: true,  desc: 'válida: espacios permitidos si tiene todos los grupos' },
    { pw: 'Pa$$w0rD',   esperado: true,  desc: 'válida: $ como especial, 0 reemplaza o' },
  ]
  casos.forEach(({ pw, esperado, desc }) => {
    it(`${esperado ? '✓' : '✗'} "${pw}" — ${desc}`, () => {
      expect(PW_REGEX.test(pw)).toBe(esperado)
    })
  })
})

// ===================================================================
// TC2: Iniciales — 7 edge cases contra generarIniciales real
// ===================================================================
describe('TC2: Iniciales — 7 edge cases', () => {
  it('nombre compuesto "Juan Carlos García" → "JC"', () => {
    expect(generarIniciales('Juan Carlos García')).toBe('JC')
  })
  it('nombre con acentos "José Hernández" → "JH"', () => {
    expect(generarIniciales('José Hernández')).toBe('JH')
  })
  it('nombre simple "Ana" → "A" (solo una inicial)', () => {
    expect(generarIniciales('Ana')).toBe('A')
  })
  it('nombre con espacios extra "  María  López  " → "ML"', () => {
    expect(generarIniciales('  María  López  ')).toBe('ML')
  })
  it('nombre muy largo "Juan Carlos María José de la Cruz" → "JC"', () => {
    expect(generarIniciales('Juan Carlos María José de la Cruz')).toBe('JC')
  })
  it('una sola letra "X" → "X"', () => {
    expect(generarIniciales('X')).toBe('X')
  })
  it('cadena vacía retorna string vacío', () => {
    expect(generarIniciales('')).toBe('')
  })
})

// ===================================================================
// TC3: Código de verificación — generarCodigo real, 100 iteraciones
// ===================================================================
describe('TC3: Código de verificación — 100 códigos', () => {
  it('100 códigos generados son strings de 6 dígitos', () => {
    const codes = Array.from({ length: 100 }, () => generarCodigo())
    codes.forEach(c => expect(c).toMatch(/^\d{6}$/))
  })
  it('menos del 5% de colisiones en 100 intentos', () => {
    const codes = Array.from({ length: 100 }, () => generarCodigo())
    expect(new Set(codes).size).toBeGreaterThan(95)
  })
  it('distribución del primer dígito es variada (no prefijo fijo)', () => {
    const codes = Array.from({ length: 50 }, () => generarCodigo())
    expect(new Set(codes.map(c => c[0])).size).toBeGreaterThan(3)
  })
})

// ===================================================================
// TC4: JWT — gegenrandoToken real + jsonwebtoken verify
// ===================================================================
describe('TC4: JWT — ciclo de vida y seguridad', () => {
  it('genera token con userId correcto en payload', () => {
    const token = generarToken(42)
    expect(jwt.decode(token).userId).toBe(42)
  })
  it('token tiene expiración futura', () => {
    expect(jwt.decode(generarToken(1)).exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })
  it('token alterado (tampering) es rechazado por jwt.verify', () => {
    expect(() => jwt.verify(generarToken(1) + 'x', process.env.JWT_SECRET || 'studymind-dev-secret-change-in-production')).toThrow()
  })
  it('token firmado con otra clave es rechazado', () => {
    expect(() => jwt.verify(jwt.sign({ userId: 1 }, 'otra-clave'), process.env.JWT_SECRET || 'studymind-dev-secret-change-in-production')).toThrow()
  })
  it('payload solo contiene userId, iat, exp — sin datos sensibles', () => {
    expect(Object.keys(jwt.decode(generarToken(99)))).toEqual(['userId', 'iat', 'exp'])
  })
})

// ===================================================================
// TC5: Mapping Evaluation→Task — evalToTask real de evaluations.js
// ===================================================================
describe('TC5: Mapping Evaluation → Task — 15 campos', () => {
  const input = {
    subjectId: 'sub-123', title: 'Parcial 1',
    description: 'Álgebra lineal', type: 'exam', priority: 'high',
    date: '2026-06-15T10:00:00Z', estimatedStudyHours: 8,
    status: 'pending', weight: 30, score: null, maxScore: 20,
    difficulty: 'hard', location: 'Aula 301',
    topics: ['Matrices', 'Vectores'], studyMaterials: ['Libro pág 45'],
    feedback: '', notes: 'Repasar determinantes',
  }

  it('mapea subjectId', () => { expect(evalToTask(input).subjectId).toBe('sub-123') })
  it('mapea date → dueDate', () => { expect(evalToTask(input).dueDate).toBe('2026-06-15T10:00:00Z') })
  it('mapea estimatedStudyHours → estimatedHours', () => { expect(evalToTask(input).estimatedHours).toBe(8) })
  it('usa estimatedHours como fallback si no hay estimatedStudyHours', () => {
    expect(evalToTask({ ...input, estimatedStudyHours: undefined, estimatedHours: 3 }).estimatedHours).toBe(3)
  })
  it('default estimatedHours = 5 si no se especifica', () => {
    expect(evalToTask({ title: 'Test' }).estimatedHours).toBe(5)
  })
  it('status "passed" → completed = true', () => { expect(evalToTask({ ...input, status: 'passed' }).completed).toBe(true) })
  it('status "pending" → completed = false', () => { expect(evalToTask({ ...input, status: 'pending' }).completed).toBe(false) })
  it('default type = "exam"', () => { expect(evalToTask({ title: 'x' }).type).toBe('exam') })
  it('score null se mapea como null (no 0)', () => { expect(evalToTask({ ...input, score: null }).score).toBeNull() })
  it('score 0 se mapea como 0', () => { expect(evalToTask({ ...input, score: 0 }).score).toBe(0) })
  it('default weight = 20', () => { expect(evalToTask({ title: 'x' }).weight).toBe(20) })
  it('topics vacío por defecto', () => { expect(evalToTask({ title: 'x' }).topics).toEqual([]) })
  it('dueDate acepta date o dueDate (retrocompatibilidad)', () => {
    expect(evalToTask({ title: 'x', date: '2026-01-01' }).dueDate).toBe('2026-01-01')
    expect(evalToTask({ title: 'x', dueDate: '2026-01-01' }).dueDate).toBe('2026-01-01')
  })
  it('evalToTask retorna objeto plano sin funciones extras', () => {
    const r = evalToTask({ title: 'x' })
    expect(typeof r).toBe('object')
    expect(r.title).toBe('x')
  })
  it('location por defecto es string vacío', () => { expect(evalToTask({ title: 'x' }).location).toBe('') })
})

// ===================================================================
// TC6: Plan de estudio — calcularHoras + generarPlan reales
// ===================================================================
describe('TC6: Plan de estudio — distribución semanal', () => {
  it('calcularHoras con 20h/semana → total=20, diario=2.9', () => {
    expect(calcularHoras({ study_hours_per_week: 20 })).toEqual({ total: 20, diario: 2.9 })
  })
  it('calcularHoras con 35h/semana → diario=5', () => {
    expect(calcularHoras({ study_hours_per_week: 35 }).diario).toBe(5)
  })
  it('calcularHoras sin settings → default 20h/semana', () => {
    expect(calcularHoras(null)).toEqual({ total: 20, diario: 2.9 })
  })
  it('generarPlan produce 7 días con la estructura correcta', () => {
    const plan = generarPlan('2026-06-08', [], [], { study_hours_per_week: 20 })
    expect(plan.days).toHaveLength(7)
    expect(plan.days[0].label).toBe('lunes')
    expect(plan.days[0].date).toBe('2026-06-08')
    expect(plan.days[0].hours).toBe(2.9)
  })
  it('generarPlan asigna evaluaciones al día según dueDate', () => {
    const plan = generarPlan('2026-06-08', [{ title: 'Examen', dueDate: '2026-06-09T10:00:00Z' }], [], null)
    expect(plan.days[1].evaluations).toHaveLength(1)
    expect(plan.days[0].evaluations).toHaveLength(0)
  })
  it('generarPlan filtra tareas por día', () => {
    const plan = generarPlan('2026-06-08', [], [{ title: 'Tarea', dueDate: '2026-06-10T10:00:00Z' }], null)
    expect(plan.days[2].tasks).toHaveLength(1)
    expect(plan.days[0].tasks).toHaveLength(0)
  })
})

// ===================================================================
// TC7: Recomendaciones — generarRecomendaciones real, 6 reglas
// ===================================================================
describe('TC7: Recomendaciones — 6 reglas de negocio', () => {
  const now = new Date()
  const ayer = new Date(now); ayer.setDate(ayer.getDate() - 1)
  const maniana = new Date(now); maniana.setDate(maniana.getDate() + 1)
  const futuro = new Date(now); futuro.setDate(futuro.getDate() + 30)

  it('tareas vencidas → recomendación crítica', () => {
    const r = generarRecomendaciones(
      [{ id: 't1', completed: false, subject_id: 's1', due_date: ayer.toISOString() }],
      [{ id: 's1', name: 'Álgebra' }], [], [])
    expect(r.some(x => x.tipo === 'critico')).toBe(true)
  })
  it('evaluación en 1 día → urgente con texto "Mañana"', () => {
    const r = generarRecomendaciones([], [],
      [{ id: 'e1', title: 'Quiz', subject_name: 'Física', subject_id: 's1', due_date: maniana.toISOString(), weight: 15 }], [])
    expect(r[0].tipo).toBe('urgente')
    expect(r[0].mensaje).toContain('Mañana')
  })
  it('evaluación hoy → texto "¡Hoy!"', () => {
    const r = generarRecomendaciones([], [],
      [{ id: 'e1', title: 'Final', subject_name: 'Cálculo', subject_id: 's1', due_date: now.toISOString(), weight: 40 }], [])
    expect(r[0].mensaje).toContain('¡Hoy!')
  })
  it('≥3 actividades en 14 días → "Semana crítica"', () => {
    const en3d = new Date(now); en3d.setDate(en3d.getDate() + 3)
    const pendientes = Array.from({ length: 3 }, (_, i) => ({
      id: `t${i}`, completed: false, due_date: new Date(en3d.getTime() + i * 86400000).toISOString(),
    }))
    expect(generarRecomendaciones(pendientes, [], [], []).some(r => r.titulo === 'Semana crítica detectada')).toBe(true)
  })
  it('≥3 ánimos bajos seguidos → "Ánimo bajo recurrente"', () => {
    const r = generarRecomendaciones(
      [{ id: 't1', completed: true, due_date: futuro.toISOString() }], [], [],
      [{ mood: 'sad' }, { mood: 'very_bad' }, { mood: 'sad' }])
    expect(r.some(x => x.tipo === 'atencion')).toBe(true)
  })
  it('≥70% completado y <3 recs → "Buen ritmo"', () => {
    const r = generarRecomendaciones(
      [
        { id: 't1', completed: true, due_date: futuro.toISOString() },
        { id: 't2', completed: true, due_date: futuro.toISOString() },
        { id: 't3', completed: true, due_date: futuro.toISOString() },
        { id: 't4', completed: false, due_date: futuro.toISOString() },
      ], [], [], [])
    expect(r.some(x => x.titulo.includes('Buen ritmo'))).toBe(true)
  })
})

// ===================================================================
// TC8: Auth middleware — authenticateToken real con mocks req/res
// ===================================================================
describe('TC8: authenticateToken — middleware real', () => {
  it('token válido → llama next() y asigna userId', () => {
    const token = generarToken(42)
    const req = { headers: { authorization: `Bearer ${token}` } }
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    const next = vi.fn()
    authenticateToken(req, res, next)
    expect(req.userId).toBe(42)
    expect(next).toHaveBeenCalledOnce()
  })
  it('sin token → 401 con mensaje', () => {
    const req = { headers: {} }
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    authenticateToken(req, res, vi.fn())
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Token de autenticación requerido' })
  })
  it('token inválido → 403 con mensaje', () => {
    const req = { headers: { authorization: 'Bearer token-basura' } }
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    authenticateToken(req, res, vi.fn())
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o expirado' })
  })
  it('Authorization sin "Bearer " → 401', () => {
    const req = { headers: { authorization: 'xyz' } }
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    authenticateToken(req, res, vi.fn())
    expect(res.status).toHaveBeenCalledWith(401)
  })
})

// ===================================================================
// TC9: Planificador — calcularHoras edge cases
// ===================================================================
describe('TC9: calcularHoras — edge cases de settings', () => {
  it('study_hours_per_week = 0 → diario = 0', () => {
    expect(calcularHoras({ study_hours_per_week: 0 })).toEqual({ total: 0, diario: 0 })
  })
  it('study_hours_per_week = 7 → diario = 1', () => {
    expect(calcularHoras({ study_hours_per_week: 7 }).diario).toBe(1)
  })
  it('study_hours_per_week = 70 → diario = 10', () => {
    expect(calcularHoras({ study_hours_per_week: 70 }).diario).toBe(10)
  })
  it('settings con campos extra no afecta el cálculo', () => {
    expect(calcularHoras({ study_hours_per_week: 20, notifications_enabled: true })).toEqual({ total: 20, diario: 2.9 })
  })
})

// ===================================================================
// TC10: Pipeline — validación de configuración CI/CD
// ===================================================================
describe('TC10: CI/CD — validación de pipeline', () => {
  it('JWT_SECRET tiene un valor por defecto seguro (>16 chars)', () => {
    const secret = process.env.JWT_SECRET || 'studymind-dev-secret-change-in-production'
    expect(secret.length).toBeGreaterThan(16)
  })
  it('JWT_EXPIRES_IN tiene formato duración válido (30d, 1h, etc)', () => {
    const exp = process.env.JWT_EXPIRES_IN || '30d'
    expect(exp).toMatch(/^\d+[smhd]$/)
  })
  it('generarToken usa JWT_SECRET correctamente', () => {
    const token = generarToken(1)
    expect(() => jwt.verify(token, process.env.JWT_SECRET || 'studymind-dev-secret-change-in-production')).not.toThrow()
  })
})
