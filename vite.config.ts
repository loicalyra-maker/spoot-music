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
          ['-m', 'yt_dlp', '--flat-playlist', '--dump-single-json', `ytsearch8:${artist} unreleased leak audio removed`],
          { timeout: 12000 },
          (err, stdout) => {
            if (err) {
              vaultCache.set(key, []);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ results: [] }));
              return;
            }

            try {
              const parsed = JSON.parse(stdout);
              const entries = parsed.entries || [];
              const normalizedArtist = artist.trim().toLowerCase();

              // Vérification stricte : le titre doit impérativement contenir le nom de l'artiste
              const validEntries = entries.filter((e: any) => {
                const t = (e.title || '').toLowerCase();
                return t.includes(normalizedArtist);
              });

              const results = validEntries.map((e: any, idx: number) => ({
                id: `vault-${e.id || idx}`,
                title: e.title || `Inédit #${idx + 1}`,
                artistName: artist,
                durationFormatted: e.duration ? `${Math.floor(e.duration / 60)}:${String(Math.floor(e.duration % 60)).padStart(2, '0')}` : '3:15',
                durationMs: (e.duration || 195) * 1000,
                url: e.url || (e.id ? `https://www.youtube.com/watch?v=${e.id}` : ''),
                viewCount: e.view_count || (520000 - idx * 45000)
              }));
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
      // 1. Endpoint de résolution de flux YouTube Music / yt-dlp
      server.middlewares.use('/api/stream-resolve', (req, res) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const q = url.searchParams.get('q');
        if (!q) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing query parameter q' }));
          return;
        }

        const normalizedKey = q.trim().toLowerCase();
        if (streamCache.has(normalizedKey)) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ url: streamCache.get(normalizedKey) }));
          return;
        }

        execFile(
          'python',
          ['-m', 'yt_dlp', '-g', '-f', 'bestaudio', `ytsearch1:${q} audio`],
          { timeout: 15000 },
          (err, stdout) => {
            if (err) {
              console.error('yt-dlp resolution error:', err.message);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
            // Filter out warning lines
            const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(l => l.startsWith('http'));
            const streamUrl = lines[0];
            if (!streamUrl) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Stream not found' }));
              return;
            }

            const proxiedUrl = `/api/stream-audio?url=${encodeURIComponent(streamUrl)}`;
            streamCache.set(normalizedKey, proxiedUrl);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ url: proxiedUrl }));
          }
        );
      });

      // 2. Proxy de streaming audio local (Bypass total des restrictions CORS & support Seek HTTP Range)
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
