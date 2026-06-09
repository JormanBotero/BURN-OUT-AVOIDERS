import { Router } from 'express'
import { database } from '../models/database.js'

const router = Router()

function pgBienestarAJs(r) {
  return {
    id: r.id, userId: r.user_id, date: r.date,
    mood: r.mood, note: r.note,
    sleepHours: r.sleep_hours,
    skipped: r.skipped,
    updatedAt: r.updated_at, createdAt: r.created_at,
  }
}

// Obtener el registro de bienestar de hoy
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const result = await database.query(
      'SELECT * FROM wellbeing WHERE user_id = $1 AND DATE(date) = $2 ORDER BY date DESC LIMIT 1',
      [req.userId, today]
    )
    res.json(result.rows[0] ? pgBienestarAJs(result.rows[0]) : null)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Guardar registro de bienestar
router.post('/', async (req, res) => {
  try {
    const { mood, note, sleepHours, date, skipped } = req.body
    const today = new Date().toISOString().split('T')[0]

    // Reemplazar si ya existe un registro para hoy
    const existing = await database.query(
      'SELECT id FROM wellbeing WHERE user_id = $1 AND DATE(date) = $2',
      [req.userId, today]
    )

    if (existing.rows.length > 0) {
      const result = await database.query(
        `UPDATE wellbeing SET mood = $1, note = $2, sleep_hours = $3, skipped = $4, date = $5, updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [mood || null, note || '', sleepHours || null, skipped || false, date || new Date().toISOString(), existing.rows[0].id]
      )
      return res.json(pgBienestarAJs(result.rows[0]))
    }

    const result = await database.query(
      `INSERT INTO wellbeing (user_id, mood, note, sleep_hours, skipped, date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, mood || null, note || '', sleepHours || null, skipped || false, date || new Date().toISOString()]
    )
    res.json(pgBienestarAJs(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Obtener historial completo de bienestar
router.get('/history', async (req, res) => {
  try {
    const result = await database.query(
      'SELECT * FROM wellbeing WHERE user_id = $1 ORDER BY date DESC',
      [req.userId]
    )
    res.json(result.rows.map(pgBienestarAJs))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
