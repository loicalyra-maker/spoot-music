// Spoot Music — Preview Pill & Circular Green Progress Ring (SnippetPreviewButton.tsx)
// Bouton d'écoute rapide (Refrain / Snippet 25s) distinct du bouton d'ajout (+).
// Affiche un anneau de progression circulaire vert émeraude pendant la pré-écoute.

import React, { useEffect, useState } from 'react';
import { Play, Square, Loader2, Headphones } from 'lucide-react';
import { snippetPreview, SnippetState } from '../../services/SnippetPreviewService';
import { Track } from '../../types';

interface SnippetPreviewButtonProps {
  track: Partial<Track> & { id: string; title: string; artistName: string; preview?: string };
  variant?: 'icon' | 'pill';
  className?: string;
}

export const SnippetPreviewButton: React.FC<SnippetPreviewButtonProps> = ({
  track,
  variant = 'pill',
  className = '',
}) => {
  const [snapState, setSnapState] = useState<SnippetState>(() => snippetPreview.getState());

  useEffect(() => {
    return snippetPreview.subscribe(setSnapState);
  }, []);

  const isThisActive = snapState.activeTrackId === track.id;
  const isPlaying = isThisActive && snapState.isPlaying;
  const isLoading = isThisActive && snapState.isLoading;
  const progress = isThisActive ? snapState.progressPercent : 0;

  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    snippetPreview.toggleSnippet(track);
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        title={isPlaying ? 'Arrêter l’extrait' : 'Pré-écouter le refrain (Snippet)'}
        className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0 ${
          isThisActive
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
            : 'bg-white/[0.08] hover:bg-white/[0.16] text-white/75 hover:text-white border border-white/[0.15]'
        } ${className}`}
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="transparent"
            stroke="rgba(16, 185, 129, 0.2)"
            strokeWidth="2.5"
          />
          {isThisActive && (
            <circle
              cx="18"
              cy="18"
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-75"
            />
          )}
        </svg>

        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
        ) : isPlaying ? (
          <Square className="w-3 h-3 fill-emerald-400 text-emerald-400" />
        ) : (
          <Headphones className="w-3.5 h-3.5" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      title={isPlaying ? 'Arrêter la pré-écoute' : 'Pré-écoute rapide (Refrain 25s)'}
      className={`relative pl-1.5 pr-2.5 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-extrabold transition-all cursor-pointer active:scale-95 shrink-0 ${
        isThisActive
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
          : 'bg-white/[0.08] hover:bg-emerald-500/15 text-white/80 hover:text-emerald-300 border border-white/[0.14] hover:border-emerald-400/40'
      } ${className}`}
    >
      <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="9.5"
            fill="transparent"
            stroke={isThisActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.18)'}
            strokeWidth="2"
          />
          {isThisActive && (
            <circle
              cx="12"
              cy="12"
              r="9.5"
              fill="transparent"
              stroke="#10b981"
              strokeWidth="2.2"
              strokeDasharray={2 * Math.PI * 9.5}
              strokeDashoffset={2 * Math.PI * 9.5 * (1 - progress / 100)}
              strokeLinecap="round"
              className="transition-all duration-75"
            />
          )}
        </svg>

        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
        ) : isPlaying ? (
          <Square className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
        ) : (
          <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
        )}
      </div>
      <span className="tracking-tight">{isPlaying ? 'Extrait...' : 'Extrait'}</span>
    </button>
  );
};

export default SnippetPreviewButton;
