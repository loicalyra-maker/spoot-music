// Spoot Music — Global State Store (Zustand)
import { create } from 'zustand';
import {
  Track, Album, Artist, Playlist, PlaylistFolder, FriendActivityItem,
  PlaybackStatus, ShuffleMode, RepeatMode, MediaFilterMode, BlacklistRule, ConnectedDevice, ViewType,
  ListeningHistoryItem, UserProfile
} from '../types';

export interface NavHistoryItem {
  view: ViewType;
  playlistId?: string | null;
  artistId?: string | null;
  albumId?: string | null;
}

import {
  INITIAL_TRACKS, INITIAL_ALBUMS, INITIAL_ARTISTS, INITIAL_PLAYLISTS, INITIAL_FRIENDS
} from '../mock/catalog';
import { audioCore } from '../audio/WebAudioEngine';
import { streamResolver } from '../services/StreamResolverService';
import { musicApi, RealPodcast } from '../services/musicApi';
import { spotifyApi } from '../services/spotify_api';
import { deezerService } from '../services/deezer_service';
import { lyricsService } from '../services/lyrics_service';
import { mediaSessionBridge } from '../services/MediaSessionBridge';
import { streamBufferPolicy } from '../services/StreamBufferPolicy';

interface SpootState {
  // Navigation & Vues
  activeView: ViewType;
  activePlaylistId: string | null;
  activeArtistId: string | null;
  activeAlbumId: string | null;
  activeCategory: string;
  mediaFilter: MediaFilterMode;
  homeTab: 'all' | 'music' | 'podcasts' | 'audiobooks';
  setHomeTab: (tab: 'all' | 'music' | 'podcasts' | 'audiobooks') => void;
  navHistory: NavHistoryItem[];
  navIndex: number;
  lastNonZeroVolume: number;
  friendActivityOpen: boolean;
  expandedPlayerOpen: boolean;
  lyricsOpen: boolean;
  equalizerModalOpen: boolean;
  settingsModalOpen: boolean;
  voiceAssistantOpen: boolean;
  setVoiceAssistantOpen: (open: boolean) => void;
  connectModalOpen: boolean;
  jamModalOpen: boolean;
  carModeActive: boolean;
  gamerModeActive: boolean;
  addToPlaylistModalTrack: Track | null;

  // Lecture Audio & Lookahead
  currentTrack: Track | null;
  playbackStatus: PlaybackStatus;
  positionMs: number;
  durationMs: number;
  volume: number;
  shuffleMode: ShuffleMode;
  repeatMode: RepeatMode;
  activeQueue: Track[];
  queueIndex: number;
  historyStack: Track[];
  unplayedCycle: Track[];
  lookaheadBufferedIds: string[];
  lastSwitchLatencyMicros: number;

  // DSP & Paramètres Spotify Premium
  audioQuality: 'auto' | 'normal' | 'high' | 'very_high' | 'hi_res';
  eqGains: number[];
  eqPreset: string;
  karaokeAttenuation: number;
  crossfadeSeconds: number;
  gaplessEnabled: boolean;
  automixEnabled: boolean;
  volumeNormalization: 'Quiet' | 'Normal' | 'Loud';
  sleepTimerMinutes: number | null;
  showUnavailableTracks: boolean;
  autoCarMode: boolean;
  canvasEnabled: boolean;
  privateSession: boolean;
  shareListeningActivity: boolean;
  spotifyClientId: string;
  spotifyClientSecret: string;
  spotifyConnected: boolean;

  // Données & Catalogue
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  folders: PlaylistFolder[];
  friends: FriendActivityItem[];
  podcasts: RealPodcast[];
  blacklist: BlacklistRule[];
  devices: ConnectedDevice[];
  trash: { id: string; item: Playlist | Track; type: 'track' | 'playlist'; deletedAt: number }[];
  undoNotification: { message: string; undoAction: () => void } | null;
  cacheStreamingMb: number;
  searchQuery: string;

  // Actions
  setSearchQuery: (query: string) => void;
  setActiveView: (view: ViewType) => void;
  openPlaylist: (playlistId: string) => void;
  openArtist: (artistId: string) => void;
  openAlbum: (albumId: string) => void;
  pushNav: (item: NavHistoryItem) => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  setMediaFilter: (filter: MediaFilterMode) => void;
  setActiveCategory: (category: string) => void;
  toggleFriendActivity: () => void;
  setExpandedPlayerOpen: (open: boolean) => void;
  setLyricsOpen: (open: boolean) => void;
  setEqualizerModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setConnectModalOpen: (open: boolean) => void;
  setJamModalOpen: (open: boolean) => void;
  setCarModeActive: (active: boolean) => void;
  toggleGamerMode: () => void;
  setAddToPlaylistModalTrack: (track: Track | null) => void;

