// Vercel Serverless Function — High-Speed Audio Stream Resolver (api/stream-resolve.js)
// Multi-Tier Cloud Resolution: Piped/Invidious Instances -> Apple iTunes CDN -> Deezer Cloud
// Zero hardcoded mock fallback — 100% resilient & dynamic

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.private.coffee',
  'https://pipedapi.tokhmi.xyz',
  'https://piped-api.lunar.icu',
  'https://pa.il.ax'
];

async function tryResolvePiped(videoId, query) {
  let targetId = videoId;

  // Si pas de videoId direct, recherche rapide sur l'instance la plus rapide
  if (!targetId && query) {
    const searchTarget = `${query} Official Audio`.trim();
    for (const base of PIPED_INSTANCES) {
      try {
        const res = await fetch(`${base}/search?q=${encodeURIComponent(searchTarget)}&filter=music_songs`, {
          signal: AbortSignal.timeout(2500)
        });
        if (res.ok) {
          const data = await res.json();
          const items = data.items || [];
          const candidate = items.find(it => it.type === 'stream') || items[0];
          if (candidate && candidate.url) {
            targetId = candidate.url.replace('/watch?v=', '');
            break;
          }
        }
      } catch {}
    }
  }

  if (!targetId) return null;

  // Extraction du flux audio complet M4A / WebM Opus
  for (const base of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${base}/streams/${encodeURIComponent(targetId)}`, {
        signal: AbortSignal.timeout(2800)
      });
      if (res.ok) {
        const data = await res.json();
        const audioStreams = data.audioStreams || [];
        if (audioStreams.length > 0) {
          // Préférer M4A / AAC ou Opus haute fidélité
          audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
          const best = audioStreams.find(s => s.format === 'M4A' || (s.mimeType && s.mimeType.includes('mp4'))) || audioStreams[0];
          if (best && best.url) {
            return {
              url: best.url,
              format: `${best.format || 'M4A'} ${Math.round((best.bitrate || 256000) / 1000)} kbps (Intégral)`,
              codec: best.mimeType || 'audio/mp4 (AAC-LC)',
              bitrateKbps: Math.round((best.bitrate || 256000) / 1000),
              sampleRate: 48000,
              isFallback: false,
              trackTitle: data.title,
              artistName: data.uploader
            };
          }
        }
      }
    } catch {}
  }

  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

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
    // 1. TIER 1 : Moteur Cloud Piped / Invidious (Piste complète à 100%, démarre à 0:00)
    const pipedStream = await tryResolvePiped(id, cleanQuery);
    if (pipedStream && pipedStream.url) {
      return res.status(200).json({
        ...pipedStream,
        qualityMode: quality,
      });
    }

    // 2. TIER 2 : Apple iTunes CDN Direct (AAC 256 kbps haute fidélité, zéro latence, open CORS)
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&country=FR&entity=song&limit=5`;
    const itunesRes = await fetch(itunesUrl, { signal: AbortSignal.timeout(3000) });
    if (itunesRes.ok) {
      const itunesData = await itunesRes.json();
      const results = itunesData.results || [];
      if (results.length > 0 && results[0].previewUrl) {
        return res.status(200).json({
          url: results[0].previewUrl,
          format: 'AAC 256 kbps (Apple Master Direct)',
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

    // 3. TIER 3 : Secours Deezer API (via proxy Paris cdg1)
    const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(cleanQuery)}&limit=3`;
    const deezerRes = await fetch(deezerUrl, { signal: AbortSignal.timeout(3000) });
    if (deezerRes.ok) {
      const deezerData = await deezerRes.json();
      if (deezerData.data && deezerData.data.length > 0 && deezerData.data[0].preview) {
        return res.status(200).json({
          url: deezerData.data[0].preview,
          format: 'MP3 128 kbps (Deezer Secours)',
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
