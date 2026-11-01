// Spoot Music — Apple iOS 26 / macOS Tahoe Liquid Glass Theme Store
// Real-time customizer, live miniature sync, tokens & CSS variables orchestration
import { create } from 'zustand';

export interface HomeSectionConfig {
  id: string;
  name: string;
  enabled: boolean;
}

export type ThemeMode = 'default' | 'liquid-glass';
export type ColorPreset = 'dynamic' | 'emerald' | 'amethyst' | 'crimson' | 'amber' | 'ocean' | 'midnight' | 'monochrome' | 'aurora' | 'sunset' | 'custom';
export type BackgroundStyle = 'animated-mesh' | 'album-adaptive' | 'static-sea' | 'custom-image';
export type PlayerMode = 'floating-pill' | 'docked-full' | 'sidebar-mini' | 'hidden';
export type SidebarMode = 'expanded' | 'compact-icons' | 'hidden';
export type DisplayDensity = 'comfortable' | 'compact' | 'ultra-compact';
export type CardSize = 'standard' | 'compact' | 'large';
export type HomeLayout = 'grid' | 'list';
export type FontFamily = 'plus-jakarta' | 'inter' | 'sf-pro';
export type AnimationIntensity = 'full' | 'reduced' | 'none';
export type CornerRadius = 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl';
export type LogoPosition = 'top-left' | 'top-center' | 'center-compact';
export type ProfilePosition = 'left' | 'right';

// Legacy compatibility aliases
export type BackgroundType = 'oled' | 'ambient-mesh' | 'custom-image';
export type PlayerSize = 'default' | 'compact-floating';

export interface ThemeConfig {
  themeMode: ThemeMode;
  colorPreset: ColorPreset;
  customColor: string;
  playerBarColor: string | null;     // Couleur personnalisée pour la barre de lecture / mini-player (null = auto)
  defaultCoverUrl: string;           // Image récurrente / fallback de couverture par défaut
  backgroundBlur: number;            // Flou d'ambiance du fond (0px à 25px)
  backgroundStyle: BackgroundStyle;
  playerMode: PlayerMode;
  sidebarMode: SidebarMode;
  displayDensity: DisplayDensity;
  cardSize: CardSize;
  homeLayout: HomeLayout;
  fontFamily: FontFamily;
  animationIntensity: AnimationIntensity;
  cornerRadius: CornerRadius;
  glassBlur: number;     // 12px à 48px
  glassOpacity: number;  // 0.05 à 0.30
  showLogo: boolean;
  logoPosition: LogoPosition;
  profilePosition: ProfilePosition;
  backgroundImageUrl: string | null;
  backgroundOpacity: number; // 0.0 à 0.8
  sections: HomeSectionConfig[];
}

interface ThemeState extends ThemeConfig {
  // Legacy aliases
  backgroundType: BackgroundType;
  playerSize: PlayerSize;

  // Tiroir de personnalisation
  isCustomizerOpen: boolean;

  // Actions
  openCustomizer: () => void;
  closeCustomizer: () => void;
  applyFullConfig: (config: Partial<ThemeConfig>) => void;
  setColorPreset: (preset: ColorPreset) => void;
  setCustomColor: (color: string) => void;
  setPlayerBarColor: (color: string | null) => void;
  setDefaultCoverUrl: (url: string) => void;
  setBackgroundBlur: (blur: number) => void;
  setBackgroundStyle: (style: BackgroundStyle) => void;
  setPlayerMode: (mode: PlayerMode) => void;
  setSidebarMode: (mode: SidebarMode) => void;
  setDisplayDensity: (density: DisplayDensity) => void;
  setCardSize: (size: CardSize) => void;
  setHomeLayout: (layout: HomeLayout) => void;
  setFontFamily: (font: FontFamily) => void;
  setAnimationIntensity: (anim: AnimationIntensity) => void;
  setGlassBlur: (blur: number) => void;
  setGlassOpacity: (opacity: number) => void;
  setCornerRadius: (radius: CornerRadius) => void;
  setShowLogo: (show: boolean) => void;
  setLogoPosition: (pos: LogoPosition) => void;
  setProfilePosition: (pos: ProfilePosition) => void;
  setBackgroundImageUrl: (url: string | null) => void;
  setBackgroundOpacity: (opacity: number) => void;
  resetTheme: () => void;
  toggleSection: (id: string) => void;
  moveSection: (index: number, direction: 'up' | 'down') => void;
  exportConfigJson: () => string;
  importConfigJson: (json: string) => boolean;

