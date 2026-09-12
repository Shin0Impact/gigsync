import { Router } from 'express';
import { mockArtists } from '../db/mockStore';

const router = Router();

// GET /api/artists/search?category_id=&lat=&lng=&radius_km=&q=&max_rate=
router.get('/search', (req, res) => {
  const { category_id, radius_km, q, max_rate, emergency_only } = req.query;

  let results = [...mockArtists];

  if (category_id && category_id !== 'all') {
    const cat = String(category_id).toLowerCase();
    results = results.filter((a) =>
      a.categories.some((c: string) => c.toLowerCase().includes(cat))
    );
  }

  if (emergency_only === 'true') {
    results = results.filter((a) => a.isEmergencyAvailable);
  }

  if (radius_km) {
    const maxRadius = parseFloat(String(radius_km));
    if (!isNaN(maxRadius) && maxRadius > 0) {
      results = results.filter((a) => (a.distanceKm ?? 0) <= maxRadius);
    }
  }

  if (max_rate) {
    const rate = parseFloat(String(max_rate));
    if (!isNaN(rate) && rate > 0) {
      results = results.filter((a) => (a.hourlyRate ?? 0) <= rate);
    }
  }

  if (q) {
    const queryStr = String(q).toLowerCase();
    results = results.filter(
      (a) =>
        a.name.toLowerCase().includes(queryStr) ||
        (a.bio && a.bio.toLowerCase().includes(queryStr)) ||
        a.categories.some((c: string) => c.toLowerCase().includes(queryStr)) ||
        (a.tagline && a.tagline.toLowerCase().includes(queryStr))
    );
  }

  res.json({ artists: results, total: results.length });
});

// GET /api/artists/emergency-available?lat=&lng=&radius_km=
router.get('/emergency-available', (req, res) => {
  const { radius_km } = req.query;
  let results = mockArtists.filter((a) => a.isEmergencyAvailable);

  if (radius_km) {
    const maxRadius = parseFloat(String(radius_km));
    if (!isNaN(maxRadius) && maxRadius > 0) {
      results = results.filter((a) => (a.distanceKm ?? 0) <= maxRadius);
    }
  }

  res.json({ artists: results, total: results.length });
});

// GET /api/artists/:id
router.get('/:id', (req, res) => {
  const artist = mockArtists.find((a) => a.id === req.params.id || a.userId === req.params.id);
  if (!artist) {
    return res.status(404).json({ error: 'Artist profile not found' });
  }
  res.json({ artist });
});

// PATCH /api/artists/me/emergency-status
router.patch('/me/emergency-status', (req, res) => {
  const { isEmergencyAvailable, artistId } = req.body;
  const targetId = artistId || 'artist-1';
  const artist = mockArtists.find((a) => a.id === targetId || a.userId === targetId);
  
  if (artist) {
    artist.isEmergencyAvailable = typeof isEmergencyAvailable === 'boolean' 
      ? isEmergencyAvailable 
      : !artist.isEmergencyAvailable;
    return res.json({ success: true, artist });
  }

  res.json({ success: true, isEmergencyAvailable: Boolean(isEmergencyAvailable) });
});

export default router;
