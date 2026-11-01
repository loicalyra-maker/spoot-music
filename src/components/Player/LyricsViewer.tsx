// Spoot Music — Apple Music iOS 26 High-Fidelity Synchronized Lyrics Viewer (LyricsViewer.tsx)
// Spécialement calibré pour iPhone 16 Pro Max (430 x 932 pt / Super Retina XDR 120Hz)
// - Safe Areas strictes (Dynamic Island + Home Indicator)
// - Moteur universel 3 niveaux (LRCLIB -> NetEase LRC -> Détection "Titre instrumental")
// - Positionnement de la ligne active au tiers supérieur de l'écran + détection de scroll manuel (4s)
// - Tap-to-Seek milliseconde exacte & lueur cinétique adaptative

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { X, Mic2, Play, Pause, SkipBack, SkipForward, RotateCcw, Sparkles } from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { LyricLine } from '../../types';
import { lyricsService, findActiveLyricIndex } from '../../services/lyrics_service';
import { ImageWithFallback } from '../Common/ImageWithFallback';

interface LyricsViewerProps {
  onClose?: () => void;
  isOverlay?: boolean;
}

export const LyricsViewer: React.FC<LyricsViewerProps> = ({ onClose }) => {
  const {
    currentTrack,
    positionMs,
    durationMs,
    playbackStatus,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seek,
    setLyricsOpen,
    setActiveView,
  } = useSpootStore();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const manualScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProgrammaticScrollRef = useRef<boolean>(false);

  const [resolvedLyrics, setResolvedLyrics] = useState<LyricLine[]>([]);
  const [isInstrumental, setIsInstrumental] = useState<boolean>(false);
  const [lyricsSource, setLyricsSource] = useState<string>('lrclib');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUserScrolling, setIsUserScrolling] = useState<boolean>(false);

  const isPlaying = playbackStatus === 'Playing';

  // Résolution automatique via le moteur 3-niveaux lyrics_service.ts
  useEffect(() => {
    if (!currentTrack) return;

    // Si le morceau possède déjà de vraies paroles synchronisées (> 3 lignes), les afficher immédiatement
    if (currentTrack.lyrics && currentTrack.lyrics.length > 3 && !currentTrack.isInstrumental) {
      setResolvedLyrics(currentTrack.lyrics);
      setIsInstrumental(false);
    }

    let cancelled = false;
    setIsLoading(true);

    lyricsService
      .getSyncedLyrics(currentTrack.artistName, currentTrack.title, currentTrack.durationMs)
      .then((res) => {
        if (cancelled) return;
        if (res.lyrics.length > 0) {
          setResolvedLyrics(res.lyrics);
          setIsInstrumental(false);
          setLyricsSource(res.source);
        } else if (!currentTrack.lyrics || currentTrack.lyrics.length < 4) {
          setResolvedLyrics([]);
          setIsInstrumental(true);
          setLyricsSource('instrumental');
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentTrack?.id, currentTrack?.title, currentTrack?.artistName]);

  const lyrics: LyricLine[] = useMemo(() => {
    if (resolvedLyrics.length > 0) return resolvedLyrics;
    return currentTrack?.lyrics || [];
  }, [resolvedLyrics, currentTrack?.lyrics]);

  // Recherche dichotomique O(log n) de la ligne active
  const currentIndex = useMemo(() => {
    return findActiveLyricIndex(lyrics, positionMs);
  }, [lyrics, positionMs]);

  // Défilement physique maintenant la ligne active exactement au tiers supérieur de l'écran (30% de hauteur)
  useEffect(() => {
    if (isUserScrolling) return;
    if (currentIndex < 0 || !containerRef.current) return;

    const activeEl = lineRefs.current[currentIndex];
    const container = containerRef.current;
    if (!activeEl) return;

    const containerHeight = container.clientHeight;
    const targetScrollTop = Math.max(
      0,
      activeEl.offsetTop - containerHeight * 0.30 + activeEl.clientHeight * 0.5
    );

    isProgrammaticScrollRef.current = true;
    container.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth',
    });

    const timer = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 450);

    return () => clearTimeout(timer);
  }, [currentIndex, isUserScrolling]);

  // Suspension temporaire de 4s si l'utilisateur scrolle au doigt
  const handleUserScroll = () => {
    if (isProgrammaticScrollRef.current) return;
    setIsUserScrolling(true);
    if (manualScrollTimeoutRef.current) {
      clearTimeout(manualScrollTimeoutRef.current);
    }
    manualScrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 4000);
  };

  const handleLineClick = (timeMs: number) => {
    setIsUserScrolling(false);
    seek(timeMs);
    if (playbackStatus !== 'Playing') {
      togglePlayPause();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setLyricsOpen(false);
      setActiveView('home');
    }
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const primaryColor = currentTrack?.palette?.primary || '#06b6d4';
  const secondaryColor = currentTrack?.palette?.secondary || '#0284c7';
  const progressPercent = durationMs > 0 ? Math.min(100, (positionMs / durationMs) * 100) : 0;

  return (
    <div
      className="relative flex-1 w-full h-full overflow-hidden flex flex-col bg-[#000000] text-white select-none"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 48px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
      }}
    >
      {/* Fond plein écran animé avec lueur cinétique fluide réactive aux teintes de la pochette */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-24 -left-16 w-[420px] h-[420px] rounded-full blur-[95px] opacity-45 animate-fluid-mesh transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${primaryColor} 0%, ${secondaryColor} 65%, transparent 100%)`,
          }}
        />
        <div
          className="absolute bottom-10 -right-16 w-[380px] h-[380px] rounded-full blur-[90px] opacity-35 animate-wave-pulse transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${secondaryColor} 0%, ${primaryColor} 65%, transparent 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-black/55 backdrop-blur-2xl" />
      </div>

      {/* En-tête Compact iPhone 16 Pro Max (Sous la Dynamic Island) */}
      <div className="relative z-20 px-5 pt-2 pb-3.5 flex items-center justify-between border-b border-white/[0.08]">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 shadow-xl shrink-0 bg-zinc-900">
            <ImageWithFallback
              src={currentTrack?.coverUrl}
              alt={currentTrack?.title || 'Cover'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-tight truncate">
                {currentTrack?.title || 'Aucun titre en cours'}
              </h2>
              <span className="px-1.5 py-0.5 rounded-md bg-white/10 border border-white/15 text-[9px] font-black uppercase tracking-wider text-cyan-300 shrink-0">
                {lyricsSource === 'netease' ? 'LRC Cloud' : lyricsSource === 'instrumental' ? 'Instru' : 'LRCLIB Sync'}
              </span>
            </div>
            <p className="text-xs font-semibold text-white/60 truncate mt-0.5">
              {currentTrack?.artistName || 'Sélectionnez un morceau'}
            </p>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer shrink-0 ml-2"
          title="Fermer les paroles"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Bouton flottant de re-synchronisation si l'utilisateur a défilé manuellement */}
      {isUserScrolling && lyrics.length > 0 && (
        <div className="absolute top-24 right-5 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => setIsUserScrolling(false)}
            className="px-3.5 py-1.5 rounded-full bg-cyan-400 text-black text-xs font-extrabold flex items-center gap-1.5 shadow-[0_0_20px_rgba(34,211,238,0.6)] cursor-pointer active:scale-95 transition-transform"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Synchro auto</span>
          </button>
        </div>
      )}

      {/* Corps Principal : Paroles Synchronisées Apple Music / État Instrumental Niveau 3 */}
      {isLoading && lyrics.length === 0 ? (
        <div className="relative z-10 flex-1 flex flex-col justify-center px-7 space-y-6">
          {[75, 55, 85, 65, 45].map((w, i) => (
            <div
              key={i}
              className="h-8 rounded-xl bg-white/10 animate-pulse"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      ) : isInstrumental || lyrics.length === 0 ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-8 space-y-6 animate-in fade-in duration-300">
          {/* Animation d'ondes sonores discrètes (Niveau 3) */}
          <div className="w-24 h-24 rounded-3xl bg-white/[0.05] border border-white/15 backdrop-blur-2xl flex items-center justify-center gap-1.5 shadow-2xl">
            <span className="w-1.5 h-6 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-11 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-8 bg-cyan-300 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-1.5 h-12 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
            <span className="w-1.5 h-5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
          </div>
          <div className="space-y-2 max-w-xs">
            <h3 className="text-3xl font-extrabold tracking-tight text-white">
              Titre instrumental
            </h3>
            <p className="text-xs font-medium text-white/50 leading-relaxed">
              Aucune piste vocale synchronisée détectée. Profitez de la richesse acoustique et du mixage studio.
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          onTouchMove={handleUserScroll}
          onWheel={handleUserScroll}
          className="relative z-10 flex-1 overflow-y-auto px-6 sm:px-12 md:px-20 pt-[18vh] pb-[42vh] space-y-7 no-scrollbar promotion-scroll-container"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 85%, transparent 100%)',
          }}
        >
          {lyrics.map((line, idx) => {
            const isActive = idx === currentIndex;

            return (
              <div
                key={`${line.timeMs}-${idx}`}
                ref={(el) => {
                  lineRefs.current[idx] = el;
                }}
                onClick={() => handleLineClick(line.timeMs)}
                className={`text-3xl md:text-4xl font-extrabold tracking-tight leading-snug cursor-pointer select-text transition-all duration-300 ${
                  isActive
                    ? 'text-white scale-105 origin-left drop-shadow-[0_4px_24px_rgba(255,255,255,0.28)]'
                    : 'text-white/30 hover:text-white/60 active:text-white/80'
                }`}
              >
                <p className="break-words pr-4">{line.text}</p>
                {line.translatedText && (
                  <p className="text-sm font-semibold text-cyan-300/70 mt-1.5">
                    {line.translatedText}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Contrôles de lecture intégrés en bas de l'écran Paroles (iPhone 16 Pro Max Ergonomie) */}
      <div className="relative z-20 px-6 pt-3 pb-2 bg-gradient-to-t from-black via-black/90 to-transparent">
        {/* Barre de scrubbing directe */}
        <div
          className="w-full h-2 flex items-center cursor-pointer group mb-1.5"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            seek(Math.round(ratio * (durationMs || 180000)));
          }}
        >
          <div className="w-full h-1 group-hover:h-1.5 bg-white/20 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-white/50 mb-2">
          <span>{formatTime(positionMs)}</span>
          <span>{formatTime(durationMs || 180000)}</span>
        </div>

        <div className="flex items-center justify-center gap-8">
          <button
            onClick={previousTrack}
            className="p-2 text-white/75 hover:text-white active:scale-90 transition-all cursor-pointer"
            title="Titre précédent"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          <button
            onClick={togglePlayPause}
            className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.4)] active:scale-92 transition-transform cursor-pointer"
            title={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-black" />
            ) : (
              <Play className="w-6 h-6 fill-black ml-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-2 text-white/75 hover:text-white active:scale-90 transition-all cursor-pointer"
            title="Titre suivant"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LyricsViewer;
