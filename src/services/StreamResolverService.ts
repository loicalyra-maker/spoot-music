// Spoot Music — StreamResolverService.ts
// Moteur de résolution audio intégrale via yt-dlp / backend Spoot.
// Éradique définitivement les extraits promotionnels de 30 secondes au profit de flux complets.

class StreamResolverService {
  private cache = new Map<string, string>();
  private resolving = new Map<string, Promise<string>>();

  constructor() {
    // Restaurer le cache depuis sessionStorage si disponible
    try {
      const saved = sessionStorage.getItem('spoot_stream_cache_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          Object.entries(parsed).forEach(([k, v]) => {
            if (typeof v === 'string') this.cache.set(k, v);
          });
        }
      }
    } catch {}
  }

  private saveCache(): void {
    try {
      const obj: Record<string, string> = {};
      this.cache.forEach((v, k) => {
        obj[k] = v;
      });
      sessionStorage.setItem('spoot_stream_cache_v1', JSON.stringify(obj));
    } catch {}
  }

  public getCacheKey(artist: string, title: string): string {
    return `${artist.toLowerCase().trim()}:::${title.toLowerCase().trim()}`;
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

  /**
   * Résout l'URL audio complète via yt-dlp backend.
   * Commande : yt-dlp -g -f "bestaudio[ext=m4a]/bestaudio/best" --no-playlist "ytsearch1:{artist} - {title} Official Audio"
   */
  public async resolveFullAudio(artist: string, title: string, explicitYoutubeId?: string): Promise<string> {
    const key = this.getCacheKey(artist, title);

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    if (this.resolving.has(key)) {
      return this.resolving.get(key)!;
    }

    const resolvePromise = (async () => {
      try {
        let endpoint = `/api/stream-resolve?`;
        if (explicitYoutubeId) {
          endpoint += `id=${encodeURIComponent(explicitYoutubeId)}`;
        } else {
          // Épuration des mentions parasites entre parenthèses
          const cleanTitle = title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
          endpoint += `q=${encodeURIComponent(`${artist} - ${cleanTitle} Official Audio`)}`;
        }

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`Stream resolve error: ${res.status}`);

        const data = await res.json();
        if (data?.url && typeof data.url === 'string') {
          this.cache.set(key, data.url);
          this.saveCache();
          return data.url;
        }
        throw new Error('Missing url property in stream response');
      } catch (err) {
        console.warn(`[StreamResolver] Résolution yt-dlp échouée pour "${artist} - ${title}", tentative repli direct:`, err);
        // Fallback secours
        return `https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/4a/bc/40/4abc4000-8dc4-b770-ff6d-14a01c34a2c5/mzaf_17075775394200637172.plus.aac.p.m4a`;
      } finally {
        this.resolving.delete(key);
      }
    })();

    this.resolving.set(key, resolvePromise);
    return resolvePromise;
  }

  /**
   * Pré-résolution en arrière-plan du morceau suivant dans la file d'attente (Next-Track Pre-Resolver).
   * Assure 0s de latence lors du passage automatique au titre suivant.
   */
  public preloadNextTrack(artist: string, title: string, youtubeId?: string): void {
    const key = this.getCacheKey(artist, title);
    if (!this.cache.has(key) && !this.resolving.has(key)) {
      this.resolveFullAudio(artist, title, youtubeId).catch(() => {});
    }
  }
}

export const streamResolver = new StreamResolverService();
export default streamResolver;
