import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import ChallengeCard from '../components/ChallengeCard'
import ProgressBar from '../components/ProgressBar'
import { Trophy } from 'lucide-react'

const WEEKLY_CHALLENGES = [
  {
    id: 1,
    title: 'Car-Free Day',
    description: 'Go car-free for one day this week. Use public transport, walk, or cycle instead.',
    saving: 5.0,
    difficulty: 'easy',
    points: 10,
  },
  {
    id: 2,
    title: 'Plant-Based Meals',
    description: 'Try vegetarian meals for 3 consecutive days. Replace meat with beans, lentils, or tofu.',
    saving: 8.0,
    difficulty: 'medium',
    points: 25,
  },
  {
    id: 3,
    title: 'LED Lighting Switch',
    description: 'Replace all incandescent bulbs in your home with LED bulbs this week.',
    saving: 3.5,
    difficulty: 'easy',
    points: 10,
  },
  {
    id: 4,
    title: 'Meatless Week',
    description: 'Eliminate meat consumption for an entire week. Focus on plant-based proteins.',
    saving: 12.0,
    difficulty: 'hard',
    points: 50,
  },
  {
    id: 5,
    title: 'Bike Commute Week',
    description: 'Replace all car trips under 5 km with cycling. Use a bike lock and helmet for safety.',
    saving: 15.0,
    difficulty: 'hard',
    points: 50,
  },
  {
    id: 6,
    title: 'Cold Shower Week',
    description: 'Switch to cold or lukewarm showers for 7 days to reduce hot water energy usage.',
    saving: 2.5,
    difficulty: 'medium',
    points: 25,
  },
]

const MAX_POINTS = 150

// No props — reads state via hooks/context
export default function Challenges() {
  const { user } = useAuth()
  const [completedChallenges, setCompletedChallenges] = useState([])
  const [acceptedChallenges, setAcceptedChallenges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadChallenges() {
      if (!user) return
      setLoading(true)
      const { data, error } = await supabase
        .from('challenge_state')
        .select('*')
        .eq('user_id', user.id)

      if (!error && data) {
        const accepted = []
        const completed = []
        data.forEach((row) => {
          if (row.status === 'accepted') {
            accepted.push(row.challenge_id)
          } else if (row.status === 'completed') {
            const ch = WEEKLY_CHALLENGES.find((c) => c.id === row.challenge_id)
            if (ch) {
              completed.push({
                ...ch,
                completedAt: row.completed_at,
              })
            }
          }
        })
        setAcceptedChallenges(accepted)
        setCompletedChallenges(completed)
      }
      setLoading(false)
    }
    loadChallenges()
  }, [user])

  const handleAcceptChallenge = async (challengeId) => {
    if (!user) return
    const updatedAccepted = [...acceptedChallenges, challengeId]
    setAcceptedChallenges(updatedAccepted)

    await supabase
      .from('challenge_state')
      .upsert({
        user_id: user.id,
        challenge_id: challengeId,
        status: 'accepted',
        completed_at: null,
      })
  }

  const handleCompleteChallenge = async (challengeId) => {
    if (!user) return
    const challenge = WEEKLY_CHALLENGES.find((c) => c.id === challengeId)
    if (!challenge) return

    const completedAt = new Date().toISOString()
    const updatedCompleted = [
      ...completedChallenges,
      { ...challenge, completedAt },
    ]
    const updatedAccepted = acceptedChallenges.filter((id) => id !== challengeId)

    setCompletedChallenges(updatedCompleted)
    setAcceptedChallenges(updatedAccepted)

    await supabase
      .from('challenge_state')
      .upsert({
        user_id: user.id,
        challenge_id: challengeId,
        status: 'completed',
        completed_at: completedAt,
      })
  }

  const totalPoints = completedChallenges.reduce((sum, c) => sum + (c.points || 0), 0)
  const totalSaved = completedChallenges.reduce((sum, c) => sum + (c.saving || 0), 0)
  const isEcoChampion = totalPoints >= MAX_POINTS

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Weekly Challenges</h1>
          <p className="text-sm text-gray-500 mt-0.5">Accept challenges and earn points for eco-friendly actions</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block h-8 w-8 border-2 border-green-dark border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-charcoal">Weekly Challenges</h1>
        <p className="text-sm text-gray-500 mt-0.5">Accept challenges and earn points for eco-friendly actions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Progress */}
        <div className="space-y-4">
          {/* Points card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-4 w-4 text-green-dark" strokeWidth={1.5} />
              <h2 className="text-sm font-medium text-charcoal">Your Progress</h2>
            </div>

            <div className="text-3xl font-semibold text-charcoal mb-1">{totalPoints}</div>
            <div className="text-xs text-gray-500 mb-4">of {MAX_POINTS} points for Eco Champion badge</div>

            <ProgressBar value={totalPoints} max={MAX_POINTS} color="#2d6a4f" showLabel={false} />

            {isEcoChampion && (
              <div className="mt-4 bg-green-light border border-green-med/40 rounded-lg p-3 text-center">
                <div className="text-sm font-semibold text-green-dark">Eco Champion</div>
                <div className="text-xs text-green-dark/80 mt-0.5">Weekly badge achieved!</div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-semibold text-charcoal">{completedChallenges.length}</div>
                <div className="text-xs text-gray-500">Done</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-charcoal">{acceptedChallenges.length}</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-dark">{totalSaved.toFixed(0)}</div>
                <div className="text-xs text-gray-500">kg saved</div>
              </div>
            </div>
          </div>

          {/* Points breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm font-medium text-gray-500 mb-3">Points System</h2>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Easy challenge', points: '10 pts', color: 'text-green-dark' },
                { label: 'Medium challenge', points: '25 pts', color: 'text-yellow-600' },
                { label: 'Hard challenge', points: '50 pts', color: 'text-red-600' },
              ].map(({ label, points, color }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-gray-600">{label}</span>
                  <span className={`font-medium ${color}`}>{points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Challenge cards */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WEEKLY_CHALLENGES.map((challenge) => {
              const isCompleted = completedChallenges.some((c) => c.id === challenge.id)
              const isAccepted = acceptedChallenges.includes(challenge.id)

              return (
                <ChallengeCard
                  key={challenge.id}
                  challenge={{ ...challenge, isCompleted, isAccepted }}
                  onAccept={handleAcceptChallenge}
                  onComplete={handleCompleteChallenge}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}