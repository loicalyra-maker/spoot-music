// Spoot Music — Modular Home Widget Layout Store (home_layout.json / Zustand Persist)
// Contrôle l'agencement 100% personnalisable de l'accueil, l'activation, le réordonnancement,
// et le masquage des recommandations automatiques au profit de la sélection utilisateur.

import { create } from 'zustand';

export interface HomeWidget {
  id: string;
  type: 'shortcuts' | 'recent_artists' | 'user_playlists' | 'daily_mix' | 'new_releases' | 'custom_banner';
  title: string;
  enabled: boolean;
  order: number;
  customData?: {
    pinnedArtistIds?: string[];
    pinnedPlaylistIds?: string[];
    bannerTitle?: string;
    bannerSubtitle?: string;
    bannerImageUrl?: string;
    bannerLink?: string;
    [key: string]: any;
  };
}

interface HomeLayoutState {
  widgets: HomeWidget[];
  isCustomizerOpen: boolean;

  // Actions d'interface
  openCustomizer: () => void;
  closeCustomizer: () => void;

  // Manipulation des widgets
  toggleWidget: (id: string) => void;
  setWidgetEnabled: (id: string, enabled: boolean) => void;
  moveWidget: (id: string, direction: 'up' | 'down') => void;
  reorderWidgets: (newWidgets: HomeWidget[]) => void;
  updateWidgetCustomData: (id: string, customData: any) => void;

  // Modes intelligents
  hideAllRecommendations: () => void; // Désactive en 1 clic Daily Mix & Nouvelles Sorties
  showAllWidgets: () => void;
  resetToDefault: () => void;

  // Sérialisation JSON
  exportLayoutJson: () => string;
  importLayoutJson: (jsonString: string) => boolean;
}

export const DEFAULT_HOME_WIDGETS: HomeWidget[] = [
  {
    id: 'widget-custom-banner',
    type: 'custom_banner',
    title: 'Bannière Pro Spoot Hi-Res',
    enabled: true,
    order: 0,
    customData: {
      bannerTitle: 'Découvertes & Sélections Exclusives',
      bannerSubtitle: 'Flux Hi-Res Lossless 24-bit 192kHz et Master Studio direct',
    }
  },
  {
    id: 'widget-shortcuts',
    type: 'shortcuts',
    title: 'Raccourcis rapides ("Réécouter")',
    enabled: true,
    order: 1,
  },
  {
    id: 'widget-user-playlists',
    type: 'user_playlists',
    title: 'Vos Playlists & Coups de Cœur',
    enabled: true,
    order: 2,
    customData: {
      pinnedPlaylistIds: ['pl-fav', 'pl-1', 'pl-2']
    }
  },
  {
    id: 'widget-recent-artists',
    type: 'recent_artists',
    title: 'Vos Artistes Épinglés & Récents',
    enabled: true,
    order: 3,
    customData: {
      pinnedArtistIds: ['8673550', '288167', '4313264'] // Vacra, Kendrick Lamar, SDM
    }
  },
  {
    id: 'widget-daily-mix',
    type: 'daily_mix',
    title: 'Daily Mix Spoot (Recommandations)',
    enabled: true,
    order: 4,
  },
  {
    id: 'widget-new-releases',
    type: 'new_releases',
    title: 'Nouvelles Sorties Officielles',
    enabled: true,
    order: 5,
  }
];

const STORAGE_KEY = 'spoot_home_layout_v1';

function loadInitialWidgets(): HomeWidget[] {
  if (typeof window === 'undefined') return DEFAULT_HOME_WIDGETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => a.order - b.order);
      }
    }
  } catch {}
  return DEFAULT_HOME_WIDGETS;
}

function saveWidgets(widgets: HomeWidget[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  } catch {}
}

export const useHomeLayoutStore = create<HomeLayoutState>((set, get) => ({
  widgets: loadInitialWidgets(),
  isCustomizerOpen: false,

  openCustomizer: () => set({ isCustomizerOpen: true }),
  closeCustomizer: () => set({ isCustomizerOpen: false }),

  toggleWidget: (id: string) => {
    const updated = get().widgets.map((w) =>
      w.id === id ? { ...w, enabled: !w.enabled } : w
    );
    saveWidgets(updated);
    set({ widgets: updated });
  },

  setWidgetEnabled: (id: string, enabled: boolean) => {
    const updated = get().widgets.map((w) =>
      w.id === id ? { ...w, enabled } : w
    );
    saveWidgets(updated);
    set({ widgets: updated });
  },

  moveWidget: (id: string, direction: 'up' | 'down') => {
    const sorted = [...get().widgets].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((w) => w.id === id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    // Échange des ordres
    const tempOrder = sorted[index].order;
    sorted[index].order = sorted[targetIndex].order;
    sorted[targetIndex].order = tempOrder;

    const reordered = sorted.sort((a, b) => a.order - b.order);
    saveWidgets(reordered);
    set({ widgets: reordered });
  },

  reorderWidgets: (newWidgets: HomeWidget[]) => {
    const indexed = newWidgets.map((w, idx) => ({ ...w, order: idx }));
    saveWidgets(indexed);
    set({ widgets: indexed });
  },

  updateWidgetCustomData: (id: string, customData: any) => {
    const updated = get().widgets.map((w) =>
      w.id === id ? { ...w, customData: { ...w.customData, ...customData } } : w
    );
    saveWidgets(updated);
    set({ widgets: updated });
  },

  // Masquage intégral des recommandations automatiques pour ne voir que sa propre sélection
  hideAllRecommendations: () => {
    const updated = get().widgets.map((w) => {
      if (w.type === 'daily_mix' || w.type === 'new_releases') {
        return { ...w, enabled: false };
      }
      if (w.type === 'user_playlists' || w.type === 'shortcuts' || w.type === 'recent_artists') {
        return { ...w, enabled: true };
      }
      return w;
    });
    saveWidgets(updated);
    set({ widgets: updated });
  },

  showAllWidgets: () => {
    const updated = get().widgets.map((w) => ({ ...w, enabled: true }));
    saveWidgets(updated);
    set({ widgets: updated });
  },

  resetToDefault: () => {
    saveWidgets(DEFAULT_HOME_WIDGETS);
    set({ widgets: DEFAULT_HOME_WIDGETS });
  },

  exportLayoutJson: () => {
    return JSON.stringify(get().widgets, null, 2);
  },

  importLayoutJson: (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].type) {
        const sorted = parsed.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        saveWidgets(sorted);
        set({ widgets: sorted });
        return true;
      }
    } catch (err) {
      console.error('Import home layout failed:', err);
    }
    return false;
  }
}));
