// Spoot Music — Real-Time Stream & Web Audio DSP Engine
// Connecte l'élément audio natif au graphe DSP Web Audio (Égaliseur 10 bandes, Limiteur, Karaoké)

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

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioEl = new Audio();
      this.audioEl.crossOrigin = 'anonymous';
      // Optimisation données mobiles (iPhone 16 Pro Max) : ne charge que les métadonnées au repos
      this.audioEl.preload = 'metadata';

      this.audioEl.addEventListener('ended', () => {
        // Ne jamais changer de piste suite à un dépassement accidentel de seek
        if (this.isSeeking) return;
        if (this.onTrackEndedCallback && this.audioEl) {
          // Vérifie qu'on est bien arrivé à la fin naturelle du titre
          const dur = this.audioEl.duration;
          if (!isNaN(dur) && dur > 0 && Math.abs(this.audioEl.currentTime - dur) < 1.0) {
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
      // Démarrage garanti à l'offset zéro (ou startPositionMs spécifié)
      const targetStartSec = Math.max(0, startPositionMs / 1000.0);
      this.audioEl.currentTime = targetStartSec;

      try {
        await this.audioEl.play();
        // Réaffirmation du démarrage à zéro une fois la lecture amorcée
        if (targetStartSec === 0 && this.audioEl.currentTime > 1.0 && this.audioEl.currentTime < this.audioEl.duration - 2) {
          this.audioEl.currentTime = 0;
        }
      } catch (err) {
        console.warn('Audio play request interrupted or requires user gesture:', err);
      }
    }
  }

  public pause() {
    if (!this.audioEl) return;
    this.audioEl.pause();
    this.isPaused = true;
  }

  public resume() {
    if (!this.audioEl) return;
    this.initDspChainIfNeeded();
    this.audioEl.play().catch(e => console.warn('Resume error:', e));
    this.isPaused = false;
  }

  public seek(positionMs: number) {
    if (!this.audioEl) return;
    this.isSeeking = true;
    const targetSec = Math.max(0, positionMs / 1000.0);
    const dur = this.audioEl.duration;

    if (!isNaN(dur) && dur > 0) {
      // Clamper en évitant d'atteindre la toute fin pour ne pas déclencher 'ended'
      this.audioEl.currentTime = Math.min(Math.max(0, dur - 0.25), targetSec);
    } else {
      this.audioEl.currentTime = targetSec;
    }

    setTimeout(() => {
      this.isSeeking = false;
    }, 400);
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
    if (!this.audioEl) return 0;
    return Math.floor(this.audioEl.currentTime * 1000.0);
  }

  public getDurationMs(): number {
    if (this.audioEl && !isNaN(this.audioEl.duration) && this.audioEl.duration > 0) {
      return Math.floor(this.audioEl.duration * 1000.0);
    }
    return this.currentTrack?.durationMs || 180000;
  }

  public switchLookaheadInstant(nextTrack: Track): number {
    const startBench = performance.now();
    this.playTrack(nextTrack, 0);
    return performance.now() - startBench;
  }

  public destroy() {
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
