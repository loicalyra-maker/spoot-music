//! Spoot Music — Audio Types & Data Structures
//! Definit les formats d'échantillons, les métadonnées de pistes et les états du moteur audio.

use serde::{Deserialize, Serialize};

/// Fréquences d'échantillonnage supportées par le moteur Hi-Res Spoot
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SampleRate {
    Standard44k = 44100,
    Standard48k = 48000,
    HiRes88k = 88200,
    HiRes96k = 96000,
    HiRes176k = 176400,
    HiRes192k = 192000,
}

impl Default for SampleRate {
    fn default() -> Self {
        SampleRate::HiRes96k
    }
}

/// Nombre de canaux audio
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Channels {
    Mono = 1,
    Stereo = 2,
}

impl Default for Channels {
    fn default() -> Self {
        Channels::Stereo
    }
}

/// Profondeur d'échantillonnage
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BitDepth {
    Bit16 = 16,
    Bit24 = 24,
    Bit32Float = 32,
}

/// Profil acoustique d'un morceau pré-calculé
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AcousticProfile {
    pub bpm: f32,
    pub camelot_key: String,
    pub energy: f32,
    pub valence: f32,
    pub loudness_lufs: f32,
    pub true_peak_db: f32,
}

/// Métadonnées complètes d'une piste pour la file de lecture
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackMetadata {
    pub id: String,
    pub isrc: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration_ms: u64,
    pub sample_rate: u32,
    pub bit_depth: u8,
    pub stream_url: Option<String>,
    pub acoustic_profile: Option<AcousticProfile>,
}

/// État global de la machine à état audio
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PlaybackStatus {
    Stopped,
    Playing,
    Paused,
    Seeking,
    Transitioning,
}

/// Modes Aléatoires (Shuffle) Spoot Music
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ShuffleMode {
    Off,
    TrueRandom,
    SmartShuffle,
    UserWeighted,
}

/// Modes de Répétition
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RepeatMode {
    Off,
    RepeatAll,
    RepeatOne,
}

/// Rapport complet d'état de lecture renvoyé au frontend via IPC
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaybackStateReport {
    pub status: PlaybackStatus,
    pub current_track: Option<TrackMetadata>,
    pub position_ms: u64,
    pub duration_ms: u64,
    pub volume: f32,
    pub shuffle_mode: ShuffleMode,
    pub repeat_mode: RepeatMode,
    pub lookahead_buffered_tracks: Vec<String>,
    pub audio_buffer_health_percent: f32,
    pub is_gamer_mode_active: bool,
}

/// Tampon d'échantillons PCM audio stéréo 32-bit flottant
#[derive(Debug, Clone)]
pub struct PcmBuffer {
    pub samples: Vec<f32>,
    pub sample_rate: u32,
    pub channels: usize,
}

impl PcmBuffer {
    pub fn new(capacity_samples: usize, sample_rate: u32, channels: usize) -> Self {
        Self {
            samples: Vec::with_capacity(capacity_samples),
            sample_rate,
            channels,
        }
    }

    pub fn duration_ms(&self) -> u64 {
        if self.sample_rate == 0 || self.channels == 0 {
            return 0;
        }
        let total_frames = self.samples.len() / self.channels;
        ((total_frames as f64 / self.sample_rate as f64) * 1000.0) as u64
    }

    /// Crée un tampon de silence
    pub fn silence(frames: usize, sample_rate: u32, channels: usize) -> Self {
        Self {
            samples: vec![0.0f32; frames * channels],
            sample_rate,
            channels,
        }
    }
}
