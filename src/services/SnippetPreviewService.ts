// Spoot Music — Non-Destructive Refrain / Snippet Preview Engine (SnippetPreviewService.ts)
// Permet d'écouter un extrait rapide (Refrain 20-30s) dans les recommandations et résultats de recherche :
// - Met en pause temporaire la file principale sans la réinitialiser
// - Extrait l'échantillon officiel 30s Deezer (track.preview) ou cale un segment de 20s au cœur du morceau (01:00)
// - Anime un indicateur de progression circulaire vert autour du bouton Play de pré-écoute

import { Track } from '../types';
import { audioCore } from '../audio/WebAudioEngine';
import { streamResolver } from './StreamResolverService';

export interface SnippetState {
  activeTrackId: string | null;
  isPlaying: boolean;
  progressPercent: number; // 0 à 100
  isLoading: boolean;
}

type SnippetListener = (state: SnippetState) => void;

class SnippetPreviewService {
  private snippetAudio: HTMLAudioElement | null = null;
  private state: SnippetState = {
    activeTrackId: null,
    isPlaying: false,
    progressPercent: 0,
    isLoading: false,
  };
  private listeners: Set<SnippetListener> = new Set();
  private wasMainPlayerPlaying: boolean = false;
  private progressTimer: ReturnType<typeof setInterval> | null = null;
  private snippetStartOffsetSec: number = 0;
  private snippetDurationSec: number = 25;
  private previewCache: Map<string, { url: string; startSec: number; durationSec: number }> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.snippetAudio = new Audio();
      this.snippetAudio.crossOrigin = 'anonymous';
      this.snippetAudio.preload = 'auto';

      this.snippetAudio.addEventListener('ended', () => {
        this.stopSnippet(true);
      });

