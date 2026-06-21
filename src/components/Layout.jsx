import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Home, PlusCircle, Sparkles, Trophy, User, LogOut, Leaf } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const NAV_ITEMS = [
  { to: '/',            label: 'Dashboard',    icon: Home,        end: true },
  { to: '/log-activity',label: 'Log Activity', icon: PlusCircle              },
  { to: '/insights',    label: 'AI Insights',  icon: Sparkles                },
  { to: '/challenges',  label: 'Challenges',   icon: Trophy                  },
  { to: '/profile',     label: 'My Profile',   icon: User                    },
]

/**
 * CO2Track wordmark with subscript 2
 * @param {Object} props
 * @param {string} [props.size='md'] - 'sm' | 'md'
 * @returns {JSX.Element}
 */
function Wordmark({ size = 'md' }) {
  const textSize = size === 'sm' ? 'text-base' : 'text-lg'
  return (
    <span className={`${textSize} font-bold text-charcoal tracking-tight select-none`}>
      CO<sub className="text-xs font-semibold text-green-dark align-sub">2</sub>Track
    </span>
  )
}

Wordmark.propTypes = {
  size: PropTypes.oneOf(['sm', 'md']),
}

/**
 * Logo icon (leaf in green square)
 * @param {Object} props
 * @param {number} [props.size=24] - width and height in px
 * @returns {JSX.Element}
 */
function LogoIcon({ size = 24 }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg bg-green-dark flex-shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Leaf className="text-white" style={{ width: size * 0.55, height: size * 0.55 }} strokeWidth={1.5} />
    </div>
  )
}

LogoIcon.propTypes = {
  size: PropTypes.number,
}

// No props — reads state via hooks/context
export default function Layout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-offwhite text-charcoal flex">

      {/* ── Sidebar (desktop) ─────────────────────────── */}
      <aside className="hidden sm:flex fixed left-0 top-0 h-screen w-52 border-r border-gray-200 bg-white flex-col z-40">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
          <LogoIcon size={32} />
          <Wordmark />
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Main navigation">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-light/40 text-green-dark border-l-2 border-green-dark pl-[10px]'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-charcoal'
                }`
              }
              aria-label={label}
            >
              <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Sign out */}
        {profile && (
          <div className="border-t border-gray-100 p-3">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 px-2 py-2 mb-1 w-full rounded-lg hover:bg-gray-50 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-dark"
              aria-label="View profile settings"
            >
              <div className="h-7 w-7 rounded-full bg-green-light border border-green-med flex items-center justify-center flex-shrink-0 text-xs font-semibold text-green-dark">
                {profile.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-charcoal truncate">{profile.name}</div>
                <div className="text-[10px] text-gray-400 truncate">{profile.location === 'india' ? '🇮🇳 India' : '🌍 Global'}</div>
              </div>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* ── Main layout ───────────────────────────────── */}
      <div className="flex-1 sm:pl-52 flex flex-col min-h-screen">
        {/* Top header (mobile only — shows brand) */}
        <header className="sm:hidden sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
          <div className="flex h-14 items-center justify-between px-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
              aria-label="CO2Track home"
            >
              <LogoIcon size={28} />
              <Wordmark size="sm" />
            </button>
            {profile && (
              <button
                onClick={() => navigate('/profile')}
                className="h-7 w-7 rounded-full bg-green-light border border-green-med flex items-center justify-center text-xs font-semibold text-green-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-green-dark hover:opacity-85 transition-opacity"
                aria-label="View profile settings"
              >
                {profile.name?.charAt(0)?.toUpperCase() ?? '?'}
              </button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 pb-24 sm:pb-8 sm:px-6">
          <Outlet />
        </main>

        {/* Bottom nav (mobile) */}
        <nav
          className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm z-30"
          aria-label="Mobile navigation"
        >
          <div className="flex justify-around">
            {NAV_ITEMS.slice(0, 4).map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center py-2.5 px-1 text-[10px] font-medium transition-colors border-t-2 ${
                    isActive ? 'text-green-dark border-green-dark' : 'text-gray-400 border-transparent'
                  }`
                }
                aria-label={label}
              >
                <Icon className="h-5 w-5 mb-0.5" strokeWidth={1.5} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}