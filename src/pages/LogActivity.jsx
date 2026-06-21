/**
 * @file LogActivity.jsx
 * @description Activity logging page with 3-column layout: form (left 2/3)
 *   and today's summary + recent logs (right 1/3).
 */

// No props — reads state via hooks/context

import { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import ActivityForm from '../components/ActivityForm';
import { useEmissions } from '../hooks/useEmissions';
import { getTotalMonthlyEmission, getCategoryBreakdown } from '../utils/emissionFactors';
import { formatCO2, formatDate } from '../utils/formatters';
import ProgressBar from '../components/ProgressBar';

/**
 * Simple toast notification component.
 * @param {{ message: string, type: 'success'|'error', onClose: function }} props
 */
function Toast({ message, type, onClose }) {
  return (
    <div className={type === 'success' ? 'toast-success' : 'toast-error'} role="status" aria-live="polite">
      {type === 'success'
        ? <CheckCircle2 size={16} className="shrink-0" />
        : <X size={16} className="shrink-0" />
      }
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 opacity-60 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

import PropTypes from 'prop-types';
Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error']).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default function LogActivity() {
  const { logs, addLog, isLoading } = useEmissions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const totalKg = getTotalMonthlyEmission(logs);
  const breakdown = getCategoryBreakdown(logs);
  const todayLogs = logs.filter((l) => {
    const d = new Date(l.logged_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayKg = getTotalMonthlyEmission(todayLogs);
  const recentLogs = logs.slice(0, 10);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (logData) => {
    setIsSubmitting(true);
    try {
      await addLog(logData);
      showToast(`Logged ${formatCO2(logData.kg_co2)} — activity saved!`);
    } catch (err) {
      showToast(err.message ?? 'Failed to save activity.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CATEGORY_META = { transport: 'Transport', food: 'Food', energy: 'Energy', shopping: 'Shopping' };

  return (
    <div className="page-container">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-charcoal">Log Activity</h1>
        <p className="text-sm text-text-muted mt-1">Record your carbon-producing activities.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left 2/3: Form ─────────────────────────── */}
        <div className="lg:col-span-2">
          <ActivityForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>

        {/* ── Right 1/3: Summary + Recent ─────────────── */}
        <div className="space-y-4">

          {/* Today's footprint */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-charcoal mb-3">{"Today's Footprint"}</h2>
            <div className="text-2xl font-semibold text-charcoal tabular-nums mb-1">
              {formatCO2(todayKg)}
            </div>
            <p className="text-xs text-text-muted mb-4">vs {formatCO2(totalKg)} this month</p>

            {/* Monthly breakdown bars */}
            <div className="space-y-2.5">
              {breakdown.map((b) => (
                <ProgressBar
                  key={b.category}
                  label={CATEGORY_META[b.category] ?? b.category}
                  value={b.percent}
                  max={100}
                  color="forest"
                  showValue
                />
              ))}
            </div>
          </div>

          {/* Recent logged activities */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-charcoal mb-3">Recent Logs</h2>

            {isLoading && (
              <div className="space-y-2">
                {[1,2,3].map((i) => <div key={i} className="skeleton h-10 rounded" />)}
              </div>
            )}

            {!isLoading && recentLogs.length === 0 && (
              <p className="text-xs text-text-muted text-center py-4">No activities yet.</p>
            )}

            <ul className="space-y-2" aria-label="Recent activity logs">
              {recentLogs.map((log) => (
                <li key={log.id} className="flex items-start justify-between gap-2 py-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-charcoal capitalize truncate">
                      {log.subcategory?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-text-muted">
                      {CATEGORY_META[log.category]} · {formatDate(log.logged_at)}
                    </p>
                    {log.note && (
                      <p className="text-xs text-text-muted italic truncate">{log.note}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-text-secondary tabular-nums shrink-0">
                    {formatCO2(log.kg_co2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
