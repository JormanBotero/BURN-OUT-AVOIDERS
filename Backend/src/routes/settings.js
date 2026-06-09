import { Router } from 'express'
import { database } from '../models/database.js'

const router = Router()

function pgSettingsAJs(r) {
  return {
    studyHoursPerWeek: Number(r.study_hours_per_week),
    preferredStudyTime: r.preferred_study_time,
    semesterStart: r.semester_start,
    semesterEnd: r.semester_end,
    notificationsEnabled: r.notifications_enabled,
    notificationEmail: r.notification_email,
  }
}

// GET /settings — obtener configuración del usuario
router.get('/', async (req, res) => {
  try {
    const { rows } = await database.query(
      'SELECT * FROM user_settings WHERE user_id=$1', [req.userId]
    )
    if (!rows.length) {
      // Devolver defaults
      return res.json({
        studyHoursPerWeek: 20, preferredStudyTime: null,
        semesterStart: null, semesterEnd: null,
        notificationsEnabled: true, notificationEmail: null,
      })
    }
    res.json(pgSettingsAJs(rows[0]))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT /settings — actualizar configuración
router.put('/', async (req, res) => {
  try {
    const { rows } = await database.query(
      `INSERT INTO user_settings (user_id, study_hours_per_week, preferred_study_time, semester_start, semester_end, notifications_enabled, notification_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         study_hours_per_week = EXCLUDED.study_hours_per_week,
         preferred_study_time = EXCLUDED.preferred_study_time,
         semester_start = EXCLUDED.semester_start,
         semester_end = EXCLUDED.semester_end,
         notifications_enabled = EXCLUDED.notifications_enabled,
         notification_email = EXCLUDED.notification_email,
         updated_at = NOW()
       RETURNING *`,
      [req.userId,
       req.body.studyHoursPerWeek || 20,
       req.body.preferredStudyTime || null,
       req.body.semesterStart || null,
       req.body.semesterEnd || null,
       req.body.notificationsEnabled != null ? req.body.notificationsEnabled : true,
       req.body.notificationEmail || null]
    )
    res.json(pgSettingsAJs(rows[0]))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
