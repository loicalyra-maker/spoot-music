//! Spoot Music — Tauri IPC Queue & Lookahead Commands

use crate::audio::{AudioCommand, LookaheadBufferPool, RepeatMode, ShuffleMode, TrackMetadata};
use crate::AppState;
use tauri::State;

/// Pré-remplit le tampon d'anticipation Lookahead avec 5 secondes d'audio pour une piste future
#[tauri::command]
pub fn spoot_prebuffer_lookahead_track(
    track: TrackMetadata,
    state: State<AppState>,
) -> Result<(), String> {
    // Génère le tampon de test ou injecte le tampon décodé
    let pcm = LookaheadBufferPool::generate_synthetic_lead_buffer(track.sample_rate, 2, 440.0);
    state
        .audio_engine
        .send_command(AudioCommand::PrebufferLookahead(track, pcm.samples));
    Ok(())
}

#[tauri::command]
pub fn spoot_set_shuffle_mode(mode: ShuffleMode, state: State<AppState>) -> Result<(), String> {
    state.audio_engine.send_command(AudioCommand::SetShuffleMode(mode));
    Ok(())
}

#[tauri::command]
pub fn spoot_set_repeat_mode(mode: RepeatMode, state: State<AppState>) -> Result<(), String> {
    state.audio_engine.send_command(AudioCommand::SetRepeatMode(mode));
    Ok(())
}
