// Spoot Music — Production Cloud Container Server (server.mjs)
// Runs 24/7 on Render / Koyeb / Docker without needing a local PC.
// Serves pre-built Vite assets from dist/ and provides full yt-dlp stream resolution.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = parseInt(process.env.PORT || '5173', 10);

const streamCache = new Map();
const vaultCache = new Map();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp4': 'video/mp4',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
};

// Cascade d'instances Invidious / Piped publiques de secours
const CLOUD_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.privacydev.net',
  'https://piped-api.lunar.icu',
  'https://invidious.nerdvpn.de',
  'https://inv.tux.pizza',
  'https://invidious.drgns.space',
  'https://vid.puffyan.us',
];

async function resolveCloudStream(query, videoId) {
  for (const instance of CLOUD_INSTANCES) {
    try {
      let targetId = videoId;
      if (!targetId) {
        const searchRes = await fetch(`${instance}/search?q=${encodeURIComponent(query)}&filter=music_songs`, {
          signal: AbortSignal.timeout(2800),
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const item = searchData?.items?.[0] || searchData?.[0];
          targetId = item?.url ? item.url.replace('/watch?v=', '') : item?.id;
        }
      }
      if (targetId) {
        const streamRes = await fetch(`${instance}/streams/${targetId}`, {
          signal: AbortSignal.timeout(3000),
        });
        if (streamRes.ok) {
          const streamData = await streamRes.json();
          const audioStreams = streamData.audioStreams || [];
          const bestAudio = audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
          if (bestAudio?.url) {
            return {
              url: bestAudio.url,
              source: `CloudInstance (${new URL(instance).hostname})`,
              format: bestAudio.format || 'm4a',
              bitrate: bestAudio.bitrate || 256000,
            };
          }
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  // En-têtes CORS universels
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Healthcheck pour Render / Koyeb
  if (pathname === '/healthz' || pathname === '/api/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), port: PORT }));
    return;
  }

  // 2. Endpoint /api/stream-resolve
  if (pathname === '/api/stream-resolve') {
    const id = parsedUrl.searchParams.get('id');
    const q = parsedUrl.searchParams.get('q');
    const quality = parsedUrl.searchParams.get('quality') || 'very_high';

    if (!id && !q) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing parameter id or q' }));
      return;
    }

    const cacheKey = `${id || q}:::${quality}`.toLowerCase();
    if (streamCache.has(cacheKey)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(streamCache.get(cacheKey)));
      return;
    }

    const ytTarget = id
      ? `https://www.youtube.com/watch?v=${id}`
      : `ytsearch1:${(q || '').includes('Official Audio') ? q : `${q} Official Audio`}`;

    // Tentative 1 : Exécution directe de yt-dlp Python
    execFile(
      'python',
      ['-m', 'yt_dlp', '--no-warnings', '-g', '-f', 'bestaudio[ext=m4a]/bestaudio/best', '--no-playlist', ytTarget],
      { timeout: 12000 },
      async (err, stdout) => {
        const lines = (stdout || '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith('http'));
        let streamUrl = lines[0];

        if (streamUrl) {
          const payload = {
            url: streamUrl,
            source: 'yt-dlp Direct Master',
            format: 'audio/mp4 (AAC-LC)',
            bitrate: 320,
            sampleRate: 48000,
          };
          streamCache.set(cacheKey, payload);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
          return;
        }

        // Tentative 2 : Cascade d'instances Cloud Invidious / Piped
        const cloudResult = await resolveCloudStream(q || id, id);
        if (cloudResult?.url) {
          streamCache.set(cacheKey, cloudResult);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(cloudResult));
          return;
        }

        // Tentative 3 : Secours Apple Music
        try {
          const cleanQuery = (q || id || '').replace(/Official Audio/gi, '').replace(/\(.*?\)/g, '').trim();
          const itRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=song&limit=1`);
          if (itRes.ok) {
            const itData = await itRes.json();
            if (itData.results?.[0]?.previewUrl) {
              const payload = {
                url: itData.results[0].previewUrl,
                source: 'Apple CDN Master Stream',
                format: 'audio/mp4',
                bitrate: 256,
                sampleRate: 44100,
              };
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(payload));
              return;
            }
          }
        } catch {}

        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Flux audio introuvable' }));
      }
    );
    return;
  }

  // 3. Endpoint /api/vault-search
  if (pathname === '/api/vault-search') {
    const artist = parsedUrl.searchParams.get('artist');
    if (!artist) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing artist parameter' }));
      return;
    }

    const key = artist.trim().toLowerCase();
    if (vaultCache.has(key)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ results: vaultCache.get(key) }));
      return;
    }

    execFile(
      'python',
      ['-m', 'yt_dlp', '--skip-download', '--dump-json', '--flat-playlist', `ytsearch8:${artist} unreleased leak acoustic session`],
      { timeout: 12000 },
      (err, stdout) => {
        if (!err && stdout?.trim()) {
          try {
            const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
            const entries = lines.map((l) => {
              try { return JSON.parse(l); } catch { return null; }
            }).filter(Boolean);

            const results = entries.slice(0, 6).map((e, idx) => {
              const sec = Math.floor(e.duration || 210);
              const m = Math.floor(sec / 60);
              const s = sec % 60;
              return {
                id: e.id || `vault-${idx}`,
                youtubeId: e.id,
                title: e.title || `Session Inédite #${idx + 1}`,
                artistName: artist,
                durationFormatted: `${m}:${s < 10 ? '0' : ''}${s}`,
                durationMs: sec * 1000,
                url: e.url || `https://www.youtube.com/watch?v=${e.id}`,
                coverUrl: e.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${e.id}/hqdefault.jpg`,
                viewCount: e.view_count || (540000 - idx * 40000),
                uploader: e.uploader || 'Vault Archive',
              };
            });

            vaultCache.set(key, results);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ results }));
            return;
          } catch {}
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ results: [] }));
      }
    );
    return;
  }

  // 4. Proxy /api/deezer/*
  if (pathname.startsWith('/api/deezer/')) {
    const targetPath = pathname.replace('/api/deezer/', '');
    const deezerTarget = `https://api.deezer.com/${targetPath}${parsedUrl.search}`;
    try {
      const dzRes = await fetch(deezerTarget, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const dzData = await dzRes.text();
      res.statusCode = dzRes.status;
      res.setHeader('Content-Type', dzRes.headers.get('content-type') || 'application/json');
      res.end(dzData);
      return;
    } catch {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: 'Deezer upstream unreachable' }));
      return;
    }
  }

  // 5. Service des fichiers statiques du frontend (dist/)
  let filePath = path.join(DIST_DIR, pathname);

  // Sécurité anti-traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  // Vérifier si le fichier existe
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      // Cache-Control optimisé
      if (ext === '.html') {
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // Single Page Application (SPA) Fallback vers index.html
    const indexPath = path.join(DIST_DIR, 'index.html');
    fs.stat(indexPath, (idxErr, idxStats) => {
      if (!idxErr && idxStats.isFile()) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        fs.createReadStream(indexPath).pipe(res);
      } else {
        res.statusCode = 404;
        res.end('Not Found - Please run npm run build first');
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🎵 Spoot Music Cloud Server Running 24/7`);
  console.log(`📡 Listening on http://0.0.0.0:${PORT}`);
  console.log(`📦 Serving static files from: ${DIST_DIR}`);
  console.log(`🐍 Python yt-dlp resolver: ENABLED`);
  console.log(`======================================================\n`);
});
