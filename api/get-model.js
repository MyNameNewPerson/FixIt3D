import fetch from 'node-fetch';

export default async function handler(req, res) {
  let { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // Handle relative URLs for local development
  if (url.startsWith('/')) {
    url = `http://localhost:3000${url}`;
  }

  console.log(`[get-model] Proxying request for: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch model from ${url}. Status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');

    // node-fetch v2/v3 body is a Node.js Readable stream
    response.body.pipe(res);

  } catch (error) {
    console.error('Proxy fetch error:', error);
    res.status(500).json({ error: 'Failed to proxy model request' });
  }
}