  // Legacy actions
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  setBackgroundType: (type: BackgroundType) => void;
  setPlayerSize: (size: PlayerSize) => void;
  reorderSections: (sections: HomeSectionConfig[]) => void;
}

export const DEFAULT_SECTIONS: HomeSectionConfig[] = [
  { id: 'quick_access', name: 'Raccourcis rapides ("Réécouter")', enabled: true },
  { id: 'user_playlists', name: 'Mes Playlists Personnelles', enabled: true },
  { id: 'friday_new', name: '"Vendredi = nouveautés"', enabled: true },
  { id: 'daily_mix', name: '"Conçu pour vous" (Daily Mix)', enabled: true },
  { id: 'favorite_artists', name: '"Vos artistes préférés"', enabled: true },
  { id: 'podcasts', name: 'Section Podcasts', enabled: true },
];

export interface PresetThemeDefinition {
  primary: string;
  secondary: string;
  glow: string;
  highlight: string;
  gradient: string;
  baseBg: string;
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return '0, 230, 118';
}

export const PRESET_COLORS: Record<ColorPreset, PresetThemeDefinition> = {
  dynamic: {
    primary: '#00e676',
    secondary: '#00b0ff',
    glow: 'rgba(0, 230, 118, 0.45)',
    highlight: 'rgba(0, 230, 118, 0.75)',
    gradient: 'linear-gradient(117deg, #00e676 0%, #00b0ff 100%)',
    baseBg: 'linear-gradient(145deg, #011409 0%, #032412 50%, #000a04 100%)'
  },
  emerald: {
    primary: '#00e676',
    secondary: '#00b0ff',
    glow: 'rgba(0, 230, 118, 0.45)',
    highlight: 'rgba(0, 230, 118, 0.75)',
    gradient: 'linear-gradient(117deg, #00e676 0%, #00b0ff 100%)',
    baseBg: 'linear-gradient(145deg, #011409 0%, #032412 50%, #000a04 100%)'
  },
  amethyst: {
    primary: '#a855f7',
    secondary: '#6366f1',
    glow: 'rgba(168, 85, 247, 0.45)',
    highlight: 'rgba(192, 132, 252, 0.75)',
    gradient: 'linear-gradient(117deg, #a855f7 0%, #6366f1 100%)',
    baseBg: 'linear-gradient(145deg, #13031f 0%, #200733 50%, #090110 100%)'
  },
  crimson: {
    primary: '#ff0055',
    secondary: '#9900ef',
    glow: 'rgba(255, 0, 85, 0.45)',
    highlight: 'rgba(255, 51, 119, 0.75)',
    gradient: 'linear-gradient(117deg, #ff0055 0%, #9900ef 100%)',
    baseBg: 'linear-gradient(145deg, #1c0209 0%, #2e0511 50%, #0b0104 100%)'
  },
  amber: {
    primary: '#eab308',
    secondary: '#f97316',
    glow: 'rgba(234, 179, 8, 0.45)',
    highlight: 'rgba(250, 204, 21, 0.75)',
    gradient: 'linear-gradient(117deg, #eab308 0%, #f97316 100%)',
    baseBg: 'linear-gradient(145deg, #1a1202 0%, #2b1f04 50%, #0b0701 100%)'
  },
  ocean: {
    primary: '#06b6d4',
    secondary: '#0284c7',
    glow: 'rgba(6, 182, 212, 0.45)',
    highlight: 'rgba(34, 211, 238, 0.65)',
    gradient: 'linear-gradient(117deg, #06b6d4 0%, #0284c7 100%)',
    baseBg: 'linear-gradient(145deg, #021a24 0%, #052636 50%, #010d14 100%)'
  },
  midnight: {
    primary: '#38bdf8',
    secondary: '#1e3a8a',
    glow: 'rgba(56, 189, 248, 0.45)',
    highlight: 'rgba(96, 165, 250, 0.65)',
    gradient: 'linear-gradient(117deg, #38bdf8 0%, #1e3a8a 100%)',
    baseBg: 'linear-gradient(145deg, #030b1c 0%, #071733 50%, #01040f 100%)'
  },
  monochrome: {
    primary: '#ffffff',
    secondary: '#94a3b8',
    glow: 'rgba(255, 255, 255, 0.35)',
    highlight: 'rgba(255, 255, 255, 0.8)',
    gradient: 'linear-gradient(117deg, #ffffff 0%, #94a3b8 100%)',
    baseBg: 'linear-gradient(145deg, #131417 0%, #1c1d22 50%, #08080a 100%)'
  },
  aurora: {
    primary: '#ec4899',
    secondary: '#8b5cf6',
    glow: 'rgba(236, 72, 153, 0.45)',
    highlight: 'rgba(244, 114, 182, 0.65)',
    gradient: 'linear-gradient(117deg, #ec4899 0%, #8b5cf6 100%)',
    baseBg: 'linear-gradient(145deg, #1b0728 0%, #2b0b3d 50%, #0a0212 100%)'
  },
  sunset: {
    primary: '#f97316',
    secondary: '#d946ef',
    glow: 'rgba(249, 115, 22, 0.45)',
    highlight: 'rgba(251, 146, 60, 0.65)',
    gradient: 'linear-gradient(117deg, #f97316 0%, #d946ef 100%)',
    baseBg: 'linear-gradient(145deg, #250a04 0%, #3a1308 50%, #0e030a 100%)'
  },
  custom: {
    primary: '#00e676',
    secondary: '#00b0ff',
    glow: 'rgba(0, 230, 118, 0.45)',
    highlight: 'rgba(0, 230, 118, 0.75)',
    gradient: 'linear-gradient(117deg, #00e676 0%, #00b0ff 100%)',
    baseBg: 'linear-gradient(145deg, #011409 0%, #032412 50%, #000a04 100%)'
  }
};

