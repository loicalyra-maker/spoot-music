// Vercel Serverless Function — Audio Stream Proxy (api/stream-audio.js)
// Enables range requests, audio caching, and bypasses upstream CORS restrictions.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Accept, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { url: targetUrl } = req.query;
  if (!targetUrl) {
    return res.status(400).send('Missing url param');
  }

  let cleanUrl = targetUrl;
  while (cleanUrl && (cleanUrl.includes('/api/stream-audio?url=') || cleanUrl.includes('%2Fapi%2Fstream-audio%3Furl%3D'))) {
    try {
      const raw = cleanUrl.includes('%2F') ? decodeURIComponent(cleanUrl) : cleanUrl;
      const parsed = new URL(raw, 'http://localhost');
      const unwrapped = parsed.searchParams.get('url');
      if (unwrapped && unwrapped !== cleanUrl) {
        cleanUrl = unwrapped;
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  };
  if (req.headers.range) {
    headers['Range'] = req.headers.range;
  }

  try {
    const upstreamRes = await fetch(cleanUrl, { headers });
    res.status(upstreamRes.status);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');

    if (upstreamRes.headers.get('content-type')) {
      res.setHeader('Content-Type', upstreamRes.headers.get('content-type'));
    }
    if (upstreamRes.headers.get('content-length')) {
      res.setHeader('Content-Length', upstreamRes.headers.get('content-length'));
    }
    if (upstreamRes.headers.get('content-range')) {
      res.setHeader('Content-Range', upstreamRes.headers.get('content-range'));
    }
    if (upstreamRes.headers.get('accept-ranges')) {
      res.setHeader('Accept-Ranges', upstreamRes.headers.get('accept-ranges'));
    }

    if (!upstreamRes.body) {
      return res.end();
    }

    const reader = upstreamRes.body.getReader();
    req.on('close', () => {
      reader.cancel().catch(() => {});
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        break;
      }
      if (!res.write(value)) {
        await new Promise((resolve) => res.once('drain', resolve));
      }
    }
  } catch (err) {
    if (!res.headersSent) {
      res.status(500);
    }
    res.end();
  }
}
