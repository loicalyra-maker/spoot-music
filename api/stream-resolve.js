// Vercel Serverless Function — High-Speed Audio Stream Resolver (api/stream-resolve.js)
// Dynamic resolution via iTunes / Deezer APIs — Zero hardcoded mock fallback

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { id, q, quality = 'very_high' } = req.query;

  if (!id && !q) {
    return res.status(400).json({ error: 'Missing parameter id or q' });
  }

  const cleanQuery = (q || id || '')
    .replace(/Official Audio/gi, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .trim();

  try {
    // 1. Recherche dynamique via Apple iTunes CDN (haute fidélité AAC)
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&country=FR&entity=song&limit=5`;
    const itunesRes = await fetch(itunesUrl);
    if (itunesRes.ok) {
      const itunesData = await itunesRes.json();
      const results = itunesData.results || [];
      if (results.length > 0 && results[0].previewUrl) {
        return res.status(200).json({
          url: results[0].previewUrl,
          format: 'AAC 256 kbps (Élevée)',
          codec: 'audio/mp4 (AAC-LC)',
          bitrateKbps: 256,
          sampleRate: 44100,
          qualityMode: quality,
          isFallback: false,
          trackTitle: results[0].trackName,
          artistName: results[0].artistName,
        });
      }
    }

    // 2. Repli recherche Deezer API
    const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(cleanQuery)}&limit=3`;
    const deezerRes = await fetch(deezerUrl);
    if (deezerRes.ok) {
      const deezerData = await deezerRes.json();
      if (deezerData.data && deezerData.data.length > 0 && deezerData.data[0].preview) {
        return res.status(200).json({
          url: deezerData.data[0].preview,
          format: 'MP3 128 kbps (Standard)',
          codec: 'audio/mpeg (MP3)',
          bitrateKbps: 128,
          sampleRate: 44100,
          qualityMode: quality,
          isFallback: false,
          trackTitle: deezerData.data[0].title,
          artistName: deezerData.data[0].artist?.name,
        });
      }
    }

    return res.status(404).json({
      error: 'Flux audio introuvable pour ce titre',
      isFallback: false,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message, isFallback: false });
  }
}
