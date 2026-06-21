/**
 * @file ProgressBar.jsx
 * @description Accessible reusable progress bar component.
 */

import PropTypes from 'prop-types';

/**
 * Accessible progress bar with label and optional value display.
 * @param {Object} props
 * @param {number} props.value - Current value (0–max).
 * @param {number} [props.max=100] - Maximum value.
 * @param {string} [props.label] - Accessible label text.
 * @param {string} [props.color='forest'] - Tailwind color token for fill.
 * @param {string} [props.className] - Extra classes for wrapper.
 * @param {boolean} [props.showValue=false] - Whether to show numeric value.
 * @returns {JSX.Element}
 */
export default function ProgressBar({
  value,
  max = 100,
  label,
  color = 'forest',
  className = '',
  showValue = false,
}) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  const colorMap = {
    forest: 'bg-forest',
    mint: 'bg-mint',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };
  const fillClass = colorMap[color] || 'bg-forest';

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs font-medium text-text-secondary">{label}</span>}
          {showValue && (
            <span className="text-xs text-text-muted tabular-nums">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div
        className="h-1 w-full bg-surface-2 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? 'Progress'}
      >
        <div
          className={`h-full ${fillClass} rounded-full transition-all duration-700 ease-smooth`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number,
  label: PropTypes.string,
  color: PropTypes.oneOf(['forest', 'mint', 'warning', 'danger']),
  className: PropTypes.string,
  showValue: PropTypes.bool,
};
