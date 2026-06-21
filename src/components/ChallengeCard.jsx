import { Check } from 'lucide-react'
import PropTypes from 'prop-types'
import { formatCO2 } from '../utils/formatters'

const DIFFICULTY_STYLES = {
  easy: {
    badge: 'bg-green-light text-green-dark border-green-med/40',
    points: 'text-green-dark',
  },
  medium: {
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    points: 'text-yellow-600',
  },
  hard: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    points: 'text-red-600',
  },
}

/**
 * Challenge Card Component
 * Displays a single eco-challenge with difficulty, potential savings, points, and actions.
 * 
 * @param {Object} props
 * @param {Object} props.challenge - The challenge details
 * @param {Function} [props.onAccept] - Handler for accepting the challenge
 * @param {Function} [props.onComplete] - Handler for completing the challenge
 * @returns {JSX.Element}
 */
export default function ChallengeCard({ challenge, onAccept, onComplete }) {
  const styles = DIFFICULTY_STYLES[challenge.difficulty] || DIFFICULTY_STYLES.easy

  return (
    <article className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-2 gap-2">
        <h3 className="font-semibold text-charcoal text-sm leading-snug">{challenge.title}</h3>
        <span
          className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium border ${styles.badge}`}
          aria-label={`Difficulty: ${challenge.difficulty}`}
        >
          {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 leading-relaxed mb-4 flex-1">{challenge.description}</p>

      {/* Savings + Points */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-gray-600">
          Est. saving:{' '}
          <span className="font-medium text-green-dark">{formatCO2(challenge.saving)}</span>
        </div>
        <div className={`text-xs font-medium ${styles.points}`}>
          {challenge.points} pts
        </div>
      </div>

      {/* Action button */}
      {challenge.isCompleted ? (
        <div
          className="w-full flex items-center justify-center gap-1.5 bg-green-light border border-green-med/40 rounded-lg py-2 text-xs font-medium text-green-dark"
          aria-label={`Challenge completed, saved ${formatCO2(challenge.saving)}`}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          Completed · {formatCO2(challenge.saving)} saved
        </div>
      ) : challenge.isAccepted ? (
        <button
          type="button"
          onClick={() => onComplete?.(challenge.id)}
          className="w-full bg-green-dark text-white py-2 rounded-lg text-xs font-medium hover:bg-green-med transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-dark"
        >
          Mark Complete
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onAccept?.(challenge.id)}
          className="w-full border border-green-dark text-green-dark py-2 rounded-lg text-xs font-medium hover:bg-green-light/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-dark"
        >
          Accept Challenge
        </button>
      )}
    </article>
  )
}

ChallengeCard.propTypes = {
  challenge: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    difficulty: PropTypes.oneOf(['easy', 'medium', 'hard']).isRequired,
    saving: PropTypes.number.isRequired,
    points: PropTypes.number.isRequired,
    isAccepted: PropTypes.bool,
    isCompleted: PropTypes.bool,
  }).isRequired,
  onAccept: PropTypes.func,
  onComplete: PropTypes.func,
}