/**
 * @file App.jsx
 * @description Root application component with React Router v6 routing,
 *   auth guard, and onboarding redirect.
 */

// No props — reads state via hooks/context

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import supabase from './lib/supabaseClient';

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
  const navigate = useNavigate();

  useEffect(() => {
    const checkOnboardingAndRedirect = async (user) => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('user_id', user.id)
          .maybeSingle();
        navigate(data?.onboarded ? '/dashboard' : '/onboarding', { replace: true });
      } catch {
        navigate('/dashboard', { replace: true });
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkOnboardingAndRedirect(session.user);
      } else {
        const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
          if (s?.user) {
            listener.subscription.unsubscribe();
            checkOnboardingAndRedirect(s.user);
          }
        });
        const timeout = setTimeout(() => {
          listener.subscription.unsubscribe();
          navigate('/login', { replace: true });
        }, 5000);
        return () => {
          listener.subscription.unsubscribe();
          clearTimeout(timeout);
        };
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <p className="text-sm text-text-muted animate-pulse">Completing sign-in…</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
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
