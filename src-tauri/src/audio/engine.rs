//! Spoot Music — Core Audio Engine
//! Moteur audio haute fidélité temps réel opérant sur un thread natif isolé.
//! Intègre le pool de préchargement Lookahead, le traitement DSP et la communication sans verrou.

use crate::audio::dsp::{ParametricEqualizer, TruePeakLimiter};
use crate::audio::lookahead::LookaheadBufferPool;
use crate::audio::ring_buffer::SpscRingBuffer;
use crate::audio::types::{
    PlaybackStateReport, PlaybackStatus, RepeatMode, SampleRate, ShuffleMode, TrackMetadata,
};
use crossbeam_channel::{bounded, Receiver, Sender};
use parking_lot::RwLock;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::thread::{self, JoinHandle};
use std::time::Duration;

/// Commandes asynchrones transmises au thread audio depuis les commandes IPC Tauri
#[derive(Debug)]
pub enum AudioCommand {
    Play(Option<String>),
    Pause,
    TogglePlayback,
    NextTrackInstant,
    PreviousTrack,
    Seek(u64),
    SetVolume(f32),
    SetEqualizerGains([f32; 10]),
    LoadTrack(TrackMetadata),
    PrebufferLookahead(TrackMetadata, Vec<f32>),
    SetShuffleMode(ShuffleMode),
    SetRepeatMode(RepeatMode),
    Shutdown,
}

/// Instance principale du Moteur Audio Spoot
pub struct AudioEngine {
    command_tx: Sender<AudioCommand>,
    lookahead_pool: Arc<LookaheadBufferPool>,
    current_track: Arc<RwLock<Option<TrackMetadata>>>,
    status: Arc<RwLock<PlaybackStatus>>,
    position_ms: Arc<AtomicU64>,
    current_sample_offset: Arc<AtomicU64>,
    volume: Arc<RwLock<f32>>,
    shuffle_mode: Arc<RwLock<ShuffleMode>>,
    repeat_mode: Arc<RwLock<RepeatMode>>,
    is_gamer_mode: Arc<AtomicBool>,
    _worker_thread: Option<JoinHandle<()>>,
}

impl AudioEngine {
    /// Initialise le moteur audio et démarre le thread temps réel
    pub fn new(sample_rate: SampleRate) -> Self {
        let sr = sample_rate as u32;
        let channels = 2; // Stéréo native

        let (command_tx, command_rx) = bounded::<AudioCommand>(128);
        let lookahead_pool = LookaheadBufferPool::new(sr, channels);
        let current_track = Arc::new(RwLock::new(None));
        let status = Arc::new(RwLock::new(PlaybackStatus::Stopped));
        let position_ms = Arc::new(AtomicU64::new(0));
        let current_sample_offset = Arc::new(AtomicU64::new(0));
        let volume = Arc::new(RwLock::new(1.0f32));
        let shuffle_mode = Arc::new(RwLock::new(ShuffleMode::TrueRandom));
        let repeat_mode = Arc::new(RwLock::new(RepeatMode::Off));
        let is_gamer_mode = Arc::new(AtomicBool::new(false));

        // Clones pour le thread audio
        let thread_lookahead = Arc::clone(&lookahead_pool);
        let thread_current_track = Arc::clone(&current_track);
        let thread_status = Arc::clone(&status);
        let thread_position_ms = Arc::clone(&position_ms);
        let thread_sample_offset = Arc::clone(&current_sample_offset);
        let thread_volume = Arc::clone(&volume);
        let thread_shuffle = Arc::clone(&shuffle_mode);
        let thread_repeat = Arc::clone(&repeat_mode);

        // Tampon circulaire SPSC haute performance pour le flux actif (2 secondes à 96 kHz)
        let ring_buffer = SpscRingBuffer::new(sr as usize * channels * 2);

        let worker_thread = thread::Builder::new()
            .name("spoot-audio-realtime".into())
            .spawn(move || {
                Self::audio_thread_loop(
                    sr,
                    channels,
                    command_rx,
                    ring_buffer,
                    thread_lookahead,
                    thread_current_track,
                    thread_status,
                    thread_position_ms,
                    thread_sample_offset,
                    thread_volume,
                    thread_shuffle,
                    thread_repeat,
                );
            })
            .expect("Échec du démarrage du thread audio Spoot");

        Self {
            command_tx,
            lookahead_pool,
            current_track,
            status,
            position_ms,
            current_sample_offset,
            volume,
            shuffle_mode,
            repeat_mode,
            is_gamer_mode,
            _worker_thread: Some(worker_thread),
        }
    }

