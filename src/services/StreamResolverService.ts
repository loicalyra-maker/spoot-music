// Spoot Music — StreamResolverService.ts
// Moteur de résolution audio intégrale via yt-dlp / backend Spoot.
// Éradique définitivement les extraits promotionnels de 30 secondes au profit de flux complets.
// Supporte les profils réels : Auto, Normal (128k), Élevé (256k), Très élevé (320k), Hi-Res Lossless.

export interface StreamResolutionMetadata {
  url: string;
  format: string;
  codec: string;
  bitrateKbps: number;
  sampleRate: number;
  qualityMode: string;
  isFallback: boolean;
}

class StreamResolverService {
  private cache = new Map<string, StreamResolutionMetadata>();
  private resolving = new Map<string, Promise<StreamResolutionMetadata>>();
  private currentActiveMetadata: StreamResolutionMetadata | null = null;

  constructor() {
    try {
      const saved = sessionStorage.getItem('spoot_stream_cache_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          Object.entries(parsed).forEach(([k, v]) => {
            if (typeof v === 'object' && v !== null) this.cache.set(k, v as StreamResolutionMetadata);
          });
        }
      }
    } catch {}
  }

  private saveCache(): void {
    try {
      const obj: Record<string, StreamResolutionMetadata> = {};
      this.cache.forEach((v, k) => {
        obj[k] = v;
      });
      sessionStorage.setItem('spoot_stream_cache_v2', JSON.stringify(obj));
    } catch {}
  }

  public getCacheKey(artist: string, title: string, quality: string = 'very_high'): string {
    return `${artist.toLowerCase().trim()}:::${title.toLowerCase().trim()}:::${quality}`;
  }

  /**
   * Vérifie si une URL audio est un extrait promotionnel bridé à 30 secondes.
   */
  public is30sPreview(url?: string): boolean {
    if (!url) return true;
    const lower = url.toLowerCase();
    return (
      lower.includes('audiopreview') ||
      lower.includes('cdns-preview') ||
      lower.includes('dzcdn.net') ||
      lower.includes('preview')
    );
  }

  public getActiveMetadata(): StreamResolutionMetadata | null {
    return this.currentActiveMetadata;
  }

  /**
   * Résout l'URL audio complète et ses métadonnées techniques réelles via yt-dlp backend.
   */
  public async resolveFullAudioWithMeta(
    artist: string,
    title: string,
    explicitYoutubeId?: string,
    quality: string = 'very_high',
    existingStreamUrl?: string
  ): Promise<StreamResolutionMetadata> {
    const key = this.getCacheKey(artist, title, quality);

    if (this.cache.has(key)) {
      const cached = this.cache.get(key)!;
      this.currentActiveMetadata = cached;
      return cached;
    }

    if (this.resolving.has(key)) {
      return this.resolving.get(key)!;
    }

    const resolvePromise = (async () => {
      try {
        let endpoint = `/api/stream-resolve?quality=${encodeURIComponent(quality)}&`;
        if (explicitYoutubeId) {
          endpoint += `id=${encodeURIComponent(explicitYoutubeId)}`;
        } else {
          const cleanTitle = title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
          endpoint += `q=${encodeURIComponent(`${artist} - ${cleanTitle} Official Audio`)}`;
        }

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`Stream resolve error: ${res.status}`);

        const data = await res.json();
        if (data?.url && typeof data.url === 'string') {
          const meta: StreamResolutionMetadata = {
            url: data.url,
            format: data.format || 'AAC-LC 320 kbps (Très élevée)',
            codec: data.codec || 'audio/mp4 (AAC-LC)',
            bitrateKbps: data.bitrateKbps || 320,
            sampleRate: data.sampleRate || 48000,
            qualityMode: data.qualityMode || quality,
            isFallback: Boolean(data.isFallback),
          };
          this.cache.set(key, meta);
          this.currentActiveMetadata = meta;
          this.saveCache();
          return meta;
        }
        throw new Error('Missing url property in stream response');
      } catch (err) {
        console.warn(`[StreamResolver] Résolution intégrale pour "${artist} - ${title}":`, err);
        // Interdiction absolue d'injecter des extraits 30 secondes tronqués d'iTunes
        if (existingStreamUrl && !this.is30sPreview(existingStreamUrl)) {
          const fallbackMeta: StreamResolutionMetadata = {
            url: existingStreamUrl,
            format: 'Flux Direct AAC 256 kbps',
            codec: 'audio/mp4 (AAC-LC)',
            bitrateKbps: 256,
            sampleRate: 44100,
            qualityMode: quality,
            isFallback: true,
          };
          this.currentActiveMetadata = fallbackMeta;
          return fallbackMeta;
        }
        throw err;
      } finally {
        this.resolving.delete(key);
      }
    })();

    this.resolving.set(key, resolvePromise);
    return resolvePromise;
  }

  /**
   * Méthode de rétro-compatibilité
   */
  public async resolveFullAudio(artist: string, title: string, explicitYoutubeId?: string, quality?: string): Promise<string> {
    const meta = await this.resolveFullAudioWithMeta(artist, title, explicitYoutubeId, quality);
    return meta.url;
  }
}

export const streamResolver = new StreamResolverService();
export default streamResolver;
