// Spoot Music — Root Application Component
// 100% Apple / Spotify Premium Faithful Layout (NavigationLayout + Real Metadata)

import React, { useEffect } from 'react';
import { NavigationLayout } from './components/NavigationLayout';
import { LyricsOverlay } from './components/Player/LyricsOverlay';
import { ExpandedPlayer } from './components/Player/ExpandedPlayer';
import { EqualizerModal } from './components/Player/EqualizerModal';
import { AddToPlaylistModal } from './components/Player/AddToPlaylistModal';
import { SettingsModal } from './components/Views/SettingsModal';
import { SpootConnectModal } from './components/Social/SpootConnectModal';
import { ProfileEditModal } from './components/Views/ProfileEditModal';
import { ListeningHistoryDrawer } from './components/Views/ListeningHistoryDrawer';
import { HomeCustomizerModal } from './components/Views/HomeCustomizerModal';
import { HomeView } from './components/Views/HomeView';
import { PlaylistView } from './components/Views/PlaylistView';
import { ArtistView } from './components/Views/ArtistView';
import { AlbumView } from './components/Views/AlbumView';
import { SearchView } from './components/Views/SearchView';
import { LibraryView } from './components/Views/LibraryView';
import { SettingsView } from './components/Views/SettingsView';
import { LyricsPanel } from './components/Player/LyricsPanel';
import { QueueView } from './components/Views/QueueView';
import { CarModeView } from './components/Views/CarModeView';
import { useSpootStore } from './store/useSpootStore';
import { RotateCcw, X } from 'lucide-react';

export const App: React.FC = () => {
  const {
    activeView,
    carModeActive,
    undoNotification,
    undoLastAction
  } = useSpootStore();

  // Auto-dismiss de la notification de téléchargement / undo après 2.5 secondes
  useEffect(() => {
    if (undoNotification) {
      const timer = setTimeout(() => {
        useSpootStore.setState({ undoNotification: null });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [undoNotification]);

  // Raccourci clavier universel Ctrl+Z / Cmd+Z pour l'annulation immédiate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undoLastAction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoLastAction]);

  return (
    <>
      {/* Car Mode Fullscreen Overlay */}
      {carModeActive && <CarModeView />}

      {/* Structure de Navigation Principale avec Mesh Glow & Colonnes Dépolies */}
      <NavigationLayout>
        {activeView === 'home' && <HomeView />}
        {activeView === 'playlist' && <PlaylistView />}
        {activeView === 'artist' && <ArtistView />}
        {activeView === 'album' && <AlbumView />}
        {activeView === 'search' && <SearchView />}
        {activeView === 'library' && <LibraryView />}
        {activeView === 'settings' && <SettingsView />}
        {activeView === 'lyrics' && <LyricsPanel />}
        {activeView === 'queue' && <QueueView />}
      </NavigationLayout>

      {/* Fenêtres modales, Tiroirs & Overlays */}
      <LyricsOverlay />
      <ExpandedPlayer />
      <EqualizerModal />
      <AddToPlaylistModal />
      <SettingsModal />
      <SpootConnectModal />
      <ProfileEditModal />
      <ListeningHistoryDrawer />
      <HomeCustomizerModal />

      {/* Snackbar d'annulation (Undo Notification) avec auto-dismiss et fermeture rapide */}
      {undoNotification && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#181818] border border-cyan-400/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <span className="text-xs font-bold text-white">{undoNotification.message}</span>
          <button
            onClick={undoNotification.undoAction}
            className="px-3 py-1 rounded-xl bg-cyan-400 text-black text-xs font-extrabold flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Annuler</span>
          </button>
          <button
            onClick={() => useSpootStore.setState({ undoNotification: null })}
            className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title="Fermer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
};

export default App;