const LOCAL_STORAGE_KEY = 'spoot_theme_config_v3';

// Application immédiate des variables CSS et attributs data-* sur documentElement
export const applyThemeToDOM = (state: Partial<ThemeConfig>) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (state.fontFamily) {
    root.setAttribute('data-font', state.fontFamily);
  }
  if (state.displayDensity) {
    root.setAttribute('data-density', state.displayDensity);
  }
  if (state.animationIntensity) {
    root.setAttribute('data-animations', state.animationIntensity);
  }
  if (state.glassBlur !== undefined) {
    root.style.setProperty('--glass-blur-val', `${state.glassBlur}px`);
  }
  if (state.glassOpacity !== undefined) {
    root.style.setProperty('--glass-opacity', `${state.glassOpacity}`);
  }

  const preset = state.colorPreset || 'ocean';
  const custom = state.customColor || '#06b6d4';
  const colors: PresetThemeDefinition = preset === 'custom'
    ? {
        primary: custom,
        secondary: '#0284c7',
        glow: `${custom}66`,
        highlight: `${custom}aa`,
        gradient: `linear-gradient(117deg, ${custom} 0%, #0284c7 100%)`,
        baseBg: `linear-gradient(145deg, #021a24 0%, #052636 50%, #010d14 100%)`,
      }
    : PRESET_COLORS[preset] || PRESET_COLORS.ocean;

  // Mise à jour intégrale des variables CSS d'accent, de reflet et de dégradé
  root.style.setProperty('--accent-color', colors.primary);
  root.style.setProperty('--accent-rgb', hexToRgb(colors.primary));
  root.style.setProperty('--accent-primary', colors.primary);
  root.style.setProperty('--accent-secondary', colors.secondary);
  root.style.setProperty('--accent-glow', colors.glow);
  root.style.setProperty('--accent-highlight', colors.highlight);
  root.style.setProperty('--accent-gradient', colors.gradient);
  root.style.setProperty('--slider-gradient', colors.gradient);
  root.style.setProperty('--glass-border-accent', `${colors.primary}55`);
  root.style.setProperty('--accent-base-bg', colors.baseBg);
  root.style.setProperty('--glass-reflet', `linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, ${colors.glow} 45%, transparent 70%)`);
  root.setAttribute('data-color-preset', preset);

  // Variable de couleur dédiée pour la barre de lecture / mini-player
  const barColor = state.playerBarColor || colors.primary;
  root.style.setProperty('--player-bar-color', barColor);
  root.style.setProperty('--player-bar-rgb', hexToRgb(barColor));

  // Variable de flou d'ambiance d'arrière-plan
  const blurVal = state.backgroundBlur ?? 0;
  root.style.setProperty('--background-blur-val', `${blurVal}px`);

  if (state.backgroundImageUrl) {
    root.setAttribute('data-has-custom-wallpaper', 'true');
  } else {
    root.removeAttribute('data-has-custom-wallpaper');
  }
};

