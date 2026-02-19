// api/search.js
import fs from 'fs';
import path from 'path';
import { supabase } from '../lib/supabase.js';

const BLACKLIST_WORDS = [
  'joke', 'meme', 'funny', 'gag', 'prank', 'fake', 'parody', 'shit', 'dumb', 'stupid',
  'keychain', 'logo', 'decoration', 'figurine', 'statue', 'ornament', 'fan art',
  'toy', 'miniature', 'sign', 'display', 'stand', 'desktop', 'accessory', 'charm'
];

const FUNCTIONAL_KEYWORDS = [
    'gear', 'knob', 'handle', 'bracket', 'clip', 'button', 'lever', 'mount', 'adapter', 'joint', 'wheel',
    'shaft', 'seal', 'gasket', 'spring', 'latch', 'hinge', 'cap', 'plug', 'cover', 'base', 'housing', 'shell',
    'replacement', 'repair', 'fix', 'part'
];

export default async function handler(req, res) {
  const { q = '', brand = '', mode = 'spare-parts', page = 1, per_page = 20 } = req.query;

  console.log(`[search] Request: mode=${mode}, q=${q}, brand=${brand}, page=${page}`);

  // 1. Try Supabase Search First
  if (process.env.SUPABASE_URL) {
    try {
      let query = supabase.from('models').select('*', { count: 'exact' });

      // Mode filter
      if (mode) query = query.eq('mode', mode);

      // Brand filter
      if (brand) query = query.ilike('brand', brand);

      // Text search
      if (q) {
        // Simple ILIKE search across title, description, brand
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%`);
      }

      // Pagination
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, count, error } = await query;

      if (!error && data && data.length > 0) {
        const hits = data.map(m => ({
          id: m.id,
          name: m.title, // Map DB title to frontend name
          description: m.description,
          image: m.image_url, // Map DB image_url to frontend image
          link: m.url,
          source: m.source,
          price: m.price,
          author: m.author,
          brand: m.brand,
          mode: m.mode,
          source_url: m.url,
          objectID: m.id // for compatibility
        }));

        return res.status(200).json({
          hits,
          totalPages: Math.ceil(count / per_page),
          currentPage: parseInt(page),
          totalResults: count
        });
      }

      if (error) {
        console.warn('[Supabase] Search error (falling back to local):', error.message);
      } else {
        console.log('[Supabase] No results found, falling back to local file.');
      }
    } catch (dbErr) {
      console.error('[Supabase] Unexpected error:', dbErr);
    }
  }

  // 2. Fallback to Local JSON (original logic)
  try {
    const dataPath = path.resolve(process.cwd(), 'data', 'models-index.json');
    console.log(`[search] Reading data from: ${dataPath}`);

    if (!fs.existsSync(dataPath)) {
      // If no DB results AND no local file, return empty with warning
      console.error(`[ERROR] Search index NOT FOUND at: ${dataPath}.`);
      return res.status(200).json({
        hits: [],
        totalPages: 0,
        currentPage: 1,
        totalResults: 0,
        warning: 'Data index not found. Please populate Supabase or run parsers.'
      });
    }

    const fileData = fs.readFileSync(dataPath, 'utf8');
    let allHits = [];
    try {
        allHits = JSON.parse(fileData);
    } catch (parseErr) {
        console.error(`[search] Failed to parse JSON: ${parseErr.message}`);
        return res.status(500).json({ error: 'Data index is corrupted' });
    }

    // Filter by mode
    let filteredHits = allHits.filter(h => h.mode === mode);

    // Apply Blacklist for technical modes
    if (['spare-parts', 'auto', 'home'].includes(mode)) {
      filteredHits = filteredHits.filter(h => {
        const text = (h.name + ' ' + (h.description || '')).toLowerCase();

        // 1. Check blacklist
        if (BLACKLIST_WORDS.some(word => text.includes(word))) return false;

        // 2. Strict functional check for branded items in spare-parts
        if (mode === 'spare-parts') {
            const brands = ['bosch', 'dyson', 'samsung', 'lg', 'whirlpool', 'miele', 'ikea', 'kitchenaid'];
            const containsBrand = brands.some(b => text.includes(b));

            if (containsBrand) {
                const hasFunctional = FUNCTIONAL_KEYWORDS.some(fk => text.includes(fk));
                if (!hasFunctional) return false;
            }
        }

        return true;
      });

      // Also ensure brand consistency if specified
      if (brand) {
        const brandL = brand.toLowerCase();
        filteredHits = filteredHits.filter(h => {
           const name = h.name.toLowerCase();
           return (h.brand && h.brand.toLowerCase() === brandL) || name.includes(brandL);
        });
      }
    } else {
      // For Hobby, maybe less strict, but still avoid "shit/dumb" etc.
      const toxicWords = ['shit', 'dumb', 'stupid', 'fake'];
      filteredHits = filteredHits.filter(h => {
        const text = h.name.toLowerCase();
        return !toxicWords.some(word => text.includes(word));
      });

      if (brand) {
        filteredHits = filteredHits.filter(h => h.brand === brand || h.category === brand);
      }
    }

    // Filter by search query
    if (q) {
      const query = q.toLowerCase();
      filteredHits = filteredHits.filter(h =>
        h.name.toLowerCase().includes(query) ||
        (h.description && h.description.toLowerCase().includes(query)) ||
        (h.category && h.category.toLowerCase().includes(query)) ||
        (h.brand && h.brand.toLowerCase().includes(query))
      );
    }

    // Generic brand filter (for chips)
    if (brand && mode !== 'spare-parts') {
      filteredHits = filteredHits.filter(h => h.brand === brand || h.category === brand);
    }

    const totalResults = filteredHits.length;
    const totalPages = Math.ceil(totalResults / per_page);
    const currentPage = parseInt(page, 10);
    const start = (currentPage - 1) * per_page;
    const end = start + parseInt(per_page, 10);
    const hits = filteredHits.slice(start, end);

    return res.status(200).json({ hits, totalPages, currentPage, totalResults });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
}
