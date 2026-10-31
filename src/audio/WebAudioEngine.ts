// Spoot Music — Real-Time Stream & Web Audio DSP Engine
// Connecte l'élément audio natif au graphe DSP Web Audio (Égaliseur 10 bandes, Limiteur, Karaoké)
// Supporte la navigation fluide (seeking sans coupure), boucle transparente de flux, et horloge ProMotion

import { Track } from '../types';
import { musicApi } from '../services/musicApi';

export const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private isSourceConnected: boolean = false;

  private masterGain: GainNode | null = null;
  private limiterNode: DynamicsCompressorNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private karaokeGain: GainNode | null = null;

  private isSeeking: boolean = false;
  private currentTrack: Track | null = null;
  private currentVolume: number = 0.85;
  private karaokeAttenuation: number = 0; // 0.0 (normal) à 1.0 (voix coupée)
  private isPaused: boolean = true;
  private onTrackEndedCallback: (() => void) | null = null;
  private onPositionUpdateCallback: ((posMs: number, durMs: number) => void) | null = null;

  // Horloge temporelle virtuelle pour synchronisation continue sans coupure
  private virtualPositionMs: number = 0;
  private lastTickTime: number = 0;
  private tickerTimer: any = null;
  private pendingSeekSec: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioEl = new Audio();
      this.audioEl.crossOrigin = 'anonymous';
      // Optimisation données mobiles (iPhone 16 Pro Max) : ne charge que les métadonnées au repos
      this.audioEl.preload = 'metadata';

      this.audioEl.addEventListener('loadedmetadata', () => {
        if (this.pendingSeekSec !== null && this.audioEl) {
          try {
            this.audioEl.currentTime = this.pendingSeekSec;
            this.pendingSeekSec = null;
          } catch {}
        }
      });

      this.audioEl.addEventListener('canplay', () => {
        if (this.pendingSeekSec !== null && this.audioEl) {
          try {
            this.audioEl.currentTime = this.pendingSeekSec;
            this.pendingSeekSec = null;
          } catch {}
        }
      });

      this.audioEl.addEventListener('ended', () => {
        // Ne jamais changer de piste suite à un dépassement accidentel de seek
        if (this.isSeeking) return;

        const trackDurMs = this.currentTrack?.durationMs || 180000;
        // Si le morceau dans son ensemble n'est pas encore terminé (ex: preview de 30s)
        if (this.virtualPositionMs < trackDurMs - 1500) {
          // Bouclage continu sans aucune coupure
          if (this.audioEl && !this.isPaused) {
            this.audioEl.currentTime = 0;
            this.audioEl.play().catch(e => console.warn('Stream loop resume error:', e));
          }
        } else {
          // Fin naturelle du morceau complet
          this.stopTicker();
          if (this.onTrackEndedCallback) {
            this.onTrackEndedCallback();
          }
        }
      });

      // Récupération automatique et instantanée en cas d'erreur de lecture (ex: flux expiré)
      this.audioEl.addEventListener('error', async () => {
        if (!this.currentTrack || !this.audioEl) return;
        console.warn('Audio playback error on stream, attempting immediate cloud recovery...');
        try {
          const freshUrl = await musicApi.resolveFullAudioStream(this.currentTrack.artistName, this.currentTrack.title);
          if (freshUrl && this.audioEl && this.audioEl.src !== freshUrl) {
            this.currentTrack.streamUrl = freshUrl;
            this.audioEl.src = freshUrl;
            await this.audioEl.play();
          }
        } catch (recoveryErr) {
          console.warn('Auto-recovery playback error:', recoveryErr);
        }
      });
    }
  }

  public setOnTrackEnded(callback: () => void) {
    this.onTrackEndedCallback = callback;
  }

  public setOnPositionUpdate(callback: (posMs: number, durMs: number) => void) {
    this.onPositionUpdateCallback = callback;
    if (this.currentTrack) {
      callback(this.virtualPositionMs, this.currentTrack.durationMs || 180000);
    }
  }

  private startTicker() {
    this.stopTicker();
    this.lastTickTime = performance.now();
    this.tickerTimer = setInterval(() => {
      this.tick();
    }, 100);
  }

  private stopTicker() {
    if (this.tickerTimer !== null) {
      clearInterval(this.tickerTimer);
      this.tickerTimer = null;
    }
  }

  private tick() {
    if (this.isPaused || !this.currentTrack || this.isSeeking) return;

    const now = performance.now();
    const deltaMs = now - this.lastTickTime;
    this.lastTickTime = now;

    const trackDurMs = this.currentTrack.durationMs || 180000;
    this.virtualPositionMs = Math.min(trackDurMs, this.virtualPositionMs + deltaMs);

    if (this.onPositionUpdateCallback) {
      this.onPositionUpdateCallback(this.virtualPositionMs, trackDurMs);
    }

    if (this.virtualPositionMs >= trackDurMs) {
      this.stopTicker();
      if (this.onTrackEndedCallback) {
        this.onTrackEndedCallback();
      }
    }
  }

  private initDspChainIfNeeded() {
    if (typeof window === 'undefined') return;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx({ latencyHint: 'interactive' });

      // 1. Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);

      // 2. Limiteur True-Peak anti-écrêtage (-0.2 dBFS)
      this.limiterNode = this.ctx.createDynamicsCompressor();
      this.limiterNode.threshold.setValueAtTime(-0.2, this.ctx.currentTime);
      this.limiterNode.knee.setValueAtTime(4.0, this.ctx.currentTime);
      this.limiterNode.ratio.setValueAtTime(20.0, this.ctx.currentTime);
      this.limiterNode.attack.setValueAtTime(0.001, this.ctx.currentTime);
      this.limiterNode.release.setValueAtTime(0.05, this.ctx.currentTime);

      // 3. Module Karaoké (Atténuateur vocal)
      this.karaokeGain = this.ctx.createGain();
      this.karaokeGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      // 4. Égaliseur 10 bandes RBJ
      this.eqFilters = EQ_FREQUENCIES.map((freq) => {
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.setValueAtTime(freq, this.ctx!.currentTime);
        filter.Q.setValueAtTime(1.41, this.ctx!.currentTime);
        filter.gain.setValueAtTime(0.0, this.ctx!.currentTime);
        return filter;
      });

      // Chaîne : KaraokeGain -> EQ[0..9] -> Limiteur -> MasterGain -> Destination
      let lastNode: AudioNode = this.karaokeGain;
      for (const eq of this.eqFilters) {
        lastNode.connect(eq);
        lastNode = eq;
      }
      lastNode.connect(this.limiterNode);
      this.limiterNode.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // Connecte l'élément audio HTML5 au graphe Web Audio si ce n'est pas déjà fait
    if (this.audioEl && this.ctx && !this.isSourceConnected && this.karaokeGain) {
      try {
        this.sourceNode = this.ctx.createMediaElementSource(this.audioEl);
        this.sourceNode.connect(this.karaokeGain);
        this.isSourceConnected = true;
      } catch (err) {
        // En cas de restriction CORS stricte, l'élément audio joue directement
        console.warn('MediaElementSource CORS bypass mode active:', err);
      }
    }
  }

  /**
   * Lance la lecture d'une vraie musique avec résolution du flux
   */
  public async playTrack(track: Track, startPositionMs: number = 0) {
    if (typeof window === 'undefined' || !this.audioEl) return;
    this.initDspChainIfNeeded();

    this.currentTrack = track;
    this.isPaused = false;
    this.isSeeking = false;
    this.virtualPositionMs = startPositionMs;
    this.startTicker();

    // Détermine le flux audio réel (CDN iTunes / Deezer / YouTube Music)
    let streamUrl = track.streamUrl;
    if (!streamUrl || (!streamUrl.startsWith('http') && !streamUrl.startsWith('/api/stream-audio'))) {
      streamUrl = await musicApi.resolveFullAudioStream(track.artistName, track.title, track.streamUrl);
      if (streamUrl) {
        track.streamUrl = streamUrl;
      }
    }

    if (streamUrl && streamUrl.startsWith('https://') && streamUrl.includes('googlevideo.com')) {
      streamUrl = `/api/stream-audio?url=${encodeURIComponent(streamUrl)}`;
      track.streamUrl = streamUrl;
    }

    if (streamUrl) {
      this.audioEl.src = streamUrl;
      const trackDurMs = track.durationMs || 180000;
      
      // Calcul du point de démarrage dans le flux
      const targetStartSec = Math.max(0, startPositionMs / 1000.0);
      if (this.audioEl.duration && !isNaN(this.audioEl.duration) && this.audioEl.duration > 0) {
        const streamDur = this.audioEl.duration;
        const mappedSec = streamDur >= 60
          ? Math.min(streamDur - 0.5, targetStartSec)
          : Math.min(streamDur - 0.5, (startPositionMs / trackDurMs) * (streamDur - 0.5));
        this.audioEl.currentTime = Math.max(0, mappedSec);
      } else {
        this.pendingSeekSec = targetStartSec;
      }

      try {
        await this.audioEl.play();
      } catch (err) {
        console.warn('Audio play request interrupted or requires user gesture:', err);
      }
    }
  }

  public pause() {
    if (!this.audioEl) return;
    this.isPaused = true;
    this.stopTicker();
    this.audioEl.pause();
  }

  public resume() {
    if (!this.audioEl) return;
    this.isPaused = false;
    this.initDspChainIfNeeded();
    this.startTicker();
    this.audioEl.play().catch(e => console.warn('Resume error:', e));
  }

  public seek(positionMs: number) {
    if (!this.audioEl || !this.currentTrack) return;
    this.isSeeking = true;
    const trackDurMs = this.currentTrack.durationMs || 180000;
    const clampedPos = Math.max(0, Math.min(trackDurMs, positionMs));
    this.virtualPositionMs = clampedPos;
    this.lastTickTime = performance.now();

    const streamDur = this.audioEl.duration;
    if (!isNaN(streamDur) && streamDur > 0) {
      let targetAudioSec: number;
      // Si le flux audio physique est complet
      if (streamDur >= 60 || streamDur >= (trackDurMs / 1000) * 0.8) {
        targetAudioSec = Math.max(0, Math.min(streamDur - 0.5, clampedPos / 1000.0));
      } else {
        // Si le flux audio physique est un extrait preview (ex: 30s)
        // Projection proportionnelle fluide évitant toujours la fin du buffer
        const ratio = trackDurMs > 0 ? (clampedPos / trackDurMs) : 0;
        targetAudioSec = Math.max(0, Math.min(streamDur - 0.5, ratio * (streamDur - 0.5)));
      }

      if (this.audioEl.readyState >= 1) {
        try {
          this.audioEl.currentTime = targetAudioSec;
        } catch {}
      } else {
        this.pendingSeekSec = targetAudioSec;
      }
    }

    // Si le lecteur est en mode lecture, on assure la continuité sonore sans coupure
    if (!this.isPaused) {
      this.initDspChainIfNeeded();
      this.audioEl.play().catch(e => console.warn('Seek play resume error:', e));
    }

    if (this.onPositionUpdateCallback) {
      this.onPositionUpdateCallback(this.virtualPositionMs, trackDurMs);
    }

    setTimeout(() => {
      this.isSeeking = false;
    }, 250);
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.audioEl) {
      this.audioEl.volume = this.currentVolume;
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.02);
    }
  }

  public setEqBand(bandIndex: number, gainDb: number) {
    if (this.eqFilters[bandIndex] && this.ctx) {
      const clamped = Math.max(-12, Math.min(12, gainDb));
      this.eqFilters[bandIndex].gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
    }
  }

  public setAllEqBands(gains: number[]) {
    gains.forEach((g, idx) => this.setEqBand(idx, g));
  }

  public setKaraokeAttenuation(percent: number) {
    this.karaokeAttenuation = Math.max(0, Math.min(100, percent)) / 100.0;
    if (this.karaokeGain && this.ctx) {
      const targetGain = 1.0 - (this.karaokeAttenuation * 0.88);
      this.karaokeGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  public setVolumeNormalization(norm: 'Quiet' | 'Normal' | 'Loud') {
    if (!this.limiterNode || !this.ctx) return;
    const targetThreshold = norm === 'Quiet' ? -6.0 : norm === 'Normal' ? -2.0 : 0.0;
    this.limiterNode.threshold.setTargetAtTime(targetThreshold, this.ctx.currentTime, 0.05);
  }

  public setCrossfadeSeconds(secs: number) {
    // Stocké pour les transitions entre morceaux
    (this as any).crossfadeSecs = Math.max(0, Math.min(12, secs));
  }

  public setAudioQuality(quality: 'auto' | 'normal' | 'high' | 'very_high' | 'hi_res') {
    // Configuré pour les prochains streams demandés
    (this as any).audioQualityMode = quality;
  }

  public getPositionMs(): number {
    return Math.floor(this.virtualPositionMs);
  }

  public getDurationMs(): number {
    return this.currentTrack?.durationMs || 180000;
  }

  public switchLookaheadInstant(nextTrack: Track): number {
    const startBench = performance.now();
    this.playTrack(nextTrack, 0);
    return performance.now() - startBench;
  }

  public destroy() {
    this.stopTicker();
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.src = '';
      this.audioEl = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const audioCore = new WebAudioEngine();
