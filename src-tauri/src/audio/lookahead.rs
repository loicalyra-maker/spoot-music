//! Spoot Music — Lookahead Multi-Buffer Engine (0 ms Latency Track Switching)
//! Gère le pool de préchargement des 3 pistes suivantes de la file de lecture.
//! Permet une permutation atomique de pointeur à 0 ms au clic ou swipe sur "Suivant".

use crate::audio::types::{PcmBuffer, TrackMetadata};
use parking_lot::RwLock;
use std::collections::VecDeque;
use std::sync::Arc;
use std::time::Instant;

/// Durée préchargée en mémoire pour chaque piste d'avance (5.0 secondes)
pub const LOOKAHEAD_DURATION_SECS: f32 = 5.0;
/// Nombre de pistes préchargées simultanément
pub const LOOKAHEAD_TRACK_COUNT: usize = 3;

/// Slot individuel de préchargement
#[derive(Debug, Clone)]
pub struct LookaheadSlot {
    pub track: TrackMetadata,
    pub pcm_lead_buffer: PcmBuffer,
    pub fully_buffered: bool,
    pub ready_timestamp: Instant,
}

/// Gestionnaire thread-safe du pool de tampons d'anticipation
pub struct LookaheadBufferPool {
    slots: RwLock<VecDeque<LookaheadSlot>>,
    target_sample_rate: u32,
    target_channels: usize,
}

impl LookaheadBufferPool {
    pub fn new(target_sample_rate: u32, target_channels: usize) -> Arc<Self> {
        Arc::new(Self {
            slots: RwLock::new(VecDeque::with_capacity(LOOKAHEAD_TRACK_COUNT)),
            target_sample_rate,
            target_channels,
        })
    }

    /// Réinitialise et purge tous les tampons d'anticipation (ex: changement de playlist)
    pub fn clear(&self) {
        let mut slots = self.slots.write();
        slots.clear();
    }

    /// Retourne les identifiants des pistes actuellement prêtes en mémoire
    pub fn get_buffered_track_ids(&self) -> Vec<String> {
        let slots = self.slots.read();
        slots.iter().map(|s| s.track.id.clone()).collect()
    }

    /// Ajoute ou met à jour une piste préchargée dans le pool
    pub fn push_prebuffered_track(&self, track: TrackMetadata, pcm_data: PcmBuffer) {
        let mut slots = self.slots.write();
        // Si la piste est déjà présente, la met à jour
        if let Some(existing) = slots.iter_mut().find(|s| s.track.id == track.id) {
            existing.pcm_lead_buffer = pcm_data;
            existing.fully_buffered = true;
            return;
        }

        // Si le pool est plein, retire la plus ancienne
        if slots.len() >= LOOKAHEAD_TRACK_COUNT {
            slots.pop_back();
        }

        slots.push_back(LookaheadSlot {
            track,
            pcm_lead_buffer: pcm_data,
            fully_buffered: true,
            ready_timestamp: Instant::now(),
        });
    }

    /// Permutation atomique vers la piste suivante (0 milliseconde de latence réseau)
    /// Retire la première piste en attente et renvoie son tampon audio pré-décodé
    pub fn switch_to_next(&self) -> Option<(TrackMetadata, PcmBuffer)> {
        let mut slots = self.slots.write();
        if let Some(slot) = slots.pop_front() {
            log::info!(
                "⚡ [Lookahead 0ms] Bascule instantanée sur la piste pré-décodée : '{}' (ID: {})",
                slot.track.title,
                slot.track.id
            );
            Some((slot.track, slot.pcm_lead_buffer))
        } else {
            None
        }
    }

    /// Vérifie si la piste N+1 est préchargée et prête
    pub fn has_next_track_ready(&self) -> bool {
        let slots = self.slots.read();
        !slots.is_empty()
    }

    /// Nombre de pistes prêtes en mémoire
    pub fn ready_count(&self) -> usize {
        let slots = self.slots.read();
        slots.len()
    }

    /// Génère un tampon PCM synthétique de test (pour tests unitaires et validation hors-ligne)
    pub fn generate_synthetic_lead_buffer(
        sample_rate: u32,
        channels: usize,
        frequency_hz: f32,
    ) -> PcmBuffer {
        let frames = (LOOKAHEAD_DURATION_SECS * sample_rate as f32) as usize;
        let mut samples = Vec::with_capacity(frames * channels);
        let angular_freq = 2.0 * std::f32::consts::PI * frequency_hz / (sample_rate as f32);

        for frame in 0..frames {
            let sample_val = (frame as f32 * angular_freq).sin() * 0.4; // 0.4 amplitude
            for _ in 0..channels {
                samples.push(sample_val);
            }
        }

        PcmBuffer {
            samples,
            sample_rate,
            channels,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lookahead_zero_latency_switch() {
        let pool = LookaheadBufferPool::new(96000, 2);

        let track1 = TrackMetadata {
            id: "track_1".into(),
            isrc: "FR-SPT-26-00001".into(),
            title: "Neon Echoes".into(),
            artist: "Spoot Collective".into(),
            album: "Synthetic Dreams".into(),
            duration_ms: 180000,
            sample_rate: 96000,
            bit_depth: 24,
            stream_url: None,
            acoustic_profile: None,
        };

        let pcm = LookaheadBufferPool::generate_synthetic_lead_buffer(96000, 2, 440.0);
        pool.push_prebuffered_track(track1.clone(), pcm);

        assert!(pool.has_next_track_ready());
        assert_eq!(pool.ready_count(), 1);

        // Mesure du temps d'exécution de la bascule
        let start = Instant::now();
        let result = pool.switch_to_next();
        let elapsed = start.elapsed();

        assert!(result.is_some());
        let (switched_track, buffer) = result.unwrap();
        assert_eq!(switched_track.id, "track_1");
        assert_eq!(buffer.samples.len(), (5.0 * 96000.0 * 2.0) as usize);

        // La bascule en mémoire s'effectue en quelques microsecondes (< 100 µs), soit 0 ms au sens perçu
        assert!(elapsed.as_micros() < 200, "Le switch a pris {} µs", elapsed.as_micros());
    }
}
