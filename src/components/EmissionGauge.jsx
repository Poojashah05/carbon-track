/**
 * @file EmissionGauge.jsx
 * @description Animated SVG circular gauge showing total monthly CO₂.
 *   Uses a count-up animation and colour-codes severity.
 */

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const INDIA_AVG = 230;
const GLOBAL_AVG = 391.67;

/**
 * Returns severity colour based on emission level.
 * @param {number} kg
 * @returns {{ stroke: string, text: string }}
 */
function getSeverity(kg) {
  if (kg < INDIA_AVG) return { stroke: '#52b788', text: 'text-mint' };
  if (kg < GLOBAL_AVG) return { stroke: '#b5852a', text: 'text-warning' };
  return { stroke: '#c0392b', text: 'text-danger' };
}

/**
 * Animated SVG circular gauge for total CO₂ emissions.
 * @param {Object} props
 * @param {number} props.totalKg - Total CO₂ in kg.
 * @param {number} [props.maxKg=600] - Maximum value for gauge arc.
 * @returns {JSX.Element}
 */
export default function EmissionGauge({ totalKg, maxKg = 600 }) {
  const [displayed, setDisplayed] = useState(0);

  // Count-up animation
  useEffect(() => {
    const duration = 1200;
    const steps = 60;
    const increment = totalKg / steps;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + increment, totalKg);
      setDisplayed(Math.round(current * 10) / 10);
      if (current >= totalKg) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [totalKg]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(totalKg / maxKg, 1);
  const offset = circumference * (1 - pct * 0.75); // 3/4 arc
  const { stroke, text } = getSeverity(totalKg);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-[135deg]" viewBox="0 0 200 200">
          {/* Track */}
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke="#e3e0d6"
            strokeWidth="12"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeLinecap="round"
          />
          {/* Fill */}
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="12"
            strokeDasharray={`${circumference * 0.75 - offset + circumference * 0.25} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>

        {/* Value overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-semibold tabular-nums ${text}`}>
            {displayed.toFixed(1)}
          </span>
          <span className="text-xs text-text-muted font-medium">kg CO₂/mo</span>
        </div>
      </div>

      {/* Severity label */}
      <div className="text-center">
        {totalKg < INDIA_AVG && (
          <p className="text-xs font-medium text-mint">Below India average 🌿</p>
        )}
        {totalKg >= INDIA_AVG && totalKg < GLOBAL_AVG && (
          <p className="text-xs font-medium text-warning">Above India, below global avg</p>
        )}
        {totalKg >= GLOBAL_AVG && (
          <p className="text-xs font-medium text-danger">Above global average</p>
        )}
      </div>
    </div>
  );
}

EmissionGauge.propTypes = {
  totalKg: PropTypes.number.isRequired,
  maxKg: PropTypes.number,
};
