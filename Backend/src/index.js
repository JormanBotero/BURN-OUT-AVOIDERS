// ─────────────────────────────────────────────────────────────────
// Servidor Principal de StudyMind
// Configura Express, CORS, rutas y arranca la API.
// La base de datos se inicializa antes de abrir el puerto.
// ─────────────────────────────────────────────────────────────────
import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'

// Cargar variables de entorno desde backend/.env
config()

import { initDatabase, isDbReady } from './models/database.js'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import subjectsRoutes from './routes/subjects.js'
import tasksRoutes from './routes/tasks.js'
import evaluationsRoutes from './routes/evaluations.js'
import wellbeingRoutes from './routes/wellbeing.js'

import settingsRoutes from './routes/settings.js'
import plansRoutes from './routes/plans.js'
import recommendationsRoutes from './routes/recommendations.js'
import { authenticateToken } from './middleware/auth.js'

const app = express()
const PUERTO = process.env.PORT

// Permitir peticiones del frontend (configurable por variable de entorno)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (Postman, Render health checks, etc.)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS bloqueado para: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Responder preflight OPTIONS en todas las rutas
app.options('*', cors())

app.use(express.json())

// ── Middleware: rechazar peticiones si la BD no está lista ──────
app.use('/api', (req, res, next) => {
  if (!isDbReady() && req.path !== '/health') {
    return res.status(503).json({ error: 'Base de datos inicializando, reintenta en unos segundos' })
  }
  next()
})

// ── Rutas públicas (sin autenticación) ──────────────────────────
app.use('/api/auth', authRoutes)

// ── Rutas privadas (requieren token JWT válido) ──────────────────
app.use('/api/users',       authenticateToken, usersRoutes)
app.use('/api/subjects',    authenticateToken, subjectsRoutes)
app.use('/api/tasks',       authenticateToken, tasksRoutes)
app.use('/api/evaluations', authenticateToken, evaluationsRoutes)
app.use('/api/wellbeing',   authenticateToken, wellbeingRoutes)

app.use('/api/settings',     authenticateToken, settingsRoutes)
app.use('/api/plans',        authenticateToken, plansRoutes)
app.use('/api/recommendations', authenticateToken, recommendationsRoutes)

// ── Endpoint de salud — útil para monitoreo y despliegue ─────────
app.get('/api/health', (req, res) => {
  res.json({
    estado: isDbReady() ? 'ok' : 'starting',
    timestamp: new Date().toISOString(),
    baseDeDatos: process.env.DATABASE_URL ? 'postgresql' : 'no configurada',
    conexion: isDbReady() ? 'conectada' : 'pendiente',
  })
})

// ── Manejo de rutas no encontradas ───────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))

// ── Manejo de errores no capturados ──────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.stack)
  res.status(500).json({ error: 'Error interno del servidor' })
})

// ── Esperar a que la BD esté lista antes de abrir el puerto ────
initDatabase()
  .then(() => {
    app.listen(PUERTO, () => {
      console.log(`StudyMind API en http://localhost:${PUERTO}`)
      console.log(`CORS permitido para: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
    })
    console.log('Base de datos lista')
  })
  .catch(err => {
    console.error('No se pudo conectar a la base de datos después de varios intentos.')
    console.error(err.message)
    process.exit(1)
  })
