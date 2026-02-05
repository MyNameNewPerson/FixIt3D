// api/download.js
import JSZip from 'jszip';
import algoliasearch from 'algoliasearch';
import fs from 'fs';
import path from 'path';

async function getModelMetadata(modelId) {
  const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
  const ALGOLIA_SEARCH_KEY = process.env.ALGOLIA_SEARCH_KEY;

  if (ALGOLIA_APP_ID && ALGOLIA_SEARCH_KEY) {
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
    const index = client.initIndex('models');
    try {
      return await index.getObject(modelId);
    } catch (e) {
      console.error('Algolia getObject error:', e);
    }
  }

  // Fallback to local data
  const dataPath = path.join(process.cwd(), 'data', 'models-index.json');
  if (fs.existsSync(dataPath)) {
    const hits = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    return hits.find(h => h.objectID === modelId);
  }
  return null;
}

export default async function handler(req, res) {
  const { modelId } = req.query;

  if (!modelId) {
    return res.status(400).json({ error: 'Model ID is required' });
  }

  const model = await getModelMetadata(modelId);
  if (!model || !model.stl_url) {
    return res.status(404).json({ error: 'Model or STL URL not found' });
  }

  try {
    const stlResponse = await fetch(model.stl_url);
    if (!stlResponse.ok) throw new Error('Failed to fetch STL');
    const stlBuffer = await stlResponse.arrayBuffer();

    const zip = new JSZip();
    zip.file(`${model.name.replace(/[^a-z0-9]/gi, '_')}.stl`, stlBuffer);
    
    zip.file('LICENSE.txt', `
Creative Commons Attribution 4.0 International

This model is provided under the license: ${model.license}
Full text: https://creativecommons.org/licenses/by/4.0/
    `);

    zip.file('README.txt', `
MODEL: ${model.name}
AUTHOR: ${model.author}
SOURCE: ${model.source_url}
LICENSE: ${model.license}

Found via FixIt3D.com - The 3D Repair Platform.
Support the author at ${model.source_url}
    `);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${modelId}.zip"`);
    res.send(zipBuffer);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to prepare download' });
  }
}