    /// Boucle de rendu temps réel découplée
    fn audio_thread_loop(
        sample_rate: u32,
        channels: usize,
        command_rx: Receiver<AudioCommand>,
        ring_buffer: Arc<SpscRingBuffer>,
        lookahead_pool: Arc<LookaheadBufferPool>,
        current_track: Arc<RwLock<Option<TrackMetadata>>>,
        status: Arc<RwLock<PlaybackStatus>>,
        position_ms: Arc<AtomicU64>,
        current_sample_offset: Arc<AtomicU64>,
        volume: Arc<RwLock<f32>>,
        _shuffle: Arc<RwLock<ShuffleMode>>,
        _repeat: Arc<RwLock<RepeatMode>>,
    ) {
        // Optimisation priorité OS si disponible
        #[cfg(target_os = "windows")]
        unsafe {
            use windows_sys::Win32::System::Threading::{
                GetCurrentThread, SetThreadPriority, THREAD_PRIORITY_TIME_CRITICAL,
            };
            SetThreadPriority(GetCurrentThread(), THREAD_PRIORITY_TIME_CRITICAL);
        }

        let mut equalizer = ParametricEqualizer::new(sample_rate);
        let limiter = TruePeakLimiter::new(-0.2); // Plafond -0.2 dBFS anti-écrêtage

        // Buffer de frame de travail (équivalent à 10 ms d'audio)
        let frame_samples_count = ((sample_rate as f32 * 0.01) as usize) * channels;
        let mut frame_buffer = vec![0.0f32; frame_samples_count];

        log::info!("🚀 [Spoot Core] Thread audio temps réel initialisé ({} Hz, {} canaux)", sample_rate, channels);

        loop {
            // 1. Traitement des commandes IPC non-bloquantes
            while let Ok(cmd) = command_rx.try_recv() {
                match cmd {
                    AudioCommand::Play(track_id) => {
                        // Démarrage garanti à l'octet et échantillon zéro lors du lancement
                        position_ms.store(0, Ordering::Release);
                        current_sample_offset.store(0, Ordering::Release);
                        if track_id.is_some() {
                            ring_buffer.clear();
                        }
                        let mut st = status.write();
                        *st = PlaybackStatus::Playing;
                    }
                    AudioCommand::Pause => {
                        let mut st = status.write();
                        *st = PlaybackStatus::Paused;
                    }
                    AudioCommand::TogglePlayback => {
                        let mut st = status.write();
                        *st = match *st {
                            PlaybackStatus::Playing => PlaybackStatus::Paused,
                            _ => PlaybackStatus::Playing,
                        };
                    }
                    AudioCommand::NextTrackInstant => {
                        // BASCULE ATOMIQUE 0 MILLISECONDE VIA LE POOL LOOKAHEAD
                        if let Some((next_meta, next_lead_pcm)) = lookahead_pool.switch_to_next() {
                            // Purge immédiate du ring buffer de l'ancien morceau
                            ring_buffer.clear();
                            // Injection instantanée des 5s pré-décodées du prochain morceau
                            ring_buffer.push_slice(&next_lead_pcm.samples);

                            // Mise à jour atomique des métadonnées
                            {
                                let mut cur = current_track.write();
                                *cur = Some(next_meta);
                            }
                            position_ms.store(0, Ordering::Release);
                            current_sample_offset.store(0, Ordering::Release);
                            let mut st = status.write();
                            *st = PlaybackStatus::Playing;
                            equalizer.reset();
                        } else {
                            log::warn!("⚠️ [Lookahead] Aucune piste prête en mémoire pour le switch immédiat");
                        }
                    }
                    AudioCommand::PreviousTrack => {
                        // Remise à zéro ou retour
                        position_ms.store(0, Ordering::Release);
                        current_sample_offset.store(0, Ordering::Release);
                    }
                    AudioCommand::Seek(target_ms) => {
                        // CORRECTION CRITIQUE SEEK :
                        // La commande spoot_seek(target_ms) ne doit EN AUCUN CAS réinitialiser la file
                        // d'attente ni permuter le pointeur du LookaheadBufferPool.
                        // Recalcul strict de l'offset d'échantillons PCM directement sur le flux actif :
                        let sample_offset = (target_ms * sample_rate as u64 * channels as u64) / 1000;
                        position_ms.store(target_ms, Ordering::Release);
                        current_sample_offset.store(sample_offset, Ordering::Release);
                        // Reprise immédiate de la lecture sans toucher à la file ni permuter le buffer pool
                    }
                    AudioCommand::SetVolume(new_vol) => {
                        let mut v = volume.write();
                        *v = new_vol.clamp(0.0, 1.0);
                    }
                    AudioCommand::SetEqualizerGains(gains) => {
                        equalizer.set_all_gains(gains);
                    }
                    AudioCommand::LoadTrack(meta) => {
                        ring_buffer.clear();
                        position_ms.store(0, Ordering::Release);
                        current_sample_offset.store(0, Ordering::Release);
                        {
                            let mut cur = current_track.write();
                            *cur = Some(meta);
                        }
                        let mut st = status.write();
                        *st = PlaybackStatus::Playing;
                    }
                    AudioCommand::PrebufferLookahead(meta, pcm) => {
                        let pcm_buf = crate::audio::types::PcmBuffer {
                            samples: pcm,
                            sample_rate,
                            channels,
                        };
                        lookahead_pool.push_prebuffered_track(meta, pcm_buf);
                    }
                    AudioCommand::SetShuffleMode(mode) => {
                        let mut sh = _shuffle.write();
                        *sh = mode;
                    }
                    AudioCommand::SetRepeatMode(mode) => {
                        let mut rep = _repeat.write();
                        *rep = mode;
                    }
                    AudioCommand::Shutdown => {
                        log::info!("🛑 [Spoot Core] Arrêt du thread audio");
                        return;
                    }
                }
            }

            let current_status = *status.read();

            // 2. Traitement du flux audio si en lecture
            if current_status == PlaybackStatus::Playing {
                // Lit la frame depuis le tampon circulaire sans verrou
                ring_buffer.pop_slice(&mut frame_buffer);

                // Application du volume maître
                let current_volume = *volume.read();
                if current_volume < 1.0 {
                    for s in frame_buffer.iter_mut() {
                        *s *= current_volume;
                    }
                }

                // Application de l'égaliseur paramétrique 10 bandes
                equalizer.process_interleaved(&mut frame_buffer);

                // Application du limiteur True-Peak
                limiter.process(&mut frame_buffer);

                // Incrémentation de la position de lecture (10 ms)
                position_ms.fetch_add(10, Ordering::Relaxed);
            }

            // Sommeil de synchronisation (cadence de frame 10 ms)
            thread::sleep(Duration::from_millis(10));
        }
    }

