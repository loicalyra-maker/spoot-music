// Spoot Music — Car Mode View (Driver Safe & Large Touch Targets)
import React from 'react';
import { Play, Pause, SkipBack, SkipForward, X, Mic, Volume2 } from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';

export const CarModeView: React.FC = () => {
  const {
    currentTrack, playbackStatus, togglePlayPause, nextTrack, previousTrack,
    setCarModeActive
  } = useSpootStore();

  if (!currentTrack) return null;

  return (
    <div className="fixed inset-0 bg-[#000000] z-50 flex flex-col justify-between p-6 md:p-12 select-none">
      {/* Header with Exit */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-mono text-spoot-neon font-bold tracking-wider">
          🚗 MODE VOITURE ACTIF (Bluetooth Véhicule Détecté)
        </span>

        <button
          onClick={() => setCarModeActive(false)}
          className="p-4 rounded-2xl bg-[#181818] text-white hover:bg-[#282828] text-sm font-bold flex items-center gap-2"
        >
          <X className="w-6 h-6" />
          <span>Quitter</span>
        </button>
      </div>

      {/* Main Track Display (High Contrast) */}
      <div className="flex flex-col items-center text-center space-y-4 my-auto">
        <div className="w-56 h-56 md:w-72 md:h-72 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
          <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
        </div>

        <div>
          <h1 className="text-3xl md:text-5xl font-black text-white">{currentTrack.title}</h1>
          <p className="text-xl md:text-2xl font-bold text-spoot-neon mt-2">{currentTrack.artistName}</p>
        </div>
      </div>

      {/* Giant Buttons for Driving Safety */}
      <div className="flex items-center justify-center gap-8 md:gap-16 pb-8">
        <button
          onClick={previousTrack}
          className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-[#1a1a1a] active:bg-[#2a2a2a] flex items-center justify-center text-white shadow-xl"
        >
          <SkipBack className="w-10 h-10 fill-current" />
        </button>

        <button
          onClick={togglePlayPause}
          className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-spoot-neon active:scale-95 text-black flex items-center justify-center shadow-[0_0_30px_rgba(0,230,118,0.5)] transition-transform"
        >
          {playbackStatus === 'Playing' ? (
            <Pause className="w-14 h-14 fill-black" />
          ) : (
            <Play className="w-14 h-14 fill-black translate-x-1" />
          )}
        </button>

        <button
          onClick={nextTrack}
          className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-[#1a1a1a] active:bg-[#2a2a2a] flex items-center justify-center text-white shadow-xl"
        >
          <SkipForward className="w-10 h-10 fill-current" />
        </button>
      </div>
    </div>
  );
};
