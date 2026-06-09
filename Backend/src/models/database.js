// Base de Datos — StudyMind


let pool = null
let dbReady = false

export function isDbReady() { return dbReady }

// Inicialización — conecta a PostgreSQL usando DATABASE_URL
export async function initDatabase() {
  const urlBD = process.env.DATABASE_URL

  if (!urlBD) {
    throw new Error(
      'DATABASE_URL no está definida. Configura esta variable en backend/.env antes de iniciar el servidor.'
    )
  }

  const { default: pg } = await import('pg')
  const { Pool } = pg
  pool = new Pool({
    connectionString: urlBD,
    ssl: process.env.DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
  })

  let attempts = 0
  const maxAttempts = 10
  while (attempts < maxAttempts) {
    attempts++
    try {
      await pool.query('SELECT 1')
      console.log('Conectado a PostgreSQL')
      await crearTablas()
      dbReady = true
      return
    } catch (err) {
      console.error(`Intento ${attempts}/${maxAttempts} — DB no disponible: ${err.message}`)
      if (attempts < maxAttempts) {
        console.log('Reintentando en 5 segundos...')
        await new Promise(r => setTimeout(r, 5000))
      } else {
        throw err
      }
    }
  }
}

async function crearTablas() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name         VARCHAR(255) NOT NULL,
      email        VARCHAR(255) UNIQUE NOT NULL,
      password     VARCHAR(255),
      avatar       TEXT,
      initials     VARCHAR(10),
      career       VARCHAR(255),
      semester     VARCHAR(100),
      university   VARCHAR(255),
      bio          TEXT,
      google_id         VARCHAR(255),
      provider          VARCHAR(50) DEFAULT 'local',
      email_verified    BOOLEAN DEFAULT FALSE,
      verification_code VARCHAR(6),
      verification_expires TIMESTAMPTZ,
      created_at        TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name         VARCHAR(255) NOT NULL,
      code         VARCHAR(50),
      credits      INTEGER DEFAULT 3,
      color        VARCHAR(20) DEFAULT '#5b4cf5',
      professor    VARCHAR(255),
      difficulty   VARCHAR(20) DEFAULT 'medium',
      schedule     JSONB DEFAULT '[]',
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id       UUID REFERENCES subjects(id) ON DELETE SET NULL,
      title            VARCHAR(500) NOT NULL,
      description      TEXT,
      type             VARCHAR(50) DEFAULT 'assignment',
      priority         VARCHAR(20) DEFAULT 'medium',
      due_date         TIMESTAMPTZ NOT NULL,
      estimated_hours  DECIMAL(5,2) DEFAULT 2,
      completed        BOOLEAN DEFAULT FALSE,
      status           VARCHAR(30) DEFAULT 'pending',
      weight           DECIMAL(5,2) DEFAULT 0,
      score            DECIMAL(6,2),
      max_score        DECIMAL(6,2) DEFAULT 5,
      difficulty       VARCHAR(20) DEFAULT 'medium',
      location         VARCHAR(255) DEFAULT '',
      topics           JSONB DEFAULT '[]',
      study_materials  JSONB DEFAULT '[]',
      feedback         TEXT DEFAULT '',
      notes            TEXT,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    );

    -- Añadir campos de verificación si no existen (para BD existentes)
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMPTZ;

    -- Tabla legacy de evaluaciones (se mantiene por compatibilidad, nuevos registros van a tasks)
    CREATE TABLE IF NOT EXISTS evaluations (
      id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id             UUID REFERENCES subjects(id) ON DELETE SET NULL,
      title                  VARCHAR(500) NOT NULL,
      type                   VARCHAR(50) DEFAULT 'exam',
      date                   TIMESTAMPTZ NOT NULL,
      weight                 DECIMAL(5,2) DEFAULT 20,
      estimated_study_hours  DECIMAL(5,2) DEFAULT 5,
      difficulty             VARCHAR(20),
      location               VARCHAR(255),
      description            TEXT,
      topics                 JSONB DEFAULT '[]',
      study_materials        JSONB DEFAULT '[]',
      status                 VARCHAR(30) DEFAULT 'pending',
      score                  DECIMAL(6,2),
      max_score              DECIMAL(6,2) DEFAULT 5,
      notes                  TEXT,
      feedback               TEXT,
      created_at             TIMESTAMPTZ DEFAULT NOW()
    );

    -- Migración: añadir campos de evaluación a tasks si la tabla ya existía
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'pending';
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2) DEFAULT 0;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS score DECIMAL(6,2);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS max_score DECIMAL(6,2) DEFAULT 5;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'medium';
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT '';
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT '[]';
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS study_materials JSONB DEFAULT '[]';
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS feedback TEXT DEFAULT '';

    -- Tablas para IA
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id                    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      study_hours_per_week       DECIMAL(4,1) DEFAULT 20,
      preferred_study_time       VARCHAR(20),
      semester_start             DATE,
      semester_end               DATE,
      notifications_enabled      BOOLEAN DEFAULT TRUE,
      notification_email         VARCHAR(255),
      created_at                 TIMESTAMPTZ DEFAULT NOW(),
      updated_at                 TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS study_plans (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      week_start      DATE NOT NULL,
      week_end        DATE NOT NULL,
      plan_data       JSONB DEFAULT '{}',
      status          VARCHAR(30) DEFAULT 'draft',
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type            VARCHAR(50) NOT NULL,
      title           VARCHAR(255) NOT NULL,
      message         TEXT,
      data            JSONB DEFAULT '{}',
      sent_at         TIMESTAMPTZ,
      read_at         TIMESTAMPTZ,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS wellbeing (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      mood         VARCHAR(50),
      note         TEXT DEFAULT '',
      sleep_hours  DECIMAL(4,1),
      skipped      BOOLEAN DEFAULT FALSE,
      updated_at   TIMESTAMPTZ DEFAULT NOW(),
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  console.log('Tablas de StudyMind creadas/verificadas')
}

// ── Usuarios ──────────────────────────────────────────────────────

export async function findUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [id])
  return rows[0] ? pgUsuarioAJs(rows[0]) : null
}

