/**
 * @file Challenges.jsx
 * @description Weekly eco-challenges page — 3-column layout with trophy card (left 1/3)
 *   and 6 challenge cards grid (right 2/3). Syncs to Supabase challenge_state.
 */

// No props — reads state via hooks/context

import { useState, useEffect, useCallback } from 'react';
import { Trophy } from 'lucide-react';
import ChallengeCard from '../components/ChallengeCard';
import ProgressBar from '../components/ProgressBar';
import supabase from '../lib/supabaseClient';
import { getItem, setItem } from '../utils/storage';
import logger from '../utils/logger';

const ALL_CHALLENGES = [
  {
    id: 'ch1',
    title: 'Car-Free Day',
    description: 'Go an entire day without using a petrol or diesel vehicle. Walk, cycle, or use public transport.',
    difficulty: 'easy',
  },
  {
    id: 'ch2',
    title: 'Meatless Monday',
    description: 'Skip meat for an entire day. Choose dal, veg thali, or a vegan meal instead.',
    difficulty: 'easy',
  },
  {
    id: 'ch3',
    title: 'Cold-Wash Week',
    description: 'Wash all your laundry in cold water for 7 days. Reduces water heating energy by up to 90%.',
    difficulty: 'easy',
  },
  {
    id: 'ch4',
    title: '5 km Cycle Commute',
    description: 'Cycle to work or errands for at least 5 km in a day instead of driving.',
    difficulty: 'medium',
  },
  {
    id: 'ch5',
    title: 'Zero Food Waste Week',
    description: 'Plan meals carefully and avoid throwing away any food for an entire week.',
    difficulty: 'medium',
  },
  {
    id: 'ch6',
    title: 'Switch to Solar',
    description: 'Investigate and commit to at least one rooftop solar panel installation quote this month.',
    difficulty: 'hard',
  },
];

const POINTS_MAP = { easy: 10, medium: 25, hard: 50 };
const CHAMPION_THRESHOLD = 100;

export default function Challenges() {
  const [completed, setCompleted] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    // Load from localStorage
    const cached = getItem('challenge_state', {});
    setCompleted(cached);
  }, []);

  const totalPoints = ALL_CHALLENGES.reduce((sum, ch) => {
    return completed[ch.id] ? sum + POINTS_MAP[ch.difficulty] : sum;
  }, 0);

  const syncToSupabase = useCallback(async (newState) => {
    if (!user) return;
    try {
      await supabase
        .from('challenge_state')
        .upsert({ user_id: user.id, state: newState, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    } catch (err) {
      logger.error('Challenge sync failed:', err);
    }
  }, [user]);

  const handleToggle = useCallback(async (id) => {
    const updated = { ...completed, [id]: !completed[id] };
    setCompleted(updated);
    setItem('challenge_state', updated);
    await syncToSupabase(updated);
  }, [completed, syncToSupabase]);

  const completedCount = Object.values(completed).filter(Boolean).length;
  const earnedBadge = totalPoints >= CHAMPION_THRESHOLD;

  return (
    <div className="page-container">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-charcoal">Weekly Challenges</h1>
        <p className="text-sm text-text-muted mt-1">Complete eco-challenges to earn points and badges.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left 1/3: Trophy + Points ─────────────────── */}
        <div className="space-y-4">

          {/* Trophy card */}
          <div className={`card p-5 text-center ${earnedBadge ? 'border-amber' : ''}`}>
            <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3
                            ${earnedBadge ? 'bg-amber text-white' : 'bg-surface-2 text-text-muted'}`}>
              <Trophy size={24} />
            </div>

            {earnedBadge ? (
              <>
                <h2 className="text-base font-semibold text-charcoal">Eco Champion!</h2>
                <p className="text-xs text-text-muted mt-1">{"You've earned the top badge."}</p>
              </>
            ) : (
              <>
                <h2 className="text-base font-semibold text-charcoal">{totalPoints} pts</h2>
                <p className="text-xs text-text-muted mt-1">
                  {CHAMPION_THRESHOLD - totalPoints} more pts for Eco Champion
                </p>
              </>
            )}

            <div className="mt-4">
              <ProgressBar
                value={totalPoints}
                max={CHAMPION_THRESHOLD}
                color={earnedBadge ? 'warning' : 'forest'}
                label={`${completedCount} / ${ALL_CHALLENGES.length} completed`}
                showValue={false}
              />
            </div>
          </div>

          {/* Points rules */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-charcoal mb-3">Points Guide</h3>
            <ul className="space-y-2">
              {[['easy', 10], ['medium', 25], ['hard', 50]].map(([diff, pts]) => (
                <li key={diff} className="flex items-center justify-between text-xs">
                  <span className={`badge badge-${diff === 'easy' ? 'green' : diff === 'medium' ? 'amber' : 'red'} capitalize`}>
                    {diff}
                  </span>
                  <span className="font-medium text-text-secondary">+{pts} points</span>
                </li>
              ))}
              <li className="flex items-center justify-between text-xs pt-2 border-t border-border">
                <span className="text-text-muted">Eco Champion at</span>
                <span className="font-semibold text-forest">{CHAMPION_THRESHOLD} points</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Right 2/3: Challenge Cards Grid ─────────────── */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ALL_CHALLENGES.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                {...challenge}
                completed={!!completed[challenge.id]}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