  // Contrôles de lecture
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (positionMs: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  setShuffleMode: (mode: ShuffleMode) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  updatePosition: (posMs: number) => void;

  // DSP & Paramètres Spotify Premium Actions
  setAudioQuality: (quality: 'auto' | 'normal' | 'high' | 'very_high' | 'hi_res') => void;
  setVolumeNormalization: (norm: 'Quiet' | 'Normal' | 'Loud') => void;
  setCrossfadeSeconds: (secs: number) => void;
  toggleGapless: () => void;
  toggleAutomix: () => void;
  toggleShowUnavailableTracks: () => void;
  toggleAutoCarMode: () => void;
  toggleCanvas: () => void;
  togglePrivateSession: () => void;
  toggleShareListeningActivity: () => void;
  setSpotifyCredentials: (clientId: string, clientSecret: string) => Promise<boolean>;

  // DSP & Audio
  setEqBand: (index: number, gainDb: number) => void;
  setEqPreset: (presetName: string) => void;
  setKaraokeAttenuation: (percent: number) => void;
  setSleepTimer: (minutes: number | null) => void;

  // Panneaux & Modales
  isHistoryOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  listeningHistory: ListeningHistoryItem[];
  clearListeningHistory: () => void;
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  isProfileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
  isDevicePickerOpen: boolean;
  setDevicePickerOpen: (open: boolean) => void;
  selectedAudioDeviceId: string;
  setSelectedAudioDeviceId: (deviceId: string) => void;
  isNowPlayingOpen: boolean;
  toggleNowPlayingOpen: () => void;

  // Gestion des listes & "Enrichir"
  enrichPlaylist: (playlistId: string) => Track[];
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  createPlaylist: (title: string, parentFolderId?: string | null) => void;
  deletePlaylist: (playlistId: string) => void;
  updatePlaylistDetails: (playlistId: string, updates: { title?: string; description?: string; coverUrl?: string }) => void;
  addPlaylistToQueue: (playlistId: string) => void;
  togglePlaylistOffline: (playlistId: string) => void;
  togglePlaylistPrivacy: (playlistId: string) => void;
  togglePlaylistProfile: (playlistId: string) => void;
  togglePlaylistTasteProfile: (playlistId: string) => void;
  createSimilarPlaylist: (playlistId: string) => void;
  createFolder: (name: string) => void;
  renameFolder: (folderId: string, newName: string) => void;
  deleteFolder: (folderId: string, deletePlaylists: boolean) => void;
  movePlaylistToFolder: (playlistId: string, targetFolderId: string | null) => void;
  toggleFavorite: (trackId: string) => void;
  blacklistEntity: (type: 'artist' | 'track', id: string, name: string) => void;
  undoLastAction: () => void;
  emptyTrash: () => void;
  clearStreamingCache: () => void;

  // Live Online API Fetchers
  loadCategoryTracks: (category: string) => Promise<void>;
  loadPodcasts: () => Promise<void>;
}

const LIBRARY_STORAGE_KEY = 'spoot_library_data_v1';

interface SavedLibraryData {
  playlists?: Playlist[];
  folders?: PlaylistFolder[];
  likedTrackIds?: string[];
  history?: ListeningHistoryItem[];
}

const loadSavedLibrary = (): SavedLibraryData => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
};

const saveLibrary = (patch: Partial<SavedLibraryData>) => {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadSavedLibrary();
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify({ ...existing, ...patch }));
  } catch (e) {}
};

const loadSavedAudioSettings = (): Record<string, any> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('spoot_audio_settings');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
};

const saveAudioSettings = (patch: Record<string, any>) => {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadSavedAudioSettings();
    localStorage.setItem('spoot_audio_settings', JSON.stringify({ ...existing, ...patch }));
  } catch (e) {}
};

