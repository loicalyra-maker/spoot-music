// Spoot Music — Modular Home Widget & Slot-Based Grid Store (home_config.json / Zustand Persist)
// Contrôle :
// 1. L'agencement 100% personnalisable des sections de l'accueil (HomeWidget[])
// 2. Le gestionnaire de Slots d'Accueil (HomeSlot[]) permettant de remplacer librement
//    chaque emplacement Daily Mix par un Artiste choisi, une Playlist personnelle ou une Sortie récente.

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

export interface HomeSlot {
  slotId: string;
  position: number;
  type: 'daily_mix' | 'custom_artist' | 'custom_playlist' | 'recent_releases';
  title: string;
  subtitle?: string;
  targetId?: string; // ID Deezer de l'artiste, ID album ou ID local de la playlist
  customImageUrl?: string;
}

interface HomeLayoutState {
  widgets: HomeWidget[];
  slots: HomeSlot[];
  isCustomizerOpen: boolean;

  // Actions d'interface
  openCustomizer: () => void;
  closeCustomizer: () => void;

  // Manipulation des widgets de section
  toggleWidget: (id: string) => void;
  setWidgetEnabled: (id: string, enabled: boolean) => void;
  moveWidget: (id: string, direction: 'up' | 'down') => void;
  reorderWidgets: (newWidgets: HomeWidget[]) => void;
  updateWidgetCustomData: (id: string, customData: any) => void;

  // Manipulation des Slots Modulaires (Remplacement Daily Mix -> Artiste / Playlist / Sorties)
  updateSlot: (slotId: string, patch: Partial<HomeSlot>) => void;
  resetSlotsToDefault: () => void;

  // Modes intelligents
  hideAllRecommendations: () => void;
  showAllWidgets: () => void;
  resetToDefault: () => void;

  // Sérialisation JSON (home_config.json)
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
    },
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
      pinnedPlaylistIds: ['pl-fav', 'pl-1', 'pl-2'],
    },
  },
  {
    id: 'widget-recent-artists',
    type: 'recent_artists',
    title: 'Vos Artistes Épinglés & Récents',
    enabled: true,
    order: 3,
    customData: {
      pinnedArtistIds: ['8673550', '288167', '4313264'],
    },
  },
  {
    id: 'widget-daily-mix',
    type: 'daily_mix',
    title: 'Grille de Slots Modulaires (Daily Mix / Artistes / Playlists)',
    enabled: true,
    order: 4,
  },
  {
    id: 'widget-new-releases',
    type: 'new_releases',
    title: 'Nouvelles Sorties Officielles',
    enabled: true,
    order: 5,
  },
];

export const DEFAULT_HOME_SLOTS: HomeSlot[] = [
  {
    slotId: 'slot-1',
    position: 0,
    type: 'daily_mix',
    title: 'Daily Mix 01',
    subtitle: 'SDM, Tiakola, Guy2Bezbar, Gazo',
    targetId: 'mix-1',
    customImageUrl: '/default-cover.jpg',
  },
  {
    slotId: 'slot-2',
    position: 1,
    type: 'custom_artist',
    title: 'Kendrick Lamar',
    subtitle: 'Artiste Épinglé • Discographie & Vault',
    targetId: '288167',
    customImageUrl: 'https://cdn-images.dzcdn.net/images/artist/96557a2f4ef2ae278932779a830517af/500x500-000000-80-0-0.jpg',
  },
  {
    slotId: 'slot-3',
    position: 2,
    type: 'custom_playlist',
    title: 'Titres Likés',
    subtitle: 'Votre collection personnelle Hi-Res',
    targetId: 'pl-fav',
    customImageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80',
  },
  {
    slotId: 'slot-4',
    position: 3,
    type: 'daily_mix',
    title: 'Daily Mix 02',
    subtitle: 'Strawberry Guy, Vacra, YOASOBI',
    targetId: 'mix-2',
    customImageUrl: 'https://cdn-images.dzcdn.net/images/cover/23b896390b1749d8003681850868b7a5/500x500-000000-80-0-0.jpg',
  },
  {
    slotId: 'slot-5',
    position: 4,
    type: 'recent_releases',
    title: 'Radar des Sorties',
    subtitle: 'Nouveaux albums & singles vérifiés',
    targetId: 'radar-releases',
    customImageUrl: 'https://cdn-images.dzcdn.net/images/cover/9a8fb8d63e0d3d5646f4f7776c7432a9/500x500-000000-80-0-0.jpg',
  },
];

const WIDGETS_STORAGE_KEY = 'spoot_home_layout_v1';
const SLOTS_STORAGE_KEY = 'spoot_home_slots_config_v1';

function loadInitialWidgets(): HomeWidget[] {
  if (typeof window === 'undefined') return DEFAULT_HOME_WIDGETS;
  try {
    const raw = localStorage.getItem(WIDGETS_STORAGE_KEY);
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
    localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(widgets));
  } catch {}
}

function loadInitialSlots(): HomeSlot[] {
  if (typeof window === 'undefined') return DEFAULT_HOME_SLOTS;
  try {
    const raw = localStorage.getItem(SLOTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => a.position - b.position);
      }
    }
  } catch {}
  return DEFAULT_HOME_SLOTS;
}

function saveSlots(slots: HomeSlot[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(slots));
  } catch {}
}

export const useHomeLayoutStore = create<HomeLayoutState>((set, get) => ({
  widgets: loadInitialWidgets(),
  slots: loadInitialSlots(),
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

  updateSlot: (slotId: string, patch: Partial<HomeSlot>) => {
    const updated = get().slots.map((s) =>
      s.slotId === slotId ? { ...s, ...patch } : s
    );
    saveSlots(updated);
    set({ slots: updated });
  },

  resetSlotsToDefault: () => {
    saveSlots(DEFAULT_HOME_SLOTS);
    set({ slots: DEFAULT_HOME_SLOTS });
  },

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
    saveSlots(DEFAULT_HOME_SLOTS);
    set({ widgets: DEFAULT_HOME_WIDGETS, slots: DEFAULT_HOME_SLOTS });
  },

  exportLayoutJson: () => {
    return JSON.stringify(
      {
        version: '2.0',
        widgets: get().widgets,
        slots: get().slots,
      },
      null,
      2
    );
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
      if (parsed && Array.isArray(parsed.widgets) && Array.isArray(parsed.slots)) {
        saveWidgets(parsed.widgets);
        saveSlots(parsed.slots);
        set({ widgets: parsed.widgets, slots: parsed.slots });
        return true;
      }
    } catch (err) {
      console.error('Import home layout failed:', err);
    }
    return false;
  },
}));
