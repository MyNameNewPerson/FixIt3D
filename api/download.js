import fetch from 'node-fetch';

const APP_TOKEN = "53dba3cff3fbbf0506e34d7fa855f40e";
const THINGIVERSE_API = 'https://api.thingiverse.com';

export default async function handler(req, res) {
  const { thing_id } = req.query;
  console.log(`[download] Received request for thing_id: ${thing_id}`);

  if (!thing_id) {
    return res.status(400).json({ error: 'Thing ID is required' });
  }

  try {
    // 1. Получаем информацию о файлах для данной модели
    const files_url = `${THINGIVERSE_API}/things/${thing_id}/files`;
    console.log(`[download] Fetching files from: ${files_url}`);
    const headers = {
      'Authorization': `Bearer ${APP_TOKEN}`
    };
    
    const filesResponse = await fetch(files_url, { headers });
    console.log(`[download] Files response status: ${filesResponse.status}`);
    if (!filesResponse.ok) {
      throw new Error(`Failed to fetch files from Thingiverse. Status: ${filesResponse.status}`);
    }
    const files = await filesResponse.json();

    // 2. Ищем первый попавшийся STL файл
    let stlFile = null;
    for (const file of files) {
      if (file.name.toLowerCase().endsWith('.stl')) {
        stlFile = file;
        break;
      }
    }

    if (!stlFile) {
        // Если STL не найден, пытаемся найти любой файл для скачивания
        stlFile = files.find(f => f.download_url);
        if(!stlFile){
            console.log(`[download] No downloadable file found for thing_id: ${thing_id}`);
            return res.status(404).json({ error: 'No downloadable STL file found for this model.' });
        }
    }
    console.log(`[download] Found file to download: ${stlFile.name}`);
    console.log(`[download] Download URL: ${stlFile.download_url}`);

    // 3. Получаем прямой URL для скачивания файла
    const downloadResponse = await fetch(stlFile.download_url, { headers });
    console.log(`[download] Direct download response status: ${downloadResponse.status}`);
    if (!downloadResponse.ok) {
      throw new Error(`Failed to download file. Status: ${downloadResponse.status}`);
    }

    // 4. Устанавливаем заголовки для скачивания файла в браузере
    res.setHeader('Content-Disposition', `attachment; filename=${stlFile.name}`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // 5. Стримим файл пользователю
    const buffer = await downloadResponse.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file.' });
  }
}