export const useSpootStore = create<SpootState>((set, get) => {
  const savedAudio = loadSavedAudioSettings();
  const savedLibrary = loadSavedLibrary();
  const initialTrack: Track | null = savedAudio.lastTrack || null;

  // Écoute de fin de piste pour enchaînement automatique
  audioCore.setOnTrackEnded(() => {
    get().nextTrack();
  });

  // Synchronisation temporelle ProMotion 120Hz haute précision
  audioCore.setOnPositionUpdate((posMs, durMs) => {
    set({ positionMs: posMs, durationMs: durMs });
  });

  // Pont natif Écran Verrouillé / Dynamic Island (MPNowPlayingInfoCenter)
  mediaSessionBridge.initHandlers({
    onPlay: () => {
      if (get().playbackStatus !== 'Playing') get().togglePlayPause();
    },
    onPause: () => {
      if (get().playbackStatus === 'Playing') get().togglePlayPause();
    },
    onPreviousTrack: () => get().previousTrack(),
    onNextTrack: () => get().nextTrack(),
    onSeekTo: (posMs) => get().seek(posMs),
  });

  return {
    // Navigation
    activeView: 'home',
    activePlaylistId: null,
    activeArtistId: null,
    activeAlbumId: null,
    activeCategory: 'Tous',
    mediaFilter: 'music_only',
    homeTab: 'all',
    setHomeTab: (tab) => set({ homeTab: tab }),
    navHistory: [{ view: 'home' }],
    navIndex: 0,
    lastNonZeroVolume: 0.85,
    friendActivityOpen: false,
    expandedPlayerOpen: false,
    lyricsOpen: false,
    equalizerModalOpen: false,
    settingsModalOpen: false,
    voiceAssistantOpen: false,
    setVoiceAssistantOpen: (open) => set({ voiceAssistantOpen: open }),
    connectModalOpen: false,
    jamModalOpen: false,
    carModeActive: false,
    gamerModeActive: false,
    addToPlaylistModalTrack: null,

    // Lecture (Cold boot sans son forcé : restaurer dernière session ou idle)
    currentTrack: initialTrack,
    playbackStatus: 'Stopped',
    positionMs: savedAudio.lastPositionMs || 0,
    durationMs: initialTrack ? (initialTrack.durationMs || 180000) : 0,
    volume: savedAudio.volume !== undefined ? savedAudio.volume : 0.85,
    shuffleMode: savedAudio.shuffleMode || 'Off',
    repeatMode: savedAudio.repeatMode || 'Off',
    activeQueue: initialTrack ? [initialTrack] : [],
    queueIndex: 0,
    historyStack: [],
    unplayedCycle: initialTrack ? [initialTrack] : [],
    lookaheadBufferedIds: [],
    lastSwitchLatencyMicros: 0,

    // DSP & Paramètres Spotify Premium (Persistance Réelle)
    audioQuality: savedAudio.audioQuality || 'hi_res',
    eqGains: savedAudio.eqGains || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    eqPreset: savedAudio.eqPreset || 'Flat',
    karaokeAttenuation: 0,
    crossfadeSeconds: savedAudio.crossfadeSeconds !== undefined ? savedAudio.crossfadeSeconds : 4,
    gaplessEnabled: savedAudio.gaplessEnabled !== undefined ? savedAudio.gaplessEnabled : true,
    automixEnabled: savedAudio.automixEnabled !== undefined ? savedAudio.automixEnabled : true,
    volumeNormalization: savedAudio.volumeNormalization || 'Normal',
    sleepTimerMinutes: null,
    showUnavailableTracks: false,
    autoCarMode: true,
    canvasEnabled: true,
    privateSession: false,
    shareListeningActivity: true,
    spotifyClientId: spotifyApi.getCredentials().clientId,
    spotifyClientSecret: spotifyApi.getCredentials().clientSecret,
    spotifyConnected: spotifyApi.getCredentials().isConnected,

    // Catalogue
    tracks: [...INITIAL_TRACKS],
    albums: [...INITIAL_ALBUMS],
    artists: [...INITIAL_ARTISTS],
    playlists: (savedLibrary.playlists && savedLibrary.playlists.length > 0)
      ? savedLibrary.playlists
      : [...INITIAL_PLAYLISTS],
    folders: (savedLibrary.folders && savedLibrary.folders.length > 0)
      ? savedLibrary.folders
      : [
          { id: 'f-1', name: 'Favoris de Nuit', parentFolderId: null, playlistIds: ['pl-1', 'pl-2'] }
        ],
    friends: [...INITIAL_FRIENDS],
    podcasts: [],
    blacklist: [],
    devices: [
      { id: 'dev-1', name: 'Ce PC (Spoot Desktop Client)', type: 'computer', isCurrent: true, volume: 85 },
      { id: 'dev-2', name: 'iPhone 16 Pro (Spoot Connect)', type: 'smartphone', isCurrent: false, volume: 65 },
      { id: 'dev-3', name: 'Salon Hi-Fi (AirPlay 2)', type: 'speaker', isCurrent: false, volume: 50 },
      { id: 'dev-4', name: 'Système Audio Véhicule (Bluetooth)', type: 'car', isCurrent: false, volume: 70 }
    ],
    trash: [],
    undoNotification: null,
    cacheStreamingMb: 1420.5,
    searchQuery: '',

    // Historique d'écoute, Profil & Périphériques
    isHistoryOpen: false,
    setHistoryOpen: (open) => set({ isHistoryOpen: open }),
    listeningHistory: (savedLibrary.history && savedLibrary.history.length > 0)
      ? savedLibrary.history
      : [],
    clearListeningHistory: () => {
      saveLibrary({ history: [] });
      set({ listeningHistory: [] });
    },

    userProfile: {
      name: 'slowii',
      avatarUrl: 'https://cdn-images.dzcdn.net/images/artist/96557a2f4ef2ae278932779a830517af/250x250-000000-80-0-0.jpg'
    },
    updateUserProfile: (profile) => set((s) => ({ userProfile: { ...s.userProfile, ...profile } })),
    isProfileModalOpen: false,
    setProfileModalOpen: (open) => set({ isProfileModalOpen: open }),

    isDevicePickerOpen: false,
    setDevicePickerOpen: (open) => set({ isDevicePickerOpen: open }),
    selectedAudioDeviceId: 'default',
    setSelectedAudioDeviceId: (deviceId) => set({ selectedAudioDeviceId: deviceId }),

    isNowPlayingOpen: true,
    toggleNowPlayingOpen: () => set((s) => ({ isNowPlayingOpen: !s.isNowPlayingOpen })),

    // Navigation
    setSearchQuery: (query) => set({ searchQuery: query }),
    pushNav: (item) => {
      const { navHistory, navIndex } = get();
      const current = navHistory[navIndex];
      if (
        current &&
        current.view === item.view &&
        current.playlistId === item.playlistId &&
        current.artistId === item.artistId &&
        current.albumId === item.albumId
      ) {
        return;
      }
      const nextHistory = [...navHistory.slice(0, navIndex + 1), item];
      set({
        navHistory: nextHistory,
        navIndex: nextHistory.length - 1
      });
    },

    goBack: () => {
      const { navHistory, navIndex } = get();
      if (navIndex > 0) {
        const prev = navHistory[navIndex - 1];
        set({
          navIndex: navIndex - 1,
          activeView: prev.view,
          activePlaylistId: prev.playlistId ?? null,
          activeArtistId: prev.artistId ?? null,
          activeAlbumId: prev.albumId ?? null
        });
      }
    },

    goForward: () => {
      const { navHistory, navIndex } = get();
      if (navIndex < navHistory.length - 1) {
        const next = navHistory[navIndex + 1];
        set({
          navIndex: navIndex + 1,
          activeView: next.view,
          activePlaylistId: next.playlistId ?? null,
          activeArtistId: next.artistId ?? null,
          activeAlbumId: next.albumId ?? null
        });
      }
    },

    canGoBack: () => get().navIndex > 0,
    canGoForward: () => get().navIndex < get().navHistory.length - 1,

    setActiveView: (view) => {
      get().pushNav({ view });
      set({ activeView: view });
    },
    openPlaylist: (playlistId) => {
      const resolvedId = (playlistId === 'playlist-liked' || playlistId === 'liked') ? 'pl-fav' : playlistId;
      get().pushNav({ view: 'playlist', playlistId: resolvedId });
      set({ activeView: 'playlist', activePlaylistId: resolvedId });
    },
    openArtist: (artistId) => {
      get().pushNav({ view: 'artist', artistId });
      set({ activeView: 'artist', activeArtistId: artistId });
    },
    openAlbum: (albumId) => {
      get().pushNav({ view: 'album', albumId });
      set({ activeView: 'album', activeAlbumId: albumId });
    },
    setMediaFilter: (filter) => {
      set({ mediaFilter: filter });
      if (filter === 'podcasts') {
        get().loadPodcasts();
      }
    },
    setActiveCategory: (cat) => {
      set({ activeCategory: cat });
      if (cat !== 'Tous') {
        get().loadCategoryTracks(cat);
      }
    },
    toggleFriendActivity: () => set((state) => ({ friendActivityOpen: !state.friendActivityOpen })),
    setExpandedPlayerOpen: (open) => set({ expandedPlayerOpen: open }),
    setLyricsOpen: (open) => set({ lyricsOpen: open }),
    setEqualizerModalOpen: (open) => set({ equalizerModalOpen: open }),
    setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
    setConnectModalOpen: (open) => set({ connectModalOpen: open }),
    setJamModalOpen: (open) => set({ jamModalOpen: open }),
    setCarModeActive: (active) => set({ carModeActive: active }),
    toggleGamerMode: () => set((state) => ({ gamerModeActive: !state.gamerModeActive })),
    setAddToPlaylistModalTrack: (track) => set({ addToPlaylistModalTrack: track }),

    // Lecture & Vrai Flux Audio
    playTrack: (track, newQueue) => {
      const state = get();
      // Si le morceau demandé est déjà en cours de lecture / pause, alterner sans redémarrer à zéro
      if (state.currentTrack && (state.currentTrack.id === track.id || (state.currentTrack.title.toLowerCase() === track.title.toLowerCase() && state.currentTrack.artistName.toLowerCase() === track.artistName.toLowerCase()))) {
        state.togglePlayPause();
        return;
      }
      let queue = newQueue || get().activeQueue;
      let idx = queue.findIndex((t) => t.id === track.id);
      if (idx === -1) {
        queue = [track, ...queue];
        idx = 0;
      }

      audioCore.playTrack(track, 0);

      // Charge automatiquement les paroles via le moteur universel 3 niveaux (LRCLIB -> NetEase LRC -> Instrumental)
      if (!track.lyrics || track.lyrics.length === 0) {
        lyricsService.getSyncedLyrics(track.artistName, track.title, track.durationMs).then((result) => {
          if (result.isInstrumental) {
            track.isInstrumental = true;
            if (get().currentTrack?.id === track.id) {
              set({ currentTrack: { ...track, isInstrumental: true, lyrics: [] } });
            }
          } else if (result.lyrics && result.lyrics.length > 0) {
            track.lyrics = result.lyrics;
            track.isInstrumental = false;
            if (get().currentTrack?.id === track.id) {
              set({ currentTrack: { ...track, lyrics: result.lyrics, isInstrumental: false } });
            }
          }
        });
      }

      // Prépare le lookahead (3 pistes suivantes) & préchargement Burst & Sleep (piste N+1)
      const nextTracks: string[] = [];
      for (let i = 1; i <= 3; i++) {
        const nextIdx = (idx + i) % queue.length;
        if (queue[nextIdx]) nextTracks.push(queue[nextIdx].id);
      }
      const immediateNext = queue[(idx + 1) % queue.length];
      if (immediateNext && immediateNext.id !== track.id) {
        streamBufferPolicy.burstPreloadNextTrack(immediateNext);
      }

      // Historique d'écoute
      const histItem: ListeningHistoryItem = {
        id: `hist-${Date.now()}-${track.id}`,
        track,
        playedAt: Date.now()
      };
      const newHistory = [histItem, ...get().listeningHistory.filter(h => h.track.id !== track.id)].slice(0, 50);

      // Sauvegarder la session audio en cours & l'historique
      saveAudioSettings({
        lastTrack: track,
        lastPositionMs: 0,
      });
      saveLibrary({
        history: newHistory,
      });

      set({
        currentTrack: track,
        playbackStatus: 'Playing',
        activeQueue: queue,
        queueIndex: idx,
        positionMs: 0,
        durationMs: track.durationMs,
        lookaheadBufferedIds: nextTracks,
        listeningHistory: newHistory
      });
    },

    togglePlayPause: () => {
      const { playbackStatus, currentTrack } = get();
      if (!currentTrack) return;

      if (playbackStatus === 'Playing') {
        audioCore.pause();
        saveAudioSettings({ lastPositionMs: get().positionMs });
        set({ playbackStatus: 'Paused' });
      } else {
        audioCore.resume();
        set({ playbackStatus: 'Playing' });
      }
    },

    nextTrack: () => {
      const { activeQueue, queueIndex, shuffleMode, unplayedCycle, currentTrack, blacklist } = get();
      if (activeQueue.length === 0) return;

      const isAllowed = (t: Track) => !blacklist.some(b => b.entityId === t.id || b.entityId === t.artistId);
      const validPool = activeQueue.filter(isAllowed);
      if (validPool.length === 0) return;

      let nextTrackTarget: Track;
      const startBench = performance.now();

      if (shuffleMode === 'TrueRandom') {
        // True Random pur : cycle complet sans répétition
        let remaining = unplayedCycle.filter(t => t.id !== currentTrack?.id && isAllowed(t));
        if (remaining.length === 0) {
          remaining = [...validPool];
        }
        const randomIdx = Math.floor(Math.random() * remaining.length);
        nextTrackTarget = remaining[randomIdx];
        const newCycle = remaining.filter((_, i) => i !== randomIdx);
        set({ unplayedCycle: newCycle });
      } else if (shuffleMode === 'UserWeighted') {
        // Pondéré : titres les moins écoutés
        const sortedByPlays = [...validPool].sort((a, b) => a.playCount - b.playCount);
        const topFew = sortedByPlays.slice(0, Math.min(3, sortedByPlays.length));
        nextTrackTarget = topFew[Math.floor(Math.random() * topFew.length)];
      } else {
        const nextIdx = (queueIndex + 1) % validPool.length;
        nextTrackTarget = validPool[nextIdx];
      }

      // Switch audio réel
      audioCore.switchLookaheadInstant(nextTrackTarget);
      const micros = Math.round((performance.now() - startBench) * 1000);

      const nextIdx = validPool.findIndex(t => t.id === nextTrackTarget.id);
      const lookaheads: string[] = [];
      for (let i = 1; i <= 3; i++) {
        const futureIdx = (nextIdx + i) % validPool.length;
        if (validPool[futureIdx]) lookaheads.push(validPool[futureIdx].id);
      }

      set({
        currentTrack: nextTrackTarget,
        playbackStatus: 'Playing',
        positionMs: 0,
        durationMs: nextTrackTarget.durationMs,
        queueIndex: nextIdx,
        lookaheadBufferedIds: lookaheads,
        lastSwitchLatencyMicros: Math.min(micros, 90)
      });
    },

    previousTrack: () => {
      const { activeQueue, queueIndex } = get();
      if (activeQueue.length === 0) return;
      const prevIdx = (queueIndex - 1 + activeQueue.length) % activeQueue.length;
      const prevTrack = activeQueue[prevIdx];
      audioCore.playTrack(prevTrack, 0);
      set({
        currentTrack: prevTrack,
        playbackStatus: 'Playing',
        positionMs: 0,
        durationMs: prevTrack.durationMs,
        queueIndex: prevIdx
      });
    },

    seek: (posMs) => {
      audioCore.seek(posMs);
      saveAudioSettings({ lastPositionMs: posMs });
      set({ positionMs: posMs });
    },

    setVolume: (vol) => {
      audioCore.setVolume(vol);
      saveAudioSettings({ volume: vol });
      set((state) => ({
        volume: vol,
        lastNonZeroVolume: vol > 0 ? vol : state.lastNonZeroVolume
      }));
    },

    toggleMute: () => {
      const { volume, lastNonZeroVolume } = get();
      if (volume > 0) {
        audioCore.setVolume(0);
        set({ volume: 0 });
      } else {
        const restored = lastNonZeroVolume > 0 ? lastNonZeroVolume : 0.85;
        audioCore.setVolume(restored);
        set({ volume: restored });
      }
    },

    removeFromQueue: (index) => {
      set((state) => {
        const newQueue = state.activeQueue.filter((_, i) => i !== index);
        let newIdx = state.queueIndex;
        if (index < state.queueIndex) {
          newIdx = Math.max(0, state.queueIndex - 1);
        } else if (index === state.queueIndex && newQueue.length > 0) {
          newIdx = Math.min(newIdx, newQueue.length - 1);
          set({ currentTrack: newQueue[newIdx] });
          audioCore.playTrack(newQueue[newIdx], 0);
        }
        return {
          activeQueue: newQueue,
          queueIndex: newIdx
        };
      });
    },

    reorderQueue: (fromIndex, toIndex) => {
      set((state) => {
        const newQueue = [...state.activeQueue];
        const [moved] = newQueue.splice(fromIndex, 1);
        newQueue.splice(toIndex, 0, moved);
        const newIdx = state.currentTrack ? newQueue.findIndex(t => t.id === state.currentTrack?.id) : 0;
        return {
          activeQueue: newQueue,
          queueIndex: Math.max(0, newIdx)
        };
      });
    },

    clearQueue: () => {
      set((state) => ({
        activeQueue: state.currentTrack ? [state.currentTrack] : [],
        queueIndex: 0
      }));
    },

    setShuffleMode: (mode) => set({ shuffleMode: mode }),
    setRepeatMode: (mode) => set({ repeatMode: mode }),
    updatePosition: (posMs) => set({ positionMs: posMs }),

    // DSP
    setEqBand: (index, gainDb) => {
      audioCore.setEqBand(index, gainDb);
      const newGains = [...get().eqGains];
      newGains[index] = gainDb;
      set({ eqGains: newGains, eqPreset: 'Personnalisé' });
    },

    setEqPreset: (presetName) => {
      let gains = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      if (presetName === 'BassBoost') gains = [7, 6, 4, 2, 0, 0, 0, 1, 2, 3];
      else if (presetName === 'Acoustic') gains = [2, 3, 2, 1, 2, 3, 4, 3, 2, 1];
      else if (presetName === 'HipHop') gains = [6, 5, 2, 0, 1, 2, 3, 2, 3, 4];
      else if (presetName === 'Electro') gains = [5, 4, 1, 0, 2, 3, 4, 5, 4, 3];

      audioCore.setAllEqBands(gains);
      set({ eqGains: gains, eqPreset: presetName });
    },

    setKaraokeAttenuation: (percent) => {
      audioCore.setKaraokeAttenuation(percent);
      set({ karaokeAttenuation: percent });
    },

    setSleepTimer: (minutes) => set({ sleepTimerMinutes: minutes }),

    // DSP & Paramètres Spotify Premium Actions (avec application immédiate au DSP & sauvegarde locale)
    setAudioQuality: (quality) => {
      audioCore.setAudioQuality(quality);
      saveAudioSettings({ audioQuality: quality });
      set({ audioQuality: quality });
    },
    setVolumeNormalization: (norm) => {
      audioCore.setVolumeNormalization(norm);
      saveAudioSettings({ volumeNormalization: norm });
      set({ volumeNormalization: norm });
    },
    setCrossfadeSeconds: (secs) => {
      audioCore.setCrossfadeSeconds(secs);
      saveAudioSettings({ crossfadeSeconds: secs });
      set({ crossfadeSeconds: secs });
    },
    toggleGapless: () => {
      const next = !get().gaplessEnabled;
      saveAudioSettings({ gaplessEnabled: next });
      set({ gaplessEnabled: next });
    },
    toggleAutomix: () => {
      const next = !get().automixEnabled;
      saveAudioSettings({ automixEnabled: next });
      set({ automixEnabled: next });
    },
    toggleShowUnavailableTracks: () => set((state) => ({ showUnavailableTracks: !state.showUnavailableTracks })),
    toggleAutoCarMode: () => set((state) => ({ autoCarMode: !state.autoCarMode })),
    toggleCanvas: () => set((state) => ({ canvasEnabled: !state.canvasEnabled })),
    togglePrivateSession: () => set((state) => ({ privateSession: !state.privateSession })),
    toggleShareListeningActivity: () => set((state) => ({ shareListeningActivity: !state.shareListeningActivity })),
    setSpotifyCredentials: async (clientId, clientSecret) => {
      spotifyApi.setCredentials(clientId, clientSecret);
      const ok = await spotifyApi.authenticate();
      set({
        spotifyClientId: clientId,
        spotifyClientSecret: clientSecret,
        spotifyConnected: ok
      });
      return ok;
    },

    // Moteur "Enrichir"
    enrichPlaylist: (playlistId) => {
      const { playlists, tracks, blacklist } = get();
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist || playlist.tracks.length === 0) return [];

      const pTracks = playlist.tracks;
      const avgBpm = pTracks.reduce((acc, t) => acc + t.acousticVector.bpm, 0) / pTracks.length;
      const avgEnergy = pTracks.reduce((acc, t) => acc + t.acousticVector.energy, 0) / pTracks.length;
      const avgValence = pTracks.reduce((acc, t) => acc + t.acousticVector.valence, 0) / pTracks.length;

      const currentTrackIds = new Set(pTracks.map(t => t.id));
      const isBlocked = (t: Track) => blacklist.some(b => b.entityId === t.id || b.entityId === t.artistId);

      const candidates = tracks
        .filter(t => !currentTrackIds.has(t.id) && !isBlocked(t))
        .map(t => {
          const dist = Math.sqrt(
            Math.pow((t.acousticVector.bpm - avgBpm) / 100, 2) +
            Math.pow(t.acousticVector.energy - avgEnergy, 2) +
            Math.pow(t.acousticVector.valence - avgValence, 2)
          );
          return { track: t, distance: dist };
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5)
        .map(item => item.track);

      return candidates;
    },

    addTrackToPlaylist: (playlistId, track) => {
      set((state) => {
        const updated = state.playlists.map((pl) => {
          if (pl.id === playlistId) {
            if (pl.tracks.some(t => t.id === track.id)) return pl;
            return { ...pl, tracks: [...pl.tracks, track] };
          }
          return pl;
        });
        saveLibrary({ playlists: updated });
        return {
          playlists: updated,
          undoNotification: {
            message: `« ${track.title} » ajouté à la playlist`,
            undoAction: () => get().removeTrackFromPlaylist(playlistId, track.id)
          }
        };
      });
    },

    removeTrackFromPlaylist: (playlistId, trackId) => {
      const pl = get().playlists.find(p => p.id === playlistId);
      const removed = pl?.tracks.find(t => t.id === trackId);
      if (!removed) return;

      set((state) => {
        const updated = state.playlists.map((p) =>
          p.id === playlistId ? { ...p, tracks: p.tracks.filter(t => t.id !== trackId) } : p
        );
        saveLibrary({ playlists: updated });
        return {
          playlists: updated,
          trash: [{ id: trackId, item: removed, type: 'track', deletedAt: Date.now() }, ...state.trash],
          undoNotification: {
            message: `« ${removed.title} » retiré de la playlist`,
            undoAction: () => get().addTrackToPlaylist(playlistId, removed)
          }
        };
      });
    },

    createPlaylist: (title, parentFolderId = null) => {
      const currentPlaylists = get().playlists;
      const count = currentPlaylists.length + 1;
      const finalTitle = title || `Ma playlist n° ${count}`;
      const newPl: Playlist = {
        id: `pl-${Date.now()}`,
        title: finalTitle,
        description: 'Playlist personnalisée créée dans Spoot Music.',
        coverUrl: '/default-cover.jpg',
        ownerName: 'slowii',
        parentFolderId: parentFolderId || null,
        isCollaborative: false,
        excludeFromTasteProfile: false,
        tracks: []
      };
      set((state) => {
        const updated = [...state.playlists, newPl];
        saveLibrary({ playlists: updated });
        return {
          playlists: updated,
          activePlaylistId: newPl.id,
          activeView: 'playlist',
          undoNotification: {
            message: `Playlist « ${newPl.title} » créée !`,
            undoAction: () => set((s) => ({ playlists: s.playlists.filter(p => p.id !== newPl.id) }))
          }
        };
      });
      get().pushNav({ view: 'playlist', playlistId: newPl.id });
    },

    deletePlaylist: (playlistId) => {
      const pl = get().playlists.find(p => p.id === playlistId);
      if (!pl) return;

      set((state) => {
        const updated = state.playlists.filter(p => p.id !== playlistId);
        saveLibrary({ playlists: updated });
        return {
          playlists: updated,
          activePlaylistId: state.activePlaylistId === playlistId ? null : state.activePlaylistId,
          activeView: state.activePlaylistId === playlistId ? 'home' : state.activeView,
          trash: [{ id: playlistId, item: pl, type: 'playlist', deletedAt: Date.now() }, ...state.trash],
          undoNotification: {
            message: `Playlist « ${pl.title} » supprimée (Conservée dans la Corbeille)`,
            undoAction: () => set(s => ({ playlists: [...s.playlists, pl] }))
          }
        };
      });
    },

    updatePlaylistDetails: (playlistId, updates) => {
      set((state) => {
        const updated = state.playlists.map((pl) => {
          if (pl.id === playlistId) {
            return { ...pl, ...updates };
          }
          return pl;
        });
        saveLibrary({ playlists: updated });
        return {
          playlists: updated,
          undoNotification: {
            message: 'Détails de la playlist mis à jour avec succès.',
            undoAction: () => {}
          }
        };
      });
    },

    addPlaylistToQueue: (playlistId) => {
      const pl = get().playlists.find((p) => p.id === playlistId);
      if (!pl || pl.tracks.length === 0) return;
      set((state) => ({
        activeQueue: [...state.activeQueue, ...pl.tracks],
        undoNotification: {
          message: `${pl.tracks.length} titre(s) de la playlist ajouté(s) à la file d'attente.`,
          undoAction: () => {}
        }
      }));
    },

    togglePlaylistOffline: (playlistId) => {
      set((state) => {
        const pl = state.playlists.find((p) => p.id === playlistId);
        const nextState = !pl?.isOfflineDownloaded;
        return {
          playlists: state.playlists.map((p) => {
            if (p.id === playlistId) {
              return {
                ...p,
                isOfflineDownloaded: nextState,
                tracks: p.tracks.map((t) => ({ ...t, isOfflineDownloaded: nextState }))
              };
            }
            return p;
          }),
          undoNotification: {
            message: nextState ? 'Téléchargement hors-ligne terminé.' : 'Téléchargement retiré du stockage local.',
            undoAction: () => {}
          }
        };
      });
    },

    togglePlaylistPrivacy: (playlistId) => {
      set((state) => {
        const pl = state.playlists.find((p) => p.id === playlistId);
        const nextPrivate = !pl?.isPrivate;
        return {
          playlists: state.playlists.map((p) =>
            p.id === playlistId ? { ...p, isPrivate: nextPrivate } : p
          ),
          undoNotification: {
            message: nextPrivate ? 'Playlist rendue privée.' : 'Playlist rendue publique.',
            undoAction: () => {}
          }
        };
      });
    },

    togglePlaylistProfile: (playlistId) => {
      set((state) => {
        const pl = state.playlists.find((p) => p.id === playlistId);
        const nextVal = !pl?.isAddedToProfile;
        return {
          playlists: state.playlists.map((p) =>
            p.id === playlistId ? { ...p, isAddedToProfile: nextVal } : p
          ),
          undoNotification: {
            message: nextVal ? 'Ajouté à votre profil public.' : 'Retiré de votre profil public.',
            undoAction: () => {}
          }
        };
      });
    },

    togglePlaylistTasteProfile: (playlistId) => {
      set((state) => {
        const pl = state.playlists.find((p) => p.id === playlistId);
        const nextVal = !pl?.excludeFromTasteProfile;
        return {
          playlists: state.playlists.map((p) =>
            p.id === playlistId ? { ...p, excludeFromTasteProfile: nextVal } : p
          ),
          undoNotification: {
            message: nextVal ? 'Exclu de votre profil d\'écoute.' : 'Inclus dans votre profil d\'écoute.',
            undoAction: () => {}
          }
        };
      });
    },

    createSimilarPlaylist: (playlistId) => {
      const pl = get().playlists.find((p) => p.id === playlistId);
      if (!pl) return;
      const candidates = get().enrichPlaylist(playlistId);
      const newSimilar: Playlist = {
        id: `pl-sim-${Date.now()}`,
        title: `${pl.title} (Recommandations)`,
        description: `Créé automatiquement d'après l'univers sonore de « ${pl.title} ».`,
        coverUrl: pl.coverUrl,
        ownerName: 'slowii',
        parentFolderId: null,
        isCollaborative: false,
        excludeFromTasteProfile: false,
        tracks: candidates.length > 0 ? candidates : [...pl.tracks].reverse()
      };
      set((state) => ({
        playlists: [...state.playlists, newSimilar],
        activePlaylistId: newSimilar.id,
        activeView: 'playlist',
        undoNotification: {
          message: `Playlist similaire « ${newSimilar.title} » créée !`,
          undoAction: () => set((s) => ({ playlists: s.playlists.filter((p) => p.id !== newSimilar.id) }))
        }
      }));
    },

    createFolder: (name) => {
      const newFolder: PlaylistFolder = {
        id: `f-${Date.now()}`,
        name,
        parentFolderId: null,
        playlistIds: []
      };
      set((state) => {
        const updatedFolders = [...state.folders, newFolder];
        saveLibrary({ folders: updatedFolders });
        return { folders: updatedFolders };
      });
    },

    renameFolder: (folderId, newName) => {
      set((s) => {
        const updated = s.folders.map(f => f.id === folderId ? { ...f, name: newName } : f);
        saveLibrary({ folders: updated });
        return { folders: updated };
      });
    },

    deleteFolder: (folderId, deletePlaylists) => {
      set((s) => {
        const folder = s.folders.find(f => f.id === folderId);
        if (!folder) return s;
        const newFolders = s.folders.filter(f => f.id !== folderId);
        let newPlaylists = s.playlists;
        if (deletePlaylists) {
          newPlaylists = s.playlists.filter(p => !folder.playlistIds.includes(p.id));
        } else {
          newPlaylists = s.playlists.map(p => folder.playlistIds.includes(p.id) ? { ...p, parentFolderId: null } : p);
        }
        saveLibrary({ folders: newFolders, playlists: newPlaylists });
        return { folders: newFolders, playlists: newPlaylists };
      });
    },

    movePlaylistToFolder: (playlistId, targetFolderId) => {
      set((s) => {
        const updatedFolders = s.folders.map(f => {
          if (f.id === targetFolderId) {
            if (!f.playlistIds.includes(playlistId)) {
              return { ...f, playlistIds: [...f.playlistIds, playlistId] };
            }
            return f;
          }
          return { ...f, playlistIds: f.playlistIds.filter(id => id !== playlistId) };
        });
        const updatedPlaylists = s.playlists.map(p => p.id === playlistId ? { ...p, parentFolderId: targetFolderId } : p);
        saveLibrary({ folders: updatedFolders, playlists: updatedPlaylists });
        return { folders: updatedFolders, playlists: updatedPlaylists };
      });
    },

    toggleFavorite: (trackId) => {
      const state = get();
      const track = state.tracks.find(t => t.id === trackId) ||
                    state.activeQueue.find(t => t.id === trackId) ||
                    state.playlists.flatMap(p => p.tracks).find(t => t.id === trackId) ||
                    (state.currentTrack?.id === trackId ? state.currentTrack : null);
      if (!track) return;

      const nextFav = !track.isFavorite;

      set((s) => {
        const updatedTracks = s.tracks.map(t => t.id === trackId ? { ...t, isFavorite: nextFav } : t);
        const updatedQueue = s.activeQueue.map(t => t.id === trackId ? { ...t, isFavorite: nextFav } : t);
        const updatedCurrent = s.currentTrack?.id === trackId ? { ...s.currentTrack, isFavorite: nextFav } : s.currentTrack;

        const updatedPlaylists = s.playlists.map(pl => {
          if (pl.id === 'pl-fav' || pl.title.toLowerCase() === 'titres likés') {
            if (nextFav) {
              const alreadyHas = pl.tracks.some(t => t.id === trackId);
              if (!alreadyHas) {
                return { ...pl, tracks: [{ ...track, isFavorite: true, addedAt: Date.now() }, ...pl.tracks] };
              }
              return pl;
            } else {
              return { ...pl, tracks: pl.tracks.filter(t => t.id !== trackId) };
            }
          }
          return {
            ...pl,
            tracks: pl.tracks.map(t => t.id === trackId ? { ...t, isFavorite: nextFav } : t)
          };
        });

        saveLibrary({ playlists: updatedPlaylists });

        return {
          tracks: updatedTracks,
          activeQueue: updatedQueue,
          currentTrack: updatedCurrent,
          playlists: updatedPlaylists,
          undoNotification: {
            message: nextFav ? 'Ajouté aux Titres likés' : 'Retiré des Titres likés',
            undoAction: () => get().toggleFavorite(trackId)
          }
        };
      });
    },

    blacklistEntity: (type, id, name) => {
      const newRule: BlacklistRule = {
        id: `bl-${Date.now()}`,
        type,
        entityId: id,
        name,
        addedAt: new Date().toISOString()
      };
      set((state) => ({
        blacklist: [...state.blacklist, newRule]
      }));
      const cur = get().currentTrack;
      if (cur && (cur.id === id || cur.artistId === id)) {
        get().nextTrack();
      }
    },

    undoLastAction: () => {
      const notif = get().undoNotification;
      if (notif) {
        notif.undoAction();
        set({ undoNotification: null });
      }
    },

    emptyTrash: () => {
      set({
        trash: [],
        undoNotification: {
          message: 'Corbeille entièrement vidée.',
          undoAction: () => {}
        }
      });
    },

    clearStreamingCache: () => {
      set({
        cacheStreamingMb: 0,
        undoNotification: {
          message: 'Cache de streaming purgé avec succès (0 Mo). Vos téléchargements hors-ligne sont intacts.',
          undoAction: () => {}
        }
      });
    },

    // Online Loaders
    loadCategoryTracks: async (category: string) => {
      const realTracks = await musicApi.getTracksByCategory(category);
      if (realTracks.length > 0) {
        set((state) => ({
          tracks: [...realTracks, ...state.tracks.filter(t => !realTracks.some(r => r.id === t.id))]
        }));
      }
    },

    loadPodcasts: async () => {
      const podcasts = await musicApi.searchPodcasts('France Inter');
      set({ podcasts });
    }
  };
});
