/**
 * @file App.jsx
 * @description Root application component with React Router v6 routing,
 *   auth guard, and onboarding redirect.
 */

// No props — reads state via hooks/context

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import supabase, { isSupabaseConfigured } from './lib/supabaseClient';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import LogActivity from './pages/LogActivity';
import Insights from './pages/Insights';
import Challenges from './pages/Challenges';
import Profile from './pages/Profile';

/**
 * Auth guard — redirects unauthenticated users to /login.
 * Shows nothing (null) while session is loading.
 * @returns {JSX.Element}
 */
function RequireAuth() {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null; // Loading
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/**
 * OAuth callback handler — exchanges code for session then redirects.
 * @returns {JSX.Element}
 */
function AuthCallback() {
  const [, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setDone(true);
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <p className="text-sm text-text-muted animate-pulse">Completing sign-in…</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {!isSupabaseConfigured && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center gap-2">
          <strong>⚙️ Setup required:</strong> Copy <code>.env.example</code> to <code>.env</code> and add your Supabase credentials to enable authentication.
        </div>
      )}
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected routes */}
        <Route element={<RequireAuth />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/log" element={<LogActivity />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