export async function findUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email)=LOWER($1)', [email])
  return rows[0] ? pgUsuarioAJs(rows[0]) : null
}

export async function findUserByGoogleId(googleId) {
  const { rows } = await pool.query('SELECT * FROM users WHERE google_id=$1', [googleId])
  return rows[0] ? pgUsuarioAJs(rows[0]) : null
}

export async function createUser(datos) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password, avatar, initials, career, semester, university, bio, google_id, provider)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      datos.name, datos.email, datos.password || null,
      datos.avatar || null, datos.initials || null,
      datos.career || null, datos.semester || null,
      datos.university || null, datos.bio || null,
      datos.googleId || null, datos.provider || 'local',
    ]
  )
  return pgUsuarioAJs(rows[0])
}

export async function updateUser(id, datos) {
  const campos = Object.entries({
    name: datos.name, avatar: datos.avatar, initials: datos.initials,
    career: datos.career, semester: datos.semester,
    university: datos.university, bio: datos.bio,
  }).filter(([, v]) => v !== undefined)
  if (!campos.length) return findUserById(id)
  const setClause = campos.map(([k], i) => `${aSnakeCase(k)}=$${i + 2}`).join(', ')
  const valores = campos.map(([, v]) => v)
  const { rows } = await pool.query(
    `UPDATE users SET ${setClause} WHERE id=$1 RETURNING *`,
    [id, ...valores]
  )
  return rows[0] ? pgUsuarioAJs(rows[0]) : null
}

export async function updateUserGoogleId(id, googleId) {
  const { rows } = await pool.query(
    `UPDATE users SET google_id=$2 WHERE id=$1 RETURNING *`,
    [id, googleId]
  )
  return rows[0] ? pgUsuarioAJs(rows[0]) : null
}

export async function setVerificationCode(userId, code) {
  await pool.query(
    `UPDATE users SET verification_code=$2, verification_expires=NOW() + INTERVAL '10 minutes' WHERE id=$1`,
    [userId, code]
  )
}

export async function verifyEmailCode(userId, code) {
  const { rows } = await pool.query(
    `SELECT id FROM users WHERE id=$1 AND verification_code=$2 AND verification_expires > NOW()`,
    [userId, code]
  )
  if (!rows.length) return false
  await pool.query(
    `UPDATE users SET email_verified=TRUE, verification_code=NULL, verification_expires=NULL WHERE id=$1`,
    [userId]
  )
  return true
}

