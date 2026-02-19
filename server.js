import express from 'express';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use('/data', express.static('data'));

const ALLOWED_APIS = ['search', 'download', 'track-click', 'get-model', 'get-thing-files', 'admin'];

// API Router
app.all('/api/:name*', async (req, res) => {
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Background Job (except on Vercel)
if (!process.env.VERCEL) {
  console.log('[INFO] Starting background job scheduler...');
  spawn('node', ['job.js'], { stdio: 'inherit', shell: true });
} else {
  console.log('[INFO] Running on Vercel, skipping background job scheduler.');
}

app.listen(port, '0.0.0.0', () => {
  console.log(`
===================================================
  FixIt3D Server is running!
  Local: http://localhost:${port}
  Host:  0.0.0.0 (Accepts all interfaces)
===================================================
  `);
});
