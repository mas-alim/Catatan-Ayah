export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  return res.status(200).json({
    ok: true,
    service: 'catatan-ayah-imagekit-api',
  });
}
