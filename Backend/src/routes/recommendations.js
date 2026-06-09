import { Router } from 'express'
import { database } from '../models/database.js'
import { generarRecomendaciones } from '../services/recomendaciones.js'

const router = Router()

// GET /recommendations — recomendaciones basadas en datos reales
router.get('/', async (req, res) => {
  try {
    const now = new Date()
    const [tasksRow, subjectsRow, evalRow, wellbeingRow] = await Promise.all([
      database.query('SELECT * FROM tasks WHERE user_id=$1', [req.userId]),
      database.query('SELECT * FROM subjects WHERE user_id=$1', [req.userId]),
      database.query(
        `SELECT t.*, s.name AS subject_name FROM tasks t
         LEFT JOIN subjects s ON t.subject_id = s.id
         WHERE t.user_id=$1 AND t.type IN ('exam','quiz','final','midterm','oral')
           AND t.due_date >= $2
         ORDER BY t.due_date`,
        [req.userId, now.toISOString()]
      ),
      database.query(
        `SELECT mood, sleep_hours FROM wellbeing
         WHERE user_id=$1 AND skipped=FALSE AND date >= $2
         ORDER BY date DESC LIMIT 7`,
        [req.userId, new Date(now - 7 * 86400000).toISOString()]
      ),
    ])

    const tasks = tasksRow.rows
    const subjects = subjectsRow.rows
    const upcomingEvals = evalRow.rows
    const wellbeing = wellbeingRow.rows

    const recs = generarRecomendaciones(tasks, subjects, upcomingEvals, wellbeing)
    res.json(recs)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
