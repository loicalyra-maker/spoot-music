//! Spoot Music — Gamer Mode & Fullscreen Game Detector
//! Détecte si un jeu en mode plein écran ou une application 3D lourde est au premier plan.
//! Permet de suspendre à 100 % le rendu UI Webview (0 FPS) pour protéger les performances de jeu.

use parking_lot::RwLock;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

pub struct GamerModeDetector {
    is_active: AtomicBool,
    override_manual: AtomicBool,
    detected_game_name: RwLock<Option<String>>,
}

impl GamerModeDetector {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            is_active: AtomicBool::new(false),
            override_manual: AtomicBool::new(false),
            detected_game_name: RwLock::new(None),
        })
    }

    /// Sonde l'état du système d'exploitation pour détecter le plein écran exclusif
    pub fn probe_fullscreen_state(&self) -> bool {
        if self.override_manual.load(Ordering::Relaxed) {
            return self.is_active.load(Ordering::Relaxed);
        }

        #[cfg(target_os = "windows")]
        {
            unsafe {
                use windows_sys::Win32::Foundation::RECT;
                use windows_sys::Win32::UI::WindowsAndMessaging::{
                    GetForegroundWindow, GetSystemMetrics, GetWindowRect, SM_CXSCREEN, SM_CYSCREEN,
                };

                let hwnd = GetForegroundWindow();
                if hwnd == 0 {
                    return false;
                }

                let mut rect: RECT = std::mem::zeroed();
                if GetWindowRect(hwnd, &mut rect) != 0 {
                    let screen_w = GetSystemMetrics(SM_CXSCREEN);
                    let screen_h = GetSystemMetrics(SM_CYSCREEN);

                    // Si la fenêtre active couvre ou dépasse la totalité de l'écran principal
                    let is_fullscreen = rect.left <= 0
                        && rect.top <= 0
                        && rect.right >= screen_w
                        && rect.bottom >= screen_h;

                    self.is_active.store(is_fullscreen, Ordering::Relaxed);
                    return is_fullscreen;
                }
            }
        }

        self.is_active.load(Ordering::Relaxed)
    }

    /// Permet de forcer manuellement le mode Gamer
    pub fn set_manual_override(&self, enabled: bool) {
        self.override_manual.store(true, Ordering::Relaxed);
        self.is_active.store(enabled, Ordering::Relaxed);
    }

    pub fn is_gamer_mode_active(&self) -> bool {
        self.is_active.load(Ordering::Relaxed)
    }
}
