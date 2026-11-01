// Spoot Music — Low-Level Power & Lifecycle Manager (PowerManager.ts)
// Protocole d'économie d'énergie ultra-agressif pour A18 Pro / iPhone 16 Pro Max.
// Dès que document.hidden === true (arrière-plan, écran verrouillé, changement d'app) :
// - Suspension immédiate des boucles graphiques (rAF, timers UI, shaders, flous CSS)
// - Découplage strict : seul le thread audio OS / HTML5 Audio continue à tourner (0% CPU graphique)

type LifecycleCallback = (isSuspended: boolean) => void;

class PowerManagerService {
  private suspended: boolean = false;
  private oledTrueBlack: boolean = false;
  private listeners: Set<LifecycleCallback> = new Set();
  private activeRafIds: Set<number> = new Set();
  private activeIntervals: Set< ReturnType<typeof setInterval> > = new Set();

  constructor() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Initialisation de l'état OLED True Black depuis localStorage
      try {
        const savedOled = localStorage.getItem('spoot_oled_true_black');
        if (savedOled !== null) {
          this.oledTrueBlack = JSON.parse(savedOled);
        } else {
          // Activé par défaut sur mobile (dalle OLED iPhone 16 Pro Max)
          this.oledTrueBlack = window.innerWidth < 768;
        }
        this.applyOledAttribute();
      } catch {}

      // Écoute du cycle de vie WebKit / iOS (équivalent web de sceneDidEnterBackground)
      document.addEventListener('visibilitychange', this.handleVisibilityChange, { passive: true });
      window.addEventListener('pagehide', () => this.setSuspended(true), { passive: true });
      window.addEventListener('pageshow', () => this.setSuspended(document.hidden), { passive: true });
      window.addEventListener('freeze', () => this.setSuspended(true), { passive: true });
      window.addEventListener('resume', () => this.setSuspended(document.hidden), { passive: true });
    }
  }

  private handleVisibilityChange = () => {
    const isHidden = document.hidden || document.visibilityState === 'hidden';
    this.setSuspended(isHidden);
  };

  private setSuspended(suspend: boolean) {
    if (this.suspended === suspend) return;
    this.suspended = suspend;

    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (suspend) {
        root.classList.add('spoot-power-suspended');
        root.setAttribute('data-power-state', 'suspended');
        this.clearAllTrackedTimers();
      } else {
        root.classList.remove('spoot-power-suspended');
        root.setAttribute('data-power-state', 'active');
      }
    }

    this.listeners.forEach((cb) => {
      try {
        cb(suspend);
      } catch (e) {
        console.warn('[PowerManager] Listener error:', e);
      }
    });
  }

  /**
   * Enregistre un requestAnimationFrame géré qui s'annule automatiquement en arrière-plan
   */
  public requestAnimationFrame(callback: FrameRequestCallback): number {
    if (this.suspended || typeof window === 'undefined') return -1;
    const id = window.requestAnimationFrame((time) => {
      this.activeRafIds.delete(id);
      if (!this.suspended) {
        callback(time);
      }
    });
    this.activeRafIds.add(id);
    return id;
  }

  public cancelAnimationFrame(id: number): void {
    if (id !== -1 && typeof window !== 'undefined') {
      window.cancelAnimationFrame(id);
      this.activeRafIds.delete(id);
    }
  }

  /**
   * Nettoie immédiatement tous les rAF et intervalles graphiques enregistrés
   */
  private clearAllTrackedTimers(): void {
    if (typeof window !== 'undefined') {
      this.activeRafIds.forEach((id) => window.cancelAnimationFrame(id));
      this.activeRafIds.clear();
    }
    this.activeIntervals.forEach((timer) => clearInterval(timer));
    this.activeIntervals.clear();
  }

  public isSuspended(): boolean {
    return this.suspended;
  }

  public subscribe(callback: LifecycleCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Contrôle du mode True Black OLED (#000000 = extinction physique des sous-pixels OLED)
   */
  public isOledTrueBlack(): boolean {
    return this.oledTrueBlack;
  }

  public setOledTrueBlack(enabled: boolean): void {
    this.oledTrueBlack = enabled;
    try {
      localStorage.setItem('spoot_oled_true_black', JSON.stringify(enabled));
    } catch {}
    this.applyOledAttribute();
  }

  public toggleOledTrueBlack(): boolean {
    this.setOledTrueBlack(!this.oledTrueBlack);
    return this.oledTrueBlack;
  }

  private applyOledAttribute(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (this.oledTrueBlack) {
      root.setAttribute('data-oled-true-black', 'true');
      root.classList.add('theme-pure-black');
    } else {
      root.removeAttribute('data-oled-true-black');
      root.classList.remove('theme-pure-black');
    }
  }
}

export const powerManager = new PowerManagerService();
export default powerManager;
