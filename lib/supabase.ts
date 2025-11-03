import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseClient: ReturnType<typeof createClient> | null = null;
let isInitialized = false;

// Create a single supabase client for interacting with your database
try {
  supabaseClient = supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            'x-application-name': 'btc1usd-frontend'
          }
        }
      })
    : null;
  isInitialized = true;
} catch (error) {
  console.warn('⚠️ Failed to initialize Supabase client:', (error as Error).message);
  supabaseClient = null;
  isInitialized = false;
}

export const supabase = supabaseClient;

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return isInitialized && !!(supabaseUrl && supabaseUrl.length > 0 && supabaseAnonKey && supabaseAnonKey.length > 0);
};

// Types for database
export interface MerkleDistributionRow {
  id: number;
  merkle_root: string;
  total_rewards: string;
  claims: any; // JSONB
  metadata: any; // JSONB
  created_at: string;
}