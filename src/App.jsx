import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import PropTypes from 'prop-types'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import LogActivity from './pages/LogActivity'
import Insights from './pages/Insights'
import Challenges from './pages/Challenges'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'

/** Full-screen loading spinner */
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-offwhite flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 border-2 border-green-dark border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500 font-medium">Loading CO2Track…</p>
      </div>
    </div>
  )
}

/**
 * Guard: requires a valid Supabase session.
 * If loading → show spinner
 * If no session → redirect to /login
 * If session but no onboarding → redirect to /onboarding
 */
function RequireAuth({ redirectIfNoOnboarding = true }) {
  const { session, profile, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (redirectIfNoOnboarding && profile && !profile.onboarding_done) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

RequireAuth.propTypes = {
  redirectIfNoOnboarding: PropTypes.bool,
}

/** Guard: redirect logged-in users away from /login */
function RequireGuest() {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (session) return <Navigate to="/" replace />
  return <Outlet />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public — redirect if already logged in */}
      <Route element={<RequireGuest />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Onboarding — needs auth but doesn't check onboarding_done */}
      <Route element={<RequireAuth redirectIfNoOnboarding={false} />}>
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>

      {/* Protected app shell */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="log-activity" element={<LogActivity />} />
          <Route path="insights" element={<Insights />} />
          <Route path="challenges" element={<Challenges />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}