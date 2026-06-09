// ─────────────────────────────────────────────────────────────────
// Rutas de Evaluaciones — CRUD (delega a tasks unificado)
//
// Por compatibilidad, este router sigue funcionando, pero los datos
// se guardan en la tabla `tasks` (unificada). El campo `date` de la
// evaluación se mapea a `dueDate` en tareas, y `estimatedStudyHours`
// a `estimatedHours`.
// ─────────────────────────────────────────────────────────────────
import { Router } from 'express'
import { getUserTasks, createTask, updateTask, deleteTask } from '../models/database.js'

// Mapea campos de evaluación → tarea unificada
export function evalToTask(datos) {
  return {
    subjectId: datos.subjectId,
    title: datos.title,
    description: datos.description,
    type: datos.type || 'exam',
    priority: datos.priority || 'high',
    dueDate: datos.date || datos.dueDate,
    estimatedHours: datos.estimatedStudyHours || datos.estimatedHours || 5,
    completed: datos.status === 'passed' || datos.status === 'failed' || datos.status === 'done',
    status: datos.status || 'pending',
    weight: datos.weight || 20,
    score: datos.score != null ? datos.score : null,
    maxScore: datos.maxScore || 5,
    difficulty: datos.difficulty || 'medium',
    location: datos.location || '',
    topics: datos.topics || [],
    studyMaterials: datos.studyMaterials || [],
    feedback: datos.feedback || '',
    notes: datos.notes || '',
  }
}

const router = Router()

router.get('/', async (req, res) => {
  try {
    const tasks = await getUserTasks(req.userId)
    res.json(tasks
      .filter(t => ['exam','quiz','final','midterm','oral','workshop','homework'].includes(t.type))
      .map(taskToEval)
    )
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

function taskToEval(t) {
  return { ...t, date: t.dueDate, estimatedStudyHours: t.estimatedHours }
}

router.post('/', async (req, res) => {
  try {
    const tarea = await createTask(req.userId, evalToTask(req.body))
    res.status(201).json(taskToEval(tarea))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const tarea = await updateTask(req.params.id, req.userId, evalToTask(req.body))
    if (!tarea) return res.status(404).json({ error: 'Evaluación no encontrada' })
    res.json(taskToEval(tarea))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await deleteTask(req.params.id, req.userId)
    res.json({ mensaje: 'Evaluación eliminada correctamente' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
