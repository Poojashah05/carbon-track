/**
 * useEmissions — Supabase-backed emission logs and profile
 * Replaces the old localStorage-based hook
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getTotalMonthlyEmission, getCategoryBreakdown } from '../utils/emissionFactors'

export function useEmissions() {
  const { user, profile, updateProfile } = useAuth()
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // ── Fetch logs from Supabase ─────────────────────────────
  const fetchLogs = useCallback(async () => {
    if (!user) { setLogs([]); setIsLoading(false); return }
    setIsLoading(true)
    const { data, error } = await supabase
      .from('emission_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (!error && data) {
      // Map snake_case DB columns to camelCase for components
      setLogs(data.map(row => ({
        id: row.id,
        category: row.category,
        subcategory: row.subcategory,
        quantity: row.quantity,
        co2Kg: Number(row.co2_kg),
        date: row.date,
        createdAt: row.created_at,
      })))
    }
    setIsLoading(false)
  }, [user])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // ── Add a log ────────────────────────────────────────────
  const addLog = useCallback(async ({ category, subcategory, quantity, date, co2Kg }) => {
    if (!user) return
    const { data, error } = await supabase
      .from('emission_logs')
      .insert({
        user_id: user.id,
        category,
        subcategory,
        quantity,
        co2_kg: co2Kg,
        date,
      })
      .select()
      .single()
    if (!error && data) {
      setLogs(prev => [{
        id: data.id,
        category: data.category,
        subcategory: data.subcategory,
        quantity: data.quantity,
        co2Kg: Number(data.co2_kg),
        date: data.date,
        createdAt: data.created_at,
      }, ...prev])
    }
    return { error }
  }, [user])

  // ── Profile helpers (delegate to AuthContext) ────────────
  const setProfile = useCallback((updates) => updateProfile(updates), [updateProfile])

  // ── Computed values ──────────────────────────────────────
  const totalMonthlyEmission = getTotalMonthlyEmission(logs)
  const categoryBreakdown = getCategoryBreakdown(logs)

  return {
    logs,
    isLoading,
    addLog,
    fetchLogs,
    totalMonthlyEmission,
    categoryBreakdown,
    userProfile: profile,
    setProfile,
  }
}