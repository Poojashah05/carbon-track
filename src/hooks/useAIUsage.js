/**
 * @file useAIUsage.js
 * @description Tracks monthly AI insight generation count.
 *   Enforces a hard limit of 2 generations per calendar month per user.
 */

import { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabaseClient';
import { getItem, setItem } from '../utils/storage';
import logger from '../utils/logger';

const MAX_MONTHLY = 2;
const CACHE_KEY = 'ai_usage';

/**
 * @typedef {Object} UseAIUsageReturn
 * @property {number} used - Number of generations used this month
 * @property {number} remaining - Remaining generations (0–2)
 * @property {boolean} canGenerate - Whether the user can still generate
 * @property {boolean} isLoading - Whether the usage data is loading
 * @property {function(): Promise<void>} recordUsage - Increments the usage counter
 */

/**
 * Manages AI insight usage tracking and rate limiting.
 * @returns {UseAIUsageReturn}
 */
export function useAIUsage() {
  const [used, setUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const monthKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      // Fallback to localStorage
      const cached = getItem(CACHE_KEY, {});
      setUsed(cached[monthKey()] ?? 0);
      setIsLoading(false);
      return;
    }

    const fetchUsage = async () => {
      setIsLoading(true);
      try {
        const mk = monthKey();
        const { data, error } = await supabase
          .from('ai_usage')
          .select('count')
          .eq('user_id', user.id)
          .eq('month_key', mk)
          .maybeSingle();

        if (error) throw error;
        const count = data?.count ?? 0;
        setUsed(count);
        setItem(CACHE_KEY, { [mk]: count });
      } catch (err) {
        logger.error('Failed to fetch AI usage:', err);
        const cached = getItem(CACHE_KEY, {});
        setUsed(cached[monthKey()] ?? 0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsage();
  }, [user]);

  /**
   * Records one AI generation usage.
   * @returns {Promise<void>}
   */
  const recordUsage = useCallback(async () => {
    const mk = monthKey();
    const newCount = used + 1;

    if (!user) {
      setUsed(newCount);
      setItem(CACHE_KEY, { [mk]: newCount });
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('ai_usage')
        .select('id, count')
        .eq('user_id', user.id)
        .eq('month_key', mk)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('ai_usage')
          .update({ count: existing.count + 1 })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('ai_usage')
          .insert({ user_id: user.id, month_key: mk, count: 1 });
      }
      setUsed(newCount);
      setItem(CACHE_KEY, { [mk]: newCount });
    } catch (err) {
      logger.error('Failed to record AI usage:', err);
    }
  }, [user, used]);

  return {
    used,
    remaining: Math.max(0, MAX_MONTHLY - used),
    canGenerate: used < MAX_MONTHLY,
    isLoading,
    recordUsage,
  };
}
