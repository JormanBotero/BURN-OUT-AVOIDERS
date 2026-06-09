const MOOD_OPTIONS = [
  { emoji: '😄', label: 'Excelente', value: 'excellent', color: '#0ea47a' },
  { emoji: '😊', label: 'Bien', value: 'good', color: '#3b82f6' },
  { emoji: '😐', label: 'Neutral', value: 'neutral', color: '#d97706' },
  { emoji: '😔', label: 'Triste', value: 'sad', color: '#ec4899' },
  { emoji: '😫', label: 'Muy mal', value: 'very_bad', color: '#ef4444' },
]

function calculateMoodStats(records) {
  const counts = {}
  records.forEach(r => {
    if (r.mood) counts[r.mood] = (counts[r.mood] || 0) + 1
  })
  return counts
}

function calculateSleepStats(records) {
  const valid = records.filter(r => r.sleepHours != null && !r.skipped)
  if (valid.length === 0) return { avg: 0, min: 0, max: 0 }
  const hours = valid.map(r => r.sleepHours)
  return {
    avg: (hours.reduce((a, b) => a + b, 0) / hours.length).toFixed(1),
    min: Math.min(...hours),
    max: Math.max(...hours),
  }
}

function getWeeklyTrend(records) {
  const now = new Date()
  const week = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const day = records.find(r => {
      const rd = new Date(r.date)
      const rs = `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}-${String(rd.getDate()).padStart(2, '0')}`
      return rs === dayStr
    }) || { date: d.toISOString(), mood: null, sleepHours: null, skipped: true }
    week.push({
      date: d,
      label: i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : d.toLocaleDateString('es', { weekday: 'short' }),
      ...day,
    })
  }
  return week
}

function getMoodFrequency(records) {
  const counts = calculateMoodStats(records)
  return MOOD_OPTIONS.map(m => ({
    name: m.label,
    value: counts[m.value] || 0,
    color: m.color,
    emoji: m.emoji,
  }))
}

export const wellbeingService = {
  calculateMoodStats,
  calculateSleepStats,
  getWeeklyTrend,
  getMoodFrequency,
}
