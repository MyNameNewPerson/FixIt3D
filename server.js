import express from 'express';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use('/data', express.static('data'));

const ALLOWED_APIS = ['search', 'download', 'track-click', 'get-model'];

// API Router
app.all('/api/:name', async (req, res) => {
  const apiName = req.params.name;
  
  if (!ALLOWED_APIS.includes(apiName)) {
    return res.status(404).send('API not found');
  }

  try {
    const apiPath = path.join(__dirname, 'api', `${apiName}.js`);

    // Windows-friendly dynamic import
    const moduleUrl = pathToFileURL(apiPath).href;
    const module = await import(moduleUrl);
    const apiHandler = module.default;
    
    if (apiHandler) {
      await apiHandler(req, res);
    } else {
      res.status(404).send('API Handler not found');
    }
  } catch (err) {
    console.error(`API Error (${apiName}):`, err);
    res.status(500).json({ error: 'Internal API Error', details: err.message });
  }
});

// Redirect root to index.html (handled by static middleware usually, but for clarity)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`
===================================================
  FixIt3D Server is running!
  Local: http://localhost:${port}
  Host:  0.0.0.0 (Accepts all interfaces)
===================================================
  `);
});