const loadSavedTheme = (): Partial<ThemeConfig> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not parse saved theme config:', e);
  }
  return {};
};

const saveTheme = (config: ThemeConfig) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Could not save theme config:', e);
  }
};

const initialSaved = loadSavedTheme();

// Configuration par défaut fidèle à la maquette
const DEFAULT_CONFIG: ThemeConfig = {
  themeMode: initialSaved.themeMode ?? 'liquid-glass',
  colorPreset: initialSaved.colorPreset ?? 'ocean',
  customColor: initialSaved.customColor ?? '#06b6d4',
  playerBarColor: initialSaved.playerBarColor ?? null,
  defaultCoverUrl: initialSaved.defaultCoverUrl ?? '/default-cover.jpg',
  backgroundBlur: initialSaved.backgroundBlur ?? 0,
  backgroundStyle: initialSaved.backgroundStyle ?? 'animated-mesh',
  playerMode: initialSaved.playerMode ?? 'floating-pill',
  sidebarMode: initialSaved.sidebarMode ?? 'expanded',
  displayDensity: initialSaved.displayDensity ?? 'comfortable',
  cardSize: initialSaved.cardSize ?? 'standard',
  homeLayout: initialSaved.homeLayout ?? 'grid',
  fontFamily: initialSaved.fontFamily ?? 'plus-jakarta',
  animationIntensity: initialSaved.animationIntensity ?? 'full',
  cornerRadius: initialSaved.cornerRadius ?? 'rounded-3xl',
  glassBlur: initialSaved.glassBlur ?? 28,
  glassOpacity: initialSaved.glassOpacity ?? 0.14,
  showLogo: initialSaved.showLogo ?? true,
  logoPosition: initialSaved.logoPosition ?? 'top-left',
  profilePosition: initialSaved.profilePosition ?? 'right',
  backgroundImageUrl: initialSaved.backgroundImageUrl ?? null,
  backgroundOpacity: initialSaved.backgroundOpacity ?? 0.10,
  sections: initialSaved.sections && initialSaved.sections.length > 0
    ? initialSaved.sections
    : DEFAULT_SECTIONS,
};

// Initialisation au chargement
applyThemeToDOM(DEFAULT_CONFIG);

