import fetch from 'node-fetch';

const APP_TOKEN = process.env.THINGIVERSE_TOKEN || "53dba3cff3fbbf0506e34d7fa855f40e";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Thing ID is required' });
  }

  try {
    const response = await fetch(`https://api.thingiverse.com/things/${id}/files`, {
        headers: { 'Authorization': `Bearer ${APP_TOKEN}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch files for ${id}. Status: ${response.status}`);
    }

    const data = await response.json();

    // Filter to find STL files
    const stlFiles = data.filter(f => f.name.toLowerCase().endsWith('.stl') || f.name.toLowerCase().endsWith('.obj'));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(stlFiles);

  } catch (error) {
    console.error('Thingiverse API error:', error);
    res.status(500).json({ error: 'Failed to fetch thing files' });
  }
}
