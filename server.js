import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

app.use(express.static('public'));
app.use('/data', express.static('data'));

const ALLOWED_APIS = ['search', 'download', 'track-click', 'get-model'];

// Mocking Vercel's serverless function behavior for local dev
app.all('/api/:name', async (req, res) => {
  const apiName = req.params.name;
  
  if (!ALLOWED_APIS.includes(apiName)) {
    return res.status(404).send('API not found');
  }

  try {
    const apiPath = path.join(__dirname, 'api', `${apiName}.js`);
    const module = await import(`file://${apiPath}`);
    const apiHandler = module.default;
    
    if (apiHandler) {
      await apiHandler(req, res);
    } else {
      res.status(404).send('API Handler not found');
    }
  } catch (err) {
    console.error(`API Error (${apiName}):`, err);
    res.status(500).send('API Error');
  }
});

app.listen(port, () => {
  console.log(`FixIt3D dev server listening at http://localhost:${port}`);
});
