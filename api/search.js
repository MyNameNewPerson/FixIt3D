// api/search.js
import fs from 'fs';
import path from 'path';

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

  try {
    const dataPath = path.resolve(process.cwd(), 'public', 'data', 'models-index.json');
    console.log(`[search] Reading data from: ${dataPath}`);

    if (!fs.existsSync(dataPath)) {
      console.warn(`[search] Index file NOT FOUND at ${dataPath}. Returning empty results.`);
      return res.status(200).json({ hits: [], totalPages: 0, currentPage: 1, totalResults: 0 });
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
