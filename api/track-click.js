export default async function handler(req, res) {
  const { modelId, type } = req.query;
  console.log(`[track] ${type} for ${modelId}`);
  // In a real app, you'd save this to a DB. For now, just OK.
  res.status(200).json({ status: 'ok' });
}