      this.snippetAudio.addEventListener('error', () => {
        this.stopSnippet(true);
      });
    }
  }

  private emit() {
    const snapshot = { ...this.state };
    this.listeners.forEach((cb) => {
      try {
        cb(snapshot);
      } catch {}
    });
  }

  public subscribe(listener: SnippetListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): SnippetState {
    return { ...this.state };
  }

  /**
   * Cherche l'extrait officiel 30s Deezer (track.preview) ou résout un segment de 20s calé à 01:00
   */
  private async resolveSnippetSource(
    track: Partial<Track> & { id: string; title: string; artistName: string; preview?: string }
  ): Promise<{ url: string; startSec: number; durationSec: number }> {
    if (this.previewCache.has(track.id)) {
      return this.previewCache.get(track.id)!;
    }

    // 1. Si track.preview officiel est déjà fourni sur l'objet
    const directPreview = (track as any).preview || (track.streamUrl && streamResolver.is30sPreview(track.streamUrl) ? track.streamUrl : null);
    if (directPreview) {
      const res = { url: directPreview, startSec: 0, durationSec: 29 };
      this.previewCache.set(track.id, res);
      return res;
    }

    // 2. Recherche rapide de l'échantillon 30s officiel sur l'API Deezer (< 180 ms)
    try {
      const q = encodeURIComponent(`artist:"${track.artistName}" track:"${track.title}"`);
      const resp = await fetch(`/api/deezer/search?q=${q}&limit=3`, {
        signal: AbortSignal.timeout(2500),
      });
      if (resp.ok) {
        const data = await resp.json();
        const match = data?.data?.find((item: any) => item.preview);
        if (match?.preview) {
          const res = { url: match.preview, startSec: 0, durationSec: 29 };
          this.previewCache.set(track.id, res);
          return res;
        }
      }
    } catch {}

    // 3. Fallback : flux complet yt-dlp calé à 01:00 (segment refrain de 20 secondes)
    const fullUrl = await streamResolver.resolveFullAudio(
      track.artistName,
      track.title,
      (track as any).youtubeId
    );
    const proxied = fullUrl.includes('googlevideo.com')
      ? `/api/stream-audio?url=${encodeURIComponent(fullUrl)}`
      : fullUrl;
    const res = { url: proxied, startSec: 60, durationSec: 20 };
    this.previewCache.set(track.id, res);
    return res;
  }

  /**
   * Démarre ou arrête la pré-écoute d'un titre sans modifier la file d'attente principale
   */
  public async toggleSnippet(
    track: Partial<Track> & { id: string; title: string; artistName: string; preview?: string }
  ): Promise<void> {
    if (!this.snippetAudio) return;

    // Si on clique sur le snippet déjà actif, on l'arrête et on restaure la lecture principale
    if (this.state.activeTrackId === track.id && (this.state.isPlaying || this.state.isLoading)) {
      this.stopSnippet(true);
      return;
    }

    // Si aucun snippet n'était en cours, mémoriser l'état du lecteur principal et le mettre en pause douce
    if (!this.state.activeTrackId) {
      this.wasMainPlayerPlaying = audioCore.isCurrentlyPlaying();
      if (this.wasMainPlayerPlaying) {
        audioCore.pause();
      }
    }

    this.clearTimer();
    this.snippetAudio.pause();

    this.state = {
      activeTrackId: track.id,
      isPlaying: false,
      progressPercent: 0,
      isLoading: true,
    };
    this.emit();

    try {
      const { url, startSec, durationSec } = await this.resolveSnippetSource(track);

      // Vérifier que l'utilisateur n'a pas annulé entre-temps
      if (this.state.activeTrackId !== track.id) return;

      this.snippetStartOffsetSec = startSec;
      this.snippetDurationSec = durationSec;
      this.snippetAudio.src = url;
      this.snippetAudio.volume = 0.9;

      const applyOffsetAndPlay = async () => {
        if (!this.snippetAudio || this.state.activeTrackId !== track.id) return;
        if (startSec > 0 && this.snippetAudio.duration > startSec + 5) {
          try {
            this.snippetAudio.currentTime = startSec;
          } catch {}
        }
        try {
          await this.snippetAudio.play();
          this.state = {
            activeTrackId: track.id,
            isPlaying: true,
            progressPercent: 0,
            isLoading: false,
          };
          this.emit();
          this.startProgressLoop();
        } catch {
          this.stopSnippet(true);
        }
      };

      if (startSec > 0) {
        this.snippetAudio.addEventListener('loadedmetadata', applyOffsetAndPlay, { once: true });
        this.snippetAudio.load();
      } else {
        await applyOffsetAndPlay();
      }
    } catch {
      this.stopSnippet(true);
    }
  }

  private startProgressLoop() {
    this.clearTimer();
    this.progressTimer = setInterval(() => {
      if (!this.snippetAudio || !this.state.isPlaying) return;
      const elapsed = Math.max(0, this.snippetAudio.currentTime - this.snippetStartOffsetSec);
      const pct = Math.min(100, (elapsed / this.snippetDurationSec) * 100);

      this.state.progressPercent = pct;
      this.emit();

      if (elapsed >= this.snippetDurationSec) {
        this.stopSnippet(true);
      }
    }, 80);
  }

  private clearTimer() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  public stopSnippet(restoreMainPlayer: boolean = true) {
    this.clearTimer();
    if (this.snippetAudio) {
      this.snippetAudio.pause();
      try {
        this.snippetAudio.currentTime = 0;
      } catch {}
    }

    const hadActive = this.state.activeTrackId !== null;
    this.state = {
      activeTrackId: null,
      isPlaying: false,
      progressPercent: 0,
      isLoading: false,
    };
    this.emit();

    if (hadActive && restoreMainPlayer && this.wasMainPlayerPlaying) {
      this.wasMainPlayerPlaying = false;
      audioCore.resume();
    }
  }
}

export const snippetPreview = new SnippetPreviewService();
export default snippetPreview;
