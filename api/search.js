// api/search.js
import fs from 'fs';
import path from 'path';

const BLACKLIST_WORDS = [
  'joke', 'meme', 'funny', 'gag', 'prank', 'fake', 'parody', 'shit', 'dumb', 'stupid',
  'keychain', 'logo', 'decoration', 'figurine', 'statue', 'ornament', 'fan art'
];

export default async function handler(req, res) {
  const { q = '', brand = '', mode = 'spare-parts', page = 1, per_page = 20 } = req.query;

  try {
    const dataPath = path.join(process.cwd(), 'data', 'models-index.json');
    if (!fs.existsSync(dataPath)) {
      return res.status(200).json({ hits: [], totalPages: 0, currentPage: 1, totalResults: 0 });
    }

    const fileData = fs.readFileSync(dataPath, 'utf8');
    let allHits = JSON.parse(fileData);

    // Filter by mode
    let filteredHits = allHits.filter(h => h.mode === mode);

    // Apply Blacklist for SPARE PARTS specifically
    if (mode === 'spare-parts') {
      filteredHits = filteredHits.filter(h => {
        const text = (h.name + ' ' + (h.description || '')).toLowerCase();
        return !BLACKLIST_WORDS.some(word => text.includes(word));
      });

      // Also ensure functional keywords if brand is mentioned
      if (brand) {
        const brandL = brand.toLowerCase();
        filteredHits = filteredHits.filter(h => {
           const name = h.name.toLowerCase();
           return h.brand === brand || name.includes(brandL);
        });
      }
    } else {
      // For Hobby, maybe less strict, but still avoid "shit/dumb" etc.
      const toxicWords = ['shit', 'dumb', 'stupid', 'fake'];
      filteredHits = filteredHits.filter(h => {
        const text = h.name.toLowerCase();
        return !toxicWords.some(word => text.includes(word));
      });
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
