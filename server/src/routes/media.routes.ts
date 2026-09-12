import { Router } from 'express';

const router = Router();

// POST /api/media/upload-url
// Returns a mock pre-signed upload URL or direct media URL so image/audio uploads work
// smoothly without needing Cloudflare R2 credentials configured.
router.post('/upload-url', (req, res) => {
  const { fileName, fileType } = req.body;
  const key = `uploads/${Date.now()}-${fileName || 'asset'}`;

  res.json({
    uploadUrl: `/api/media/mock-upload/${encodeURIComponent(key)}`,
    publicUrl: `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=600&fit=crop`,
    key,
    fileType: fileType || 'image/jpeg',
  });
});

router.put('/mock-upload/:key', (_req, res) => {
  res.status(200).send();
});

export default router;
