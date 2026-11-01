// Spoot Music — Vercel Serverless NetEase Cloud Music LRC Proxy (api/lyrics-netease.js)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { q } = req.query || {};
  if (!q) {
    return res.status(400).json({ lrc: null });
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
      return res.status(200).json({ lrc: null });
    }

    let bestLrc = null;
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

    return res.status(200).json({ lrc: bestLrc });
  } catch {
    return res.status(200).json({ lrc: null });
  }
}
