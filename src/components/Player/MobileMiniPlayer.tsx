// Spoot Music — Mobile Native iPhone Mini Player Component (MobileMiniPlayer.tsx)
// Faithful to Spotify iOS 26: Floating Glass Island Docked Above Bottom Nav Bar
import React from 'react';
import { Play, Pause, Heart, Speaker } from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';

export const MobileMiniPlayer: React.FC = () => {
  const {
    currentTrack,
    playbackStatus,
    togglePlayPause,
    positionMs,
    durationMs,
    setExpandedPlayerOpen,
    setDevicePickerOpen,
  } = useSpootStore();

  if (!currentTrack) return null;

  const isPlaying = playbackStatus === 'Playing';
  const progressPercent = durationMs > 0 ? Math.min(100, Math.max(0, (positionMs / durationMs) * 100)) : 0;

  return (
    <div
      onClick={() => setExpandedPlayerOpen(true)}
      style={{
        bottom: 'calc(3.8rem + max(env(safe-area-inset-bottom, 12px), 12px))',
      }}
      className="fixed left-2 right-2 z-40 rounded-xl overflow-hidden cursor-pointer select-none transition-all active:scale-[0.99] border border-white/15 bg-[#0a1824]/90 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center justify-between px-2.5 py-1.5 gap-2.5">
        {/* 1. Pochette Carrée HD */}
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/10 shadow-sm border border-white/10">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 2. Titre & Artiste en défilement textuel */}
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-xs font-bold text-white truncate leading-tight">
            {currentTrack.title}
          </p>
          <p className="text-[11px] text-cyan-200/70 truncate mt-0.5">
            {currentTrack.artistName}
          </p>
        </div>

        {/* 3. Boutons d'Action : Appareils, Favori, Play/Pause */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setDevicePickerOpen(true)}
            className="p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Spoot Connect • Appareils"
          >
            <Speaker className="w-4 h-4 text-cyan-300" />
          </button>

          <button
            onClick={() => {
              // Toggle favori
            }}
            className="p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Ajouter aux favoris"
          >
            <Heart className={`w-4 h-4 ${currentTrack.isFavorite ? 'fill-cyan-400 text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={togglePlayPause}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center cursor-pointer shadow-md active:scale-95 transition-transform ml-1"
            title={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black text-black" />
            ) : (
              <Play className="w-4 h-4 fill-black text-black ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* 4. Barre de Progression Inférieure Sleek 2.5px */}
      <div className="w-full h-[2.5px] bg-white/15 relative">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-sky-400 rounded-full transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default MobileMiniPlayer;
