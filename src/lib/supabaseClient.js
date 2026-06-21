/**
 * @file supabaseClient.js
 * @description Singleton Supabase client instance.
 *   Reads credentials from Vite environment variables.
 *   Falls back gracefully when env vars are not configured.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

/** @type {import('@supabase/supabase-js').SupabaseClient} */
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

/**
 * Whether Supabase is properly configured with real env vars.
 * @type {boolean}
 */
export const isSupabaseConfigured =
  !!import.meta.env.VITE_SUPABASE_URL &&
  !!import.meta.env.VITE_SUPABASE_ANON_KEY;
