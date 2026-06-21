import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { formatCO2 } from '../utils/formatters'

const MAX_SCALE = 600 // kg, represents 100% of arc

/**
 * Emission Gauge Component
 * Animated circular gauge for total CO₂ emissions
 * 
 * @param {Object} props
 * @param {number} props.totalKg - Total CO2 in kg
 * @param {string} [props.status] - User's status relative to global average ('below' or 'above')
 * @param {boolean} [props.isLoading] - Loading state
 * @returns {JSX.Element}
 */
export default function EmissionGauge({ totalKg, status = 'below', isLoading = false }) {
  const [displayValue, setDisplayValue] = useState(0)

  const radius = 72
  const strokeWidth = 7
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    if (isLoading) { setDisplayValue(0); return }

    const target = Math.min(totalKg, MAX_SCALE)
    const duration = 1400
    const start = performance.now()

    const animate = (now) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setDisplayValue(target * ease)
      if (t < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [totalKg, isLoading])

  const progress = Math.min(displayValue / MAX_SCALE, 1)
  const strokeDashoffset = circumference * (1 - progress)
  const color = status === 'below' ? '#52b788' : '#dc2626'

  return (
    <div className="relative flex items-center justify-center" aria-label={`${formatCO2(totalKg)} CO₂ monthly emissions`}>
      <svg
        width={160}
        height={160}
        viewBox="0 0 160 160"
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={80}
          cy={80}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <circle
          cx={80}
          cy={80}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          style={{ transition: 'stroke-dashoffset 0.05s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        {isLoading ? (
          <div className="text-sm text-gray-400">Loading…</div>
        ) : (
          <>
            <div className="text-xl font-semibold text-charcoal leading-tight">
              {displayValue.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">kg CO₂</div>
          </>
        )}
      </div>
    </div>
  )
}

EmissionGauge.propTypes = {
  totalKg: PropTypes.number.isRequired,
  status: PropTypes.oneOf(['below', 'above', 'equal']),
  isLoading: PropTypes.bool,
}