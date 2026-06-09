// ─────────────────────────────────────────────────────────────────
// Raíz de la aplicación — configura el router, autenticación y tema
// Protected: solo accesible si hay sesión activa
// Public: redirige al dashboard si ya hay sesión
// ─────────────────────────────────────────────────────────────────
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { Layout } from './components/Layout.jsx'
import { WellbeingGate } from './components/WellbeingGate.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { Subjects } from './pages/Subjects.jsx'
import { SubjectDetail } from './pages/SubjectDetail.jsx'
import { Tasks } from './pages/Tasks.jsx'
import { Schedule } from './pages/Schedule.jsx'
import { Analytics } from './pages/Analytics.jsx'
import { Profile } from './pages/Profile.jsx'
import { Wellbeing } from './pages/Wellbeing.jsx'
import { Plans } from './pages/Plans.jsx'
import { LoginPage } from './pages/Login.jsx'
import { RegisterPage } from './pages/Register.jsx'
import { HomePage } from './pages/Home.jsx'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: '1.2rem' }}>✦</span>
        </div>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function Public({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/app" replace /> : children
}

function AppRoutes() {
  const router = createBrowserRouter([
    { path: '/', element: <Public><HomePage /></Public> },
    { path: '/login', element: <Public><LoginPage /></Public> },
    { path: '/register', element: <Public><RegisterPage /></Public> },
    {
      path: '/app',
      element: <Protected><WellbeingGate><Layout /></WellbeingGate></Protected>,
      children: [
        { index: true, element: <Dashboard /> },
        { path: 'subjects', element: <Subjects /> },
        { path: 'subjects/:id', element: <SubjectDetail /> },
        { path: 'tasks', element: <Tasks /> },
        { path: 'schedule', element: <Schedule /> },
        { path: 'wellbeing', element: <Wellbeing /> },
        { path: 'plans', element: <Plans /> },
        { path: 'analytics', element: <Analytics /> },
        { path: 'profile', element: <Profile /> },
      ],
    },
  ])
  return <RouterProvider router={router} />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}
