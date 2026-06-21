/**
 * @file useEmissions.js
 * @description Custom hook for managing emission logs.
 *   Syncs between Supabase (primary) and localStorage (offline cache).
 */

import { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabaseClient';
import { getItem, setItem } from '../utils/storage';
import logger from '../utils/logger';

const CACHE_KEY = 'emission_logs';

/**
 * @typedef {Object} EmissionLog
 * @property {string} id - UUID
 * @property {string} user_id - Supabase user UUID
 * @property {string} category - 'transport' | 'food' | 'energy' | 'shopping'
 * @property {string} subcategory - Subcategory key from FACTORS
 * @property {number} quantity - Amount of activity
 * @property {number} kg_co2 - Calculated CO₂ in kg
 * @property {string} logged_at - ISO timestamp
 * @property {string} [note] - Optional user note
 */

/**
 * @typedef {Object} UseEmissionsReturn
 * @property {EmissionLog[]} logs - Current month's emission logs
 * @property {boolean} isLoading - Whether logs are being fetched
 * @property {string|null} error - Error message if fetch failed
 * @property {function(Omit<EmissionLog,'id'|'user_id'>): Promise<void>} addLog
 * @property {function(string): Promise<void>} deleteLog
 * @property {function(): void} refetch
 */

/**
 * Manages emission logs with Supabase sync and localStorage fallback.
 * @returns {UseEmissionsReturn}
 */
export function useEmissions() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Track authenticated user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!user) {
      // Offline fallback
      const cached = getItem(CACHE_KEY, []);
      setLogs(cached);
      setIsLoading(false);
      return;
    }

    try {
      // Current calendar month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data, error: sbError } = await supabase
        .from('emission_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', monthStart)
        .order('logged_at', { ascending: false });

      if (sbError) throw sbError;

      setLogs(data || []);
      setItem(CACHE_KEY, data || []);
    } catch (err) {
      logger.error('Failed to fetch emission logs:', err);
      setError('Could not load your activity logs. Using cached data.');
      const cached = getItem(CACHE_KEY, []);
      setLogs(cached);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  /**
   * Adds a new emission log entry.
   * @param {Omit<EmissionLog,'id'|'user_id'>} logData
   */
  const addLog = useCallback(async (logData) => {
    if (!user) {
      const newLog = { ...logData, id: crypto.randomUUID(), user_id: 'local' };
      const updated = [newLog, ...logs];
      setLogs(updated);
      setItem(CACHE_KEY, updated);
      return;
    }
    const { data, error: sbError } = await supabase
      .from('emission_logs')
      .insert({ ...logData, user_id: user.id })
      .select()
      .single();
    if (sbError) throw sbError;
    const updated = [data, ...logs];
    setLogs(updated);
    setItem(CACHE_KEY, updated);
  }, [user, logs]);

  /**
   * Deletes an emission log entry by ID.
   * @param {string} id
   */
  const deleteLog = useCallback(async (id) => {
    if (!user) {
      const updated = logs.filter((l) => l.id !== id);
      setLogs(updated);
      setItem(CACHE_KEY, updated);
      return;
    }
    const { error: sbError } = await supabase
      .from('emission_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (sbError) throw sbError;
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    setItem(CACHE_KEY, updated);
  }, [user, logs]);

  return { logs, isLoading, error, addLog, deleteLog, refetch: fetchLogs };
}
