import fetch from 'node-fetch';
import { supabase } from '../lib/supabase.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const API_KEY = process.env.MYMINIFACTORY_TOKEN;
// Note: MyMiniFactory V2 API endpoint structure
const API_URL = 'https://www.myminifactory.com/api/v2/search';

async function searchMyMiniFactory(query = '', page = 1) {
  if (!API_KEY) {
    console.warn('Warning: MYMINIFACTORY_TOKEN is missing in .env. Skipping MMF fetch.');
    return [];
  }

  // Ensure query is encoded
  const url = `${API_URL}?q=${encodeURIComponent(query)}&page=${page}&per_page=20`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`MyMiniFactory API Error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    // API usually returns { items: [...] } or just [...] depending on endpoint
    return data.items || data || [];
  } catch (error) {
    console.error('Failed to fetch from MyMiniFactory:', error.message);
    return [];
  }
}

async function saveToSupabase(items) {
  if (!items || !items.length) return;

  // Map API response to our schema
  const records = items.map(item => {
    // Determine mode based on keywords
    let mode = 'hobby';
    const text = (item.name + ' ' + (item.description || '')).toLowerCase();
    if (text.includes('gear') || text.includes('bracket') || text.includes('part') || text.includes('repair')) {
      mode = 'spare-parts';
    } else if (text.includes('car') || text.includes('auto') || text.includes('vehicle')) {
      mode = 'auto';
    } else if (text.includes('home') || text.includes('kitchen') || text.includes('bathroom')) {
      mode = 'home';
    }

    return {
      id: `mmf_${item.id}`,
      title: item.name,
      description: (item.description || '').substring(0, 500), // Truncate
      url: item.url || `https://www.myminifactory.com/object/3d-print-${item.id}`,
      image_url: (item.images && item.images.length > 0) ? item.images[0].original : null,
      author: item.author ? item.author.username : 'Unknown',
      source: 'MyMiniFactory',
      price: (item.price && item.price > 0) ? `${item.price} USD` : 'free',
      mode: mode,
      created_at: new Date().toISOString()
    };
  });

  const { data, error } = await supabase
    .from('models')
    .upsert(records, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('Error saving to Supabase:', error.message);
  } else {
    console.log(`Saved ${records.length} models to Supabase.`);
  }
}

// Main execution function
async function run() {
  console.log('Starting MyMiniFactory parser...');

  // Example queries to populate the DB with diverse content
  const queries = ['spare parts', 'gear', 'bracket', 'toy', 'figure', 'car part', 'home decor'];

  for (const q of queries) {
    console.log(`Searching for: ${q}`);
    const items = await searchMyMiniFactory(q);
    await saveToSupabase(items);
    // Be nice to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('Done.');
}

// Execute if run directly
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
    run().catch(console.error);
}

export { run };
