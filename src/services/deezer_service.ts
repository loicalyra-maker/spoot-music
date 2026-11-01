// Spoot Music — Official Deezer Public API & LRCLIB Synced Lyrics Service
// Architecture 100% autonome et intelligente : Deezer Direct / Vercel Proxy + JSONP Fallback + LRCLIB Synced Lyrics

import { Track, Album, Artist, LyricLine } from '../types';
import { INITIAL_ARTISTS, INITIAL_TRACKS, INITIAL_ALBUMS } from '../mock/catalog';

export interface ArtistDiscographyClean {
  albums: Album[];
  singlesAndEPs: Album[];
  compilationsAndAppearances: Album[];
}

export interface DeezerArtistDetails extends Artist {
  nbFans: number;
  nbAlbums: number;
  pictureXl: string;
}

export interface DeezerAlbumDetails extends Album {
  coverXl: string;
  releaseDate: string;
  artistPictureSmall: string;
  artistId: string;
  artistName: string;
  genres: string[];
}

export interface DeezerPodcast {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  fans: number;
}

export interface DeezerEpisode {
  id: string;
  title: string;
  releaseDate: string;
  durationSeconds: number;
  coverUrl: string;
}

function deterministicHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export class DeezerService {
  private static instance: DeezerService;
  private lyricsCache = new Map<string, LyricLine[]>();
  private albumCache = new Map<string, DeezerAlbumDetails>();
  private artistCache = new Map<string, DeezerArtistDetails>();
  private searchCache = new Map<string, { tracks: Track[]; artists: Artist[]; albums: Album[] }>();
  private topTracksCache = new Map<string, Track[]>();

  public static getInstance(): DeezerService {
    if (!DeezerService.instance) {
      DeezerService.instance = new DeezerService();
    }
    return DeezerService.instance;
  }

  /**
   * Appel JSONP direct vers l'API publique Deezer
   * Bypasse 100% des restrictions CORS dans tous les navigateurs (iOS Safari, Chrome, etc.)
   */
  public fetchDeezerJsonp<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Window not available for JSONP'));
    }
    return new Promise((resolve, reject) => {
      const callbackName = `deezer_jsonp_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      const url = new URL(`https://api.deezer.com/${endpoint.replace(/^\//, '')}`);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
      url.searchParams.set('output', 'jsonp');
      url.searchParams.set('callback', callbackName);

      const script = document.createElement('script');
      script.src = url.toString();
      script.async = true;

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Deezer JSONP timeout on ${endpoint}`));
      }, 3500);

      const cleanup = () => {
        clearTimeout(timer);
        if (script.parentNode) script.parentNode.removeChild(script);
        delete (window as any)[callbackName];
      };

      (window as any)[callbackName] = (data: T) => {
        cleanup();
        resolve(data);
      };

      script.onerror = () => {
        cleanup();
        reject(new Error(`Deezer JSONP load error on ${endpoint}`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Client HTTP intelligent pour Deezer
   * 1. Proxy local / Rewrites Vercel (/api/deezer)
   * 2. JSONP client-side (bypasse CORS mondial sans serveur)
   */
  public async fetchDeezer<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => search.set(k, String(v)));
    const qs = search.toString() ? `?${search.toString()}` : '';

    // Tentative 1 : via /api/deezer
    try {
      const res = await fetch(`/api/deezer/${endpoint.replace(/^\//, '')}${qs}`, {
        signal: AbortSignal.timeout(2200)
      });
      if (res.ok) {
        const text = await res.text();
        if (text && !text.startsWith('<!DOCTYPE') && !text.startsWith('<html')) {
          return JSON.parse(text);
        }
      }
    } catch {}

    // Tentative 2 : via JSONP universel
    try {
      return await this.fetchDeezerJsonp<T>(endpoint, params);
    } catch {}

    throw new Error(`Deezer API unreachable on ${endpoint}`);
  }

  /**
   * Calcul déterministe d'écoutes selon la loi de puissance (Zipf) Spotify
   */
  public computeDeterministicPlays(
    trackId: string,
    rankIndex?: number,
    monthlyListeners?: number,
    trackRank?: number,
    previousPlays?: number
  ): number {
    const listeners = monthlyListeners && monthlyListeners > 0 ? monthlyListeners : 3200000;

    if (rankIndex !== undefined && rankIndex >= 0) {
      const topMultipliers = [13.5, 3.94, 2.47, 2.05, 1.67, 1.35, 1.12, 0.94, 0.78, 0.65];
      const mult = rankIndex < topMultipliers.length ? topMultipliers[rankIndex] : 0.5 / (rankIndex - 7);
      const base = listeners * mult;
      const jitter = (deterministicHash(trackId + rankIndex) % 87654) + 1234;
      let calculated = Math.floor(base) + jitter;

      if (previousPlays && previousPlays > 0) {
        calculated = Math.min(calculated, Math.floor(previousPlays * 0.90));
      }
      return Math.max(15420, calculated);
    }

    const norm = Math.max(0.08, Math.min(1.0, (trackRank || 600000) / 1000000));
    const albumMax = Math.max(800000, listeners * 1.8);
    const calculated = Math.floor(albumMax * Math.pow(norm, 2.6)) + (deterministicHash(trackId) % 43210) + 18500;
    return Math.max(21500, calculated);
  }

  /**
   * Mappe un titre Deezer vers le format interne Track
   */
  public mapDeezerTrack(t: any, fallbackCover?: string, playCountOverride?: number): Track {
    const coverHd = t.album?.cover_xl || t.album?.cover_big || t.album?.cover_medium || fallbackCover || '/default-cover.jpg';
    const artistName = t.artist?.name || (typeof t.artist === 'string' ? t.artist : 'Artiste Inconnu');
    const artistId = String(t.artist?.id || '0');
    const albumId = String(t.album?.id || '0');
    const albumTitle = t.album?.title || 'Single';
    const trackId = `dz-${t.id}`;

    const playCount = playCountOverride !== undefined
      ? playCountOverride
      : this.computeDeterministicPlays(trackId, undefined, undefined, t.rank);

    return {
      id: trackId,
      isrc: t.isrc || `FR-DZ-${t.id}`,
      title: t.title_short || t.title,
      artistId,
      artistName,
      albumId,
      albumTitle,
      coverUrl: coverHd,
      streamUrl: t.preview || undefined,
      durationMs: (t.duration || 180) * 1000,
      sampleRate: 96000,
      bitDepth: 24,
      bitrateKbps: 4608,
      formatLabel: 'Hi-Res Lossless 24-bit / 96 kHz FLAC',
      releaseDate: t.release_date || (t.album?.release_date ? t.album.release_date.split('-')[0] : '2024'),
      playCount,
      lastPlayedTimestamp: Date.now(),
      isFavorite: false,
      isOfflineDownloaded: false,
      isExplicit: t.explicit_lyrics || Boolean(t.explicit_content_lyrics),
      hasVideo: Boolean(t.has_video || deterministicHash(trackId) % 3 === 0),
      palette: {
        primary: '#450af5',
        secondary: '#121212',
      },
      acousticVector: {
        bpm: t.bpm || 115,
        camelotKey: '8B',
        energy: 0.72,
        valence: 0.58,
        danceability: 0.68,
        acousticness: 0.22,
        loudnessLufs: -6.0,
        decade: 2024,
        genre: artistName,
      },
      lyrics: [],
    };
  }

  /**
   * Mappe un titre iTunes vers le format interne Track
   */
  public mapItunesTrack(item: any): Track {
    const durationMs = item.trackTimeMillis || 180000;
    const cover = (item.artworkUrl100 || '').replace('100x100bb', '1000x1000bb');
    const trackId = `it-${item.trackId}`;

    return {
      id: trackId,
      isrc: `US-IT-${item.trackId}`,
      title: item.trackName,
      artistId: String(item.artistId || '0'),
      artistName: item.artistName,
      albumId: String(item.collectionId || '0'),
      albumTitle: item.collectionName || 'Single',
      coverUrl: cover,
      streamUrl: item.previewUrl || undefined,
      durationMs,
      sampleRate: 96000,
      bitDepth: 24,
      bitrateKbps: 4608,
      formatLabel: 'Hi-Res Lossless 24-bit / 96 kHz Apple Audio',
      releaseDate: item.releaseDate ? item.releaseDate.split('T')[0] : '2024-01-01',
      playCount: 154200,
      lastPlayedTimestamp: Date.now(),
      isFavorite: false,
      isOfflineDownloaded: false,
      isExplicit: item.trackExplicitness === 'explicit',
      hasVideo: false,
      palette: { primary: '#450af5', secondary: '#121212' },
      acousticVector: {
        bpm: 120,
        camelotKey: '8B',
        energy: 0.75,
        valence: 0.60,
        danceability: 0.70,
        acousticness: 0.20,
        loudnessLufs: -6.0,
        decade: 2024,
        genre: item.primaryGenreName || 'Musique',
      },
      lyrics: [],
    };
  }

  /**
   * Recherche universelle (Titres, Artistes, Albums) via Deezer avec fallback iTunes
   */
  public async search(query: string, limit: number = 30): Promise<{ tracks: Track[]; artists: Artist[]; albums: Album[] }> {
    if (!query.trim()) {
      return { tracks: [], artists: [], albums: [] };
    }

    const cacheKey = query.toLowerCase().trim();
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    const tracks: Track[] = [];
    const artists: Artist[] = [];
    const albums: Album[] = [];

    // 1. Recherche prioritaire Deezer API (via proxy ou JSONP)
    try {
      const [tracksRes, artistsRes, albumsRes] = await Promise.allSettled([
        this.fetchDeezer<any>('search', { q: query, limit }),
        this.fetchDeezer<any>('search/artist', { q: query, limit: 8 }),
        this.fetchDeezer<any>('search/album', { q: query, limit: 12 }),
      ]);

      if (tracksRes.status === 'fulfilled' && tracksRes.value?.data) {
        tracks.push(...tracksRes.value.data.map((t: any) => this.mapDeezerTrack(t)));
      }

      if (artistsRes.status === 'fulfilled' && artistsRes.value?.data) {
        artists.push(
          ...artistsRes.value.data.map((a: any) => ({
            id: String(a.id),
            name: a.name,
            avatarUrl: a.picture_xl || a.picture_big || a.picture_medium || 'https://cdn-images.dzcdn.net/images/artist/56589954cda1a811317b84fffc1c75b5/1000x1000-000000-80-0-0.jpg',
            monthlyListeners: (a.nb_fan || 50000) * 4,
            bio: `Artiste vérifié officiel sur Spoot Music. Discographie complète disponible.`,
            isFollowed: false,
            hasNewRelease: true,
            albums: [],
          }))
        );
      }

      if (albumsRes.status === 'fulfilled' && albumsRes.value?.data) {
        albums.push(
          ...albumsRes.value.data.map((alb: any) => ({
            id: String(alb.id),
            title: alb.title,
            artistId: String(alb.artist?.id || '0'),
            artistName: alb.artist?.name || 'Artiste',
            coverUrl: alb.cover_xl || alb.cover_big || alb.cover_medium || '/default-cover.jpg',
            releaseYear: alb.release_date ? parseInt(alb.release_date.split('-')[0], 10) : 2024,
            type: (alb.record_type === 'single' ? 'single' : alb.record_type === 'ep' ? 'ep' : 'album') as any,
            trackCount: alb.nb_tracks || 12,
            totalDurationMs: (alb.nb_tracks || 12) * 210000,
            tracks: [],
          }))
        );
      }
    } catch {}

    // 2. Si Deezer n'a rien renvoyé, fallback rapide iTunes API
    if (tracks.length === 0 || artists.length === 0 || albums.length === 0) {
      try {
        const encoded = encodeURIComponent(query);
        const [itunesTracksRes, itunesArtistsRes, itunesAlbumsRes] = await Promise.allSettled([
          fetch(`https://itunes.apple.com/search?term=${encoded}&entity=song&limit=${limit}`),
          fetch(`https://itunes.apple.com/search?term=${encoded}&entity=musicArtist&limit=8`),
          fetch(`https://itunes.apple.com/search?term=${encoded}&entity=album&limit=12`),
        ]);

        if (tracks.length === 0 && itunesTracksRes.status === 'fulfilled' && itunesTracksRes.value.ok) {
          const itData = await itunesTracksRes.value.json();
          if (itData.results && Array.isArray(itData.results)) {
            tracks.push(...itData.results.map((item: any) => this.mapItunesTrack(item)));
          }
        }

        if (artists.length === 0 && itunesArtistsRes.status === 'fulfilled' && itunesArtistsRes.value.ok) {
          const itData = await itunesArtistsRes.value.json();
          if (itData.results && Array.isArray(itData.results)) {
            artists.push(
              ...itData.results.map((item: any) => ({
                id: String(item.artistId),
                name: item.artistName,
                avatarUrl: tracks.find((t) => t.artistName.toLowerCase() === item.artistName.toLowerCase())?.coverUrl ||
                  'https://cdn-images.dzcdn.net/images/artist/56589954cda1a811317b84fffc1c75b5/1000x1000-000000-80-0-0.jpg',
                monthlyListeners: 4200000,
                bio: `Artiste officiel vérifié sur Spoot Music (${item.primaryGenreName || 'Musique'}).`,
                isFollowed: false,
                hasNewRelease: true,
                albums: [],
              }))
            );
          }
        }

        if (albums.length === 0 && itunesAlbumsRes.status === 'fulfilled' && itunesAlbumsRes.value.ok) {
          const itData = await itunesAlbumsRes.value.json();
          if (itData.results && Array.isArray(itData.results)) {
            albums.push(
              ...itData.results.map((alb: any) => ({
                id: String(alb.collectionId),
                title: alb.collectionName,
                artistId: String(alb.artistId || '0'),
                artistName: alb.artistName || 'Artiste',
                coverUrl: (alb.artworkUrl100 || '').replace('100x100bb', '1000x1000bb'),
                releaseYear: alb.releaseDate ? parseInt(alb.releaseDate.split('-')[0], 10) : 2024,
                type: (alb.trackCount === 1 ? 'single' : 'album') as any,
                trackCount: alb.trackCount || 10,
                totalDurationMs: (alb.trackCount || 10) * 200000,
                tracks: [],
              }))
            );
          }
        }
      } catch {}
    }

    const finalResult = { tracks, artists, albums };
    if (tracks.length > 0 || artists.length > 0) {
      this.searchCache.set(cacheKey, finalResult);
    }
    return finalResult;
  }

  /**
   * Tendances du Top 50 mondial / France (Chart)
   */
  public async getChart(): Promise<{ tracks: Track[]; albums: Album[]; artists: Artist[] }> {
    try {
      const data = await this.fetchDeezer<any>('chart/0');
      if (data) {
        const tracks = (data.tracks?.data || []).map((t: any) => this.mapDeezerTrack(t));
        const albums = (data.albums?.data || []).map((alb: any) => ({
          id: String(alb.id),
          title: alb.title,
          artistId: String(alb.artist?.id || '0'),
          artistName: alb.artist?.name || 'Artiste',
          coverUrl: alb.cover_xl || alb.cover_big || alb.cover_medium,
          releaseYear: new Date().getFullYear(),
          type: 'album' as const,
          trackCount: 12,
          totalDurationMs: 2400000,
          tracks: [],
        }));
        const artists = (data.artists?.data || []).map((a: any) => ({
          id: String(a.id),
          name: a.name,
          avatarUrl: a.picture_xl || a.picture_big || a.picture_medium,
          monthlyListeners: (a.nb_fan || 100000) * 4,
          bio: `Artiste officiel Spoot Top Chart`,
          isFollowed: false,
          hasNewRelease: false,
          albums: [],
        }));
        return { tracks, albums, artists };
      }
    } catch {}

    // Fallback avec les morceaux mock enrichis
    return {
      tracks: INITIAL_TRACKS.slice(0, 15),
      albums: INITIAL_ALBUMS.slice(0, 8),
      artists: INITIAL_ARTISTS.slice(0, 8),
    };
  }

  /**
   * Top 50 morceaux les plus streamés (Chart Mondial / France)
   */
  public async getTop50Tracks(): Promise<Track[]> {
    try {
      const data = await this.fetchDeezer<any>('chart/0/tracks', { limit: 50 });
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        return data.data.map((t: any) => this.mapDeezerTrack(t));
      }
    } catch {}

    try {
      const itRes = await fetch('https://itunes.apple.com/search?term=Top+Hits+France&entity=song&limit=50');
      if (itRes.ok) {
        const itData = await itRes.json();
        if (itData.results && Array.isArray(itData.results)) {
          return itData.results.map((item: any) => this.mapItunesTrack(item));
        }
      }
    } catch {}

    return INITIAL_TRACKS;
  }

  /**
   * Récupération autonome des nouveaux sons et tendances mondiales en direct (Releases & Nouveautés)
   */
  public async getLatestLiveReleases(): Promise<{
    tracks: Track[];
    albums: Album[];
    artists: Artist[];
  }> {
    try {
      const [chartData, top50] = await Promise.all([
        this.getChart().catch(() => ({ tracks: [], albums: [], artists: [] })),
        this.getTop50Tracks().catch(() => [] as Track[]),
      ]);

      const uniqueTracks = new Map<string, Track>();
      for (const t of [...chartData.tracks, ...top50]) {
        if (t.id && !uniqueTracks.has(t.id)) {
          uniqueTracks.set(t.id, t);
        }
      }

      return {
        tracks: Array.from(uniqueTracks.values()),
        albums: chartData.albums,
        artists: chartData.artists,
      };
    } catch {
      return { tracks: INITIAL_TRACKS.slice(0, 10), albums: INITIAL_ALBUMS, artists: INITIAL_ARTISTS };
    }
  }

  /**
   * Top Podcasts Tendances (Chart Podcasts)
   */
  public async getTopPodcasts(): Promise<DeezerPodcast[]> {
    try {
      const data = await this.fetchDeezer<any>('chart/0/podcasts');
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        return data.data.map((p: any) => ({
          id: String(p.id),
          title: p.title,
          description: p.description || 'Émission officielle vérifiée',
          coverUrl: p.picture_xl || p.picture_big || p.picture_medium,
          fans: p.fans || 50000,
        }));
      }
    } catch {}

    return [
      {
        id: '6125205',
        title: 'LEGEND',
        description: 'Guillaume Pley reçoit des personnalités aux parcours hors du commun.',
        coverUrl: 'https://cdn-images.dzcdn.net/images/talk/b1d3cc65ef4dcdb9959a57281b6c527a/500x500-000000-80-0-0.jpg',
        fans: 206900
      },
      {
        id: '27263',
        title: 'Les Grosses Têtes',
        description: 'Retrouvez Laurent Ruquier et les sociétaires des Grosses Têtes.',
        coverUrl: 'https://cdn-images.dzcdn.net/images/talk/f05e9ea2e7421cb8b770519bfb7f8c5b/500x500-000000-80-0-0.jpg',
        fans: 145000
      },
      {
        id: '1587392',
        title: 'La dernière',
        description: "Guillaume Meurice, Juliette Arnaud et Aymeric Lompret analysent l'actualité.",
        coverUrl: 'https://cdn-images.dzcdn.net/images/talk/9c4c478a514d3f3ee91f09e8633364f8/500x500-000000-80-0-0.jpg',
        fans: 98000
      },
      {
        id: '1106092',
        title: "Entrez dans l'Histoire",
        description: "Lorànt Deutsch vous emmène sur les traces des plus grandes figures historiques.",
        coverUrl: 'https://cdn-images.dzcdn.net/images/talk/783a48e89f76a165b4c48970e6e7d6a5/500x500-000000-80-0-0.jpg',
        fans: 82000
      }
    ];
  }

  /**
   * Épisodes d'un Podcast Deezer
   */
  public async getPodcastEpisodes(podcastId: string): Promise<DeezerEpisode[]> {
    try {
      const data = await this.fetchDeezer<any>(`podcast/${podcastId}/episodes`);
      if (data?.data && Array.isArray(data.data)) {
        return data.data.map((ep: any) => ({
          id: String(ep.id),
          title: ep.title,
          releaseDate: ep.release_date ? ep.release_date.split(' ')[0] : '2024-01-01',
          durationSeconds: ep.duration || 1800,
          coverUrl: ep.picture_medium || ep.picture_big,
        }));
      }
    } catch {}

    return [
      {
        id: 'ep-1',
        title: 'Interview Exclusive : Les Secrets Révélés',
        releaseDate: '2024-10-25',
        durationSeconds: 3420,
        coverUrl: 'https://cdn-images.dzcdn.net/images/talk/b1d3cc65ef4dcdb9959a57281b6c527a/500x500-000000-80-0-0.jpg'
      },
      {
        id: 'ep-2',
        title: 'Parcours d\'une légende : De l\'ombre à la lumière',
        releaseDate: '2024-10-18',
        durationSeconds: 4100,
        coverUrl: 'https://cdn-images.dzcdn.net/images/talk/b1d3cc65ef4dcdb9959a57281b6c527a/500x500-000000-80-0-0.jpg'
      }
    ];
  }

  /**
   * Récupère un artiste de manière instantanée et synchrone depuis le cache ou les données connues (0ms)
   */
  public getCachedArtist(artistId: string): DeezerArtistDetails | null {
    const cleanId = artistId.replace(/^art-/, '').replace(/^dz-/, '').trim();
    if (this.artistCache.has(cleanId)) return this.artistCache.get(cleanId)!;

    const mockMatch = INITIAL_ARTISTS.find(
      (a) => a.id === cleanId || a.name.toLowerCase() === cleanId.toLowerCase()
    );
    if (mockMatch) {
      return {
        id: mockMatch.id,
        name: mockMatch.name,
        avatarUrl: mockMatch.avatarUrl,
        pictureXl: mockMatch.avatarUrl,
        monthlyListeners: mockMatch.monthlyListeners || 3840000,
        nbFans: Math.round((mockMatch.monthlyListeners || 3840000) / 4),
        nbAlbums: 8,
        bio: mockMatch.bio || `Artiste vérifié officiel sur Spoot Music.`,
        isFollowed: mockMatch.isFollowed ?? true,
        hasNewRelease: mockMatch.hasNewRelease ?? true,
        albums: [],
      };
    }

    const trackMatch = INITIAL_TRACKS.find(
      (t) => t.artistId === cleanId || t.artistName.toLowerCase() === cleanId.toLowerCase()
    );
    if (trackMatch) {
      return {
        id: trackMatch.artistId,
        name: trackMatch.artistName,
        avatarUrl: trackMatch.coverUrl,
        pictureXl: trackMatch.coverUrl,
        monthlyListeners: 3200000,
        nbFans: 450000,
        nbAlbums: 6,
        bio: `Artiste vérifié officiel sur Spoot Music.`,
        isFollowed: true,
        hasNewRelease: true,
        albums: [],
      };
    }

    return null;
  }

  /**
   * Récupère les détails officiels d'un Artiste (Deezer API + fallback iTunes par nom)
   */
  public async getArtist(artistId: string): Promise<DeezerArtistDetails> {
    const cleanId = artistId.replace(/^art-/, '').replace(/^dz-/, '').trim();
    if (this.artistCache.has(cleanId)) {
      return this.artistCache.get(cleanId)!;
    }

    const cached = this.getCachedArtist(cleanId);
    if (cached) {
      this.artistCache.set(cleanId, cached);
      return cached;
    }

    // 1. Si identifiant numérique : appel Deezer artist/ID
    const isNumericId = /^\d+$/.test(cleanId);
    if (isNumericId) {
      try {
        const a = await this.fetchDeezer<any>(`artist/${cleanId}`);
        if (a && a.id) {
          const finalPic = a.picture_xl || a.picture_big || a.picture_medium || 'https://cdn-images.dzcdn.net/images/artist/56589954cda1a811317b84fffc1c75b5/1000x1000-000000-80-0-0.jpg';
          const details: DeezerArtistDetails = {
            id: String(a.id),
            name: a.name,
            avatarUrl: finalPic,
            pictureXl: finalPic,
            monthlyListeners: a.nb_fan ? Math.round(a.nb_fan * 3.8) : 3200000,
            nbFans: a.nb_fan || 250000,
            nbAlbums: a.nb_album || 8,
            bio: `Artiste vérifié officiel sur Spoot Music. Discographie complète disponible en Hi-Res Lossless.`,
            isFollowed: true,
            hasNewRelease: true,
            albums: [],
          };
          this.artistCache.set(cleanId, details);
          return details;
        }
      } catch {}
    }

    // 2. Si identifiant textuel (nom d'artiste) : recherche Deezer search/artist
    try {
      const artSearch = await this.fetchDeezer<any>('search/artist', { q: cleanId, limit: 1 });
      const a = artSearch?.data?.[0];
      if (a && a.id) {
        const finalPic = a.picture_xl || a.picture_big || a.picture_medium || 'https://cdn-images.dzcdn.net/images/artist/56589954cda1a811317b84fffc1c75b5/1000x1000-000000-80-0-0.jpg';
        const details: DeezerArtistDetails = {
          id: String(a.id),
          name: a.name,
          avatarUrl: finalPic,
          pictureXl: finalPic,
          monthlyListeners: a.nb_fan ? Math.round(a.nb_fan * 3.8) : 3200000,
          nbFans: a.nb_fan || 250000,
          nbAlbums: a.nb_album || 8,
          bio: `Artiste vérifié officiel sur Spoot Music. Discographie complète disponible en Hi-Res Lossless.`,
          isFollowed: true,
          hasNewRelease: true,
          albums: [],
        };
        this.artistCache.set(cleanId, details);
        this.artistCache.set(String(a.id), details);
        return details;
      }
    } catch {}

    // 3. Fallback iTunes Search par nom
    try {
      const itRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanId)}&entity=musicArtist&limit=1`);
      if (itRes.ok) {
        const data = await itRes.json();
        const itArtist = data.results?.[0];
        if (itArtist) {
          let avatar = 'https://cdn-images.dzcdn.net/images/artist/56589954cda1a811317b84fffc1c75b5/1000x1000-000000-80-0-0.jpg';
          try {
            const sRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(itArtist.artistName)}&entity=song&limit=1`);
            if (sRes.ok) {
              const sData = await sRes.json();
              if (sData.results?.[0]?.artworkUrl100) {
                avatar = sData.results[0].artworkUrl100.replace('100x100bb', '1000x1000bb');
              }
            }
          } catch {}

          const details: DeezerArtistDetails = {
            id: String(itArtist.artistId),
            name: itArtist.artistName,
            avatarUrl: avatar,
            pictureXl: avatar,
            monthlyListeners: 3500000,
            nbFans: 500000,
            nbAlbums: 7,
            bio: `Artiste officiel vérifié sur Spoot Music (${itArtist.primaryGenreName || 'Musique'}).`,
            isFollowed: true,
            hasNewRelease: true,
            albums: [],
          };
          this.artistCache.set(cleanId, details);
          return details;
        }
      }
    } catch {}

    // 4. Fallback final garanti sans jamais bloquer l'écran
    const readableName = cleanId.replace(/[-_]/g, ' ');
    const fallbackDetails: DeezerArtistDetails = {
      id: cleanId,
      name: readableName.charAt(0).toUpperCase() + readableName.slice(1),
      avatarUrl: 'https://cdn-images.dzcdn.net/images/artist/56589954cda1a811317b84fffc1c75b5/1000x1000-000000-80-0-0.jpg',
      pictureXl: 'https://cdn-images.dzcdn.net/images/artist/56589954cda1a811317b84fffc1c75b5/1000x1000-000000-80-0-0.jpg',
      monthlyListeners: 2800000,
      nbFans: 180000,
      nbAlbums: 6,
      bio: `Artiste officiel vérifié sur Spoot Music. Discographie complète disponible.`,
      isFollowed: true,
      hasNewRelease: true,
      albums: [],
    };
    this.artistCache.set(cleanId, fallbackDetails);
    return fallbackDetails;
  }

  /**
   * Top 10 Titres Populaires d'un Artiste avec vrais previews audio et métadonnées Deezer
   */
  public async getArtistTopTracks(artistId: string, limit: number = 10, artistMonthlyListeners?: number): Promise<Track[]> {
    const cleanId = artistId.replace(/^art-/, '').replace(/^dz-/, '').trim();
    if (this.topTracksCache.has(cleanId)) {
      return this.topTracksCache.get(cleanId)!;
    }

    const listeners = artistMonthlyListeners || this.artistCache.get(cleanId)?.monthlyListeners || 3500000;
    const isNumericId = /^\d+$/.test(cleanId);

    // 1. Appel Deezer artist/ID/top
    if (isNumericId) {
      try {
        const data = await this.fetchDeezer<any>(`artist/${cleanId}/top`, { limit });
        if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
          let prevPlays = 0;
          const mapped = data.data.map((t: any, idx: number) => {
            const trackId = `dz-${t.id}`;
            const plays = this.computeDeterministicPlays(trackId, idx, listeners, t.rank, prevPlays);
            prevPlays = plays;
            return this.mapDeezerTrack(t, undefined, plays);
          });
          this.topTracksCache.set(cleanId, mapped);
          return mapped;
        }
      } catch {}
    }

    // 2. Recherche Deezer par nom d'artiste
    const artistName = this.artistCache.get(cleanId)?.name || cleanId;
    try {
      const data = await this.fetchDeezer<any>('search', { q: `artist:"${artistName}"`, limit });
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        let prevPlays = 0;
        const mapped = data.data.map((t: any, idx: number) => {
          const trackId = `dz-${t.id}`;
          const plays = this.computeDeterministicPlays(trackId, idx, listeners, t.rank, prevPlays);
          prevPlays = plays;
          return this.mapDeezerTrack(t, undefined, plays);
        });
        this.topTracksCache.set(cleanId, mapped);
        return mapped;
      }
    } catch {}

    // 3. Fallback catalogue mock instantané si disponible
    const matchedMockTracks = INITIAL_TRACKS.filter(
      (t) => t.artistId === cleanId || t.artistName.toLowerCase().includes(artistName.toLowerCase())
    );
    if (matchedMockTracks.length > 0) {
      this.topTracksCache.set(cleanId, matchedMockTracks);
      return matchedMockTracks;
    }

    // 4. Fallback iTunes Search par nom
    try {
      const itRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&country=FR&entity=song&limit=${limit}`);
      if (itRes.ok) {
        const itData = await itRes.json();
        if (itData.results && Array.isArray(itData.results)) {
          const mapped = itData.results.map((item: any) => this.mapItunesTrack(item));
          if (mapped.length > 0) {
            this.topTracksCache.set(cleanId, mapped);
            return mapped;
          }
        }
      }
    } catch {}

    return INITIAL_TRACKS.slice(0, limit);
  }

  /**
   * Discographie Complète d'un Artiste (Albums, Singles, EP)
   */
    /**
   * Discographie Épurée & Filtrée avec Élimination Stricte des Albums Fantômes (Tributes, Covers, Karaoke)
   * et séparation nette en 3 collections : Albums, Singles & EP, Apparitions & Compilations.
   */
  public async getArtistDiscographyClean(artistId: string, limit: number = 60): Promise<ArtistDiscographyClean> {
    const cleanId = artistId.replace(/^art-/, '').replace(/^dz-/, '').trim();
    const isNumericId = /^\d+$/.test(cleanId);
    const currentArtistId = isNumericId ? parseInt(cleanId, 10) : null;

    let rawList: any[] = [];

    if (isNumericId) {
      try {
        const data = await this.fetchDeezer<any>(`artist/${cleanId}/albums`, { limit });
        if (data?.data && Array.isArray(data.data)) {
          rawList = data.data;
        }
      } catch {}
    }

    if (rawList.length === 0) {
      const artistName = this.artistCache.get(cleanId)?.name || cleanId;
      try {
        const itRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=album&limit=${limit}`);
        if (itRes.ok) {
          const itData = await itRes.json();
          if (itData.results && Array.isArray(itData.results)) {
            rawList = itData.results.map((alb: any) => ({
              id: String(alb.collectionId),
              title: alb.collectionName,
              record_type: alb.trackCount <= 3 ? 'single' : 'album',
              release_date: alb.releaseDate,
              cover_xl: (alb.artworkUrl100 || '').replace('100x100bb', '1000x1000bb'),
              artist: { id: currentArtistId, name: alb.artistName },
              nb_tracks: alb.trackCount
            }));
          }
        }
      } catch {}
    }

    const JUNK_ALBUM_TERMS = ['tribute', 'covers', 'cover', 'karaoke', 'piano', 'instrumental', 'remix collection'];
    const isJunk = (title: string) => {
      const lower = (title || '').toLowerCase();
      return JUNK_ALBUM_TERMS.some(term => lower.includes(term));
    };

    const mapAlbum = (alb: any, forcedType?: 'album' | 'single' | 'ep'): Album => ({
      id: String(alb.id),
      title: alb.title,
      artistId: cleanId,
      artistName: alb.artist?.name || this.artistCache.get(cleanId)?.name || 'Artiste',
      coverUrl: alb.cover_xl || alb.cover_big || alb.cover_medium || '/default-cover.jpg',
      releaseYear: alb.release_date ? parseInt(alb.release_date.split('-')[0], 10) : 2024,
      type: forcedType || (alb.record_type === 'single' ? 'single' : alb.record_type === 'ep' ? 'ep' : 'album'),
      trackCount: alb.nb_tracks || 10,
      totalDurationMs: (alb.nb_tracks || 10) * 200000,
      tracks: []
    });

    // 1. Albums Studios Officiels : record_type === 'album', pas de junk, artistId correspondant
    const albums = rawList
      .filter((alb: any) => {
        const isRecAlbum = alb.record_type === 'album';
        const notJunk = !isJunk(alb.title);
        const matchesArtist = !currentArtistId || !alb.artist?.id || alb.artist.id === currentArtistId;
        return isRecAlbum && notJunk && matchesArtist;
      })
      .map(alb => mapAlbum(alb, 'album'));

    // 2. Singles & EPs Officiels
    const singlesAndEPs = rawList
      .filter((alb: any) => {
        const isSingleOrEp = alb.record_type === 'single' || alb.record_type === 'ep';
        const notJunk = !isJunk(alb.title);
        const matchesArtist = !currentArtistId || !alb.artist?.id || alb.artist.id === currentArtistId;
        return isSingleOrEp && notJunk && matchesArtist;
      })
      .map(alb => mapAlbum(alb, alb.record_type === 'ep' ? 'ep' : 'single'));

    // 3. Apparitions & Compilations : record_type === 'compile' ou apparitions featurings / artistes différents
    const compilationsAndAppearances = rawList
      .filter((alb: any) => {
        const isCompile = alb.record_type === 'compile';
        const isOtherArtist = currentArtistId && alb.artist?.id && alb.artist.id !== currentArtistId;
        const hasCompileTerm = (alb.title || '').toLowerCase().includes('best of') || (alb.title || '').toLowerCase().includes('compilation');
        return (isCompile || isOtherArtist || hasCompileTerm) && !isJunk(alb.title);
      })
      .map(alb => mapAlbum(alb, 'album'));

    return {
      albums,
      singlesAndEPs,
      compilationsAndAppearances
    };
  }

  public async getArtistAlbums(artistId: string, limit: number = 24): Promise<Album[]> {
    const cleanId = artistId.replace(/^art-/, '').replace(/^dz-/, '').trim();
    const isNumericId = /^\d+$/.test(cleanId);

    if (isNumericId) {
      try {
        const data = await this.fetchDeezer<any>(`artist/${cleanId}/albums`, { limit });
        if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
          return data.data.map((alb: any) => ({
            id: String(alb.id),
            title: alb.title,
            artistId: cleanId,
            artistName: alb.artist?.name || this.artistCache.get(cleanId)?.name || 'Artiste',
            coverUrl: alb.cover_xl || alb.cover_big || alb.cover_medium,
            releaseYear: alb.release_date ? parseInt(alb.release_date.split('-')[0], 10) : 2024,
            type: (alb.record_type === 'single' ? 'single' : alb.record_type === 'ep' ? 'ep' : 'album') as any,
            trackCount: alb.nb_tracks || 10,
            totalDurationMs: (alb.nb_tracks || 10) * 200000,
            tracks: [],
          }));
        }
      } catch {}
    }

    const artistName = this.artistCache.get(cleanId)?.name || cleanId;
    try {
      const itRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=album&limit=${limit}`);
      if (itRes.ok) {
        const itData = await itRes.json();
        if (itData.results && Array.isArray(itData.results)) {
          return itData.results.map((alb: any) => ({
            id: String(alb.collectionId),
            title: alb.collectionName,
            artistId: cleanId,
            artistName: alb.artistName || artistName,
            coverUrl: (alb.artworkUrl100 || '').replace('100x100bb', '1000x1000bb'),
            releaseYear: alb.releaseDate ? parseInt(alb.releaseDate.split('-')[0], 10) : 2024,
            type: (alb.trackCount === 1 ? 'single' : 'album') as any,
            trackCount: alb.trackCount || 10,
            totalDurationMs: (alb.trackCount || 10) * 200000,
            tracks: [],
          }));
        }
      }
    } catch {}

    return INITIAL_ALBUMS;
  }

  /**
   * Artistes Similaires (Fans Also Like)
   */
  public async getArtistRelated(artistId: string, limit: number = 8): Promise<Artist[]> {
    const cleanId = artistId.replace(/^art-/, '').replace(/^dz-/, '').trim();
    if (/^\d+$/.test(cleanId)) {
      try {
        const data = await this.fetchDeezer<any>(`artist/${cleanId}/related`, { limit });
        if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
          return data.data.map((a: any) => ({
            id: String(a.id),
            name: a.name,
            avatarUrl: a.picture_xl || a.picture_big || a.picture_medium,
            monthlyListeners: (a.nb_fan || 50000) * 4,
            bio: `Artiste similaire recommandé sur Spoot Music.`,
            isFollowed: false,
            hasNewRelease: false,
            albums: [],
          }));
        }
      } catch {}
    }

    return INITIAL_ARTISTS.filter((a) => a.id !== cleanId).slice(0, limit);
  }

  /**
   * Détails d'un Album et liste complète de ses pistes
   */
  public async getAlbum(albumId: string): Promise<DeezerAlbumDetails | null> {
    const cleanId = albumId.replace(/^alb-/, '').replace(/^dz-/, '').trim();
    if (this.albumCache.has(cleanId)) return this.albumCache.get(cleanId)!;

    if (/^\d+$/.test(cleanId)) {
      try {
        const alb = await this.fetchDeezer<any>(`album/${cleanId}`);
        if (alb && alb.id) {
          const cover = alb.cover_xl || alb.cover_big || alb.cover_medium;
          const artistName = alb.artist?.name || 'Artiste';
          const artistId = String(alb.artist?.id || '0');
          const tracks: Track[] = (alb.tracks?.data || []).map((t: any) => this.mapDeezerTrack(t, cover));

          const details: DeezerAlbumDetails = {
            id: String(alb.id),
            title: alb.title,
            artistId,
            artistName,
            artistPictureSmall: alb.artist?.picture_medium || '',
            coverUrl: cover,
            coverXl: cover,
            releaseYear: alb.release_date ? parseInt(alb.release_date.split('-')[0], 10) : 2024,
            releaseDate: alb.release_date || '2024-01-01',
            type: (alb.record_type === 'single' ? 'single' : alb.record_type === 'ep' ? 'ep' : 'album') as any,
            trackCount: alb.nb_tracks || tracks.length,
            totalDurationMs: (alb.duration || 1800) * 1000,
            genres: (alb.genres?.data || []).map((g: any) => g.name),
            tracks,
          };
          this.albumCache.set(cleanId, details);
          return details;
        }
      } catch {}
    }

    const mockMatch = INITIAL_ALBUMS.find((a) => a.id === albumId || a.id === cleanId);
    if (mockMatch) {
      const albTracks = INITIAL_TRACKS.filter((t) => t.albumId === mockMatch.id);
      const details: DeezerAlbumDetails = {
        ...mockMatch,
        coverXl: mockMatch.coverUrl,
        releaseDate: '2024-01-01',
        artistPictureSmall: '',
        genres: ['Musique'],
        tracks: albTracks,
      };
      this.albumCache.set(cleanId, details);
      return details;
    }

    return null;
  }

  /**
   * Titres du Unreleased Vault / Exclusivités Spoot
   */
  public async getArtistUnreleased(artistName: string): Promise<any[]> {
    const clean = artistName.toLowerCase().trim();
    const vaultMap: Record<string, any[]> = {
      'kendrick': [
        { id: 'kdot-vault-1', title: 'Prayer (Mr. Morale Sessions / Unreleased Studio Master)', durationFormatted: '3:32', durationMs: 212000, viewCount: 1850000, coverUrl: 'https://cdn-images.dzcdn.net/images/artist/be0a7c550567f4af0ed202d7235b74d6/1000x1000-000000-80-0-0.jpg', streamUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/bf/f9/06/bff90680-e83c-246e-1da8-fbbe4508e820/mzaf_6097127506229983995.plus.aac.p.m4a' },
        { id: 'kdot-vault-2', title: 'I\'m Better (feat. Sampha - Unreleased Studio Cut)', durationFormatted: '3:48', durationMs: 228000, viewCount: 1420000, coverUrl: 'https://cdn-images.dzcdn.net/images/artist/be0a7c550567f4af0ed202d7235b74d6/1000x1000-000000-80-0-0.jpg', streamUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/18/f7/e5/18f7e5b6-c67b-1178-08f2-895c2e91244e/mzaf_10444321743135406059.plus.aac.p.m4a' },
        { id: 'kdot-vault-3', title: 'Cartoons & Cereal (feat. Gunplay - GKMC Vault Classic)', durationFormatted: '6:47', durationMs: 407000, viewCount: 3200000, coverUrl: 'https://cdn-images.dzcdn.net/images/artist/be0a7c550567f4af0ed202d7235b74d6/1000x1000-000000-80-0-0.jpg', streamUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/a4/09/be/a409be43-8515-77ee-6a75-b3a1a9e86971/mzaf_16382024987720974864.plus.aac.p.m4a' },
        { id: 'kdot-vault-4', title: 'Gotta Love Me (feat. Baby Keem - Studio Session Leak)', durationFormatted: '2:45', durationMs: 165000, viewCount: 980000, coverUrl: 'https://cdn-images.dzcdn.net/images/artist/be0a7c550567f4af0ed202d7235b74d6/1000x1000-000000-80-0-0.jpg', streamUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/55/96/f8/5596f8c7-43ca-6a45-6c7c-fbf9c0d95101/mzaf_12891965687796441584.plus.aac.p.m4a' },
        { id: 'kdot-vault-5', title: 'Pure (Mr. Morale Unreleased Leak Master)', durationFormatted: '3:15', durationMs: 195000, viewCount: 820000, coverUrl: 'https://cdn-images.dzcdn.net/images/artist/be0a7c550567f4af0ed202d7235b74d6/1000x1000-000000-80-0-0.jpg', streamUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/4a/01/5e/4a015ecb-1ad3-4ec6-75fa-659f71c360b9/mzaf_3313204780509650392.plus.aac.p.m4a' },
        { id: 'kdot-vault-6', title: 'Look Out for Detox (Classic Mixtape Tape Archive)', durationFormatted: '3:05', durationMs: 185000, viewCount: 2900000, coverUrl: 'https://cdn-images.dzcdn.net/images/artist/be0a7c550567f4af0ed202d7235b74d6/1000x1000-000000-80-0-0.jpg', streamUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/13/28/76/132876b6-bf25-b44c-3543-ec52d0fa557e/mzaf_13506144883464521473.plus.aac.p.m4a' }
      ],
      'damso': [
        { id: 'dam-vault-1', title: 'Cœur de pirate (Unreleased Studio Leak 2021)', durationFormatted: '3:18', durationMs: 198000, viewCount: 890000, coverUrl: 'https://cdn-images.dzcdn.net/images/cover/b4198c9beee603f9ec6727218ea19142/1000x1000-000000-80-0-0.jpg' },
        { id: 'dam-vault-2', title: 'Ipséité Intro (Démo Studio 2017 Archive)', durationFormatted: '2:45', durationMs: 165000, viewCount: 1100000, coverUrl: 'https://cdn-images.dzcdn.net/images/cover/b4198c9beee603f9ec6727218ea19142/1000x1000-000000-80-0-0.jpg' },
        { id: 'dam-vault-3', title: 'QALF Session (Leak Bruxelles Inédit)', durationFormatted: '3:30', durationMs: 210000, viewCount: 740000, coverUrl: 'https://cdn-images.dzcdn.net/images/cover/b4198c9beee603f9ec6727218ea19142/1000x1000-000000-80-0-0.jpg' },
        { id: 'dam-vault-4', title: 'Ouzbek (Inédit Théâtre Antique)', durationFormatted: '3:02', durationMs: 182000, viewCount: 630000, coverUrl: 'https://cdn-images.dzcdn.net/images/cover/b4198c9beee603f9ec6727218ea19142/1000x1000-000000-80-0-0.jpg' }
      ],
      'drake': [
        { id: 'drk-vault-1', title: 'Neatly (Unreleased Leak CLB Era)', durationFormatted: '3:12', durationMs: 192000, viewCount: 1650000 },
        { id: 'drk-vault-2', title: 'Vital (Unreleased Scorpion Leak Master)', durationFormatted: '3:55', durationMs: 235000, viewCount: 2100000 },
        { id: 'drk-vault-3', title: 'Lie to Me (Studio Archive Leak)', durationFormatted: '2:48', durationMs: 168000, viewCount: 1200000 },
        { id: 'drk-vault-4', title: 'At the Gates (feat. Lil Uzi Vert - Unreleased)', durationFormatted: '3:25', durationMs: 205000, viewCount: 1800000 }
      ],
      'carti': [
        { id: 'crt-vault-1', title: '24 Songs / Made It This Far (V2 Era Leak Master)', durationFormatted: '3:35', durationMs: 215000, viewCount: 4500000 },
        { id: 'crt-vault-2', title: 'Cancun (SEGA Edition Studio Archive)', durationFormatted: '2:10', durationMs: 130000, viewCount: 6800000 },
        { id: 'crt-vault-3', title: 'Skeleton (Prod. Pi\'erre Bourne Leak)', durationFormatted: '2:32', durationMs: 152000, viewCount: 3200000 },
        { id: 'crt-vault-4', title: 'Molly / No Stylist (Unreleased Studio Master)', durationFormatted: '3:10', durationMs: 190000, viewCount: 5100000 }
      ],
      'travis': [
        { id: 'trv-vault-1', title: 'Heartbeat (Utopia Leak Session Master)', durationFormatted: '3:20', durationMs: 200000, viewCount: 2400000 },
        { id: 'trv-vault-2', title: 'Too Many Chances (Astroworld Unreleased Archive)', durationFormatted: '3:45', durationMs: 225000, viewCount: 1900000 },
        { id: 'trv-vault-3', title: 'Trill Mode (Unreleased Studio Demo)', durationFormatted: '2:55', durationMs: 175000, viewCount: 1300000 }
      ],
      'kanye': [
        { id: 'ye-vault-1', title: 'Never See Me Again (Good Ass Job Legend Archive)', durationFormatted: '8:40', durationMs: 520000, viewCount: 5800000 },
        { id: 'ye-vault-2', title: 'Mama\'s Boyfriend (MBDTF Sessions Unreleased)', durationFormatted: '3:58', durationMs: 238000, viewCount: 3400000 },
        { id: 'ye-vault-3', title: 'Can U Be (feat. Travis Scott - TurboGrafx16 Leak)', durationFormatted: '3:15', durationMs: 195000, viewCount: 4200000 }
      ],
      'juice': [
        { id: 'jw-vault-1', title: 'Rental / Cha-Ching (Unreleased Studio Master)', durationFormatted: '4:12', durationMs: 252000, viewCount: 7200000 },
        { id: 'jw-vault-2', title: 'KTM Drip (Unreleased Leak)', durationFormatted: '3:35', durationMs: 215000, viewCount: 4100000 },
        { id: 'jw-vault-3', title: 'Adore You (Unreleased Archive)', durationFormatted: '3:05', durationMs: 185000, viewCount: 3600000 }
      ],
      'sdm': [
        { id: 'sdm-vault-1', title: 'CARTIER SANTOS (Studio V1 Session Extended)', durationFormatted: '3:45', durationMs: 225000, viewCount: 620000, coverUrl: 'https://cdn-images.dzcdn.net/images/cover/640220bd3d80561118391eef3a24fb53/1000x1000-000000-80-0-0.jpg' },
        { id: 'sdm-vault-2', title: 'ALVALM Intro (Unreleased Leak Demo)', durationFormatted: '2:58', durationMs: 178000, viewCount: 480000, coverUrl: 'https://cdn-images.dzcdn.net/images/cover/640220bd3d80561118391eef3a24fb53/1000x1000-000000-80-0-0.jpg' },
        { id: 'sdm-vault-3', title: 'Bolide Allemand (Live Bercy Acapella Exclusive)', durationFormatted: '3:20', durationMs: 200000, viewCount: 750000, coverUrl: 'https://cdn-images.dzcdn.net/images/cover/640220bd3d80561118391eef3a24fb53/1000x1000-000000-80-0-0.jpg' },
        { id: 'sdm-vault-4', title: '8 Réseau (Freestyle Inédit Studio Session)', durationFormatted: '2:50', durationMs: 170000, viewCount: 510000, coverUrl: 'https://cdn-images.dzcdn.net/images/cover/640220bd3d80561118391eef3a24fb53/1000x1000-000000-80-0-0.jpg' }
      ],
      'tiakola': [
        { id: 'tia-vault-1', title: 'BDLM (Solo Studio Cut Demo)', durationFormatted: '3:12', durationMs: 192000, viewCount: 540000, coverUrl: 'https://cdn-images.dzcdn.net/images/cover/af056d5fa6167cfd1917dc0e08c11083/1000x1000-000000-80-0-0.jpg' },
        { id: 'tia-vault-2', title: 'Mélo Tape (Leak Archive 2024)', durationFormatted: '3:05', durationMs: 185000, viewCount: 410000, coverUrl: 'https://cdn-images.dzcdn.net/images/cover/af056d5fa6167cfd1917dc0e08c11083/1000x1000-000000-80-0-0.jpg' },
        { id: 'tia-vault-3', title: 'La Clé (Acoustic Guitar Session)', durationFormatted: '2:48', durationMs: 168000, viewCount: 690000, coverUrl: 'https://cdn-images.dzcdn.net/images/cover/af056d5fa6167cfd1917dc0e08c11083/1000x1000-000000-80-0-0.jpg' },
        { id: 'tia-vault-4', title: 'Mode Avion (Inédit Studio Session)', durationFormatted: '2:52', durationMs: 172000, viewCount: 450000, coverUrl: 'https://cdn-images.dzcdn.net/images/cover/af056d5fa6167cfd1917dc0e08c11083/1000x1000-000000-80-0-0.jpg' }
      ],
      'gazo': [
        { id: 'gz-vault-1', title: 'Drill FR (Maquette Studio Exclusive)', durationFormatted: '3:10', durationMs: 190000, viewCount: 680000 },
        { id: 'gz-vault-2', title: 'K-Maro (Unreleased Leak 2024)', durationFormatted: '2:45', durationMs: 165000, viewCount: 590000 }
      ],
      'ninho': [
        { id: 'ni-vault-1', title: 'M.I.L.S 4 Intro (Maquette Studio Inédite)', durationFormatted: '3:25', durationMs: 205000, viewCount: 820000 },
        { id: 'ni-vault-2', title: 'VVS (Unreleased Demo Leak)', durationFormatted: '2:55', durationMs: 175000, viewCount: 710000 }
      ],
      'vacra': [
        { id: 'vac-vault-1', title: 'Tiki Taka (Acoustic Session Inédite)', durationFormatted: '3:15', durationMs: 195000, viewCount: 380000 },
        { id: 'vac-vault-2', title: 'Plan B (Démo Studio Archive)', durationFormatted: '2:50', durationMs: 170000, viewCount: 290000 }
      ],
      'yoasobi': [
        { id: 'yoa-vault-1', title: '夜に駆ける (The First Take Studio Master Unreleased)', durationFormatted: '4:15', durationMs: 255000, viewCount: 1200000 },
        { id: 'yoa-vault-2', title: 'Gunjo (Acoustic Piano Session)', durationFormatted: '3:50', durationMs: 230000, viewCount: 950000 }
      ]
    };

    for (const [key, list] of Object.entries(vaultMap)) {
      if (clean.includes(key)) {
        return list.map(item => ({ ...item, artistName }));
      }
    }

    return [
      { id: `${clean}-vault-1`, title: `${artistName} — Session Studio Exclusive 2024`, durationFormatted: '3:10', durationMs: 190000, viewCount: 320000, artistName },
      { id: `${clean}-vault-2`, title: `${artistName} — Démo Inédite (Spoot Vault Leak)`, durationFormatted: '2:45', durationMs: 165000, viewCount: 280000, artistName }
    ];
  }

  /**
   * Paroles synchronisées via LRCLIB Public API (open CORS mondial)
   */
  public async getSyncedLyrics(
    artistName: string,
    trackTitle: string,
    durationMs: number = 180000
  ): Promise<{ lyrics: LyricLine[]; isInstrumental: boolean }> {
    const cacheKey = `${artistName} - ${trackTitle}`.toLowerCase();
    if (this.lyricsCache.has(cacheKey)) {
      return { lyrics: this.lyricsCache.get(cacheKey)!, isInstrumental: false };
    }

    const catalogMatch = INITIAL_TRACKS.find(
      (t) =>
        t.title.toLowerCase() === trackTitle.toLowerCase() ||
        (t.artistName.toLowerCase() === artistName.toLowerCase() && t.title.toLowerCase().includes(trackTitle.toLowerCase()))
    );
    if (catalogMatch && catalogMatch.lyrics && catalogMatch.lyrics.length > 0) {
      this.lyricsCache.set(cacheKey, catalogMatch.lyrics);
      return { lyrics: catalogMatch.lyrics, isInstrumental: false };
    }

    const cleanArtist = artistName.replace(/\(.*\)/g, '').replace(/feat\..*/i, '').replace(/[,&].*/, '').trim();
    const cleanTitle = trackTitle.replace(/\(.*\)/g, '').replace(/\[.*\]/g, '').replace(/feat\..*/i, '').trim();

    const lrclibEndpoints = [
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`,
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artistName)}&track_name=${encodeURIComponent(trackTitle)}`,
      `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanArtist} ${cleanTitle}`)}`,
      `https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle)}`
    ];

    for (const url of lrclibEndpoints) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(2800) });
        if (res.ok) {
          const data = await res.json();
          const targetItem = Array.isArray(data) ? data[0] : data;
          if (targetItem) {
            if (targetItem.instrumental) {
              return { lyrics: [], isInstrumental: true };
            }
            if (targetItem.syncedLyrics) {
              const lines = this.parseLrc(targetItem.syncedLyrics);
              if (lines.length > 0) {
                this.lyricsCache.set(cacheKey, lines);
                return { lyrics: lines, isInstrumental: false };
              }
            }
            if (targetItem.plainLyrics) {
              const lines = this.synthesizeLyricsTiming(targetItem.plainLyrics, durationMs);
              this.lyricsCache.set(cacheKey, lines);
              return { lyrics: lines, isInstrumental: false };
            }
          }
        }
      } catch {}
    }

    return { lyrics: [], isInstrumental: true };
  }

  private parseLrc(lrcText: string): LyricLine[] {
    const lines = lrcText.split('\n');
    const result: LyricLine[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
      const match = timeRegex.exec(line);
      if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const frac = parseInt(match[3].padEnd(3, '0').slice(0, 3), 10);
        const timeMs = min * 60000 + sec * 1000 + frac;
        const text = line.replace(/\s*\[\d{2}:\d{2}\.\d{2,3}\]\s*/g, '').trim();
        if (text) {
          result.push({ timeMs, text });
        }
      }
    }
    return result.sort((a, b) => a.timeMs - b.timeMs);
  }

  private synthesizeLyricsTiming(plainText: string, totalDurationMs: number): LyricLine[] {
    const rawLines = plainText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (rawLines.length === 0) return [];
    const stepMs = Math.floor((totalDurationMs * 0.85) / rawLines.length);
    const initialOffset = Math.min(3000, Math.floor(totalDurationMs * 0.05));

    return rawLines.map((text, idx) => ({
      timeMs: initialOffset + idx * stepMs,
      text,
    }));
  }
}

export const deezerService = DeezerService.getInstance();
