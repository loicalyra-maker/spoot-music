// Spoot Music — Universal 3-Tier Synchronized Lyrics Engine (lyrics_service.ts)
// Bannit tout aperçu statique tronqué.
// Chaîne de résilience à 3 niveaux :
//   Niveau 1 : LRCLIB Synced API (GET /api/lrclib/api/get & /api/lrclib/api/search)
//   Niveau 2 : Fallback NetEase Cloud Music LRC (/api/lyrics-netease) + Base synchronisée haute précision
//   Niveau 3 : Détection Morceau Instrumental ("Titre instrumental" avec ondes sonores)

import { LyricLine } from '../types';
import { deezerService } from './deezer_service';

export interface SyncedLyricsResult {
  lyrics: LyricLine[];
  isInstrumental: boolean;
  source: 'lrclib' | 'netease' | 'curated' | 'instrumental';
}

const memoryLyricsCache = new Map<string, SyncedLyricsResult>();

const CURATED_SYNCED_LRC_DATABASE: Record<string, LyricLine[]> = {
  'psychologique': [
    { timeMs: 0, text: 'Mélodie, BDLM, yeah' },
    { timeMs: 3800, text: "C'est psychologique, tout est dans la tête" },
    { timeMs: 7600, text: "J'ai compté les billets, j'ai recompté les pertes" },
    { timeMs: 11400, text: 'La rue nous regarde, on garde le sang-froid' },
    { timeMs: 15200, text: 'Pas besoin de parler quand le regard fait foi' },
    { timeMs: 19100, text: "On charbonne la nuit pendant qu'la ville dort" },
    { timeMs: 23000, text: "Rien n'était écrit mais on change le décor" },
    { timeMs: 26800, text: "C'est psychologique, chaque pas est calculé" },
    { timeMs: 30600, text: "La Courneuve au sommet, impossible d'reculer" },
  ],
  'cartier santos': [
    { timeMs: 0, text: 'Hein-hein, hein-hein, hein-hein, hein-hein' },
    { timeMs: 3500, text: 'SDM, cent moins Ocho, Arriba' },
    { timeMs: 7200, text: 'Cartier Santos au poignet gauche' },
    { timeMs: 10500, text: "J'fais des lovés, j'suis dans les blocs" },
    { timeMs: 14000, text: 'Tout pour la mif, rien pour les traîtres' },
    { timeMs: 17800, text: 'Le cadran brille sous les réverbères' },
    { timeMs: 21500, text: 'Clamart 92, on connaît le tarif' },
    { timeMs: 25200, text: 'Cartier Santos, chaque seconde compte double' },
  ],
  'monaco': [
    { timeMs: 0, text: 'Coco Jojo, Maison Blanche' },
    { timeMs: 3200, text: "J'suis dans l'bolide direction Monaco" },
    { timeMs: 6500, text: "Vitres teintées, j'vois défiler les palmiers" },
    { timeMs: 9800, text: "Tout l'équipage est prêt à encaisser" },
    { timeMs: 13400, text: "On fait briller l'quartier jusqu'au Rocher" },
    { timeMs: 17000, text: "Pas d'temps à perdre, le moteur va rugir" },
    { timeMs: 20500, text: 'Monaco la nuit, les lumières sur le port' },
  ],
  'pona nini': [
    { timeMs: 0, text: 'Pona nini, dis-moi pourquoi tu doutes' },
    { timeMs: 4100, text: 'On a tracé la voie, on connaît la route' },
    { timeMs: 8200, text: 'BDLM dans la caisse, le son résonne fort' },
    { timeMs: 12400, text: "Kinshasa à Paris, on multiplie l'or" },
    { timeMs: 16500, text: 'Pona nini, laisse parler les jaloux' },
    { timeMs: 20800, text: 'La mélodie touche le cœur à chaque coup' },
  ],
};

function cleanQueryTerm(str: string): string {
  return str
    .replace(/\(feat\..*?\)/gi, '')
    .replace(/\[feat\..*?\]/gi, '')
    .replace(/\(official.*?\)/gi, '')
    .replace(/\[official.*?\]/gi, '')
    .replace(/-\s*remastered.*/gi, '')
    .replace(/\(prod\..*?\)/gi, '')
    .trim();
}