export const useThemeStore = create<ThemeState>((set, get) => {
  const commit = (patch: Partial<ThemeConfig>) => {
    set((state) => {
      const next = { ...state, ...patch };
      // Synchronise les alias legacy
      if (patch.backgroundStyle) {
        next.backgroundType = patch.backgroundStyle === 'custom-image' ? 'custom-image' : 'ambient-mesh';
      }
      if (patch.playerMode) {
        next.playerSize = patch.playerMode === 'docked-full' ? 'default' : 'compact-floating';
      }
      applyThemeToDOM(next);
      saveTheme(next);
      return next;
    });
  };

  return {
    ...DEFAULT_CONFIG,
    // Alias legacy
    backgroundType: 'ambient-mesh',
    playerSize: 'compact-floating',
    isCustomizerOpen: false,

    openCustomizer: () => set({ isCustomizerOpen: true }),
    closeCustomizer: () => set({ isCustomizerOpen: false }),

    applyFullConfig: (newConfig) => commit(newConfig),
    setColorPreset: (preset) => commit({ colorPreset: preset }),
    setCustomColor: (color) => commit({ customColor: color, colorPreset: 'custom' }),
    setPlayerBarColor: (color) => commit({ playerBarColor: color }),
    setDefaultCoverUrl: (url) => commit({ defaultCoverUrl: url }),
    setBackgroundBlur: (blur) => commit({ backgroundBlur: blur }),
    setBackgroundStyle: (style) => commit({ backgroundStyle: style }),
    setPlayerMode: (mode) => commit({ playerMode: mode }),
    setSidebarMode: (mode) => commit({ sidebarMode: mode }),
    setDisplayDensity: (density) => commit({ displayDensity: density }),
    setCardSize: (size) => commit({ cardSize: size }),
    setHomeLayout: (layout) => commit({ homeLayout: layout }),
    setFontFamily: (font) => commit({ fontFamily: font }),
    setAnimationIntensity: (anim) => commit({ animationIntensity: anim }),
    setGlassBlur: (blur) => commit({ glassBlur: blur }),
    setGlassOpacity: (opacity) => commit({ glassOpacity: opacity }),
    setCornerRadius: (radius) => commit({ cornerRadius: radius }),
    setShowLogo: (show) => commit({ showLogo: show }),
    setLogoPosition: (pos) => commit({ logoPosition: pos }),
    setProfilePosition: (pos) => commit({ profilePosition: pos }),
    setBackgroundImageUrl: (url) => commit({ backgroundImageUrl: url, backgroundStyle: 'custom-image' }),
    setBackgroundOpacity: (opacity) => commit({ backgroundOpacity: opacity }),

    resetTheme: () => {
      const resetConfig: ThemeConfig = {
        themeMode: 'liquid-glass',
        colorPreset: 'emerald',
        customColor: '#06b6d4',
        playerBarColor: null,
        defaultCoverUrl: '/default-cover.jpg',
        backgroundBlur: 0,
        backgroundStyle: 'animated-mesh',
        playerMode: 'floating-pill',
        sidebarMode: 'expanded',
        displayDensity: 'comfortable',
        cardSize: 'standard',
        homeLayout: 'grid',
        fontFamily: 'plus-jakarta',
        animationIntensity: 'full',
        cornerRadius: 'rounded-3xl',
        glassBlur: 28,
        glassOpacity: 0.14,
        showLogo: true,
        logoPosition: 'top-left',
        profilePosition: 'right',
        backgroundImageUrl: null,
        backgroundOpacity: 0.10,
        sections: DEFAULT_SECTIONS,
      };
      commit(resetConfig);
    },

    toggleSection: (id) => {
      const updated = get().sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
      commit({ sections: updated });
    },

    moveSection: (index, direction) => {
      const list = [...get().sections];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return;
      const [item] = list.splice(index, 1);
      list.splice(targetIndex, 0, item);
      commit({ sections: list });
    },

    exportConfigJson: () => {
      const state = get();
      const exportable: ThemeConfig = {
        themeMode: state.themeMode,
        colorPreset: state.colorPreset,
        customColor: state.customColor,
        playerBarColor: state.playerBarColor,
        defaultCoverUrl: state.defaultCoverUrl,
        backgroundBlur: state.backgroundBlur,
        backgroundStyle: state.backgroundStyle,
        playerMode: state.playerMode,
        sidebarMode: state.sidebarMode,
        displayDensity: state.displayDensity,
        cardSize: state.cardSize,
        homeLayout: state.homeLayout,
        fontFamily: state.fontFamily,
        animationIntensity: state.animationIntensity,
        cornerRadius: state.cornerRadius,
        glassBlur: state.glassBlur,
        glassOpacity: state.glassOpacity,
        showLogo: state.showLogo,
        logoPosition: state.logoPosition,
        profilePosition: state.profilePosition,
        backgroundImageUrl: state.backgroundImageUrl,
        backgroundOpacity: state.backgroundOpacity,
        sections: state.sections,
      };
      return JSON.stringify(exportable, null, 2);
    },

    importConfigJson: (json) => {
      try {
        const parsed = JSON.parse(json);
        if (parsed && typeof parsed === 'object') {
          commit(parsed);
          return true;
        }
      } catch (err) {
        console.error('Invalid theme JSON:', err);
      }
      return false;
    },

    // Legacy action forwards
    setThemeMode: (mode) => commit({ themeMode: mode }),
    toggleThemeMode: () => commit({ themeMode: get().themeMode === 'liquid-glass' ? 'default' : 'liquid-glass' }),
    setBackgroundType: (type) => commit({ backgroundStyle: type === 'custom-image' ? 'custom-image' : 'animated-mesh' }),
    setPlayerSize: (size) => commit({ playerMode: size === 'default' ? 'docked-full' : 'floating-pill' }),
    reorderSections: (sections) => commit({ sections }),
  };
});
