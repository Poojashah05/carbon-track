/**
 * AI Insights usage tracking — 2 per calendar month per user
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const MONTHLY_LIMIT = 2

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function useAIUsage() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const month = currentMonth()

  const fetchUsage = useCallback(async () => {
    if (!user) { setCount(0); setLoading(false); return }
    const { data } = await supabase
      .from('ai_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('month', month)
      .maybeSingle()
    setCount(data?.count ?? 0)
    setLoading(false)
  }, [user, month])

  useEffect(() => { fetchUsage() }, [fetchUsage])

  const incrementUsage = useCallback(async () => {
    if (!user) return
    const newCount = count + 1
    await supabase.from('ai_usage').upsert(
      { user_id: user.id, month, count: newCount },
      { onConflict: 'user_id,month' }
    )
    setCount(newCount)
  }, [user, month, count])

  return {
    count,
    loading,
    limit: MONTHLY_LIMIT,
    remaining: Math.max(0, MONTHLY_LIMIT - count),
    canUse: count < MONTHLY_LIMIT,
    incrementUsage,
  }
}
