/**
 * @file useGroqInsights.js
 * @description Groq API hook with token-by-token streaming, monthly rate limiting,
 *   Supabase caching, and localStorage sync.
 */

import { useState, useCallback, useEffect } from 'react';
import supabase from '../lib/supabaseClient';
import { useAIUsage } from './useAIUsage';
import { getItem, setItem } from '../utils/storage';
import logger from '../utils/logger';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';
const INSIGHTS_CACHE_KEY = 'ai_insights';

/**
 * @typedef {Object} InsightReport
 * @property {string} id - UUID
 * @property {string} content - The AI-generated insight text
 * @property {string} created_at - ISO timestamp
 * @property {Object} emission_snapshot - The emission data used to generate this
 */

/**
 * @typedef {Object} UseGroqInsightsReturn
 * @property {InsightReport[]} reports - Historical insight reports (newest first)
 * @property {string} streamingContent - Currently streaming token content
 * @property {boolean} isStreaming - Whether a generation is in progress
 * @property {string|null} error - Error message if last generation failed
 * @property {function(): Promise<void>} generate - Triggers a new AI generation
 * @property {number} remainingCount - Number of AI generations left this month
 * @property {boolean} canGenerate - Whether user can still generate
 */

/**
 * Builds the system prompt injecting user emission data.
 * @param {Object} emissions
 * @returns {string}
 */
function buildSystemPrompt(emissions) {
  const { transportKg, foodKg, energyKg, shoppingKg, totalKg, globalAvg } = emissions;
  const pct = totalKg > 0
    ? Math.abs(Math.round(((totalKg - globalAvg) / globalAvg) * 100))
    : 0;
  const status = totalKg > globalAvg ? 'above' : 'below';

  return `You are CO2Track's carbon footprint advisor. The user's current monthly emissions are:
- Transport: ${transportKg.toFixed(1)} kg CO₂
- Food: ${foodKg.toFixed(1)} kg CO₂
- Home energy: ${energyKg.toFixed(1)} kg CO₂
- Shopping: ${shoppingKg.toFixed(1)} kg CO₂
- Total: ${totalKg.toFixed(1)} kg CO₂/month
- Global average: ${globalAvg} kg CO₂/month
- User's status: ${status} average by ${pct}%

Give specific, ranked, actionable advice based on THIS user's actual biggest emission category. Be concise. Never give generic climate facts. Always start with their highest-impact category. Format your response as 3 numbered insights, each under 60 words.`;
}

/**
 * Hook for Groq AI insight generation with streaming, caching, and rate limiting.
 * @param {Object} emissionData - User's categorised emission totals
 * @returns {UseGroqInsightsReturn}
 */
export function useGroqInsights(emissionData) {
  const [reports, setReports] = useState([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const { remaining, canGenerate, recordUsage } = useAIUsage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  // Load cached reports on mount
  useEffect(() => {
    const loadReports = async () => {
      if (!user) {
        const cached = getItem(INSIGHTS_CACHE_KEY, []);
        setReports(cached);
        return;
      }
      try {
        const { data, error: sbErr } = await supabase
          .from('ai_insights')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (sbErr) throw sbErr;
        setReports(data || []);
        setItem(INSIGHTS_CACHE_KEY, data || []);
      } catch (err) {
        logger.error('Failed to load AI insights:', err);
        const cached = getItem(INSIGHTS_CACHE_KEY, []);
        setReports(cached);
      }
    };
    loadReports();
  }, [user]);

  /**
   * Generates a new AI insight report via streaming.
   * @returns {Promise<void>}
   */
  const generate = useCallback(async () => {
    if (!canGenerate) {
      setError('You have used all 2 AI insight generations for this month.');
      return;
    }
    if (isStreaming) return;

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      setError('Groq API key is not configured. Please add VITE_GROQ_API_KEY to your .env file.');
      return;
    }

    setIsStreaming(true);
    setError(null);
    setStreamingContent('');

    try {
      await recordUsage();

      const systemPrompt = buildSystemPrompt(emissionData);
      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Generate my personalised carbon reduction insights.' },
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 512,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const json = line.replace('data: ', '').trim();
          if (json === '[DONE]') break;

          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              fullContent += delta;
              setStreamingContent((prev) => prev + delta);
            }
          } catch {
            // Ignore malformed SSE chunks
          }
        }
      }

      // Persist to Supabase and local state
      const newReport = {
        id: crypto.randomUUID(),
        content: fullContent,
        created_at: new Date().toISOString(),
        emission_snapshot: emissionData,
      };

      if (user) {
        const { data: saved } = await supabase
          .from('ai_insights')
          .insert({ ...newReport, user_id: user.id })
          .select()
          .single();
        if (saved) newReport.id = saved.id;
      }

      const updatedReports = [newReport, ...reports];
      setReports(updatedReports);
      setItem(INSIGHTS_CACHE_KEY, updatedReports);
      setStreamingContent('');
    } catch (err) {
      logger.error('Groq streaming error:', err);
      setError(err.message || 'Failed to generate insights. Please try again.');
    } finally {
      setIsStreaming(false);
    }
  }, [canGenerate, isStreaming, emissionData, recordUsage, user, reports]);

  return {
    reports,
    streamingContent,
    isStreaming,
    error,
    generate,
    remainingCount: remaining,
    canGenerate,
  };
}
