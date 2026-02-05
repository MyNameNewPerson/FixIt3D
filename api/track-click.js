// api/track-click.js

export default async function handler(req, res) {
  const { modelId, type } = req.query;
  
  // In a real app, you would log this to a database or analytics service
  console.log(`[TRACK] Click: modelId=${modelId}, type=${type}, timestamp=${new Date().toISOString()}`);
  
  res.status(200).json({ success: true });
}
