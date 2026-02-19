import { supabase } from './supabase.js';

let cache = {};
const TTL = 1000 * 60 * 5; // 5 minutes
let lastFetch = 0;

export async function getConfig(key) {
  const now = Date.now();
  if (now - lastFetch > TTL || !cache[key]) {
    await refreshConfig();
  }
  return cache[key];
}

async function refreshConfig() {
  const { data, error } = await supabase.from('app_config').select('key, value');
  if (data) {
    data.forEach(item => {
      cache[item.key] = item.value;
    });
    lastFetch = Date.now();
    console.log('[Config] Refreshed app_config from DB');
  } else if (error) {
    console.error('[Config] Failed to fetch config:', error.message);
  }
}

// Admin helper to update cache immediately
export function invalidateConfig() {
  lastFetch = 0;
}
