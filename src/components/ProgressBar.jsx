import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

/**
 * Animated Progress Bar Component
 * 
 * @param {Object} props
 * @param {number} props.value - Current progress value
 * @param {number} [props.max=100] - Maximum possible value
 * @param {string} [props.color='#2d6a4f'] - Fill color
 * @param {number} [props.height=8] - Height of the progress bar in px (unused but kept for API compat)
 * @param {boolean} [props.showLabel=false] - Whether to show the text label
 * @returns {JSX.Element}
 */
export default function ProgressBar({ value, max = 100, color = '#2d6a4f', showLabel = false }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const targetValue = Math.min(value, max)
    const duration = 1000
    const startTime = performance.now()

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const currentValue = targetValue * easeProgress

      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, max])

  const percentage = Math.min((displayValue / max) * 100, 100)

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm text-charcoal mb-2">
          <span>Progress</span>
          <span>{Math.round(displayValue)} / {max}</span>
        </div>
      )}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-in-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number,
  color: PropTypes.string,
  showLabel: PropTypes.bool,
}