/**
 * @file Layout.jsx
 * @description App shell with sidebar navigation and 3-column-ready main content area.
 */

// No props — reads state via hooks/context

import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusSquare,
  Lightbulb,
  Trophy,
  User,
  Leaf,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import supabase from '../lib/supabaseClient';
import logger from '../utils/logger';

const NAV_ITEMS = [
  { to: '/dashboard',   label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/log',         label: 'Log Activity', Icon: PlusSquare },
  { to: '/insights',    label: 'Insights',     Icon: Lightbulb },
  { to: '/challenges',  label: 'Challenges',   Icon: Trophy },
  { to: '/profile',     label: 'Profile',      Icon: User },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { logger.error('Sign out error:', error); return; }
    navigate('/login');
  };

  // eslint-disable-next-line react/prop-types
  const Sidebar = ({ mobile = false }) => (
    <nav
      className={`flex flex-col h-full bg-white border-r border-border
                  ${mobile ? 'w-64' : 'w-sidebar'}`}
      aria-label="Primary navigation"
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="w-7 h-7 bg-forest rounded flex items-center justify-center">
          <Leaf size={14} className="text-white" />
        </div>
        <span className="text-base font-semibold text-charcoal tracking-tight">CO2Track</span>
        {mobile && (
          <button
            type="button"
            className="ml-auto text-text-muted hover:text-charcoal"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <ul className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5" role="list">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm rounded transition-colors duration-150
                 ${isActive
                   ? 'bg-light-green text-forest font-medium'
                   : 'text-text-secondary hover:bg-surface-1 hover:text-charcoal font-normal'
                 }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Sign out */}
      <div className="p-3 border-t border-border">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-sm text-text-muted
                     hover:text-danger hover:bg-red-50 rounded transition-colors duration-150"
          aria-label="Sign out of CO2Track"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-50 animate-slide-up">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-border">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-text-muted hover:text-charcoal"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-forest rounded flex items-center justify-center">
              <Leaf size={10} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-charcoal">CO2Track</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
