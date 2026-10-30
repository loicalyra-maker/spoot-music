// Spoot Music — Right Sidebar: "En cours d'écoute" (Now Playing View)
// Reproduction fidèle 100% de la colonne droite de Spotify Premium (Screenshots 1 & 2)

import React from 'react';
import { Play, Plus, Check, Mic2, ExternalLink, X, Heart, MoreHorizontal } from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { useThemeStore } from '../../store/useThemeStore';

export const NowPlayingSidebar: React.FC = () => {
  const {
    currentTrack, playbackStatus, positionMs,
    toggleFavorite, setAddToPlaylistModalTrack, setLyricsOpen,
    openArtist, setActiveView, toggleNowPlayingOpen
  } = useSpootStore();

  const { themeMode } = useThemeStore();
  const isLiquidGlass = themeMode === 'liquid-glass';

  const isPlaying = playbackStatus === 'Playing';

  if (!currentTrack) {
    return (
      <aside className={`transition-all duration-300 ${
        isLiquidGlass
          ? 'w-80 h-full bg-white/[0.08] backdrop-blur-2xl rounded-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] m-3 ml-0'
          : 'w-80 h-full bg-[#121212] rounded-lg m-2 ml-0'
      } p-4 flex flex-col justify-center items-center text-center text-[#b3b3b3] select-none`}>
        <p className="text-sm font-semibold">Aucun titre en cours d'écoute</p>
        <p className="text-xs text-[#727272] mt-1">Sélectionnez un titre pour lancer la lecture</p>
      </aside>
    );
  }

  // Trouve la ligne de paroles active en fonction du temps actuel
  const lyrics = currentTrack.lyrics || [];
  const currentLyricIndex = lyrics.findIndex((line, idx) => {
    const nextLine = lyrics[idx + 1];
    if (nextLine) {
      return positionMs >= line.timeMs && positionMs < nextLine.timeMs;
    }
    return positionMs >= line.timeMs;
  });

  const activeIndex = currentLyricIndex >= 0 ? currentLyricIndex : 0;
  const activeLyric = lyrics[activeIndex]?.text || "Hein-hein, hein-hein, hein-hein, hein-hein";
  const nextLyric = lyrics[activeIndex + 1]?.text || "SDM, cent moins Ocho (I love...";

  return (
    <aside className={`transition-all duration-300 ${
      isLiquidGlass
        ? 'w-[340px] xl:w-[380px] h-full bg-white/[0.08] backdrop-blur-2xl rounded-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] m-3 ml-0'
        : 'w-[340px] xl:w-[380px] h-full bg-[#121212] rounded-lg m-2 ml-0 border border-[#1f1f1f]'
    } flex flex-col overflow-hidden select-none text-white`}>
      {/* Header avec nom de l'artiste */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#181818]">
        <h2 
          onClick={() => openArtist(currentTrack.artistId)}
          className="text-base font-bold text-white hover:underline cursor-pointer truncate"
        >
          {currentTrack.artistName}
        </h2>
        <div className="flex items-center gap-2 text-[#b3b3b3]">
          <button 
            onClick={() => setActiveView('lyrics')}
            className="p-1.5 hover:text-white rounded-full hover:bg-[#282828] transition-colors"
            title="Ouvrir les paroles plein écran"
          >
            <Mic2 className="w-4 h-4" />
          </button>
          <button 
            onClick={toggleNowPlayingOpen}
            className="p-1.5 hover:text-white rounded-full hover:bg-[#282828] transition-colors"
            title="Fermer le volet En cours d'écoute"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conteneur défilable pour la vidéo/canvas et les paroles */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 custom-scrollbar">
        {/* Grand Canvas Visuel / Pochette avec bouton "Passer à la vidéo" */}
        <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-2xl group bg-[#181818]">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Bouton "Passer à la vidéo" en bas à gauche du visuel */}
          <button
            onClick={() => setLyricsOpen(true)}
            className="absolute bottom-4 left-4 bg-black/60 hover:bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-white border border-white/20 transition-all hover:scale-105"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Passer à la vidéo</span>
          </button>
        </div>

        {/* Détails du morceau */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-white truncate hover:underline cursor-pointer" title={currentTrack.title}>
              {currentTrack.title}
            </h1>
            <p 
              onClick={() => openArtist(currentTrack.artistId)}
              className="text-sm font-semibold text-[#b3b3b3] hover:underline hover:text-white cursor-pointer mt-0.5 truncate"
            >
              {currentTrack.artistName}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className="w-8 h-8 rounded-full border border-[#727272] hover:border-white flex items-center justify-center text-[#b3b3b3] hover:text-white transition-all hover:scale-110"
              title="Ajouter aux favoris ou playlist"
            >
              {currentTrack.isFavorite ? (
                <Check className="w-4 h-4 text-spoot-neon" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Carte "Aperçu des paroles" (Screenshot 1 & 2) */}
        <div 
          onClick={() => setActiveView('lyrics')}
          className="bg-gradient-to-b from-[#1c2e3d] to-[#13222e] hover:from-[#21374a] hover:to-[#172a39] p-4 rounded-2xl cursor-pointer transition-all border border-[#2b4458]/40 shadow-lg group relative"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Aperçu des paroles</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#b3b3b3] group-hover:text-white transition-colors" />
          </div>

          <div className="space-y-1.5 font-bold leading-snug">
            <p className="text-lg text-white group-hover:text-spoot-neon transition-colors line-clamp-2">
              {activeLyric}
            </p>
            <p className="text-sm text-[#8fa8be] line-clamp-1">
              {nextLyric}
            </p>
          </div>
        </div>

        {/* Fiche Artiste Compacte */}
        <div 
          onClick={() => openArtist(currentTrack.artistId)}
          className="bg-[#181818] p-4 rounded-2xl hover:bg-[#202020] cursor-pointer transition-colors border border-[#242424]"
        >
          <div className="flex items-center gap-3">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.artistName}
              className="w-14 h-14 rounded-full object-cover shadow-md"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold uppercase text-[#727272]">Artiste</span>
              <h3 className="text-sm font-bold text-white truncate">{currentTrack.artistName}</h3>
              <p className="text-xs text-[#b3b3b3] mt-0.5">3 421 890 auditeurs par mois</p>
            </div>
            <button className="px-3.5 py-1 rounded-full border border-[#727272] text-xs font-bold text-white hover:border-white hover:scale-105 transition-all">
              Suivre
            </button>
          </div>
        </div>

        {/* Crédits */}
        <div className="bg-[#181818] p-4 rounded-2xl text-xs text-[#b3b3b3] space-y-2 border border-[#242424]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm">Crédits</span>
            <button className="text-[11px] font-bold text-white hover:underline">Tout afficher</button>
          </div>
          <div>
            <p className="text-white font-semibold">{currentTrack.artistName}</p>
            <p className="text-[11px] text-[#727272]">Artiste principal, Paroles</p>
          </div>
          <div>
            <p className="text-white font-semibold">Spoot Hi-Res Master</p>
            <p className="text-[11px] text-[#727272]">Production & Mixage Studio</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
