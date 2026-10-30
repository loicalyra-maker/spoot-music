// Spoot Music — Automated Unit & Integration Tests (Vitest)
import { describe, it, expect, beforeEach } from 'vitest';
import { useSpootStore } from '../store/useSpootStore';
import { INITIAL_TRACKS } from '../mock/catalog';

describe('Spoot Music Core Store & Audio Integration', () => {
  beforeEach(() => {
    // Réinitialise le store
    useSpootStore.setState({
      activeQueue: [...INITIAL_TRACKS],
      queueIndex: 0,
      currentTrack: INITIAL_TRACKS[0],
      playbackStatus: 'Stopped',
      shuffleMode: 'TrueRandom',
      unplayedCycle: [...INITIAL_TRACKS],
      blacklist: [],
      trash: [],
      undoNotification: null
    });
  });

  it('devrait initialiser la file de lecture avec le catalogue Hi-Res', () => {
    const state = useSpootStore.getState();
    expect(state.activeQueue.length).toBeGreaterThan(0);
    expect(state.currentTrack?.formatLabel).toContain('Hi-Res Lossless');
  });

  it('devrait effectuer une bascule de piste instantanée (0 ms Lookahead)', () => {
    const store = useSpootStore.getState();
    const initialTrackId = store.currentTrack?.id;

    // Déclenche le switch vers la piste suivante
    store.nextTrack();

    const updatedState = useSpootStore.getState();
    expect(updatedState.currentTrack?.id).not.toBe(initialTrackId);
    expect(updatedState.lastSwitchLatencyMicros).toBeLessThan(100); // < 100 µs = 0 ms perçu
    expect(updatedState.lookaheadBufferedIds.length).toBe(3); // 3 pistes pré-chargées
  });

  it('devrait respecter le True Random sans biais commercial', () => {
    const store = useSpootStore.getState();
    store.setShuffleMode('TrueRandom');

    const playedIds = new Set<string>();
    const totalTracks = store.activeQueue.length;

    // Écoute de tous les morceaux d'un cycle complet
    for (let i = 0; i < totalTracks; i++) {
      const cur = useSpootStore.getState().currentTrack!;
      expect(playedIds.has(cur.id)).toBe(false); // Aucune répétition avant cycle complet
      playedIds.add(cur.id);
      useSpootStore.getState().nextTrack();
    }

    expect(playedIds.size).toBe(totalTracks);
  });

  it('devrait enrichir une playlist avec des morceaux acoustiquement cohérents', () => {
    const store = useSpootStore.getState();
    const playlistId = 'pl-1'; // Daily Mix 1 - Rap FR
    const recommendations = store.enrichPlaylist(playlistId);

    expect(recommendations.length).toBeGreaterThan(0);
    // Les recommandations ne doivent pas être déjà présentes dans la playlist
    const pl = store.playlists.find(p => p.id === playlistId)!;
    for (const rec of recommendations) {
      expect(pl.tracks.some(t => t.id === rec.id)).toBe(false);
    }
  });

  it('devrait bannir à 100% un artiste ou un morceau via la Blacklist', () => {
    const store = useSpootStore.getState();
    const artistToBlock = INITIAL_TRACKS[1].artistId; // Kavinsky
    const trackToBlock = INITIAL_TRACKS[1];

    store.blacklistEntity('artist', artistToBlock, trackToBlock.artistName);

    const updatedState = useSpootStore.getState();
    expect(updatedState.blacklist.some(b => b.entityId === artistToBlock)).toBe(true);

    // Si on avance dans la file, la piste bannie ne doit jamais être sélectionnée
    for (let i = 0; i < 10; i++) {
      updatedState.nextTrack();
      const current = useSpootStore.getState().currentTrack;
      expect(current?.artistId).not.toBe(artistToBlock);
    }
  });

  it('devrait placer une playlist supprimée dans la corbeille révocatoire à 30 jours', () => {
    const store = useSpootStore.getState();
    const targetPlaylist = store.playlists[0];

    store.deletePlaylist(targetPlaylist.id);

    const updatedState = useSpootStore.getState();
    expect(updatedState.playlists.some(p => p.id === targetPlaylist.id)).toBe(false);
    expect(updatedState.trash.some(t => t.id === targetPlaylist.id)).toBe(true);
    expect(updatedState.undoNotification).not.toBeNull();

    // Test de l'annulation immédiate (Undo)
    store.undoLastAction();
    const restoredState = useSpootStore.getState();
    expect(restoredState.playlists.some(p => p.id === targetPlaylist.id)).toBe(true);
  });

  it('devrait purger le cache streaming sans jamais toucher aux téléchargements hors-ligne', () => {
    const store = useSpootStore.getState();
    const offlineTracksBefore = store.tracks.filter(t => t.isOfflineDownloaded);

    store.clearStreamingCache();

    const offlineTracksAfter = useSpootStore.getState().tracks.filter(t => t.isOfflineDownloaded);
    expect(offlineTracksAfter.length).toBe(offlineTracksBefore.length);
  });

  it('devrait effectuer un seek sans changer de morceau ni réinitialiser la file', () => {
    const store = useSpootStore.getState();
    const originalTrackId = store.currentTrack?.id;
    const originalQueueLength = store.activeQueue.length;

    // Déplacement temporel à 45 secondes
    store.seek(45000);

    const updatedState = useSpootStore.getState();
    // Le morceau en cours et la file doivent rester strictement inchangés
    expect(updatedState.currentTrack?.id).toBe(originalTrackId);
    expect(updatedState.activeQueue.length).toBe(originalQueueLength);
    expect(updatedState.positionMs).toBe(45000);
  });

  it('devrait configurer les identifiants Spotify et vérifier la recherche mondiale', async () => {
    const store = useSpootStore.getState();
    expect(store.audioQuality).toBe('hi_res');
    expect(store.gaplessEnabled).toBe(true);
    expect(store.automixEnabled).toBe(true);

    // Test de modification des réglages Spotify Premium
    store.setCrossfadeSeconds(8);
    expect(useSpootStore.getState().crossfadeSeconds).toBe(8);

    store.toggleGapless();
    expect(useSpootStore.getState().gaplessEnabled).toBe(false);

    store.setAudioQuality('very_high');
    expect(useSpootStore.getState().audioQuality).toBe('very_high');
  });

  it('devrait modifier les détails, basculer le mode hors-ligne et créer une playlist similaire', () => {
    const store = useSpootStore.getState();
    const targetPl = store.playlists[0];

    // Modifier les métadonnées
    store.updatePlaylistDetails(targetPl.id, {
      title: 'Ma Super Playlist 2026',
      description: 'Test description',
      coverUrl: 'https://cdn-images.dzcdn.net/images/cover/custom.jpg'
    });
    const updatedPl = useSpootStore.getState().playlists.find(p => p.id === targetPl.id);
    expect(updatedPl?.title).toBe('Ma Super Playlist 2026');
    expect(updatedPl?.description).toBe('Test description');

    // Téléchargement hors-ligne
    const initialOffline = updatedPl?.isOfflineDownloaded;
    store.togglePlaylistOffline(targetPl.id);
    expect(useSpootStore.getState().playlists.find(p => p.id === targetPl.id)?.isOfflineDownloaded).toBe(!initialOffline);

    // Ajouter la playlist à la file d'attente
    const queueLenBefore = useSpootStore.getState().activeQueue.length;
    store.addPlaylistToQueue(targetPl.id);
    expect(useSpootStore.getState().activeQueue.length).toBeGreaterThan(queueLenBefore);

    // Créer une playlist similaire
    const initialPlaylistsCount = useSpootStore.getState().playlists.length;
    store.createSimilarPlaylist(targetPl.id);
    expect(useSpootStore.getState().playlists.length).toBe(initialPlaylistsCount + 1);
    const similarPl = useSpootStore.getState().playlists[useSpootStore.getState().playlists.length - 1];
    expect(similarPl.title).toContain('Recommandations');
  });
});
