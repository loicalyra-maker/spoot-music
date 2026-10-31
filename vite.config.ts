import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { execFile } from 'node:child_process';

const streamCache = new Map<string, string>();
const vaultCache = new Map<string, any[]>();

function ytDlpStreamResolver(): Plugin {
  return {
    name: 'yt-dlp-stream-resolver',
    configureServer(server) {
      // 1. Endpoint de recherche Archives & Titres non officiels (Vault)
      server.middlewares.use('/api/vault-search', (req, res) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const artist = url.searchParams.get('artist');
        if (!artist) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing artist parameter' }));
          return;
        }

        const key = artist.trim().toLowerCase();
        if (vaultCache.has(key)) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ results: vaultCache.get(key) }));
          return;
        }

        execFile(
          'python',
          ['-m', 'yt_dlp', '--skip-download', '--dump-json', '--flat-playlist', `ytsearch8:${artist} unreleased leak`],
          { timeout: 10000 },
          (err, stdout) => {
            if (err || !stdout?.trim()) {
              // Fallback vers API YouTube (garantit le fonctionnement universel sans Python)
              fetch('https://www.youtube.com/youtubei/v1/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  context: { client: { clientName: 'WEB', clientVersion: '2.20240101.00.00' } },
                  query: `${artist} unreleased leak`
                })
              })
                .then(r => r.json())
                .then(data => {
                  const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
                  const results = contents
                    .filter((item) => item.videoRenderer && item.videoRenderer.videoId)
                    .slice(0, 8)
                    .map((item, idx) => {
                      const v = item.videoRenderer;
                      const durText = v.lengthText?.simpleText || '3:30';
                      const parts = durText.split(':').map(Number);
                      let sec = 210;
                      if (parts.length === 2) sec = parts[0] * 60 + parts[1];
                      else if (parts.length === 3) sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
                      return {
                        id: v.videoId,
                        youtubeId: v.videoId,
                        title: v.title?.runs?.[0]?.text || `Inédit #${idx + 1}`,
                        artistName: artist,
                        durationFormatted: durText,
                        durationMs: sec * 1000,
                        url: `https://www.youtube.com/watch?v=${v.videoId}`,
                        coverUrl: v.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
                        viewCount: 650000 - idx * 45000,
                        uploader: v.ownerText?.runs?.[0]?.text || 'Vault Archive'
                      };
                    });
                  vaultCache.set(key, results);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ results }));
                })
                .catch(() => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ results: [] }));
                });
              return;
            }

            try {
              const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
              const entries = lines.map(l => {
                try { return JSON.parse(l); } catch { return null; }
              }).filter(Boolean);

              const results = entries.map((e, idx) => {
                const sec = Math.floor(e.duration || 210);
                const m = Math.floor(sec / 60);
                const s = sec % 60;
                return {
                  id: e.id || `vault-${idx}`,
                  youtubeId: e.id,
                  title: e.title || `Inédit #${idx + 1}`,
                  artistName: artist,
                  durationFormatted: `${m}:${s < 10 ? '0' : ''}${s}`,
                  durationMs: sec * 1000,
                  url: e.url || (e.id ? `https://www.youtube.com/watch?v=${e.id}` : ''),
                  coverUrl: e.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${e.id}/hqdefault.jpg`,
                  viewCount: e.view_count || (780000 - idx * 45000),
                  uploader: e.uploader || e.channel || 'Vault Archive'
                };
              });

              vaultCache.set(key, results);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ results }));
            } catch {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to parse vault search' }));
            }
          }
        );
      });

      // 2. Endpoint de résolution de flux YouTube Music / yt-dlp
      server.middlewares.use('/api/stream-resolve', (req, res) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const id = url.searchParams.get('id');
        const q = url.searchParams.get('q');
        if (!id && !q) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing parameter id or q' }));
          return;
        }

        const normalizedKey = (id || q || '').trim().toLowerCase();
        if (streamCache.has(normalizedKey)) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ url: streamCache.get(normalizedKey) }));
          return;
        }

        const ytTarget = id ? `https://www.youtube.com/watch?v=${id}` : `ytsearch1:${q} audio`;

        execFile(
          'python',
          ['-m', 'yt_dlp', '-g', '-f', 'bestaudio', ytTarget],
          { timeout: 15000 },
          (err, stdout) => {
            if (err || !stdout?.trim()) {
              const fallbackUrl = 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bf/20/4f/bf204f14-9fa0-7d7d-e717-b769f584e035/mzaf_11306359050637175240.plus.aac.p.m4a';
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ url: fallbackUrl }));
              return;
            }
            const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(l => l.startsWith('http'));
            const streamUrl = lines[0];
            if (!streamUrl) {
              const fallbackUrl = 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bf/20/4f/bf204f14-9fa0-7d7d-e717-b769f584e035/mzaf_11306359050637175240.plus.aac.p.m4a';
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ url: fallbackUrl }));
              return;
            }

            const proxiedUrl = `/api/stream-audio?url=${encodeURIComponent(streamUrl)}`;
            streamCache.set(normalizedKey, proxiedUrl);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ url: proxiedUrl }));
          }
        );
      });

      server.middlewares.use('/api/stream-audio', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Range, Accept, Content-Type');
          res.end();
          return;
        }

        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const targetUrl = url.searchParams.get('url');
        if (!targetUrl) {
          res.statusCode = 400;
          res.end('Missing url param');
          return;
        }

        const headers: Record<string, string> = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        };
        if (req.headers.range) {
          headers['Range'] = req.headers.range as string;
        }

        try {
          const upstreamRes = await fetch(targetUrl, { headers });
          res.statusCode = upstreamRes.status;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Range, Accept, Content-Type');

          if (upstreamRes.headers.get('content-type')) {
            res.setHeader('Content-Type', upstreamRes.headers.get('content-type')!);
          }
          if (upstreamRes.headers.get('content-length')) {
            res.setHeader('Content-Length', upstreamRes.headers.get('content-length')!);
          }
          if (upstreamRes.headers.get('content-range')) {
            res.setHeader('Content-Range', upstreamRes.headers.get('content-range')!);
          }
          if (upstreamRes.headers.get('accept-ranges')) {
            res.setHeader('Accept-Ranges', upstreamRes.headers.get('accept-ranges')!);
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
        } catch (err) {
          if (!res.headersSent) {
            res.statusCode = 500;
          }
          res.end();
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), ytDlpStreamResolver()],
  clearScreen: false,
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api/deezer': {
        target: 'https://api.deezer.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deezer/, ''),
      },
      '/api/lrclib': {
        target: 'https://lrclib.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lrclib/, ''),
        headers: {
          'User-Agent': 'SpootMusic/1.0.0 (https://spootmusic.app)',
        },
      },
      '/api/invidious': {
        target: 'https://yt.chocolatemoo53.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/invidious/, ''),
      },
      '/api/spotify': {
        target: 'https://api.spotify.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/spotify/, ''),
      },
      '/api/spotify-auth': {
        target: 'https://accounts.spotify.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/spotify-auth/, ''),
      },
      '/api/itunes': {
        target: 'https://itunes.apple.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/itunes/, ''),
      },
    },
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: ['es2021', 'chrome105', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
