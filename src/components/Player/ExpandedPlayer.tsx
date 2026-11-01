// Spoot Music — Immersive Spotify/Apple Now Playing Canvas View (ExpandedPlayer.tsx)
// Faithful reproduction of reference screenshots (media_1793404020949_957af945.png & user capture)
// Full-bleed Canvas (Video/Artwork), edge-to-edge typography, sleek timeline with negative remaining time,
// crisp solid white circular play button, green library checkmark badge, and bottom Paroles/Crédits cards.

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown, MoreHorizontal, Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Check, Plus, Speaker, ListMusic,
  Sliders, Mic2, ShieldAlert, X, Maximize2
} from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { useThemeStore } from '../../store/useThemeStore';
import { lyricsService } from '../../services/lyrics_service';
import { LyricLine } from '../../types';
import { ImageWithFallback } from '../Common/ImageWithFallback';

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

  const storeDefaultCover = useThemeStore((s) => s.defaultCoverUrl);
  const [imageError, setImageError] = useState(false);
  const [creditsExpanded, setCreditsExpanded] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [dragPositionMs, setDragPositionMs] = useState(0);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const lyricsPreviewContainerRef = useRef<HTMLDivElement | null>(null);
  const activePreviewLineRef = useRef<HTMLDivElement | null>(null);

  const [resolvedPreviewLyrics, setResolvedPreviewLyrics] = useState<LyricLine[]>([]);
  const [previewInstrumental, setPreviewInstrumental] = useState(false);
  const lyrics: LyricLine[] = resolvedPreviewLyrics.length > 0 ? resolvedPreviewLyrics : (currentTrack?.lyrics || []);
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
    if (!currentTrack) return;
    setPreviewInstrumental(false);
    lyricsService.getSyncedLyrics(currentTrack.artistName, currentTrack.title, durationMs || currentTrack.durationMs).then((res) => {
      if (res.lyrics && res.lyrics.length > 0) {
        currentTrack.lyrics = res.lyrics;
        setResolvedPreviewLyrics(res.lyrics);
        setPreviewInstrumental(false);
      } else {
        setResolvedPreviewLyrics([]);
        setPreviewInstrumental(res.isInstrumental);
      }
    });
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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const targetMs = handleSeekFromClientX(e.clientX);
    setDragPositionMs(targetMs);

    const onMouseMove = (ev: MouseEvent) => {
      setDragPositionMs(handleSeekFromClientX(ev.clientX));
    };

    const onMouseUp = (ev: MouseEvent) => {
      const finalMs = handleSeekFromClientX(ev.clientX);
      seek(finalMs);
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
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

  // Seuls les titres du Vault / Unreleased utilisent Sasuke comme fallback de secours
  const isUnreleasedTrack = Boolean(currentTrack.isUnreleased);
  const fallbackCover = isUnreleasedTrack ? (storeDefaultCover || '/default-cover.jpg') : '';
  const rawCover = (!imageError && currentTrack.coverUrl) ? currentTrack.coverUrl : fallbackCover;
  const highResCoverSrc = rawCover
    ? rawCover
        .replace(/\/\d+x\d+(-[a-f0-9]+)?/g, '/1000x1000')
        .replace(/100x100bb/g, '1000x1000bb')
        .replace(/250x250bb/g, '1000x1000bb')
        .replace(/500x500bb/g, '1000x1000bb')
    : fallbackCover;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-[#080808] text-white select-none overflow-y-auto no-scrollbar animate-in fade-in duration-200"
      style={{
        backgroundColor: '#0a0a0c',
      }}
    >
      {/* 0. FULL-BLEED CANVAS LAYER (Video if available or Ambient Glow Layer) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {currentTrack.canvasUrl ? (
          <>
            <video
              autoPlay
              loop
              muted
              playsInline
              src={currentTrack.canvasUrl}
              className="w-full h-full object-cover"
            />
            {/* Ombre supérieure douce sous la barre de navigation */}
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/85 via-black/45 to-transparent" />
            {/* Fondu inférieur progressif vers le noir pour les contrôles et paroles */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/90 via-42% to-transparent" />
          </>
        ) : (
          <>
            {/* Aura d'ambiance liquide ultra-douce projetée par les couleurs de la pochette HD */}
            <img
              src={highResCoverSrc}
              alt=""
              onError={() => setImageError(true)}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              className="w-full h-full object-cover scale-125 blur-3xl opacity-35 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#0a0a0c]" />
          </>
        )}
      </div>

      {/* 1. TOP HEADER (Chevron Down, Artist Name in clean uppercase tracking, More Options) */}
      <div className="w-full max-w-md mx-auto pt-[max(env(safe-area-inset-top)+14px,56px)] px-6 pb-2 flex items-center justify-between relative z-10">
        <button
          onClick={() => setExpandedPlayerOpen(false)}
          className="w-10 h-10 -ml-2 flex items-center justify-center text-white/90 hover:text-white active:scale-90 transition-transform cursor-pointer"
          aria-label="Réduire le lecteur"
          title="Réduire"
        >
          <ChevronDown className="w-7 h-7 stroke-[2.4]" />
        </button>

        <button
          onClick={() => {
            setExpandedPlayerOpen(false);
            if (currentTrack.artistId) openArtist(currentTrack.artistId);
          }}
          className="text-xs font-bold text-white/90 tracking-widest uppercase hover:underline truncate max-w-[220px] text-center cursor-pointer"
        >
          {currentTrack.artistName}
        </button>

        <button
          onClick={() => setOptionsMenuOpen(true)}
          className="w-10 h-10 -mr-2 flex items-center justify-center text-white/90 hover:text-white active:scale-90 transition-transform cursor-pointer"
          aria-label="Options"
          title="Plus d'options"
        >
          <MoreHorizontal className="w-6 h-6 stroke-[2.2]" />
        </button>
      </div>

      {/* Options Popup Modal */}
      {optionsMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
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
                <svg className="w-4 h-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
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

      {/* 2. MAIN ARTWORK / CANVAS DISPLAY (Adapté iPhone 16 Pro Max 430x932 & Haute Définition) */}
      <div className="w-full max-w-md mx-auto flex-1 min-h-[32vh] sm:min-h-[38vh] relative z-10 flex items-center justify-center px-6 py-2">
        {!currentTrack.canvasUrl && (
          <div className="relative aspect-square w-[76vw] max-w-[340px] rounded-3xl overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.85)] border border-white/10 group animate-in zoom-in-95 duration-200">
            <ImageWithFallback
              src={highResCoverSrc}
              alt={currentTrack.title}
              isUnreleased={isUnreleasedTrack}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* 3. TRACK INFO & GREEN CHECKMARK CIRCLE (Exact match with reference screenshot) */}
      <div className="w-full max-w-md mx-auto px-6 relative z-10 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1
            className="text-2xl sm:text-[26px] font-black text-white tracking-tight leading-tight truncate"
            title={currentTrack.title}
          >
            {currentTrack.title}
          </h1>
          <button
            onClick={() => {
              setExpandedPlayerOpen(false);
              if (currentTrack.artistId) openArtist(currentTrack.artistId);
            }}
            className="text-sm sm:text-base font-semibold text-white/70 hover:text-white truncate block text-left mt-1 cursor-pointer transition-colors"
          >
            {currentTrack.artistName}
          </button>
        </div>

        {/* Spotify Green Filled Checkmark Circle (Right of title/artist) */}
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
            <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3.4]" />
          ) : (
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          )}
        </button>
      </div>

      {/* 4. TIMELINE SCRUBBER (Thin bar with elapsed time on left & negative remaining time on right) */}
      <div className="w-full max-w-md mx-auto px-6 pt-3.5 space-y-1.5 relative z-10">
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          onMouseDown={handleMouseDown}
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
        <div className="flex items-center justify-between text-xs font-medium text-white/60">
          <span>{formatTime(currentPos)}</span>
          <span>-{formatTime(remainingMs)}</span>
        </div>
      </div>

      {/* 5. MAIN PLAYBACK CONTROLS (Shuffle, Prev, Giant White Circular Play/Pause, Next, Repeat) */}
      <div className="w-full max-w-md mx-auto px-6 py-2 flex items-center justify-between relative z-10">
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

        {/* Big White Circular Play/Pause Button (Exact match with reference screenshot) */}
        <button
          onClick={togglePlayPause}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white text-black flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title={isPlaying ? 'Pause' : 'Lecture'}
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-black stroke-[1]" />
          ) : (
            <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-black stroke-[1] ml-0.5" />
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

      {/* 6. BOTTOM UTILITIES ROW (Airplay/Device, Share, Queue / Lyrics) */}
      <div className="w-full max-w-md mx-auto px-6 py-1 flex items-center justify-between text-white/70 relative z-10">
        <button
          onClick={() => setDevicePickerOpen(true)}
          className="p-2 -ml-2 hover:text-white active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          title="Appareils disponibles (Spoot Connect)"
        >
          <Speaker className="w-5 h-5 stroke-[2]" />
        </button>

        <div className="flex items-center gap-4 -mr-2">
          {/* iOS / Spotify Style Share Icon (Square with up arrow) */}
          <button
            onClick={handleShare}
            className="p-2 hover:text-white active:scale-95 transition-all cursor-pointer relative"
            title="Partager"
          >
            <svg className="w-5 h-5 stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            {copiedShare && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                Copié !
              </span>
            )}
          </button>

          <button
            onClick={() => setLyricsOpen(true)}
            className="p-2 hover:text-white active:scale-95 transition-all cursor-pointer"
            title="File d'attente & Paroles"
          >
            <ListMusic className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* 7. BOTTOM CARDS : PAROLES SYNCHRONISÉES PUIS CRÉDITS (Comme dans la capture de référence) */}
      <div className="w-full max-w-md mx-auto px-6 pt-3 pb-[max(env(safe-area-inset-bottom)+12px,28px)] space-y-3 relative z-10">
        {/* Carte interactive Paroles synchronisées (placée immédiatement avant les Crédits) */}
        <div
          onClick={() => setLyricsOpen(true)}
          className="w-full rounded-2xl bg-[#222224]/90 hover:bg-[#28282b] border border-white/10 p-4 cursor-pointer transition-all shadow-xl backdrop-blur-xl group"
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
            className="mt-3 max-h-28 overflow-y-auto space-y-2.5 scrollbar-none pr-1 select-none"
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
                        ? 'text-white font-extrabold text-base scale-[1.01] bg-white/[0.08] shadow-[0_0_20px_rgba(30,215,96,0.18)] border-l-2 border-[#1ed760]'
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
                {previewInstrumental ? 'Titre instrumental • Aucune parole vocale' : 'Chargement des paroles synchronisées...'}
              </div>
            )}
          </div>
        </div>

        {/* Carte Peeking "Crédits" (Exacte reproduction de la carte inférieure de la capture de référence) */}
        <div
          onClick={() => setCreditsExpanded(!creditsExpanded)}
          className="w-full rounded-2xl bg-[#1e1e1e]/95 hover:bg-[#252525] border border-white/10 p-4 cursor-pointer transition-all shadow-lg backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white">Crédits</h3>
            <span className="text-xs text-white/50 font-medium">
              {creditsExpanded ? 'Réduire' : 'Afficher tout'}
            </span>
          </div>

          {!creditsExpanded ? (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-xs text-white/60">
              <span className="truncate">{currentTrack.artistName} • {currentTrack.albumTitle}</span>
              <span className="text-[11px] font-mono text-cyan-300 shrink-0 ml-2">
                {currentTrack.formatLabel ? 'Hi-Res Lossless' : 'FLAC'}
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
                <span className="text-white/50">Format Audio</span>
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
