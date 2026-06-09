const DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

export function calcularHoras(settings) {
  const total = settings ? Number(settings.study_hours_per_week) : 20
  return { total, diario: Math.round((total / 7) * 10) / 10 }
}

export function generarPlan(weekStart, evaluaciones, tareas, settings) {
  const { total, diario } = calcularHoras(settings)
  const plan = { hoursPerWeek: total, dailyHours: diario, days: [] }
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    plan.days.push({
      date: dateStr, label: DAYS[i], hours: diario,
      evaluations: evaluaciones.filter(e => e.dueDate && e.dueDate.startsWith(dateStr)),
      tasks: tareas.filter(t => t.dueDate && t.dueDate.startsWith(dateStr)),
    })
  }
  return plan
}
