import { Router } from 'express'
import { database } from '../models/database.js'
import { calcularHoras, generarPlan } from '../services/planificador.js'

const router = Router()

// GET /plans — lista de planes de estudio del usuario
router.get('/', async (req, res) => {
  try {
    const { rows } = await database.query(
      'SELECT * FROM study_plans WHERE user_id=$1 ORDER BY week_start DESC',
      [req.userId]
    )
    res.json(rows.map(r => ({
      id: r.id, weekStart: r.week_start, weekEnd: r.week_end,
      planData: r.plan_data, status: r.status,
      createdAt: r.created_at, updatedAt: r.updated_at,
    })))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /plans/generate — generar plan de estudio para una semana
router.post('/generate', async (req, res) => {
  try {
    const weekStart = req.body.weekStart || new Date().toISOString().split('T')[0]
    const weekEndDate = new Date(weekStart)
    weekEndDate.setDate(weekEndDate.getDate() + 7)
    const weekEnd = weekEndDate.toISOString().split('T')[0]

    // Obtener evaluaciones próximas y tareas pendientes
    const [evalRows, taskRows, settingsRows] = await Promise.all([
      database.query(
        `SELECT t.*, s.name AS subject_name, s.color AS subject_color FROM tasks t
         LEFT JOIN subjects s ON t.subject_id = s.id
         WHERE t.user_id=$1 AND t.type IN ('exam','quiz','final','midterm','oral')
           AND t.due_date >= $2 AND t.due_date < $3
         ORDER BY t.due_date`,
        [req.userId, weekStart, weekEnd]
      ),
      database.query(
        `SELECT t.*, s.name AS subject_name, s.color AS subject_color FROM tasks t
         LEFT JOIN subjects s ON t.subject_id = s.id
         WHERE t.user_id=$1 AND (t.completed = FALSE OR t.completed IS NULL)
           AND t.due_date >= $2
         ORDER BY t.due_date`,
        [req.userId, weekStart]
      ),
      database.query(
        'SELECT * FROM user_settings WHERE user_id=$1', [req.userId]
      ),
    ])

    const settings = settingsRows.rows[0]

    const allEvals = evalRows.rows.map(r => ({
      id: r.id, title: r.title, type: r.type,
      subjectName: r.subject_name, subjectColor: r.subject_color,
      dueDate: r.due_date, weight: r.weight, estimatedHours: r.estimated_hours,
      difficulty: r.difficulty,
    }))

    const allTasks = taskRows.rows.filter(r => r.subject_id).map(r => ({
      id: r.id, title: r.title, type: r.type,
      subjectName: r.subject_name, subjectColor: r.subject_color,
      dueDate: r.due_date, estimatedHours: r.estimated_hours,
      difficulty: r.difficulty,
    }))

    const planData = generarPlan(weekStart, allEvals, allTasks, settings)

    // Guardar en BD
    const { rows } = await database.query(
      `INSERT INTO study_plans (user_id, week_start, week_end, plan_data, status)
       VALUES ($1, $2, $3, $4, 'generated') RETURNING *`,
      [req.userId, weekStart, weekEnd, JSON.stringify(planData)]
    )

    res.json({
      id: rows[0].id, weekStart: rows[0].week_start, weekEnd: rows[0].week_end,
      planData, status: 'generated',
      createdAt: rows[0].created_at, updatedAt: rows[0].updated_at,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