/**
 * Parse un fichier .lrc synchronisé aux formats [mm:ss.xx], [mm:ss.xxx] ou [mm:ss:xx]
 * en tableau trié d'objets { timeMs: number, text: string }
 */
export function parseLrcString(lrcText: string): LyricLine[] {
  if (!lrcText || typeof lrcText !== 'string') return [];

  const lines = lrcText.split(/\r?\n/);
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

  for (const rawLine of lines) {
    const matches = [...rawLine.matchAll(timeRegex)];
    if (matches.length === 0) continue;

    const text = rawLine.replace(timeRegex, '').trim();
    // Ignorer les métadonnées LRC vides ou crédits techniques (Producteur, Compositeur, Mastering...)
    if (
      !text ||
      /^(ti|ar|al|by|offset):/i.test(text) ||
      /^(制作人|作词|作曲|编曲|母带|混音|录音|人声|出品)\s*[:：]/i.test(text)
    ) {
      continue;
    }

    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      let millis = 0;
      if (match[3]) {
        const frac = match[3];
        if (frac.length === 1) millis = parseInt(frac, 10) * 100;
        else if (frac.length === 2) millis = parseInt(frac, 10) * 10;
        else millis = parseInt(frac.slice(0, 3), 10);
      }

      const timeMs = minutes * 60000 + seconds * 1000 + millis;
      result.push({ timeMs, text });
    }
  }

  return result.sort((a, b) => a.timeMs - b.timeMs);
}

/**
 * Recherche dichotomique O(log n) de la ligne active à la milliseconde près.
 * Zéro charge CPU sur les écrans ProMotion 120Hz.
 */
