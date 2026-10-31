// Spoot Music — Immersive Spotify/Apple Now Playing Canvas View (ExpandedPlayer.tsx)
// Faithful reproduction of reference screenshot (media_1793404020949_957af945.png)
// Supports edge-to-edge Artwork / Video Canvas, Sleek Timeline with negative remaining time,
// Crisp White circular Play/Pause button, Green Checkmark library badge, and Bottom Crédits Drawer.

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown, MoreHorizontal, Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Check, Plus, Laptop2, Share2, ListMusic,
  Sliders, Mic2, ShieldAlert, Sparkles, X, Heart, Maximize2
} from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { deezerService } from '../../services/deezer_service';
import { LyricLine } from '../../types';

export const ExpandedPlayer: React.FC = () => {
  const {
    currentTrack,
    expandedPlayerOpen,
    setExpandedPlayerOpen,
    playbackStatus,
    togglePlayPause,
    nextTrack,
    previousTrack,
    positionMs,
    durationMs,
    seek,
    shuffleMode,
    setShuffleMode,
    repeatMode,
    setRepeatMode,
    toggleFavorite,
    setEqualizerModalOpen,
    setLyricsOpen,
    setDevicePickerOpen,
    openArtist,
    blacklistEntity
  } = useSpootStore();

  const [imageError, setImageError] = useState(false);
  const [creditsExpanded, setCreditsExpanded] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [dragPositionMs, setDragPositionMs] = useState(0);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const lyricsPreviewContainerRef = useRef<HTMLDivElement | null>(null);
  const activePreviewLineRef = useRef<HTMLDivElement | null>(null);

  const lyrics: LyricLine[] = currentTrack?.lyrics || [];
  const activeLyricIndex = lyrics.findIndex((line, idx) => {
    const nextLine = lyrics[idx + 1];
    if (nextLine) {
      return (positionMs || 0) >= line.timeMs && (positionMs || 0) < nextLine.timeMs;
    }
    return (positionMs || 0) >= line.timeMs;
  });
  const currentLyricIndex = activeLyricIndex >= 0 ? activeLyricIndex : 0;

  useEffect(() => {
    if (activePreviewLineRef.current && lyricsPreviewContainerRef.current) {
      activePreviewLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentLyricIndex]);

  useEffect(() => {
    if (currentTrack && (!currentTrack.lyrics || currentTrack.lyrics.length === 0)) {
      deezerService.getSyncedLyrics(currentTrack.artistName, currentTrack.title, durationMs || currentTrack.durationMs).then((res) => {
        if (res.lyrics && res.lyrics.length > 0) {
          currentTrack.lyrics = res.lyrics;
        }
      });
    }
  }, [currentTrack?.id]);

  if (!expandedPlayerOpen || !currentTrack) return null;

  const isPlaying = playbackStatus === 'Playing';
  const effectiveDuration = durationMs > 0 ? durationMs : (currentTrack.durationMs || 180000);
  const currentPos = isDragging ? dragPositionMs : Math.min(positionMs, effectiveDuration);
  const progressRatio = effectiveDuration > 0 ? Math.min(1, Math.max(0, currentPos / effectiveDuration)) : 0;
  const remainingMs = Math.max(0, effectiveDuration - currentPos);

  const formatTime = (ms: number) => {
    if (isNaN(ms) || ms < 0) return '0:00';
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeekFromClientX = (clientX: number) => {
    if (!timelineRef.current || effectiveDuration <= 0) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * effectiveDuration;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const targetMs = handleSeekFromClientX(e.clientX);
    seek(targetMs);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragPositionMs(handleSeekFromClientX(touch.clientX));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    setDragPositionMs(handleSeekFromClientX(touch.clientX));
  };

  const handleTouchEnd = () => {
    seek(dragPositionMs);
    setIsDragging(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${currentTrack.title} — ${currentTrack.artistName}`,
        text: `Écoute ${currentTrack.title} sur Spoot Music`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/#track-${currentTrack.id}`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const fallbackCover = 'https://cdn-images.dzcdn.net/images/cover/c028acc15f911c6ca3ff821abbb64aa3/1000x1000-000000-80-0-0.jpg';
  const coverSrc = (!imageError && currentTrack.coverUrl) ? currentTrack.coverUrl : fallbackCover;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between pt-[max(env(safe-area-inset-top)+12px,52px)] pb-[max(env(safe-area-inset-bottom)+12px,32px)] px-6 sm:px-8 select-none overflow-y-auto no-scrollbar animate-in fade-in duration-200 bg-[#050608]"
      style={{
        background: `radial-gradient(circle at 50% 15%, ${currentTrack.palette?.primary || '#134e4a'}65 0%, #0b0f14 55%, #050608 100%)`,
      }}
    >
      {/* 1. TOP HEADER (Chevron Down, Artist Name, More Options) */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between py-1 relative z-10">
        <button
          onClick={() => setExpandedPlayerOpen(false)}
          className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-transform cursor-pointer"
          aria-label="Réduire le lecteur"
          title="Réduire"
        >
          <ChevronDown className="w-7 h-7 stroke-[2.2]" />
        </button>

        <button
          onClick={() => {
            setExpandedPlayerOpen(false);
            if (currentTrack.artistId) openArtist(currentTrack.artistId);
          }}
          className="text-xs sm:text-sm font-extrabold text-white tracking-widest uppercase hover:underline truncate max-w-[220px] text-center cursor-pointer"
        >
          {currentTrack.artistName}
        </button>

        <button
          onClick={() => setOptionsMenuOpen(!optionsMenuOpen)}
          className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-transform cursor-pointer"
          aria-label="Options"
          title="Plus d'options"
        >
          <MoreHorizontal className="w-6 h-6 stroke-[2.2]" />
        </button>
      </div>

      {/* Options Popup Menu */}
      {optionsMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#181818] border border-white/15 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="font-black text-white text-base truncate">{currentTrack.title}</p>
                <p className="text-xs text-white/60 truncate">{currentTrack.artistName}</p>
              </div>
              <button
                onClick={() => setOptionsMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setOptionsMenuOpen(false);
                  setLyricsOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-bold text-left transition-colors"
              >
                <Mic2 className="w-4 h-4 text-cyan-300" />
                <span>Afficher les paroles synchronisées</span>
              </button>

              <button
                onClick={() => {
                  setOptionsMenuOpen(false);
                  setEqualizerModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-bold text-left transition-colors"
              >
                <Sliders className="w-4 h-4 text-cyan-300" />
                <span>Égaliseur 10 bandes Hi-Res</span>
              </button>

              <button
                onClick={() => {
                  setOptionsMenuOpen(false);
                  handleShare();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-bold text-left transition-colors"
              >
                <Share2 className="w-4 h-4 text-cyan-300" />
                <span>Partager ce titre</span>
              </button>

              <button
                onClick={() => {
                  setOptionsMenuOpen(false);
                  blacklistEntity('artist', currentTrack.artistId, currentTrack.artistName);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold text-left transition-colors border border-red-500/20"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Ne plus diffuser cet artiste</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN ARTWORK / VIDEO CANVAS (Takes the central stage with rounded corners) */}
      <div className="w-full max-w-md mx-auto my-auto flex items-center justify-center py-2 sm:py-4">
        <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full max-h-[50vh] sm:max-h-[54vh] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.85)] border border-white/10 bg-[#0d1319] group">
          <img
            src={coverSrc}
            alt={currentTrack.title}
            loading="eager"
            decoding="async"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Subtile lueur spéculaire haute */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/60" />

          {/* Badge format Hi-Res en superposition subtile */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold text-cyan-300 flex items-center gap-1.5 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Hi-Res Lossless</span>
          </div>
        </div>
      </div>

      {/* 3. TRACK INFO & GREEN CHECKMARK (Directly below Artwork) */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between gap-4 pt-2">
        <div className="min-w-0 flex-1">
          <h1
            className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug truncate"
            title={currentTrack.title}
          >
            {currentTrack.title}
          </h1>
          <button
            onClick={() => {
              setExpandedPlayerOpen(false);
              if (currentTrack.artistId) openArtist(currentTrack.artistId);
            }}
            className="text-sm font-semibold text-white/70 hover:text-white truncate block text-left mt-0.5 cursor-pointer transition-colors"
          >
            {currentTrack.artistName}
          </button>
        </div>

        {/* Spotify Green Filled Checkmark Circle (Exact match with reference screenshot) */}
        <button
          onClick={() => toggleFavorite(currentTrack.id)}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-md active:scale-90 transition-transform cursor-pointer ${
            currentTrack.isFavorite
              ? 'bg-[#1ed760] text-black shadow-[0_0_15px_rgba(30,215,96,0.5)]'
              : 'border-2 border-white/40 text-white/60 hover:border-white hover:text-white'
          }`}
          title={currentTrack.isFavorite ? 'Enregistré dans vos favoris' : 'Ajouter à vos favoris'}
          aria-label={currentTrack.isFavorite ? 'Enregistré' : 'Ajouter'}
        >
          {currentTrack.isFavorite ? (
            <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3.2]" />
          ) : (
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          )}
        </button>
      </div>

      {/* 4. TIMELINE SCRUBBER (Thin bar with elapsed time & negative remaining time) */}
      <div className="w-full max-w-md mx-auto pt-3 space-y-1.5">
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full h-4 flex items-center cursor-pointer group"
        >
          {/* Rail de fond */}
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            {/* Barre de progression blanche pure */}
            <div
              className="h-full bg-white rounded-full transition-all duration-75"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>

          {/* Curseur blanc */}
          <div
            className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md -translate-x-1/2 transition-transform duration-75 group-hover:scale-125"
            style={{ left: `${progressRatio * 100}%` }}
          />
        </div>

        {/* Horodateurs : Temps écoulé à gauche, Temps restant négatif à droite (-4:15) */}
        <div className="flex items-center justify-between text-[11px] font-mono font-medium text-white/60">
          <span>{formatTime(currentPos)}</span>
          <span>-{formatTime(remainingMs)}</span>
        </div>
      </div>

      {/* 5. MAIN PLAYBACK CONTROLS (Shuffle, Prev, Big White Play/Pause Circle, Next, Repeat) */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between py-2 px-1">
        {/* Shuffle */}
        <button
          onClick={() => {
            const nextMode = shuffleMode === 'Off' ? 'TrueRandom' : 'Off';
            setShuffleMode(nextMode);
          }}
          className={`w-9 h-9 flex items-center justify-center transition-all cursor-pointer relative active:scale-90 ${
            shuffleMode !== 'Off' ? 'text-[#1ed760]' : 'text-white/70 hover:text-white'
          }`}
          title={`Lecture aléatoire : ${shuffleMode}`}
        >
          <Shuffle className="w-5 h-5 stroke-[2.2]" />
          {shuffleMode !== 'Off' && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#1ed760]" />
          )}
        </button>

        {/* Previous Track */}
        <button
          onClick={previousTrack}
          className="w-10 h-10 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          title="Titre précédent"
        >
          <SkipBack className="w-7 h-7 fill-white stroke-[1]" />
        </button>

        {/* Big White Circular Play/Pause Button (Exact screenshot center piece) */}
        <button
          onClick={togglePlayPause}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white text-black flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title={isPlaying ? 'Pause' : 'Lecture'}
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-black stroke-[1]" />
          ) : (
            <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-black stroke-[1] ml-1" />
          )}
        </button>

        {/* Next Track */}
        <button
          onClick={nextTrack}
          className="w-10 h-10 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          title="Titre suivant"
        >
          <SkipForward className="w-7 h-7 fill-white stroke-[1]" />
        </button>

        {/* Repeat */}
        <button
          onClick={() => {
            const nextMode = repeatMode === 'Off' ? 'RepeatAll' : repeatMode === 'RepeatAll' ? 'RepeatOne' : 'Off';
            setRepeatMode(nextMode);
          }}
          className={`w-9 h-9 flex items-center justify-center transition-all cursor-pointer relative active:scale-90 ${
            repeatMode !== 'Off' ? 'text-[#1ed760]' : 'text-white/70 hover:text-white'
          }`}
          title={`Répétition : ${repeatMode}`}
        >
          {repeatMode === 'RepeatOne' ? (
            <Repeat1 className="w-5 h-5 stroke-[2.2]" />
          ) : (
            <Repeat className="w-5 h-5 stroke-[2.2]" />
          )}
          {repeatMode !== 'Off' && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#1ed760]" />
          )}
        </button>
      </div>

      {/* 6. BOTTOM UTILITIES ROW (Device Picker, Share, Queue / Lyrics) */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between text-white/70 pt-1 px-1">
        <button
          onClick={() => setDevicePickerOpen(true)}
          className="p-2 hover:text-white active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          title="Appareils disponibles (Spoot Connect)"
        >
          <Laptop2 className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={handleShare}
            className="p-2 hover:text-white active:scale-95 transition-all cursor-pointer relative"
            title="Partager"
          >
            <Share2 className="w-5 h-5" />
            {copiedShare && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                Copié !
              </span>
            )}
          </button>

          <button
            onClick={() => setLyricsOpen(true)}
            className="p-2 hover:text-white active:scale-95 transition-all cursor-pointer"
            title="Paroles synchronisées"
          >
            <ListMusic className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 7. PAROLES SYNCHRONISÉES (Carte interactive placée immédiatement avant les Crédits) */}
      <div className="w-full max-w-md mx-auto pt-3">
        <div
          onClick={() => setLyricsOpen(true)}
          className="w-full rounded-2xl bg-gradient-to-b from-[#222224]/95 to-[#161618]/95 hover:from-[#2a2a2d] hover:to-[#1c1c1f] border border-white/10 p-4 cursor-pointer transition-all shadow-xl backdrop-blur-xl group"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-[#1ed760]" />
              <h3 className="font-extrabold text-sm text-white tracking-wide">Paroles</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/30">
                Synchronisées
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLyricsOpen(true);
              }}
              className="text-xs text-white/70 hover:text-white font-semibold flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 transition-all"
              title="Agrandir les paroles en plein écran"
            >
              <span>Agrandir</span>
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* Défilement en direct des paroles synchronisées avec mise en valeur de la ligne active */}
          <div
            ref={lyricsPreviewContainerRef}
            className="mt-3 max-h-32 overflow-y-auto space-y-2.5 scrollbar-none pr-1 select-none"
          >
            {lyrics.length > 0 ? (
              lyrics.map((line, idx) => {
                const isActive = idx === currentLyricIndex;
                return (
                  <div
                    key={`${line.timeMs}-${idx}`}
                    ref={isActive ? activePreviewLineRef : null}
                    onClick={(e) => {
                      e.stopPropagation();
                      seek(line.timeMs);
                    }}
                    className={`transition-all duration-300 cursor-pointer rounded-lg px-2.5 py-1.5 ${
                      isActive
                        ? 'text-white font-extrabold text-base scale-[1.02] bg-white/[0.08] shadow-[0_0_20px_rgba(30,215,96,0.18)] border-l-2 border-[#1ed760]'
                        : 'text-white/45 hover:text-white/80 font-medium text-xs sm:text-sm hover:bg-white/[0.03]'
                    }`}
                  >
                    <p className="leading-snug">{line.text}</p>
                    {line.translatedText && (
                      <p className="text-[11px] text-white/40 mt-0.5">{line.translatedText}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-white/50 animate-pulse">
                Chargement des paroles synchronisées...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 8. BOTTOM PEEKING CARD ("Crédits" Drawer as shown in screenshot) */}
      <div className="w-full max-w-md mx-auto pt-3">
        <div
          onClick={() => setCreditsExpanded(!creditsExpanded)}
          className="w-full rounded-2xl bg-[#181818]/90 hover:bg-[#202020] border border-white/10 p-4 cursor-pointer transition-all shadow-lg backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white">Crédits</h3>
            <span className="text-xs text-white/50 font-medium">
              {creditsExpanded ? 'Réduire' : 'Afficher tout'}
            </span>
          </div>

          {/* Contenu rétractable ou aperçu */}
          {!creditsExpanded ? (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-xs text-white/60">
              <span className="truncate">{currentTrack.artistName} • {currentTrack.albumTitle}</span>
              <span className="text-[11px] font-mono text-cyan-300 shrink-0 ml-2">
                {currentTrack.formatLabel ? 'Hi-Res 24-bit' : 'FLAC'}
              </span>
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-3 text-xs text-white/70 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-white/50">Interprète principal</span>
                <span className="font-bold text-white">{currentTrack.artistName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">Album</span>
                <span className="font-bold text-white">{currentTrack.albumTitle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">Format Audio Réel</span>
                <span className="font-mono text-cyan-300 font-bold">{currentTrack.formatLabel || 'Hi-Res Lossless 24-bit / 96 kHz FLAC'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">Code ISRC</span>
                <span className="font-mono text-white/90">{currentTrack.isrc || 'FR-9W1-24-00330'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">Vecteur Acoustique</span>
                <span className="font-mono text-white/90">
                  {currentTrack.acousticVector?.bpm || 130} BPM • {currentTrack.acousticVector?.camelotKey || '8A'} • {currentTrack.acousticVector?.loudnessLufs || -6.0} LUFS
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLyricsOpen(true);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <Mic2 className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Paroles</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEqualizerModalOpen(true);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Égaliseur</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
