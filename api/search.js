// api/search.js
import fs from 'fs';
import path from 'path';

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

    // Filter by query
    if (q) {
      const query = q.toLowerCase();
      filteredHits = filteredHits.filter(h =>
        h.name.toLowerCase().includes(query) ||
        (h.description && h.description.toLowerCase().includes(query)) ||
        (h.category && h.category.toLowerCase().includes(query))
      );
    }

    // Filter by brand
    if (brand) {
      filteredHits = filteredHits.filter(h => h.brand === brand);
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