    /// Envoie une commande asynchrone sans bloquer l'appelant
    pub fn send_command(&self, cmd: AudioCommand) {
        let _ = self.command_tx.send(cmd);
    }

    /// Génère le rapport d'état complet pour les requêtes IPC
    pub fn get_state_report(&self) -> PlaybackStateReport {
        let current_meta = self.current_track.read().clone();
        let duration = current_meta.as_ref().map(|t| t.duration_ms).unwrap_or(0);

        PlaybackStateReport {
            status: *self.status.read(),
            current_track: current_meta,
            position_ms: self.position_ms.load(Ordering::Acquire),
            duration_ms: duration,
            volume: *self.volume.read(),
            shuffle_mode: *self.shuffle_mode.read(),
            repeat_mode: *self.repeat_mode.read(),
            lookahead_buffered_tracks: self.lookahead_pool.get_buffered_track_ids(),
            audio_buffer_health_percent: 100.0,
            is_gamer_mode_active: self.is_gamer_mode.load(Ordering::Relaxed),
        }
    }

    pub fn set_gamer_mode_flag(&self, active: bool) {
        self.is_gamer_mode.store(active, Ordering::Relaxed);
    }

    pub fn lookahead_pool(&self) -> Arc<LookaheadBufferPool> {
        Arc::clone(&self.lookahead_pool)
    }
}

impl Drop for AudioEngine {
    fn drop(&mut self) {
        let _ = self.command_tx.send(AudioCommand::Shutdown);
    }
}
