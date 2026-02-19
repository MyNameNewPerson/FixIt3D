import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Warning: SUPABASE_URL or SUPABASE_KEY is missing. Database operations may fail.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');
