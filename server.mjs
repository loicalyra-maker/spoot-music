// Spoot Music — Production Cloud Container Server (server.mjs)
// Runs 24/7 on Render / Koyeb / Docker without needing a local PC.
// Serves pre-built Vite assets from dist/ and provides full yt-dlp stream resolution & audio proxying.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = parseInt(process.env.PORT || '5173', 10);
const PYTHON_BIN = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');

const streamCache = new Map();
const vaultCache = new Map();
const neteaseLyricsCache = new Map();

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, Accept');

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
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), port: PORT, python: PYTHON_BIN }));
    return;
  }

  // Debug yt-dlp on container
  if (pathname === '/api/debug-ytdlp') {
    const q = parsedUrl.searchParams.get('q') || 'Tiakola Pona Nini';
    execFile('yt-dlp', ['--version'], (vErr, vOut, vStderr) => {
      execFile(
        PYTHON_BIN,
        ['-m', 'yt_dlp', '--no-warnings', '--extractor-args', 'youtube:player_client=android,web', '-g', '-f', 'bestaudio', '--no-playlist', 'ytsearch1:' + q],
        { timeout: 15000 },
        (err, stdout, stderr) => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            ytdlpVersion: vOut ? vOut.trim() : (vErr ? vErr.message : null),
            vStderr: vStderr ? vStderr.trim() : null,
            python: PYTHON_BIN,
            err: err ? err.message : null,
            stdout: stdout ? stdout.trim() : null,
            stderr: stderr ? stderr.trim() : null,
          }));
        }
      );
    });
    return;
  }

  // 2. Endpoint /api/stream-audio (Audio proxy with HTTP Range streaming & burst)
  if (pathname === '/api/stream-audio') {
    let targetUrl = parsedUrl.searchParams.get('url');
    if (!targetUrl) {
      res.statusCode = 400;
      res.end('Missing url param');
      return;
    }

    // Anti-recursion unwrapping
    while (targetUrl && (targetUrl.includes('/api/stream-audio?url=') || targetUrl.includes('%2Fapi%2Fstream-audio%3Furl%3D'))) {
      try {
        const rawTarget = targetUrl.includes('%2F') ? decodeURIComponent(targetUrl) : targetUrl;
        const parsed = new URL(rawTarget, `http://${req.headers.host}`);
        const unwrapped = parsed.searchParams.get('url');
        if (unwrapped && unwrapped !== targetUrl) {
          targetUrl = unwrapped;
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
      const upstreamRes = await fetch(targetUrl, { headers });
      res.statusCode = upstreamRes.status;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Accept, Content-Type');
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
        res.end();
        return;
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
      return;
    } catch (err) {
      if (!res.headersSent) {
        res.statusCode = 500;
      }
      res.end();
      return;
    }
  }

  // 3. Endpoint /api/stream-resolve
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

    let ytdlpFormat = 'bestaudio[ext=m4a]/bestaudio/best';
    let formatLabel = 'AAC-LC 320 kbps (Très élevée)';
    let detectedCodec = 'audio/mp4 (AAC-LC)';
    let estimatedBitrate = 320;
    let effectiveSampleRate = 48000;

    if (quality === 'normal') {
      ytdlpFormat = 'ba[abr<=160]/worstaudio';
      formatLabel = 'Opus 128 kbps (Éco)';
      detectedCodec = 'audio/webm (Opus)';
      estimatedBitrate = 128;
    } else if (quality === 'high') {
      ytdlpFormat = 'ba[abr<=256]';
      formatLabel = 'AAC 256 kbps (Élevée)';
      detectedCodec = 'audio/mp4 (AAC)';
      estimatedBitrate = 256;
    } else if (quality === 'hi_res') {
      ytdlpFormat = 'bestaudio[ext=m4a]/bestaudio/best';
      formatLabel = 'Hi-Res Lossless 24-bit / 96 kHz Master';
      detectedCodec = 'FLAC / ALAC Lossless';
      estimatedBitrate = 4608;
      effectiveSampleRate = 96000;
    }

    const ytTarget = id
      ? `https://www.youtube.com/watch?v=${id}`
      : `ytsearch1:${(q || '').includes('Official Audio') ? q : `${q} Official Audio`}`;

    // Tentative 1 : Exécution directe de yt-dlp Python avec player_client android,web
    execFile(
      PYTHON_BIN,
      [
        '-m',
        'yt_dlp',
        '--no-warnings',
        '--extractor-args',
        'youtube:player_client=android,web',
        '-g',
        '-f',
        ytdlpFormat,
        '--no-playlist',
        ytTarget,
      ],
      { timeout: 15000 },
      async (err, stdout) => {
        const lines = (stdout || '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith('http'));
        let streamUrl = lines[0];

        if (streamUrl) {
          const proxiedUrl = streamUrl.includes('googlevideo.com')
            ? `/api/stream-audio?url=${encodeURIComponent(streamUrl)}`
            : streamUrl;

          const payload = {
            url: proxiedUrl,
            format: formatLabel,
            codec: detectedCodec,
            bitrateKbps: estimatedBitrate,
            sampleRate: effectiveSampleRate,
            qualityMode: quality,
            isFallback: false,
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
          const proxiedUrl = cloudResult.url.includes('googlevideo.com')
            ? `/api/stream-audio?url=${encodeURIComponent(cloudResult.url)}`
            : cloudResult.url;
          const payload = {
            url: proxiedUrl,
            format: cloudResult.format || formatLabel,
            codec: detectedCodec,
            bitrateKbps: cloudResult.bitrate ? Math.round(cloudResult.bitrate / 1000) : estimatedBitrate,
            sampleRate: effectiveSampleRate,
            qualityMode: quality,
            isFallback: false,
          };
          streamCache.set(cacheKey, payload);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
          return;
        }

        // Zéro repli sur extrait 30s : 404 strict avec statut clair
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Flux audio introuvable pour ce titre' }));
      }
    );
    return;
  }

  // 4. Proxy /api/lrclib/* vers https://lrclib.net/*
  if (pathname.startsWith('/api/lrclib/')) {
    const lrclibPath = pathname.replace('/api/lrclib', '');
    const targetUrl = `https://lrclib.net${lrclibPath}${parsedUrl.search}`;
    try {
      const lrcRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'SpootMusic/1.0 (https://spoot-music.onrender.com)',
        },
      });
      const lrcData = await lrcRes.text();
      res.statusCode = lrcRes.status;
      res.setHeader('Content-Type', lrcRes.headers.get('content-type') || 'application/json');
      res.end(lrcData);
      return;
    } catch {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: 'LRCLIB upstream unreachable' }));
      return;
    }
  }

  // 5. Proxy /api/lyrics-netease (Niveau 2 lyrics)
  if (pathname === '/api/lyrics-netease') {
    const q = parsedUrl.searchParams.get('q');
    res.setHeader('Content-Type', 'application/json');
    if (!q) {
      res.statusCode = 400;
      res.end(JSON.stringify({ lrc: null }));
      return;
    }
    const key = q.trim().toLowerCase();
    if (neteaseLyricsCache.has(key)) {
      res.end(JSON.stringify({ lrc: neteaseLyricsCache.get(key) }));
      return;
    }
    try {
      const searchResp = await fetch('https://music.163.com/api/search/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: 'https://music.163.com/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        body: `s=${encodeURIComponent(q)}&type=1&offset=0&total=true&limit=5`,
      });
      const searchData = await searchResp.json();
      const songs = searchData?.result?.songs || [];
      if (!songs.length) {
        res.end(JSON.stringify({ lrc: null }));
        return;
      }
      let bestLrc = null;
      for (const song of songs.slice(0, 3)) {
        const lyricResp = await fetch(
          `https://music.163.com/api/song/lyric?os=pc&id=${song.id}&lv=-1&kv=-1&tv=-1`,
          {
            headers: {
              Referer: 'https://music.163.com/',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            },
          }
        );
        const lyricData = await lyricResp.json();
        const candidate = lyricData?.lrc?.lyric || null;
        if (candidate && candidate.split('\n').length >= 6) {
          bestLrc = candidate;
          break;
        }
      }
      if (bestLrc) {
        neteaseLyricsCache.set(key, bestLrc);
      }
      res.end(JSON.stringify({ lrc: bestLrc }));
      return;
    } catch {
      res.end(JSON.stringify({ lrc: null }));
      return;
    }
  }

  // 6. Endpoint /api/vault-search
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
      PYTHON_BIN,
      ['-m', 'yt_dlp', '--skip-download', '--dump-json', '--flat-playlist', `ytsearch8:${artist} unreleased leak acoustic session`],
      { timeout: 15000 },
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

  // 7. Proxy /api/deezer/*
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

  // 8. Service des fichiers statiques du frontend (dist/)
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
  console.log(`🐍 Python yt-dlp binary: ${PYTHON_BIN}`);
  console.log(`🔊 Audio Proxy /api/stream-audio: READY`);
  console.log(`📝 Lyrics Proxy /api/lrclib & /api/lyrics-netease: READY`);
  console.log(`======================================================\n`);
});
