/**
 * Spoot Music — Client-Side IPC Bindings (TypeScript)
 * Interface type-safe pour communiquer avec le cœur audio Rust de Tauri v2.
 */

import { invoke } from '@tauri-apps/api/core';

export type PlaybackStatus = 'Stopped' | 'Playing' | 'Paused' | 'Seeking' | 'Transitioning';
export type ShuffleMode = 'Off' | 'TrueRandom' | 'SmartShuffle' | 'UserWeighted';
export type RepeatMode = 'Off' | 'RepeatAll' | 'RepeatOne';

export interface AcousticProfile {
  bpm: number;
  camelot_key: string;
  energy: number;
  valence: number;
  loudness_lufs: number;
  true_peak_db: number;
}

export interface TrackMetadata {
  id: string;
  isrc: string;
  title: string;
  artist: string;
  album: string;
  duration_ms: number;
  sample_rate: number;
  bit_depth: number;
  stream_url?: string;
  acoustic_profile?: AcousticProfile;
}

export interface PlaybackStateReport {
  status: PlaybackStatus;
  current_track: TrackMetadata | null;
  position_ms: number;
  duration_ms: number;
  volume: number;
  shuffle_mode: ShuffleMode;
  repeat_mode: RepeatMode;
  lookahead_buffered_tracks: string[];
  audio_buffer_health_percent: number;
  is_gamer_mode_active: boolean;
}

export interface SystemFootprintReport {
  ram_usage_mb: number;
  cpu_usage_percent: number;
  is_gamer_mode_active: boolean;
  ui_framerate_target: number;
  audio_thread_priority: string;
}

export const SpootAudioBridge = {
  play: async (trackId?: string): Promise<void> => {
    await invoke('spoot_play', { trackId });
  },

  pause: async (): Promise<void> => {
    await invoke('spoot_pause');
  },

  togglePlayback: async (): Promise<void> => {
    await invoke('spoot_toggle_playback');
  },

  /**
   * Bascule atomique instantanée vers la piste suivante (0 milliseconde de latence)
   */
  nextTrack: async (): Promise<PlaybackStateReport> => {
    return await invoke<PlaybackStateReport>('spoot_next_track');
  },

  previousTrack: async (): Promise<void> => {
    await invoke('spoot_previous_track');
  },

  seek: async (targetMs: number): Promise<void> => {
    await invoke('spoot_seek', { targetMs: Math.round(targetMs) });
  },

  setVolume: async (volume: number): Promise<void> => {
    await invoke('spoot_set_volume', { volume: Math.max(0, Math.min(1, volume)) });
  },

  getPlaybackState: async (): Promise<PlaybackStateReport> => {
    return await invoke<PlaybackStateReport>('spoot_get_playback_state');
  },

  loadTrack: async (track: TrackMetadata): Promise<void> => {
    await invoke('spoot_load_track', { track });
  },

  prebufferLookaheadTrack: async (track: TrackMetadata): Promise<void> => {
    await invoke('spoot_prebuffer_lookahead_track', { track });
  },

  setShuffleMode: async (mode: ShuffleMode): Promise<void> => {
    await invoke('spoot_set_shuffle_mode', { mode });
  },

  setRepeatMode: async (mode: RepeatMode): Promise<void> => {
    await invoke('spoot_set_repeat_mode', { mode });
  },

  setEqualizerGains: async (gains: number[]): Promise<void> => {
    if (gains.length !== 10) {
      throw new Error("L'égaliseur nécessite exactement 10 bandes.");
    }
    await invoke('spoot_set_equalizer_gains', { gains });
  },

  toggleGamerMode: async (enabled: boolean): Promise<boolean> => {
    return await invoke<boolean>('spoot_toggle_gamer_mode', { enabled });
  },

  getSystemFootprint: async (): Promise<SystemFootprintReport> => {
    return await invoke<SystemFootprintReport>('spoot_get_system_footprint');
  },
};
