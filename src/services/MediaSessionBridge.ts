// Spoot Music — Native iOS Lock Screen & Dynamic Island Bridge (MediaSessionBridge.ts)
// Pont complet vers MPNowPlayingInfoCenter / MPRemoteCommandCenter via l'API Web MediaSession.
// Permet le contrôle total (Lecture/Pause, Suivant, Précédent, Scrubbing précis, Pochette HD)
// directement depuis l'écran verrouillé, le Centre de Contrôle et la Dynamic Island sans allumer l'écran.

import { Track } from '../types';

interface MediaSessionHandlers {
  onPlay: () => void;
  onPause: () => void;
  onPreviousTrack: () => void;
  onNextTrack: () => void;
  onSeekTo: (positionMs: number) => void;
}

class MediaSessionBridgeService {
  private lastPositionSyncTime: number = 0;
  private isInitialized: boolean = false;

  /**
   * Enregistre les commandes matérielles et de l'écran de verrouillage iOS (MPRemoteCommandCenter)
   */
  public initHandlers(handlers: MediaSessionHandlers): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (this.isInitialized) return;
    this.isInitialized = true;

    const ms = navigator.mediaSession;

    const safeSetHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        // Certaines actions (ex: seekto sur très anciens navigateurs) peuvent être ignorées
      }
    };

    safeSetHandler('play', () => handlers.onPlay());
    safeSetHandler('pause', () => handlers.onPause());
    safeSetHandler('previoustrack', () => handlers.onPreviousTrack());
    safeSetHandler('nexttrack', () => handlers.onNextTrack());

    safeSetHandler('seekbackward', (details) => {
      const offsetMs = (details.seekOffset || 10) * 1000;
      handlers.onSeekTo(Math.max(0, this.currentPosMs - offsetMs));
    });

    safeSetHandler('seekforward', (details) => {
      const offsetMs = (details.seekOffset || 10) * 1000;
      handlers.onSeekTo(this.currentPosMs + offsetMs);
    });

    safeSetHandler('seekto', (details) => {
      if (typeof details.seekTime === 'number') {
        handlers.onSeekTo(Math.round(details.seekTime * 1000));
      }
    });
  }

  private currentPosMs: number = 0;

  /**
   * Met à jour les métadonnées Now Playing (Pochette HD, Titre, Artiste, Album)
   * projetées dans la Dynamic Island et sur l'écran de verrouillage iPhone 16 Pro Max.
   */
  public updateMetadata(track: Track | null): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !track) return;

    const cover = track.coverUrl || '/logo.png';

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artistName,
        album: track.albumTitle || 'Spoot Music Hi-Res',
        artwork: [
          { src: cover, sizes: '96x96', type: 'image/jpeg' },
          { src: cover, sizes: '128x128', type: 'image/jpeg' },
          { src: cover, sizes: '192x192', type: 'image/jpeg' },
          { src: cover, sizes: '256x256', type: 'image/jpeg' },
          { src: cover, sizes: '384x384', type: 'image/jpeg' },
          { src: cover, sizes: '512x512', type: 'image/jpeg' },
        ],
      });
    } catch (err) {
      console.warn('[MediaSessionBridge] Erreur mise à jour MediaMetadata:', err);
    }
  }

  /**
   * Synchronise l'état Lecture / Pause avec le système iOS
   */
  public updatePlaybackState(state: 'playing' | 'paused' | 'none'): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch {}
  }

  /**
   * Synchronise la barre de progression de l'écran verrouillé et de la Dynamic Island.
   * Throttlé à 1 mise à jour par seconde max (ou lors d'un seek) pour économiser le CPU.
   */
  public updatePositionState(positionMs: number, durationMs: number, force: boolean = false): void {
    this.currentPosMs = positionMs;
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (typeof navigator.mediaSession.setPositionState !== 'function') return;

    const now = performance.now();
    if (!force && now - this.lastPositionSyncTime < 1000) return;
    this.lastPositionSyncTime = now;

    const durSec = Math.max(1, durationMs / 1000);
    const posSec = Math.max(0, Math.min(durSec, positionMs / 1000));

    try {
      navigator.mediaSession.setPositionState({
        duration: durSec,
        playbackRate: 1.0,
        position: posSec,
      });
    } catch {}
  }
}

export const mediaSessionBridge = new MediaSessionBridgeService();
export default mediaSessionBridge;