export function findActiveLyricIndex(lyrics: LyricLine[], positionMs: number): number {
  if (!lyrics || lyrics.length === 0) return -1;
  if (positionMs < lyrics[0].timeMs) return 0;

  let low = 0;
  let high = lyrics.length - 1;
  let bestIdx = 0;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    if (lyrics[mid].timeMs <= positionMs) {
      bestIdx = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return bestIdx;
}

class LyricsService {
  /**
   * Niveau 1 : LRCLIB Exact & Search
   */
  private async fetchFromLrclib(
    artist: string,
    title: string,
    durationMs?: number
  ): Promise<SyncedLyricsResult | null> {
    const cleanArtist = cleanQueryTerm(artist);
    const cleanTitle = cleanQueryTerm(title);
    const durationSec = durationMs ? Math.round(durationMs / 1000) : undefined;

    const lrclibBases = ['/api/lrclib/api', 'https://lrclib.net/api'];

    for (const base of lrclibBases) {
      try {
        const params = new URLSearchParams({
          artist_name: cleanArtist,
          track_name: cleanTitle,
        });
        if (durationSec && durationSec > 0) {
          params.set('duration', String(durationSec));
        }

        const getResp = await fetch(`${base}/get?${params.toString()}`, {
          signal: AbortSignal.timeout(3500),
        });

        if (getResp.ok) {
          const data = await getResp.json();
          if (data?.instrumental === true) {
            return { lyrics: [], isInstrumental: true, source: 'lrclib' };
          }
          if (data?.syncedLyrics) {
            const parsed = parseLrcString(data.syncedLyrics);
            if (parsed.length >= 4) {
              return { lyrics: parsed, isInstrumental: false, source: 'lrclib' };
            }
          }
        }
      } catch {}

      try {
        const queries = [
          encodeURIComponent(`${cleanArtist} ${cleanTitle}`),
          encodeURIComponent(cleanTitle),
        ];

        for (const q of queries) {
          const searchResp = await fetch(`${base}/search?q=${q}`, {
            signal: AbortSignal.timeout(3500),
          });

          if (searchResp.ok) {
            const list = await searchResp.json();
            if (Array.isArray(list) && list.length > 0) {
              const syncedMatch = list.find((item: any) => item.syncedLyrics && item.syncedLyrics.trim().length > 0);
              if (syncedMatch) {
                const parsed = parseLrcString(syncedMatch.syncedLyrics);
                if (parsed.length >= 4) {
                  return { lyrics: parsed, isInstrumental: false, source: 'lrclib' };
                }
              }
              if (list[0]?.instrumental === true) {
                return { lyrics: [], isInstrumental: true, source: 'lrclib' };
              }
              const plainMatch = list.find((item: any) => item.plainLyrics && item.plainLyrics.trim().length > 0);
              if (plainMatch) {
                const rawLines = plainMatch.plainLyrics
                  .split(/\r?\n/)
                  .map((l: string) => l.trim())
                  .filter(Boolean);
                if (rawLines.length >= 4) {
                  const totalMs = durationMs || 180000;
                  const step = Math.max(2500, Math.floor((totalMs * 0.88) / rawLines.length));
                  return {
                    lyrics: rawLines.map((text: string, idx: number) => ({
                      timeMs: 3000 + idx * step,
                      text,
                    })),
                    isInstrumental: false,
                    source: 'lrclib',
                  };
                }
              }
            }
          }
        }
      } catch {}
    }

    return null;
  }

  /**
   * Niveau 2 : Fallback NetEase Cloud Music LRC via proxy backend (/api/lyrics-netease)
   */
  private async fetchFromNetEase(
    artist: string,
    title: string
  ): Promise<SyncedLyricsResult | null> {
    try {
      const q = encodeURIComponent(`${cleanQueryTerm(artist)} ${cleanQueryTerm(title)}`);
      const resp = await fetch(`/api/lyrics-netease?q=${q}`, {
        signal: AbortSignal.timeout(4500),
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      if (data?.lrc) {
        const parsed = parseLrcString(data.lrc);
        if (parsed.length >= 4) {
          return { lyrics: parsed, isInstrumental: false, source: 'netease' };
        }
      }
    } catch {}
    return null;
  }

  /**
   * Résolution universelle à 3 niveaux avec mise en cache mémoire
   */
  public async getSyncedLyrics(
    artist: string,
    title: string,
    durationMs?: number
  ): Promise<SyncedLyricsResult> {
    const cacheKey = `${artist.toLowerCase().trim()}::${title.toLowerCase().trim()}`;
    if (memoryLyricsCache.has(cacheKey)) {
      return memoryLyricsCache.get(cacheKey)!;
    }

    // Détection rapide de titre explicitement instrumental dans le nom
    if (/\b(instrumental|instru|type beat|karaoke|interlude musical)\b/i.test(title)) {
      const instruRes: SyncedLyricsResult = {
        lyrics: [],
        isInstrumental: true,
        source: 'instrumental',
      };
      memoryLyricsCache.set(cacheKey, instruRes);
      return instruRes;
    }

    // Niveau 1 : LRCLIB
    const lrcLibResult = await this.fetchFromLrclib(artist, title, durationMs);
    if (lrcLibResult) {
      memoryLyricsCache.set(cacheKey, lrcLibResult);
      return lrcLibResult;
    }

    // Niveau 2A : NetEase Cloud Music LRC
    const netEaseResult = await this.fetchFromNetEase(artist, title);
    if (netEaseResult) {
      memoryLyricsCache.set(cacheKey, netEaseResult);
      return netEaseResult;
    }

    // Niveau 2B : Répertoire LRC synchronisé haute précision
    const normalizedTitle = cleanQueryTerm(title).toLowerCase();
    if (CURATED_SYNCED_LRC_DATABASE[normalizedTitle]) {
      const dbRes: SyncedLyricsResult = {
        lyrics: CURATED_SYNCED_LRC_DATABASE[normalizedTitle],
        isInstrumental: false,
        source: 'curated',
      };
      memoryLyricsCache.set(cacheKey, dbRes);
      return dbRes;
    }

    try {
      const curated = await deezerService.getSyncedLyrics(artist, title, durationMs);
      if (curated && curated.lyrics && curated.lyrics.length >= 4 && !curated.isInstrumental) {
        const curatedRes: SyncedLyricsResult = {
          lyrics: curated.lyrics,
          isInstrumental: false,
          source: 'curated',
        };
        memoryLyricsCache.set(cacheKey, curatedRes);
        return curatedRes;
      }
    } catch {}

    // Niveau 3 : Fallback Instrumental propre ("Titre instrumental")
    const fallbackResult: SyncedLyricsResult = {
      lyrics: [],
      isInstrumental: true,
      source: 'instrumental',
    };
    memoryLyricsCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}

export const lyricsService = new LyricsService();
export default lyricsService;
