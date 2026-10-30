//! Spoot Music — Tauri IPC DSP Commands

use crate::audio::AudioCommand;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn spoot_set_equalizer_gains(gains: [f32; 10], state: State<AppState>) -> Result<(), String> {
    state.audio_engine.send_command(AudioCommand::SetEqualizerGains(gains));
    Ok(())
}
