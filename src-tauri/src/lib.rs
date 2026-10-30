//! Spoot Music — Desktop Core Application Library (Tauri v2)
//! Intègre le moteur audio temps réel haute fidélité, le pool Lookahead 0ms et les commandes IPC.

pub mod audio;
pub mod commands;
pub mod gamer_mode;

use audio::{AudioEngine, SampleRate};
use gamer_mode::GamerModeDetector;
use std::sync::Arc;

/// État partagé global de l'application accessible par tous les handlers IPC Tauri
pub struct AppState {
    pub audio_engine: Arc<AudioEngine>,
    pub gamer_detector: Arc<GamerModeDetector>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    log::info!("⚡ Initialisation de Spoot Music Core (Tauri v2)...");

    // Instanciation du moteur audio en qualité Hi-Res (96 kHz, Stéréo)
    let audio_engine = Arc::new(AudioEngine::new(SampleRate::HiRes96k));
    let gamer_detector = GamerModeDetector::new();

    let app_state = AppState {
        audio_engine,
        gamer_detector,
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // Commandes de Lecture
            commands::spoot_play,
            commands::spoot_pause,
            commands::spoot_toggle_playback,
            commands::spoot_next_track,
            commands::spoot_previous_track,
            commands::spoot_seek,
            commands::spoot_set_volume,
            commands::spoot_get_playback_state,
            commands::spoot_load_track,
            // Commandes de File & Lookahead
            commands::spoot_prebuffer_lookahead_track,
            commands::spoot_set_shuffle_mode,
            commands::spoot_set_repeat_mode,
            // Commandes DSP & EQ
            commands::spoot_set_equalizer_gains,
            // Commandes Système & Mode Gamer
            commands::spoot_toggle_gamer_mode,
            commands::spoot_get_system_footprint
        ])
        .run(tauri::generate_context!())
        .expect("Erreur lors de l'exécution de l'application Spoot Music");
}
