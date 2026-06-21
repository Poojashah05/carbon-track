/**
 * @file Dashboard.jsx
 * @description Main dashboard — 3-column layout with emission gauge, category breakdown,
 *   and recent activity feed.
 */

// No props — reads state via hooks/context

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusSquare, ArrowRight, Loader2 } from 'lucide-react';
import EmissionGauge from '../components/EmissionGauge';
import CategoryBreakdown from '../components/CategoryBreakdown';
import ProgressBar from '../components/ProgressBar';
import { useEmissions } from '../hooks/useEmissions';
import {
  getTotalMonthlyEmission,
  getCategoryBreakdown,
  compareToGlobalAverage,
  INDIA_MONTHLY_AVG_KG,
  GLOBAL_MONTHLY_AVG_KG,
} from '../utils/emissionFactors';
import { formatCO2, formatDate } from '../utils/formatters';

const CATEGORY_ICON_MAP = { transport: '🚗', food: '🍽️', energy: '⚡', shopping: '🛍️' };

export default function Dashboard() {
  const { logs, isLoading, error } = useEmissions();
  const [profile, setProfile] = useState(null);

  const totalKg = getTotalMonthlyEmission(logs);
  const breakdown = getCategoryBreakdown(logs);
  const comparison = compareToGlobalAverage(totalKg);
  const recentLogs = logs.slice(0, 8);

  useEffect(() => {
    const stored = localStorage.getItem('co2track_profile');
    if (stored) try { setProfile(JSON.parse(stored)); } catch { /* ignore */ }
  }, []);

  return (
    <div className="page-container">
      {/* Page header */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-charcoal">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">
          {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })} — Monthly Overview
        </p>
      </header>

      {error && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
          {error}
        </div>
      )}

      {/* 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left 2/3 ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Gauge + Comparison row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Gauge card */}
            <div className="card p-5 flex flex-col items-center justify-center">
              {isLoading ? (
                <div className="flex items-center gap-2 text-text-muted">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : (
                <EmissionGauge totalKg={totalKg} />
              )}
            </div>

            {/* Comparison card */}
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-charcoal">How you compare</h2>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-text-muted">India avg ({INDIA_MONTHLY_AVG_KG} kg)</span>
                    <span className={`text-xs font-medium tabular-nums
                      ${comparison.indiaPercent > 0 ? 'text-danger' : 'text-mint'}`}>
                      {comparison.vsIndia}
                    </span>
                  </div>
                  <ProgressBar
                    value={totalKg}
                    max={INDIA_MONTHLY_AVG_KG * 2}
                    color={comparison.indiaPercent > 0 ? 'danger' : 'mint'}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-text-muted">Global avg ({GLOBAL_MONTHLY_AVG_KG} kg)</span>
                    <span className={`text-xs font-medium tabular-nums
                      ${comparison.globalPercent > 0 ? 'text-danger' : 'text-mint'}`}>
                      {comparison.vsGlobal}
                    </span>
                  </div>
                  <ProgressBar
                    value={totalKg}
                    max={GLOBAL_MONTHLY_AVG_KG * 2}
                    color={comparison.globalPercent > 0 ? 'danger' : 'forest'}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-text-muted">
                  Your footprint is{' '}
                  <span className="font-semibold text-charcoal">{formatCO2(totalKg)}</span>
                  {' '}this month.
                </p>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <CategoryBreakdown breakdown={breakdown} />
        </div>

        {/* ── Right 1/3 ─────────────────────────────────── */}
        <div className="space-y-4">

          {/* Log Activity CTA */}
          <Link
            to="/log"
            className="card p-4 flex items-center justify-between group
                       hover:border-forest transition-colors duration-150 block"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-light-green rounded flex items-center justify-center">
                <PlusSquare size={16} className="text-forest" />
              </div>
              <div>
                <p className="text-sm font-medium text-charcoal">Log an Activity</p>
                <p className="text-xs text-text-muted">Track transport, food, energy</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-text-muted group-hover:text-forest transition-colors" />
          </Link>

          {/* Onboarding CTA (shown if no profile) */}
          {!profile?.onboarded && (
            <Link
              to="/onboarding"
              className="card p-4 flex items-center justify-between group
                         border-mint/50 hover:border-mint transition-colors duration-150 block"
            >
              <div>
                <p className="text-sm font-medium text-charcoal">Complete Setup</p>
                <p className="text-xs text-text-muted">Set your baseline preferences</p>
              </div>
              <ArrowRight size={16} className="text-text-muted group-hover:text-mint transition-colors" />
            </Link>
          )}

          {/* Recent Activity feed */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-charcoal mb-3">Recent Activity</h2>
            {isLoading && (
              <div className="space-y-2">
                {[1,2,3].map((i) => (
                  <div key={i} className="skeleton h-12 rounded" />
                ))}
              </div>
            )}
            {!isLoading && recentLogs.length === 0 && (
              <p className="text-xs text-text-muted py-4 text-center">
                No activities logged this month.
              </p>
            )}
            <ul className="space-y-2" aria-label="Recent activity log">
              {recentLogs.map((log) => (
                <li key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">
                      {CATEGORY_ICON_MAP[log.category] ?? '•'}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-charcoal capitalize">
                        {log.subcategory?.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-text-muted">{formatDate(log.logged_at)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-text-secondary tabular-nums">
                    {formatCO2(log.kg_co2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
