import { supabase } from '../lib/supabase.js';

export default async function handler(req, res) {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;

    let query = supabase
      .from('masters')
      .select('id, name, lat, lng, address, is_premium, source, verified')
      .order('is_premium', { ascending: false });

    if (minLat && maxLat && minLng && maxLng) {
      query = query
        .gte('lat', minLat)
        .lte('lat', maxLat)
        .gte('lng', minLng)
        .lte('lng', maxLng);
    } else {
      // Default limit if no bounds (e.g., first 100)
      query = query.limit(100);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch masters' });
    }

    // Map to frontend structure
    const masters = data.map(m => ({
      id: m.id,
      name: m.name,
      lat: m.lat,
      lng: m.lng,
      address: m.address,
      is_premium: m.is_premium,
      source: m.source,
      verified: m.verified,
      has_contacts: true // Indicator that contacts exist (but are hidden)
    }));

    return res.status(200).json({ masters });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
