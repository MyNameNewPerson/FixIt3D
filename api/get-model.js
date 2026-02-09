// api/get-model.js
export default async function handler(req, res) {
  let { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // Handle relative URLs for local development
  if (url.startsWith('/')) {
    url = `http://localhost:3000${url}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch model from ${url}. Status: ${response.status}`);
    }

    // Get the content type from the original response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // Stream the response body to the client
    response.body.pipe(res);

  } catch (error) {
    console.error('Proxy fetch error:', error);
    res.status(500).json({ error: 'Failed to proxy model request' });
  }
}
