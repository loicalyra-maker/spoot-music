// Spoot Music — Apple-Grade Synchronized Lyrics Viewer (LyricsViewer.tsx)
import React, { useEffect, useRef } from 'react';
import { X, Mic2, Disc3, Music2, Video, MoreHorizontal, Sparkles } from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { LyricLine } from '../../types';

interface LyricsViewerProps {
  onClose?: () => void;
  isOverlay?: boolean;
}

export const LyricsViewer: React.FC<LyricsViewerProps> = ({ onClose, isOverlay = false }) => {
  const {
    currentTrack, positionMs, seek, setLyricsOpen,
    setActiveView
  } = useSpootStore();

  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const lyrics: LyricLine[] = currentTrack?.lyrics || [];
  const isInstrumental = currentTrack?.isInstrumental || false;

  // Calcul de la ligne active
  const activeIndex = lyrics.findIndex((line, idx) => {
    const nextLine = lyrics[idx + 1];
    if (nextLine) {
      return positionMs >= line.timeMs && positionMs < nextLine.timeMs;
    }
    return positionMs >= line.timeMs;
  });

  const currentIndex = activeIndex >= 0 ? activeIndex : 0;

  // Auto-scroll doux centré sur la ligne active
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentIndex]);

  const handleLineClick = (timeMs: number) => {
    seek(timeMs);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setLyricsOpen(false);
      setActiveView('home');
    }
  };

  const primaryColor = currentTrack?.palette?.primary || '#38bdf8';

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col bg-black/40 backdrop-blur-2xl text-white select-none">
      {/* Halo d'ambiance Apple Music dérivé de la pochette */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 transition-all duration-1000 blur-[130px]"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${primaryColor} 0%, transparent 75%)`,
        }}
      />
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />

      {/* Barre supérieure Apple-grade avec marge de sécurité Dynamic Island pour iPhone 16 Pro Max */}
      <div className="relative z-20 px-6 pt-[max(env(safe-area-inset-top)+14px,64px)] pb-4 flex items-center justify-between border-b border-white/[0.08] backdrop-blur-md bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-md">
            <Mic2 className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide truncate max-w-sm sm:max-w-md">
              {currentTrack?.title || 'Aucun titre en cours'}
            </h2>
            <p className="text-xs text-white/60 truncate">
              {currentTrack?.artistName || 'Sélectionnez un morceau'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-white/70">
          <button
            onClick={handleClose}
            className="p-2 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Fermer les paroles"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contenu principal : Instrumental vs Paroles Synchronisées vs Non Disponible */}
      {isInstrumental ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-8 space-y-5 animate-in fade-in duration-300">
          <div className="w-24 h-24 rounded-3xl bg-white/[0.06] border border-white/15 backdrop-blur-2xl flex items-center justify-center shadow-2xl">
            <Music2 className="w-12 h-12 text-cyan-300 animate-pulse" />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="text-2xl font-black tracking-tight text-white">
              Morceau instrumental
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Ce titre ne comporte pas de paroles enregistrées. Profitez de la mélodie pure et de la production studio.
            </p>
          </div>
        </div>
      ) : lyrics.length > 0 ? (
        <div
          ref={containerRef}
          className="relative z-10 flex-1 overflow-y-auto px-8 md:px-20 lg:px-32 py-24 space-y-8 custom-scrollbar scroll-smooth"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          }}
        >
          {lyrics.map((line, idx) => {
            const isActive = idx === currentIndex;
            const isPast = idx < currentIndex;

            return (
              <div
                key={`${line.timeMs}-${idx}`}
                ref={isActive ? activeLineRef : null}
                onClick={() => handleLineClick(line.timeMs)}
                className={`cursor-pointer transition-all duration-300 font-black tracking-tight leading-snug select-text ${
                  isActive
                    ? 'text-white text-3xl sm:text-4xl md:text-5xl scale-[1.02] origin-left opacity-100 drop-shadow-lg'
                    : isPast
                    ? 'text-white/35 hover:text-white/75 text-2xl sm:text-3xl md:text-4xl'
                    : 'text-white/35 hover:text-white/75 text-2xl sm:text-3xl md:text-4xl'
                }`}
              >
                <p>{line.text}</p>
                {line.translatedText && (
                  <p className="text-sm font-medium text-white/50 mt-1">{line.translatedText}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/40">
            <Mic2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Paroles indisponibles</h3>
          <p className="text-xs text-white/50 max-w-sm">
            Les paroles synchronisées pour ce titre n'ont pas encore été synchronisées dans LRCLIB.
          </p>
        </div>
      )}
    </div>
  );
};

export default LyricsViewer;
