export function generarRecomendaciones(tasks, subjects, upcomingEvals, wellbeing) {
  const now = new Date()
  const recs = []

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

  if (recs.length === 0) {
    recs.push({
      tipo: 'exito', icon: 'sparkles',
      titulo: '¡Todo en orden!',
      mensaje: 'No hay alertas. Adelanta material de estudio.',
      accion: '/app/analytics', accionLabel: 'Ver estadísticas',
    })
  }

  return recs.slice(0, 4)
}
