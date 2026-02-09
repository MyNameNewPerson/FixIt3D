// api/search.js
import algoliasearch from 'algoliasearch';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { q = '', brand = '', page = 1, per_page = 20 } = req.query;

  const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
  const ALGOLIA_SEARCH_KEY = process.env.ALGOLIA_SEARCH_KEY;

  if (ALGOLIA_APP_ID && ALGOLIA_SEARCH_KEY) {
    // Real Algolia search (pagination would be handled differently here)
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
    const index = client.initIndex('models');

    try {
      const { hits, nbPages, page: currentPage } = await index.search(q, {
        filters: brand ? `brand:${brand}` : '',
        page: page - 1, // Algolia is 0-indexed
        hitsPerPage: per_page
      });
      return res.status(200).json({ hits, totalPages: nbPages, currentPage: currentPage + 1 });
    } catch (error) {
      console.error('Algolia search error:', error);
      return res.status(500).json({ error: 'Search failed' });
    }
  } else {
    // Fallback to local JSON for dev/demo
    try {
      const dataPath = path.join(process.cwd(), 'data', 'models-index.json');
      if (!fs.existsSync(dataPath)) {
        return res.status(200).json({ hits: [], totalPages: 0, currentPage: 1 });
      }
      const fileData = fs.readFileSync(dataPath, 'utf8');
      let allHits = JSON.parse(fileData);

      let filteredHits = allHits;
      if (q) {
        const query = q.toLowerCase();
        filteredHits = filteredHits.filter(h => 
          h.name.toLowerCase().includes(query) || 
          (h.description && h.description.toLowerCase().includes(query)) ||
          (h.category && h.category.toLowerCase().includes(query))
        );
      }

      if (brand) {
        filteredHits = filteredHits.filter(h => h.brand === brand);
      }

      const totalPages = Math.ceil(filteredHits.length / per_page);
      const currentPage = parseInt(page, 10);
      const start = (currentPage - 1) * per_page;
      const end = start + parseInt(per_page, 10);
      const hits = filteredHits.slice(start, end);

      return res.status(200).json({ hits, totalPages, currentPage, totalResults: filteredHits.length });
    } catch (error) {
      console.error('Local search error:', error);
      return res.status(500).json({ error: 'Search failed' });
    }
  }
}
