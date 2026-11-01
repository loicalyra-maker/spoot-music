// Spoot Music — Spotify / Apple Premium Faithful Player Component (MiniPlayer.tsx)
// Translucent Sea Liquid Glass, Specular Edge Refraction, Crisp White Play Button & Dynamic Floating Island Size
import React, { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Maximize2, Mic2, Heart,
  Laptop2, ListMusic
} from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { useThemeStore } from '../../store/useThemeStore';
import { audioCore } from '../../audio/WebAudioEngine';
import { DevicePickerMenu } from './DevicePickerMenu';

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack, playbackStatus, togglePlayPause, nextTrack, previousTrack,
    positionMs, durationMs, seek, volume, setVolume, toggleMute, shuffleMode, setShuffleMode,
    repeatMode, setRepeatMode, toggleFavorite,
    setExpandedPlayerOpen, updatePosition, openArtist, activeView, setActiveView,
    isDevicePickerOpen, setDevicePickerOpen
  } = useSpootStore();

  const { themeMode, playerMode, cornerRadius } = useThemeStore();
  const isLiquidGlass = themeMode === 'liquid-glass';
  const isPlaying = playbackStatus === 'Playing';

  const [isDragging, setIsDragging] = useState(false);
  const [dragPositionMs, setDragPositionMs] = useState(0);
  const progressIntervalRef = useRef<number | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const calculateSeekPosition = (clientX: number) => {
    if (!sliderRef.current || durationMs <= 0) return 0;
    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    return ratio * durationMs;
  };

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const targetMs = calculateSeekPosition(e.clientX);
    seek(targetMs);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const targetMs = calculateSeekPosition(e.clientX);
    setDragPositionMs(targetMs);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const pos = calculateSeekPosition(moveEvent.clientX);
      setDragPositionMs(pos);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const finalPos = calculateSeekPosition(upEvent.clientX);
      seek(finalPos);
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Synchronisation temporelle optimisée ProMotion 120Hz avec le moteur audio réel
  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = window.setInterval(() => {
        if (!isDragging) {
          const actualPos = audioCore.getPositionMs();
          updatePosition(actualPos);
        }
      }, 250);
    } else {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [playbackStatus, isPlaying, isDragging]);

  const formatTime = (ms: number) => {
    const totalSecs = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentDisplayTime = isDragging ? dragPositionMs : positionMs;
  const progressPercent = durationMs > 0 ? Math.min(100, Math.max(0, (currentDisplayTime / durationMs) * 100)) : 0;

  const cycleShuffleMode = () => {
    if (shuffleMode === 'Off') setShuffleMode('TrueRandom');
    else setShuffleMode('Off');
  };

  const cycleRepeatMode = () => {
    if (repeatMode === 'Off') setRepeatMode('RepeatAll');
    else if (repeatMode === 'RepeatAll') setRepeatMode('RepeatOne');
    else setRepeatMode('Off');
  };

  if (!currentTrack) {
    return (
      <footer
        className={`transition-all duration-300 z-40 select-none text-white/50 text-xs flex items-center justify-center ${
          playerMode === 'floating-pill'
            ? `mx-auto max-w-5xl ${cornerRadius} h-16 shadow-2xl liquid-glass-floating-player`
            : `h-20 w-full bg-[#0a1820]/90 backdrop-blur-2xl border-t border-white/[0.1]`
        }`}
      >
        <span>Prêt pour l'écoute Hi-Res</span>
      </footer>
    );
  }

  const isFloating = playerMode === 'floating-pill';

  return (
    <footer
      className={`transition-all duration-500 z-40 select-none text-white relative ${
        isFloating
          ? `mx-auto max-w-5xl ${cornerRadius} h-[76px] px-6 flex items-center justify-between shadow-2xl liquid-glass-floating-player border border-white/[0.22]`
          : `h-20 px-6 flex items-center justify-between w-full border-t border-white/[0.12] bg-[#071922]/90 backdrop-blur-2xl`
      }`}
    >
      {/* 1. Zone Gauche : Pochette, Titre, Artiste et Favoris */}
      <div className="flex items-center gap-3.5 w-[30%] min-w-[180px] max-w-[340px]">
        {/* Pochette Carrée avec Coins Adoucis (Taille stricte 56x56 px pour parer tout débordement) */}
        <div
          onClick={() => setExpandedPlayerOpen(true)}
          className="relative group w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-2xl overflow-hidden cursor-pointer shrink-0 shadow-lg bg-white/10 border border-white/20 transition-transform hover:scale-105"
        >
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>

        {/* Titre et Artiste */}
        <div className="min-w-0 flex-1">
          <div
            onClick={() => setExpandedPlayerOpen(true)}
            className="font-bold text-sm text-white hover:underline cursor-pointer truncate leading-tight tracking-tight glass-readable-text"
            title={currentTrack.title}
          >
            {currentTrack.title}
          </div>
          <div
            onClick={() => currentTrack.artistId && openArtist(currentTrack.artistId)}
            className="text-xs text-cyan-200/80 hover:text-white hover:underline cursor-pointer truncate mt-0.5"
            title={currentTrack.artistName}
          >
            {currentTrack.artistName}
          </div>
        </div>

        {/* Bouton Like / Favori */}
        <button
          onClick={() => toggleFavorite(currentTrack.id)}
          className={`p-1.5 rounded-full transition-all cursor-pointer ${
            currentTrack.isFavorite
              ? 'text-cyan-400 scale-110'
              : 'text-white/60 hover:text-white hover:scale-105'
          }`}
          title={currentTrack.isFavorite ? 'Retirer des titres likés' : 'Ajouter aux titres likés'}
        >
          <Heart className={`w-4 h-4 ${currentTrack.isFavorite ? 'fill-current' : ''}`} style={currentTrack.isFavorite ? { color: 'var(--accent-color, #00e676)' } : undefined} />
        </button>
      </div>

      {/* 2. Zone Centrale : Contrôles de lecture & Barre de défilement temporelle */}
      <div className="flex flex-col items-center max-w-[50%] w-full px-4">
        {/* Boutons de contrôle circulaires */}
        <div className="flex items-center gap-4 mb-1.5">
          {/* Lecture Aléatoire */}
          <button
            onClick={cycleShuffleMode}
            className={`p-1.5 transition-colors cursor-pointer relative ${
              shuffleMode !== 'Off' ? '' : 'text-white/60 hover:text-white'
            }`}
            title="Lecture aléatoire"
          >
            <Shuffle className="w-4 h-4" />
            {shuffleMode !== 'Off' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
            )}
          </button>

          {/* Précédent */}
          <button
            onClick={previousTrack}
            className="text-white/70 hover:text-white transition-all cursor-pointer active:scale-95 hover:scale-105"
            title="Précédent"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Bouton Play / Pause : Cercle Blanc Plein Apple-grade */}
          <button
            onClick={togglePlayPause}
            className="w-10 h-10 rounded-full liquid-glass-play-btn flex items-center justify-center cursor-pointer shadow-xl active:scale-95 transition-transform"
            title={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black text-black" />
            ) : (
              <Play className="w-4 h-4 fill-black text-black ml-0.5" />
            )}
          </button>

          {/* Suivant */}
          <button
            onClick={nextTrack}
            className="text-white/70 hover:text-white transition-all cursor-pointer active:scale-95 hover:scale-105"
            title="Suivant"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Répéter */}
          <button
            onClick={cycleRepeatMode}
            className={`p-1.5 transition-colors cursor-pointer relative ${
              repeatMode !== 'Off' ? 'text-cyan-400' : 'text-white/60 hover:text-white'
            }`}
            title="Répéter"
          >
            {repeatMode === 'RepeatOne' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            {repeatMode !== 'Off' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Barre de Progression Haute Fidélité Liquid Glass (Slider iOS 26) */}
        <div className="flex items-center gap-3 w-full max-w-lg text-[11px] font-mono text-white/70 select-none">
          <span className="w-9 text-right font-medium">{formatTime(currentDisplayTime)}</span>
          <div
            ref={sliderRef}
            className="slider-container flex-1"
            onClick={handleSliderClick}
            onMouseDown={handleMouseDown}
          >
            {/* Barre de progression avec dégradé liquide dynamique */}
            <div
              className="slider-progress"
              style={{ width: `${progressPercent}%` }}
            />

            {/* Curseur Verre Liquide (Liquid Glass Thumb) avec réfraction et reflet */}
            <div
              className={`slider-thumb-glass ${isDragging ? 'active' : ''}`}
              style={{ left: `${progressPercent}%` }}
            >
              <div className="slider-thumb-glass-filter" />
              <div className="slider-thumb-glass-overlay" />
              <div className="slider-thumb-glass-specular" />
            </div>
          </div>
          <span className="w-9 text-left font-medium">{formatTime(durationMs)}</span>
        </div>
      </div>

      {/* 3. Zone Droite : Paroles, File d'attente, Volume & Plein écran */}
      <div className="flex items-center justify-end gap-2.5 w-[30%] min-w-[180px] max-w-[340px] text-white/70">
        {/* Paroles */}
        <button
          onClick={() => setActiveView(activeView === 'lyrics' ? 'home' : 'lyrics')}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            activeView === 'lyrics'
              ? 'bg-white text-black shadow-md'
              : 'hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Paroles synchronisées"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* File d'attente */}
        <button
          onClick={() => setActiveView(activeView === 'queue' ? 'home' : 'queue')}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            activeView === 'queue'
              ? 'bg-white text-black shadow-md'
              : 'hover:text-white hover:bg-white/[0.08]'
          }`}
          title="File d'attente"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Menu Appareil de sortie */}
        <div className="relative">
          <button
            onClick={() => setDevicePickerOpen(!isDevicePickerOpen)}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isDevicePickerOpen
                ? 'bg-white text-black shadow-md'
                : 'hover:text-white hover:bg-white/[0.08]'
            }`}
            title="Appareil d'écoute et qualité sonore"
          >
            <Laptop2 className="w-4 h-4" />
          </button>
          <DevicePickerMenu />
        </div>

        {/* Volume Scrubbable */}
        <div className="flex items-center gap-1.5 group">
          <button
            onClick={toggleMute}
            className="hover:text-white transition-colors p-1"
            title={volume === 0 ? 'Activer le son' : 'Couper le son'}
          >
            {volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-white/20 accent-white hover:accent-[var(--accent-color,#00e676)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md transition-all"
          />
        </div>

        {/* Plein écran */}
        <button
          onClick={() => setExpandedPlayerOpen(true)}
          className="p-2 hover:text-white hover:bg-white/[0.08] rounded-xl transition-all cursor-pointer"
          title="Vue En cours d'écoute plein écran"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};

export default MiniPlayer;
