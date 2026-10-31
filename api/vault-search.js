// Vercel Serverless Function — High-Speed YouTube Vault Search
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { artist } = req.query;
  if (!artist) {
    return res.status(400).json({ error: 'Missing artist parameter' });
  }

  try {
    const query = `${artist} unreleased leak`;
    const response = await fetch('https://www.youtube.com/youtubei/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20240101.00.00',
          },
        },
        query,
      }),
    });

    if (!response.ok) {
      throw new Error(`YouTube API returned ${response.status}`);
    }

    const data = await response.json();
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
          uploader: v.ownerText?.runs?.[0]?.text || 'Vault Archive',
        };
      });

    return res.status(200).json({ results });
  } catch (err) {
    console.error('Vault search error:', err.message);
    return res.status(500).json({ error: 'Failed to search vault', results: [] });
  }
}