export async function markEmailVerified(userId) {
  await pool.query(
    `UPDATE users SET email_verified=TRUE WHERE id=$1`,
    [userId]
  )
}

// ── Materias ──────────────────────────────────────────────────────

export async function getUserSubjects(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM subjects WHERE user_id=$1 ORDER BY created_at', [userId]
  )
  return rows.map(pgMateriaAJs)
}

export async function createSubject(userId, datos) {
  const { rows } = await pool.query(
    `INSERT INTO subjects (user_id, name, code, credits, color, professor, difficulty, schedule)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [userId, datos.name, datos.code || '', datos.credits || 3, datos.color || '#5b4cf5',
     datos.professor || '', datos.difficulty || 'medium', JSON.stringify(datos.schedule || [])]
  )
  return pgMateriaAJs(rows[0])
}

export async function updateSubject(id, userId, datos) {
  const { rows } = await pool.query(
    `UPDATE subjects
       SET name=$3, code=$4, credits=$5, color=$6, professor=$7, difficulty=$8, schedule=$9
     WHERE id=$1 AND user_id=$2 RETURNING *`,
    [id, userId, datos.name, datos.code, datos.credits, datos.color,
     datos.professor, datos.difficulty, JSON.stringify(datos.schedule || [])]
  )
  return rows[0] ? pgMateriaAJs(rows[0]) : null
}

export async function deleteSubject(id, userId) {
  await pool.query('DELETE FROM subjects WHERE id=$1 AND user_id=$2', [id, userId])
  return true
}

// ── Tareas ────────────────────────────────────────────────────────

export async function getUserTasks(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM tasks WHERE user_id=$1 ORDER BY due_date', [userId]
  )
  return rows.map(pgTareaAJs)
}

export async function createTask(userId, datos) {
  const { rows } = await pool.query(
    `INSERT INTO tasks (
       user_id, subject_id, title, description, type, priority, due_date,
       estimated_hours, completed, status, weight, score, max_score,
       difficulty, location, topics, study_materials, feedback, notes
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
    [userId, datos.subjectId || null, datos.title, datos.description || '',
     datos.type || 'assignment', datos.priority || 'medium', datos.dueDate,
     datos.estimatedHours || 2,
     datos.completed != null ? datos.completed : false,
     datos.status || 'pending',
     datos.weight || 0,
     datos.score != null ? datos.score : null,
     datos.maxScore || 5,
     datos.difficulty || 'medium',
     datos.location || '',
     JSON.stringify(datos.topics || []),
     JSON.stringify(datos.studyMaterials || []),
     datos.feedback || '',
     datos.notes || '']
  )
  return pgTareaAJs(rows[0])
}

export async function updateTask(id, userId, datos) {
  const { rows } = await pool.query(
    `UPDATE tasks
       SET title=$3, description=$4, type=$5, priority=$6,
           due_date=$7, estimated_hours=$8, completed=$9,
           status=$10, weight=$11, score=$12, max_score=$13,
           difficulty=$14, location=$15, topics=$16, study_materials=$17,
           feedback=$18, notes=$19, subject_id=$20
     WHERE id=$1 AND user_id=$2 RETURNING *`,
    [id, userId, datos.title, datos.description, datos.type, datos.priority,
     datos.dueDate, datos.estimatedHours,
     datos.completed != null ? datos.completed : false,
     datos.status || 'pending',
     datos.weight || 0,
     datos.score != null ? datos.score : null,
     datos.maxScore || 5,
     datos.difficulty || 'medium',
     datos.location || '',
     JSON.stringify(datos.topics || []),
     JSON.stringify(datos.studyMaterials || []),
     datos.feedback || '',
     datos.notes || '',
     datos.subjectId || null]
  )
  return rows[0] ? pgTareaAJs(rows[0]) : null
}

export async function deleteTask(id, userId) {
  await pool.query('DELETE FROM tasks WHERE id=$1 AND user_id=$2', [id, userId])
  return true
}

// ── Evaluaciones ──────────────────────────────────────────────────

export async function getUserEvaluations(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM evaluations WHERE user_id=$1 ORDER BY date', [userId]
  )
  return rows.map(pgEvalAJs)
}

