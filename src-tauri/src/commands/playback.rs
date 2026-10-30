//! Spoot Music — Tauri IPC Playback Commands
//! Commandes IPC exposées au frontend pour le contrôle de lecture ultra-rapide.

use crate::audio::{AudioCommand, PlaybackStateReport, TrackMetadata};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn spoot_play(track_id: Option<String>, state: State<AppState>) -> Result<(), String> {
    state.audio_engine.send_command(AudioCommand::Play(track_id));
    Ok(())
}

#[tauri::command]
pub fn spoot_pause(state: State<AppState>) -> Result<(), String> {
    state.audio_engine.send_command(AudioCommand::Pause);
    Ok(())
}

#[tauri::command]
pub fn spoot_toggle_playback(state: State<AppState>) -> Result<(), String> {
    state.audio_engine.send_command(AudioCommand::TogglePlayback);
    Ok(())
}

/// Bascule atomique instantanée (0 ms de latence) vers la piste suivante
#[tauri::command]
pub fn spoot_next_track(state: State<AppState>) -> Result<PlaybackStateReport, String> {
    state.audio_engine.send_command(AudioCommand::NextTrackInstant);
    // Retourne immédiatement le nouvel état mis à jour
    Ok(state.audio_engine.get_state_report())
}

#[tauri::command]
pub fn spoot_previous_track(state: State<AppState>) -> Result<(), String> {
    state.audio_engine.send_command(AudioCommand::PreviousTrack);
    Ok(())
}

/// Déplacement temporel précis sans réinitialisation de la file ni mutation du buffer pool
#[tauri::command]
pub fn spoot_seek(target_ms: u64, state: State<AppState>) -> Result<(), String> {
    state.audio_engine.send_command(AudioCommand::Seek(target_ms));
    Ok(())
}

#[tauri::command]
pub fn spoot_set_volume(volume: f32, state: State<AppState>) -> Result<(), String> {
    state.audio_engine.send_command(AudioCommand::SetVolume(volume));
    Ok(())
}

#[tauri::command]
pub fn spoot_get_playback_state(state: State<AppState>) -> Result<PlaybackStateReport, String> {
    Ok(state.audio_engine.get_state_report())
}

#[tauri::command]
pub fn spoot_load_track(track: TrackMetadata, state: State<AppState>) -> Result<(), String> {
    state.audio_engine.send_command(AudioCommand::LoadTrack(track));
    Ok(())
}
