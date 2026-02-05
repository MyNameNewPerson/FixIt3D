// api/search.js
import algoliasearch from 'algoliasearch';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { q = '', brand = '' } = req.query;

  const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
  const ALGOLIA_SEARCH_KEY = process.env.ALGOLIA_SEARCH_KEY;

  if (ALGOLIA_APP_ID && ALGOLIA_SEARCH_KEY) {
    // Real Algolia search
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
    const index = client.initIndex('models');

    try {
      const { hits } = await index.search(q, {
        filters: brand ? `brand:${brand}` : '',
        hitsPerPage: 20
      });
      return res.status(200).json({ hits });
    } catch (error) {
      console.error('Algolia search error:', error);
      return res.status(500).json({ error: 'Search failed' });
    }
  } else {
    // Fallback to local JSON for dev/demo
    try {
      const dataPath = path.join(process.cwd(), 'data', 'models-index.json');
      if (!fs.existsSync(dataPath)) {
        return res.status(200).json({ hits: [] });
      }
      const fileData = fs.readFileSync(dataPath, 'utf8');
      let hits = JSON.parse(fileData);

      if (q) {
        const query = q.toLowerCase();
        hits = hits.filter(h => 
          h.name.toLowerCase().includes(query) || 
          (h.description && h.description.toLowerCase().includes(query))
        );
      }

      if (brand) {
        hits = hits.filter(h => h.brand === brand);
      }

      return res.status(200).json({ hits: hits.slice(0, 20) });
    } catch (error) {
      console.error('Local search error:', error);
      return res.status(500).json({ error: 'Search failed' });
    }
  }
}
