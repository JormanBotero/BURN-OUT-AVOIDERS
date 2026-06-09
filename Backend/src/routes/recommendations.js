import { Router } from 'express'
import { database } from '../models/database.js'

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

    const recs = []

    // Tareas vencidas
    const vencidas = tasks.filter(t => !t.completed && new Date(t.due_date) < now)
    if (vencidas.length > 0) {
      const sub = subjects.find(s => s.id === vencidas[0].subject_id)
      recs.push({
        tipo: 'critico', icon: 'alert-triangle',
        titulo: `${vencidas.length} tarea${vencidas.length > 1 ? 's' : ''} vencida${vencidas.length > 1 ? 's' : ''}`,
        mensaje: `Tienes actividades atrasadas${sub ? ` en ${sub.name}` : ''}. Prioriza resolverlas.`,
        accion: '/app/tasks', accionLabel: 'Ver tareas',
      })
    }

    // Evaluación próxima
    if (upcomingEvals.length > 0) {
      const ev = upcomingEvals[0]
      const diffDays = Math.ceil((new Date(ev.due_date) - now) / 86400000)
      recs.push({
        tipo: diffDays <= 2 ? 'urgente' : 'info',
        icon: 'target',
        titulo: `${ev.title}${ev.subject_name ? ` — ${ev.subject_name}` : ''}`,
        mensaje: `${diffDays <= 0 ? '¡Hoy!' : diffDays === 1 ? 'Mañana' : `En ${diffDays} días`}. Pesa ${ev.weight}% de la nota final.`,
        accion: `/app/subjects/${ev.subject_id}`, accionLabel: 'Ver materia',
      })
    }

    // Semana crítica
    const pending = tasks.filter(t => !t.completed)
    const semanas = {}
    pending.forEach(t => {
      const d = Math.ceil((new Date(t.due_date) - now) / 86400000)
      if (d >= 0 && d <= 14) {
        const sem = Math.floor(d / 7)
        semanas[sem] = (semanas[sem] || 0) + 1
      }
    })
    const semPeak = Object.entries(semanas).sort((a, b) => b[1] - a[1])[0]
    if (semPeak && semPeak[1] >= 3) {
      recs.push({
        tipo: 'info', icon: 'flame',
        titulo: 'Semana crítica detectada',
        mensaje: `${semPeak[1]} actividades concentradas ${semPeak[0] === '0' ? 'esta semana' : 'la próxima semana'}. Distribuye tu tiempo.`,
        accion: '/app/schedule', accionLabel: 'Ver horario',
      })
    }

    // Bienestar
    if (wellbeing.length > 0) {
      const moods = wellbeing.filter(w => w.mood === 'sad' || w.mood === 'very_bad')
      if (moods.length >= 3) {
        recs.push({
          tipo: 'atencion', icon: 'heart',
          titulo: 'Ánimo bajo recurrente',
          mensaje: 'Has reportado estado de ánimo bajo varios días seguidos. Considera tomar un descanso.',
          accion: '/app/wellbeing', accionLabel: 'Ver bienestar',
        })
      }
    }

    // Buen ritmo
    const done = tasks.filter(t => t.completed)
    const rate = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0
    if (rate >= 70 && recs.length < 3) {
      recs.push({
        tipo: 'exito', icon: 'star',
        titulo: `¡Buen ritmo! ${rate}% completado`,
        mensaje: `${done.length} tareas terminadas. Sigue así.`,
        accion: '/app/analytics', accionLabel: 'Ver análisis',
      })
    }

    // Si no hay nada, mensaje positivo
    if (recs.length === 0) {
      recs.push({
        tipo: 'exito', icon: 'sparkles',
        titulo: '¡Todo en orden!',
        mensaje: 'No hay alertas. Adelanta material de estudio.',
        accion: '/app/analytics', accionLabel: 'Ver estadísticas',
      })
    }

    res.json(recs.slice(0, 4))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
