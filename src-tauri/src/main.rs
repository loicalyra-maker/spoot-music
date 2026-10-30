// Spoot Music — Desktop Executable Entry Point
// Empêche l'affichage de la fenêtre console sous Windows en mode release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    spoot_music_core_lib::run();
}
