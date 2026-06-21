/**
 * Custom hook for Groq API integration with streaming and persistent history support
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { storage } from '../utils/storage'

const API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

/**
 * @typedef {Object} EmissionData
 * @property {number} transportKg
 * @property {number} foodKg
 * @property {number} energyKg
 * @property {number} shoppingKg
 * @property {number} totalKg
 * @property {string} status
 * @property {string} percent
 */

export function useGroqInsights() {
  const { user } = useAuth()
  const [insights, setInsights] = useState('')
  const [insightsHistory, setInsightsHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)

  // ── Fetch history ───────────────────────────────────────
  const fetchInsightsHistory = useCallback(async () => {
    if (!user) {
      setInsightsHistory([])
      return
    }
    setIsHistoryLoading(true)

    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setInsightsHistory(data)
        // Cache in local storage
        storage.setItem(`co2track_ai_insights_${user.id}`, data)
      } else {
        // Fallback to local storage
        const localData = storage.getItem(`co2track_ai_insights_${user.id}`, [])
        setInsightsHistory(localData)
      }
    } catch {
      // Fallback on exception
      const localData = storage.getItem(`co2track_ai_insights_${user.id}`, [])
      setInsightsHistory(localData)
    } finally {
      setIsHistoryLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchInsightsHistory()
  }, [fetchInsightsHistory])

  // ── Save new insight ─────────────────────────────────────
  const saveInsight = useCallback(async (content) => {
    if (!user || !content.trim()) return null

    const newInsightRow = {
      user_id: user.id,
      content: content.trim(),
      created_at: new Date().toISOString()
    }

    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .insert(newInsightRow)
        .select()
        .single()

      if (!error && data) {
        setInsightsHistory(prev => [data, ...prev])
        // Sync local storage
        const parsedLocal = storage.getItem(`co2track_ai_insights_${user.id}`, [])
        storage.setItem(`co2track_ai_insights_${user.id}`, [data, ...parsedLocal])
        return data
      } else {
        // Fallback to local storage (generate mock id)
        const mockRow = { ...newInsightRow, id: Math.random().toString(36).substr(2, 9) }
        setInsightsHistory(prev => [mockRow, ...prev])
        const parsedLocal = storage.getItem(`co2track_ai_insights_${user.id}`, [])
        storage.setItem(`co2track_ai_insights_${user.id}`, [mockRow, ...parsedLocal])
        return mockRow
      }
    } catch {
      // Fallback to local storage
      const mockRow = { ...newInsightRow, id: Math.random().toString(36).substr(2, 9) }
      setInsightsHistory(prev => [mockRow, ...prev])
      const parsedLocal = storage.getItem(`co2track_ai_insights_${user.id}`, [])
      storage.setItem(`co2track_ai_insights_${user.id}`, [mockRow, ...parsedLocal])
      return mockRow
    }
  }, [user])

  // ── Generate insights from Groq API using streaming ─────
  const generateInsights = useCallback(async (emissionData) => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY
    if (!apiKey) {
      setError('GROQ API key not configured. Add VITE_GROQ_API_KEY to your .env file.')
      return
    }

    // Abort any in-progress request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    setError(null)
    setInsights('')

    const systemPrompt = `You are EcoTrack's carbon footprint advisor. The user's current monthly emissions are:
- Transport: ${emissionData.transportKg.toFixed(1)} kg CO₂
- Food: ${emissionData.foodKg.toFixed(1)} kg CO₂
- Home energy: ${emissionData.energyKg.toFixed(1)} kg CO₂
- Shopping: ${emissionData.shoppingKg.toFixed(1)} kg CO₂
- Total: ${emissionData.totalKg.toFixed(1)} kg CO₂/month
- Global average: 391.67 kg CO₂/month
- User's status: ${emissionData.status} average by ${emissionData.percent}%

Give specific, ranked, actionable advice based on THIS user's actual biggest emission category. Be concise. Never give generic climate facts. Always start with their highest-impact category. Format your response as 3 numbered insights, each under 60 words.`

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Generate insights based on my emission data.' },
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 500,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body received from API')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                fullResponse += content
                setInsights(fullResponse)
              }
            } catch {
              // Ignore malformed stream chunks
            }
          }
        }
      }

      // Stream successfully completed, save to history database
      if (fullResponse.trim()) {
        await saveInsight(fullResponse)
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message || 'Failed to generate insights. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [saveInsight])

  // ── Chat with Groq using conversation history ───────────
  const chat = useCallback(async (userMessage, history, emissionData) => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY
    if (!apiKey) {
      return 'API key not configured.'
    }

    const systemPrompt = `You are EcoTrack's carbon footprint advisor. The user's monthly emissions: Transport ${emissionData.transportKg?.toFixed(1) ?? 0} kg, Food ${emissionData.foodKg?.toFixed(1) ?? 0} kg, Energy ${emissionData.energyKg?.toFixed(1) ?? 0} kg, Shopping ${emissionData.shoppingKg?.toFixed(1) ?? 0} kg (Total: ${emissionData.totalKg?.toFixed(1) ?? 0} kg). Answer questions about reducing carbon footprint concisely and specifically.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-4).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
      { role: 'user', content: userMessage },
    ]

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 300,
        }),
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = await response.json()
      return data.choices?.[0]?.message?.content || 'No response received.'
    } catch (err) {
      return `Error: ${err.message}`
    }
  }, [])

  const retry = useCallback(() => {
    setError(null)
    setInsights('')
  }, [])

  return {
    insights,
    insightsHistory,
    isLoading,
    isHistoryLoading,
    error,
    generateInsights,
    chat,
    retry,
    refetchHistory: fetchInsightsHistory,
  }
}