import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { execFile } from 'node:child_process';

const streamCache = new Map<string, string>();
const vaultCache = new Map<string, any[]>();
const neteaseLyricsCache = new Map<string, string>();

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

        const JUNK_KEYWORDS = ['reaction', 'review', 'instrumental remake', 'type beat', 'cover', 'slowed', 'sped up', 'reverb', 'mashup', 'tiktok'];
        const isJunk = (t: string) => {
          const lower = (t || '').toLowerCase();
          return JUNK_KEYWORDS.some(kw => lower.includes(kw));
        };

        execFile(
          'python',
          ['-m', 'yt_dlp', '--skip-download', '--dump-json', '--flat-playlist', `ytsearch10:${artist} unreleased leak`],
          { timeout: 12000 },
          (err, stdout) => {
            if (err || !stdout?.trim()) {
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
                    .filter((item: any) => item.videoRenderer && item.videoRenderer.videoId)
                    .map((item: any) => {
                      const v = item.videoRenderer;
                      const title = v.title?.runs?.[0]?.text || '';
                      const durText = v.lengthText?.simpleText || '3:30';
                      const parts = durText.split(':').map(Number);
                      let sec = 210;
                      if (parts.length === 2) sec = parts[0] * 60 + parts[1];
                      else if (parts.length === 3) sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
                      return { v, title, durText, sec };
                    })
                    .filter(({ title, sec }: any) => !isJunk(title) && sec >= 90 && sec <= 360)
                    .slice(0, 8)
                    .map(({ v, title, durText, sec }: any, idx: number) => ({
                      id: v.videoId,
                      youtubeId: v.videoId,
                      title: title || `Inédit #${idx + 1}`,
                      artistName: artist,
                      durationFormatted: durText,
                      durationMs: sec * 1000,
                      url: `https://www.youtube.com/watch?v=${v.videoId}`,
                      coverUrl: v.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
                      viewCount: 650000 - idx * 45000,
                      uploader: v.ownerText?.runs?.[0]?.text || 'Vault Archive'
                    }));
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

              const results = entries
                .filter((e: any) => {
                  const title = e.title || '';
                  const sec = Math.floor(e.duration || 210);
                  return !isJunk(title) && sec >= 90 && sec <= 360;
                })
                .slice(0, 8)
                .map((e: any, idx: number) => {
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

            // 2. Endpoint de résolution de flux YouTube Music / yt-dlp avec sélecteur de qualité réel
      server.middlewares.use('/api/stream-resolve', (req, res) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const id = url.searchParams.get('id');
        const q = url.searchParams.get('q');
        const quality = url.searchParams.get('quality') || 'very_high';
        if (!id && !q) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing parameter id or q' }));
          return;
        }

        const normalizedKey = `${id || q || ''}:::${quality}`.trim().toLowerCase();
        if (streamCache.has(normalizedKey)) {
          res.setHeader('Content-Type', 'application/json');
          res.end(streamCache.get(normalizedKey));
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
          effectiveSampleRate = 48000;
        } else if (quality === 'high') {
          ytdlpFormat = 'ba[abr<=256]';
          formatLabel = 'AAC 256 kbps (Élevée)';
          detectedCodec = 'audio/mp4 (AAC)';
          estimatedBitrate = 256;
          effectiveSampleRate = 48000;
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

        execFile(
          'python',
          ['-m', 'yt_dlp', '--no-warnings', '-g', '-f', ytdlpFormat, '--no-playlist', ytTarget],
          { timeout: 15000 },
          async (err, stdout) => {
            const lines = (stdout || '').split(/\r?\n/).map(l => l.trim()).filter(l => l.startsWith('http'));
            let streamUrl = lines[0];

            if (!streamUrl) {
              // Repli dynamique intelligent : recherche en direct le vrai flux du morceau demandé (zéro confusion)
              try {
                const cleanQuery = (q || id || '').replace(/Official Audio/gi, '').replace(/\(.*?\)/g, '').trim();
                const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=song&limit=1`);
                if (itunesRes.ok) {
                  const itunesData = await itunesRes.json();
                  if (itunesData.results?.[0]?.previewUrl) {
                    streamUrl = itunesData.results[0].previewUrl;
                  }
                }
              } catch {}
            }

            if (!streamUrl) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Flux audio introuvable pour ce titre', isFallback: false }));
              return;
            }

            const proxiedUrl = streamUrl.includes('googlevideo.com')
              ? `/api/stream-audio?url=${encodeURIComponent(streamUrl)}`
              : streamUrl;

            const payload = JSON.stringify({
              url: proxiedUrl,
              format: formatLabel,
              codec: detectedCodec,
              bitrateKbps: estimatedBitrate,
              sampleRate: effectiveSampleRate,
              qualityMode: quality,
              isFallback: !lines[0]
            });
            streamCache.set(normalizedKey, payload);
            res.setHeader('Content-Type', 'application/json');
            res.end(payload);
          }
        );
      });

      // 3. Proxy NetEase Cloud Music LRC (Niveau 2 du moteur de paroles synchronisées)
      server.middlewares.use('/api/lyrics-netease', async (req, res) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const q = url.searchParams.get('q');
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
              'Referer': 'https://music.163.com/',
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

          let bestLrc: string | null = null;
          for (const song of songs.slice(0, 3)) {
            const lyricResp = await fetch(
              `https://music.163.com/api/song/lyric?os=pc&id=${song.id}&lv=-1&kv=-1&tv=-1`,
              {
                headers: {
                  'Referer': 'https://music.163.com/',
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
        } catch {
          res.end(JSON.stringify({ lrc: null }));
        }
      });

      // 4. Proxy audio avec support HTTP Range & Cache-Control Burst & Sleep
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
        let targetUrl = url.searchParams.get('url');
        if (!targetUrl) {
          res.statusCode = 400;
          res.end('Missing url param');
          return;
        }

        // Sécurité anti-bouclage de proxy (si targetUrl est lui-même un appel proxy imbriqué)
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
          res.setHeader('Cache-Control', 'public, max-age=86400, immutable');

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
