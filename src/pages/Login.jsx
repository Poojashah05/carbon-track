/**
 * @file Login.jsx (formerly AuthCallback.jsx)
 * @description GitHub OAuth login screen and OAuth callback handler.
 */

// No props — reads state via hooks/context

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, Leaf, Loader2 } from 'lucide-react';
import supabase from '../lib/supabaseClient';
import logger from '../utils/logger';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Handle OAuth callback — if user already authed, redirect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkOnboardingAndRedirect(session.user);
      }
    });
  }, []);

  const checkOnboardingAndRedirect = async (user) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('user_id', user.id)
        .maybeSingle();
      navigate(data?.onboarded ? '/dashboard' : '/onboarding', { replace: true });
    } catch (err) {
      logger.error('Profile check failed:', err);
      navigate('/dashboard', { replace: true });
    }
  };

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) throw authError;
    } catch (err) {
      logger.error('GitHub OAuth error:', err);
      setError(err.message ?? 'Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-forest rounded-lg flex items-center justify-center mx-auto mb-4">
            <Leaf size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-charcoal">CO2Track</h1>
          <p className="text-sm text-text-muted mt-2">
            Track your carbon footprint. Make every choice count.
          </p>
        </div>

        {/* Login card */}
        <div className="card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-charcoal">Sign in</h2>
            <p className="text-xs text-text-muted mt-1">
              Use your GitHub account to continue.
            </p>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-danger">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGitHubLogin}
            disabled={isLoading}
            className="btn-primary w-full justify-center py-2.5 text-sm"
            aria-label="Sign in with GitHub"
          >
            {isLoading
              ? <Loader2 size={16} className="animate-spin" />
              : <Github size={16} />
            }
            {isLoading ? 'Redirecting…' : 'Continue with GitHub'}
          </button>

          <p className="text-xs text-text-muted text-center leading-relaxed">
            By signing in you agree to help reduce CO₂ emissions 🌱
          </p>
        </div>

        {/* Hackathon badge */}
        <p className="text-center text-xs text-text-muted mt-6">
          Built for Hack2Skill PromptWars · Google for Developers
        </p>
      </div>
    </div>
  );
}
