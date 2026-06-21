import { useState } from 'react'
import PropTypes from 'prop-types'
import { useAuth } from '../contexts/AuthContext'
import { Leaf } from 'lucide-react'


/** Inline GitHub SVG icon */
function GithubIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
    </svg>
  )
}

GithubIcon.propTypes = {
  className: PropTypes.string,
}

// No props — reads state via hooks/context
export default function Login() {
  const { signInWithGitHub } = useAuth()
  const [loadingProvider, setLoadingProvider] = useState(null)
  const [error, setError] = useState(null)

  const handleSignIn = async (provider) => {
    setLoadingProvider(provider)
    setError(null)
    try {
      if (provider === 'github') {
        await signInWithGitHub()
      }
    } catch {
      setError('Sign-in failed. Please try again.')
      setLoadingProvider(null)
    }
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      {/* Decorative top bar */}
      <div className="h-1 bg-green-dark w-full" />

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Logo + Brand */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-dark mb-5 shadow-sm">
            <Leaf className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>

          <h1 className="text-4xl font-bold text-charcoal tracking-tight">
            CO<sub className="text-2xl font-semibold text-green-dark">2</sub>Track
          </h1>

          <p className="mt-3 text-gray-500 text-base max-w-xs mx-auto leading-relaxed">
            India's smart carbon footprint tracker — log, measure, and reduce your impact.
          </p>
        </div>

        {/* Sign-in card */}
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-8">
          <h2 className="text-sm font-semibold text-gray-500 text-center mb-6 uppercase tracking-wider">
            Sign in to continue
          </h2>

          <div className="space-y-3">
            {/* GitHub */}
            <button
              id="sign-in-github"
              type="button"
              onClick={() => handleSignIn('github')}
              disabled={loadingProvider !== null}
              className="w-full flex items-center justify-center gap-3 bg-[#24292e] hover:bg-[#1b1f23] text-white py-3 px-4 rounded-xl text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#24292e] disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="Sign in with GitHub"
            >
              {loadingProvider === 'github' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <GithubIcon className="w-4 h-4" />
              )}
              Continue with GitHub
            </button>
          </div>

          {error && (
            <p className="mt-4 text-xs text-red-600 text-center" role="alert">{error}</p>
          )}

          {/* Privacy note */}
          <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
            We only store your name and email to personalise your experience. Your data is never sold.
          </p>
        </div>

        {/* Stats row */}
        <div className="mt-10 flex gap-8 text-center">
          {[
            { label: 'Emission factors', value: '25+' },
            { label: 'Indian food items', value: '9' },
            { label: 'AI insights / month', value: '2' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xl font-bold text-green-dark">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-gray-400">
        CO2Track · Built for India · Open source on GitHub
      </footer>
    </div>
  )
}
