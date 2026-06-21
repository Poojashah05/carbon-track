/**
 * @file InsightCard.jsx
 * @description Displays a single AI-generated insight report with accordion expand/collapse.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, Sparkles } from 'lucide-react';
import { formatDate } from '../utils/formatters';

/**
 * Skeleton loader for streaming state.
 * @returns {JSX.Element}
 */
function InsightSkeleton() {
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-5/6 rounded" />
      <div className="skeleton h-4 w-2/3 rounded" />
    </div>
  );
}

/**
 * Renders a single AI insight report with accordion expand/collapse.
 * @param {Object} props
 * @param {import('../hooks/useGroqInsights').InsightReport} props.report
 * @param {boolean} [props.isOpen=false] - Whether accordion is expanded.
 * @param {function} props.onToggle - Callback when header is clicked.
 * @param {boolean} [props.isLatest=false] - Marks the most recent report.
 * @returns {JSX.Element}
 */
export default function InsightCard({ report, isOpen, onToggle, isLatest = false }) {
  return (
    <article className="card overflow-hidden">
      {/* Accordion header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left
                   hover:bg-surface-1 transition-colors duration-150 focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-forest"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <Sparkles size={16} className="text-mint shrink-0" />
          <div>
            <p className="text-sm font-medium text-charcoal">
              AI Insights Report
              {isLatest && (
                <span className="ml-2 badge-green text-xs px-1.5 py-0.5 rounded">Latest</span>
              )}
            </p>
            <p className="text-xs text-text-muted mt-0.5">{formatDate(report.created_at)}</p>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Accordion content */}
      {isOpen && (
        <div
          className="px-5 pb-5 pt-1 border-t border-border animate-fade-in"
          aria-live="polite"
        >
          <div className="prose prose-sm max-w-none text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
            {report.content}
          </div>

          {/* Emission snapshot metadata */}
          {report.emission_snapshot && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2">
              {Object.entries(report.emission_snapshot)
                .filter(([k]) => k !== 'globalAvg')
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-text-muted capitalize">{k.replace(/Kg$/, ' kg')}</span>
                    <span className="font-medium text-text-secondary tabular-nums">
                      {typeof v === 'number' ? `${v.toFixed(1)} kg` : v}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

InsightCard.propTypes = {
  report: PropTypes.shape({
    id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    emission_snapshot: PropTypes.object,
  }).isRequired,
  isOpen: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  isLatest: PropTypes.bool,
};

/**
 * Skeleton variant for InsightCard when streaming.
 */
export { InsightSkeleton };
