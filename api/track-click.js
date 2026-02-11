export default function handler(req, res) {
  const { modelId, type } = req.query;
  console.log(`[Tracking] Model: ${modelId}, Type: ${type}`);
  res.status(200).json({ success: true });
}
