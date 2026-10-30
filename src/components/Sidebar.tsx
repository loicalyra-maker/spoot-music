// Spoot Music — Apple iOS 26 / macOS Tahoe Faithful Liquid Glass Sidebar (Sidebar.tsx)
// Faithful to reference image: Home active pill, Liked Songs card, compact-icons mode & sidebar mini-player
import React, { useState, useRef, useEffect } from 'react';
import {
  Home, Search, Library, Plus, Heart, Music, ListPlus, FolderPlus,
  Sliders, Sparkles, Folder, Settings, User, Play, Pause, SkipForward,
  ChevronRight, Volume2, Mic2
} from 'lucide-react';
import { useSpootStore } from '../store/useSpootStore';
import { useThemeStore } from '../store/useThemeStore';
import { FolderItem } from './Sidebar/FolderItem';
import { SpootLogo } from './Branding/SpootLogo';

export const Sidebar: React.FC = () => {
  const {
    playlists,
    folders,
    activePlaylistId,
    openPlaylist,
    createPlaylist,
    createFolder,
    activeView,
    setActiveView,
    userProfile,
    setProfileModalOpen,
    currentTrack,
    playbackStatus,
    togglePlayPause,
    nextTrack
  } = useSpootStore();

  const {
    logoPosition,
    showLogo,
    profilePosition,
    openCustomizer,
    themeMode,
    cornerRadius,
    sidebarMode,
    playerMode
  } = useThemeStore();

  const isLiquidGlass = themeMode === 'liquid-glass';
  const isCompact = sidebarMode === 'compact-icons';
  const isPlaying = playbackStatus === 'Playing';

  const [searchFilter, setSearchFilter] = useState('');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setCreateMenuOpen(false);
      }
    };
    if (createMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [createMenuOpen]);

  // Si sidebarMode est "hidden", ne pas afficher
  if (sidebarMode === 'hidden') return null;

  // Filtrage des playlists
  const folderPlaylistIds = new Set(folders.flatMap((f) => f.playlistIds));
  const rootPlaylists = playlists.filter(
    (pl) => !folderPlaylistIds.has(pl.id) && !pl.parentFolderId
  );
  const displayedPlaylists = searchFilter.trim()
    ? rootPlaylists.filter((p) => p.title.toLowerCase().includes(searchFilter.toLowerCase()))
    : rootPlaylists;

  return (
    <aside
      className={`transition-all duration-300 ${
        isCompact ? 'w-20' : 'w-72 xl:w-80'
      } h-full flex flex-col overflow-hidden select-none text-white shrink-0 min-h-0 ${
        isLiquidGlass
          ? `liquid-glass-surface ${cornerRadius} m-3 mr-0`
          : `bg-[#121212] ${cornerRadius} m-2 mr-0 border border-[#1f1f1f]`
      }`}
    >
      {/* 1. Header Logo (si top-left) */}
      {showLogo && logoPosition === 'top-left' && (
        <div className={`p-4 flex items-center ${isCompact ? 'justify-center' : 'justify-between'} border-b border-white/[0.08]`}>
          <div
            onClick={() => setActiveView('home')}
            className="cursor-pointer group flex items-center gap-2.5"
            title="Spoot Music Accueil"
          >
            <SpootLogo variant="liquid-glass" size={34} showText={!isCompact} />
          </div>
        </div>
      )}

      {/* Profil Utilisateur (Si profilePosition === 'left' et non compact) */}
      {profilePosition === 'left' && !isCompact && (
        <div
          onClick={() => setProfileModalOpen(true)}
          className="mx-3 my-2.5 p-2 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center gap-3 cursor-pointer group transition-all shadow-sm"
          title={`Compte Spoot • ${userProfile.name}`}
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/20 shrink-0 group-hover:scale-105 transition-transform">
            <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{userProfile.name}</p>
            <p className="text-[10px] text-cyan-300 truncate">Profil Spoot</p>
          </div>
        </div>
      )}

      {/* 2. Navigation Haute Fidèle à la maquette de référence */}
      <div className="p-3 space-y-1 border-b border-white/[0.06]">
        {/* Bouton Accueil — Pastille active mise en valeur comme dans la capture */}
        <button
          onClick={() => setActiveView('home')}
          className={`w-full flex items-center ${isCompact ? 'justify-center' : 'gap-3.5 px-4'} py-2.5 rounded-2xl cursor-pointer transition-all duration-200 ${
            activeView === 'home'
              ? 'liquid-glass-active-pill text-white font-black'
              : 'text-white/70 hover:text-white hover:bg-white/[0.06] font-bold text-sm'
          }`}
          title="Accueil"
        >
          <Home className="w-5 h-5 text-cyan-300" />
          {!isCompact && <span>Home</span>}
        </button>

        {/* Bouton Rechercher */}
        <button
          onClick={() => setActiveView('search')}
          className={`w-full flex items-center ${isCompact ? 'justify-center' : 'gap-3.5 px-4'} py-2.5 rounded-2xl cursor-pointer transition-all duration-200 ${
            activeView === 'search'
              ? 'liquid-glass-active-pill text-white font-black'
              : 'text-white/70 hover:text-white hover:bg-white/[0.06] font-bold text-sm'
          }`}
          title="Rechercher"
        >
          <Search className="w-5 h-5 text-white/70" />
          {!isCompact && <span>Search</span>}
        </button>

        {/* Bouton Bibliothèque */}
        <button
          onClick={() => setActiveView('library')}
          className={`w-full flex items-center ${isCompact ? 'justify-center' : 'gap-3.5 px-4'} py-2.5 rounded-2xl cursor-pointer transition-all duration-200 ${
            activeView === 'library'
              ? 'liquid-glass-active-pill text-white font-black'
              : 'text-white/70 hover:text-white hover:bg-white/[0.06] font-bold text-sm'
          }`}
          title="Bibliothèque"
        >
          <Library className="w-5 h-5 text-white/70" />
          {!isCompact && <span>Your Library</span>}
        </button>
      </div>

      {/* 3. Section Playlists avec bouton "+" */}
      <div className={`px-4 py-3 flex items-center ${isCompact ? 'justify-center' : 'justify-between'}`}>
        {!isCompact && (
          <span className="text-xs font-black uppercase tracking-wider text-white/60">
            Playlists
          </span>
        )}

        <div className="relative" ref={createMenuRef}>
          <button
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer active:scale-95 border border-white/10 shadow-sm"
            title="Créer une nouvelle playlist ou un dossier"
          >
            <Plus className="w-4 h-4" />
          </button>

          {createMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-950/95 border border-white/15 rounded-2xl shadow-2xl py-1.5 z-50 text-xs font-semibold text-white backdrop-blur-2xl animate-in fade-in duration-100">
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  const num = playlists.length + 1;
                  createPlaylist(`Ma playlist n° ${num}`);
                }}
                className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ListPlus className="w-4 h-4 text-cyan-300" />
                <span>Nouvelle playlist</span>
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  const num = folders.length + 1;
                  createFolder(`Nouveau dossier ${num}`);
                }}
                className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-emerald-300" />
                <span>Nouveau dossier</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Filtre de recherche dans les playlists (si non compact) */}
      {!isCompact && (
        <div className="px-4 pb-2">
          <div className="flex items-center bg-white/[0.05] hover:bg-white/[0.08] focus-within:bg-white/[0.1] rounded-xl px-3 py-1.5 transition-all border border-white/[0.06]">
            <Search className="w-3.5 h-3.5 text-white/40 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Filtrer..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-white/40 w-full focus:outline-none font-medium"
            />
          </div>
        </div>
      )}

      {/* 5. Liste Déroulante des Playlists */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1.5 custom-scrollbar min-h-0">
        {/* Dossiers */}
        {!isCompact && folders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            playlists={playlists}
            activePlaylistId={activePlaylistId}
            onOpenPlaylist={openPlaylist}
          />
        ))}

        {/* Playlists à la racine */}
        {displayedPlaylists.map((pl) => {
          const isSelected = activePlaylistId === pl.id || (activePlaylistId === 'playlist-liked' && (pl.id === 'pl-fav' || pl.title.toLowerCase() === 'titres likés'));
          const isLiked = pl.id === 'pl-fav' || pl.id === 'playlist-liked' || pl.title.toLowerCase() === 'titres likés';

          return (
            <div
              key={pl.id}
              onClick={() => openPlaylist(pl.id)}
              className={`flex items-center ${isCompact ? 'justify-center p-2' : 'gap-3 p-2 px-3'} rounded-2xl cursor-pointer transition-all duration-200 group ${
                isSelected
                  ? 'bg-white/15 text-white border border-white/20 shadow-md'
                  : 'hover:bg-white/[0.07] text-white/80 hover:text-white'
              }`}
              title={pl.title}
            >
              <div
                className={`w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center shadow-md border border-white/10 group-hover:scale-105 transition-transform ${
                  isLiked
                    ? 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500'
                    : 'bg-white/10'
                }`}
              >
                {isLiked ? (
                  <Heart className="w-5 h-5 fill-white text-white drop-shadow-md" />
                ) : pl.coverUrl ? (
                  <img src={pl.coverUrl} alt={pl.title} className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-5 h-5 text-white/60" />
                )}
              </div>

              {!isCompact && (
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-bold truncate leading-tight ${
                      isSelected ? 'text-cyan-300' : 'text-white'
                    }`}
                  >
                    {pl.title}
                  </p>
                  <p className="text-[11px] text-white/50 truncate mt-0.5 font-medium">
                    {isLiked ? `Playlist • ${pl.tracks.length} titres` : `${pl.tracks.length} morceaux`}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 6. Mini-Lecteur Intégré dans la Sidebar (Option "sidebar-mini" pour gain de place maximal) */}
      {playerMode === 'sidebar-mini' && currentTrack && (
        <div className="p-3 border-t border-white/[0.08] bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0 border border-white/15">
              <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
            </div>
            {!isCompact && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
                <p className="text-[10px] text-cyan-300 truncate">{currentTrack.artistName}</p>
              </div>
            )}
            <button
              onClick={togglePlayPause}
              className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-md shrink-0"
              title={isPlaying ? "Pause" : "Lecture"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black ml-0.5" />}
            </button>
          </div>
        </div>
      )}

      {/* 7. Pied de page épuré : Raccourci vers le Studio de personnalisation */}
      <div className="p-3 border-t border-white/[0.08]">
        <button
          onClick={openCustomizer}
          className={`w-full flex items-center ${isCompact ? 'justify-center p-2' : 'justify-between px-3.5 py-2.5'} rounded-2xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.10] text-white/80 hover:text-white text-xs font-bold transition-all cursor-pointer group shadow-sm active:scale-95`}
          title="Ouvrir le studio de personnalisation de l'espace"
        >
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-cyan-300 group-hover:rotate-45 transition-transform" />
            {!isCompact && <span>Personnaliser l'espace</span>}
          </div>
          {!isCompact && (
            <span className="text-[10px] text-cyan-300 font-mono bg-white/[0.08] px-2 py-0.5 rounded-md border border-white/[0.08]">
              ⌘P
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
