/**
 * @file ChallengeCard.jsx
 * @description Weekly eco-challenge card with difficulty badge and mark-complete action.
 */

import PropTypes from 'prop-types';
import { CheckCircle2, Circle } from 'lucide-react';

const DIFFICULTY_META = {
  easy:   { label: 'Easy',   className: 'badge-green',  points: 10 },
  medium: { label: 'Medium', className: 'badge-amber',  points: 25 },
  hard:   { label: 'Hard',   className: 'badge-red',    points: 50 },
};

/**
 * A single weekly eco-challenge item.
 * @param {Object} props
 * @param {string} props.id - Challenge ID.
 * @param {string} props.title - Challenge title.
 * @param {string} props.description - Short description of the challenge.
 * @param {'easy'|'medium'|'hard'} props.difficulty
 * @param {boolean} props.completed - Whether the user has completed this challenge.
 * @param {function(string): void} props.onToggle - Called with challenge ID on completion toggle.
 * @returns {JSX.Element}
 */
export default function ChallengeCard({ id, title, description, difficulty, completed, onToggle }) {
  const meta = DIFFICULTY_META[difficulty] ?? DIFFICULTY_META.easy;

  return (
    <article
      className={`card p-4 flex flex-col gap-3 transition-all duration-200
                  ${completed ? 'opacity-60' : 'hover:border-mint'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={meta.className}>{meta.label}</span>
            <span className="text-xs text-text-muted">+{meta.points} pts</span>
          </div>
          <h4 className={`text-sm font-semibold leading-snug ${completed ? 'line-through text-text-muted' : 'text-charcoal'}`}>
            {title}
          </h4>
        </div>

        {/* Complete toggle */}
        <button
          type="button"
          onClick={() => onToggle(id)}
          className="shrink-0 text-mint hover:text-forest transition-colors duration-150 mt-0.5"
          aria-label={completed ? `Mark "${title}" incomplete` : `Mark "${title}" complete`}
        >
          {completed
            ? <CheckCircle2 size={20} className="text-mint" />
            : <Circle size={20} className="text-border" />
          }
        </button>
      </div>

      <p className="text-xs text-text-muted leading-relaxed">{description}</p>
    </article>
  );
}

ChallengeCard.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  difficulty: PropTypes.oneOf(['easy', 'medium', 'hard']).isRequired,
  completed: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};
