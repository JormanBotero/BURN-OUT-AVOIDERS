import { wellbeingService } from '../services/wellbeingService.js'
import { api } from '../utils/api.js'

/** Solo usa la API. Sin localStorage — así los datos no se mezclan entre cuentas. */
async function checkToday() {
  try {
    const server = await api.getTodayWellbeing()
    return server || null
  } catch {
    return null
  }
}

async function saveEntry({ mood, note, sleepHours }) {
  const entry = { mood, note, sleepHours: sleepHours ? Number(sleepHours) : null, skipped: false, date: new Date().toISOString() }
  await api.saveWellbeing(entry)
  return entry
}

async function skipToday() {
  const entry = { skipped: true, date: new Date().toISOString() }
  await api.saveWellbeing(entry)
  return entry
}

async function getHistory() {
  try {
    return await api.getWellbeingHistory() || []
  } catch {
    return []
  }
}

async function getWeeklyTrend() {
  const h = await getHistory()
  return wellbeingService.getWeeklyTrend(h)
}

async function getMoodFrequency() {
  const h = await getHistory()
  return wellbeingService.getMoodFrequency(h)
}

async function getSleepStats() {
  const h = await getHistory()
  return wellbeingService.calculateSleepStats(h)
}

export const wellbeingController = {
  checkToday,
  saveEntry,
  skipToday,
  getHistory,
  getWeeklyTrend,
  getMoodFrequency,
  getSleepStats,
}
