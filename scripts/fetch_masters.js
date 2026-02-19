import fetch from 'node-fetch';
import { supabase } from '../lib/supabase.js';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Query for nodes/ways tagged as 3d printing services
const QUERY = `
[out:json][timeout:25];
(
  node["craft"="3d_printing"];
  way["craft"="3d_printing"];
  node["office"="3d_printing"];
);
out center;
`;

async function fetchOverpass() {
  const body = `data=${encodeURIComponent(QUERY)}`;
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function saveMasters(elements) {
  let newCount = 0;

  for (const e of elements) {
    const lat = e.lat || (e.center ? e.center.lat : null);
    const lng = e.lon || (e.center ? e.center.lon : null);

    if (!lat || !lng) continue;

    const master = {
      name: e.tags.name || '3D Printing Service',
      lat: lat,
      lng: lng,
      address: [
        e.tags['addr:street'],
        e.tags['addr:housenumber'],
        e.tags['addr:city']
      ].filter(Boolean).join(', ') || 'Address not provided',
      contacts: {
        phone: e.tags.phone || e.tags['contact:phone'],
        website: e.tags.website || e.tags['contact:website'],
        email: e.tags.email || e.tags['contact:email']
      },
      source: 'osm',
      is_premium: false,
      balance: 0,
      verified: true // OSM data is generally considered verified public data
    };

    // Check for duplicates based on location (approximate)
    const { data: existing } = await supabase
      .from('masters')
      .select('id')
      .eq('lat', lat)
      .eq('lng', lng)
      .limit(1);

    if (!existing || existing.length === 0) {
      const { error } = await supabase.from('masters').insert(master);
      if (error) {
        console.error('Error inserting master:', error.message);
      } else {
        newCount++;
      }
    }
  }

  console.log(`Added ${newCount} new masters.`);
}

(async () => {
  try {
    console.log('Fetching 3D printing services from OpenStreetMap...');
    const data = await fetchOverpass();
    console.log(`Found ${data.elements.length} elements from OSM.`);
    await saveMasters(data.elements);
    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