export async function createEvaluation(userId, datos) {
  const { rows } = await pool.query(
    `INSERT INTO evaluations (
       user_id, subject_id, title, type, date, weight,
       estimated_study_hours, difficulty, location, description,
       topics, study_materials, status, score, max_score, notes, feedback
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
    [userId, datos.subjectId || null, datos.title, datos.type || 'exam', datos.date,
     datos.weight || 20, datos.estimatedStudyHours || 5, datos.difficulty || null,
     datos.location || null, datos.description || null,
     JSON.stringify(datos.topics || []), JSON.stringify(datos.studyMaterials || []),
     datos.status || 'pending', datos.score != null ? datos.score : null,
     datos.maxScore || 5, datos.notes || null, datos.feedback || null]
  )
  return pgEvalAJs(rows[0])
}

export async function updateEvaluation(id, userId, datos) {
  const { rows } = await pool.query(
    `UPDATE evaluations
       SET title=$3, type=$4, date=$5, weight=$6,
           estimated_study_hours=$7, difficulty=$8, location=$9, description=$10,
           topics=$11, study_materials=$12, status=$13, score=$14,
           max_score=$15, notes=$16, feedback=$17, subject_id=$18
     WHERE id=$1 AND user_id=$2 RETURNING *`,
    [id, userId, datos.title, datos.type, datos.date, datos.weight,
     datos.estimatedStudyHours, datos.difficulty || null, datos.location || null,
     datos.description || null, JSON.stringify(datos.topics || []),
     JSON.stringify(datos.studyMaterials || []), datos.status || 'pending',
     datos.score != null ? datos.score : null, datos.maxScore || 5,
     datos.notes || null, datos.feedback || null, datos.subjectId || null]
  )
  return rows[0] ? pgEvalAJs(rows[0]) : null
}

export async function deleteEvaluation(id, userId) {
  await pool.query('DELETE FROM evaluations WHERE id=$1 AND user_id=$2', [id, userId])
  return true
}

// ── Helpers ───────────────────────────────────────────────────────

function pgUsuarioAJs(r) {
  return {
    id: r.id, name: r.name, email: r.email, password: r.password,
    avatar: r.avatar, initials: r.initials, career: r.career,
    semester: r.semester, university: r.university, bio: r.bio,
    googleId: r.google_id, provider: r.provider,
    emailVerified: r.email_verified || false,
    createdAt: r.created_at,
  }
}

function pgMateriaAJs(r) {
  return {
    id: r.id, userId: r.user_id, name: r.name, code: r.code,
    credits: r.credits, color: r.color, professor: r.professor,
    difficulty: r.difficulty, schedule: r.schedule || [],
    createdAt: r.created_at,
  }
}

function pgTareaAJs(r) {
  return {
    id: r.id, userId: r.user_id, subjectId: r.subject_id,
    title: r.title, description: r.description, type: r.type,
    priority: r.priority, dueDate: r.due_date,
    estimatedHours: r.estimated_hours,
    completed: r.completed != null ? r.completed : (r.status === 'completed' || r.status === 'passed' || r.status === 'failed'),
    status: r.status || 'pending',
    weight: r.weight != null ? Number(r.weight) : 0,
    score: r.score != null ? Number(r.score) : null,
    maxScore: r.max_score != null ? Number(r.max_score) : 5,
    difficulty: r.difficulty || 'medium',
    location: r.location || '',
    topics: r.topics || [],
    studyMaterials: r.study_materials || [],
    feedback: r.feedback || '',
    notes: r.notes || '',
    createdAt: r.created_at,
  }
}

function pgEvalAJs(r) {
  return {
    id: r.id, userId: r.user_id, subjectId: r.subject_id,
    title: r.title, type: r.type, date: r.date, weight: r.weight,
    estimatedStudyHours: r.estimated_study_hours, difficulty: r.difficulty,
    location: r.location, description: r.description,
    topics: r.topics || [], studyMaterials: r.study_materials || [],
    status: r.status || 'pending', score: r.score, maxScore: r.max_score != null ? Number(r.max_score) : 5,
    notes: r.notes, feedback: r.feedback, createdAt: r.created_at,
  }
}

function aSnakeCase(str) {
  return str.replace(/[A-Z]/g, c => '_' + c.toLowerCase())
}

export const database = {
  query: (text, params) => pool.query(text, params),
}
