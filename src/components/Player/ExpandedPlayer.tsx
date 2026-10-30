// Spoot Music — Expanded Now Playing View & Audiophile Credits (ExpandedPlayer.tsx)
// Fully adapted for iPhone 16 Pro Max (Dynamic Island Safe Area, High-Contrast Close Button, Fast & Data-Efficient)
import React, { useState } from 'react';
import {
  X, Heart, ShieldAlert, Sliders, Mic2, Zap
} from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';

export const ExpandedPlayer: React.FC = () => {
  const {
    currentTrack, expandedPlayerOpen, setExpandedPlayerOpen,
    setEqualizerModalOpen, setLyricsOpen, toggleFavorite,
    blacklistEntity, openArtist
  } = useSpootStore();

  const [imageError, setImageError] = useState(false);

  if (!expandedPlayerOpen || !currentTrack) return null;

  const fallbackCover = 'https://cdn-images.dzcdn.net/images/cover/640220bd3d80561118391eef3a24fb53/1000x1000-000000-80-0-0.jpg';
  const coverSrc = (!imageError && currentTrack.coverUrl) ? currentTrack.coverUrl : fallbackCover;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col pt-[max(env(safe-area-inset-top)+20px,74px)] pb-[max(env(safe-area-inset-bottom)+24px,44px)] px-5 md:px-12 animate-in fade-in duration-300 select-none overflow-y-auto no-scrollbar"
      style={{
        background: `radial-gradient(circle at 50% 15%, ${currentTrack.palette?.primary || '#06b6d4'}40 0%, #060913 65%, #020408 100%)`
      }}
    >
      {/* 1. Top Header : Dégagé sous la Dynamic Island / Encoche iPhone 16 Pro Max */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3 mb-4">
        {/* Badge Hi-Res Audio / Bit-Perfect */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.12] border border-white/20 backdrop-blur-xl text-xs font-mono text-cyan-300 font-bold shadow-md">
          <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">{currentTrack.formatLabel || 'Hi-Res Lossless 24-bit / 96 kHz'}</span>
        </div>

        {/* Bouton Fermer (Croix) Haute Visibilité Spécial iPhone 16 Pro Max */}
        <button
          onClick={() => setExpandedPlayerOpen(false)}
          className="w-11 h-11 rounded-full bg-white/[0.18] hover:bg-white/[0.28] active:bg-white/[0.38] border border-white/30 backdrop-blur-2xl flex items-center justify-center text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all active:scale-90 cursor-pointer shrink-0"
          title="Fermer la vue lecture"
          aria-label="Fermer"
        >
          <X className="w-6 h-6 text-white stroke-[2.5]" />
        </button>
      </div>

      {/* 2. Corps Principal : Pochette Vinyle + Métadonnées & Contrôles */}
      <div className="flex-1 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-14 items-center my-auto py-2">
        {/* Pochette Album Haute Définition avec Reflet Liquid Glass */}
        <div className="relative group max-w-[290px] sm:max-w-sm md:max-w-md mx-auto aspect-square w-full rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.85)] border border-white/20 bg-[#0a0f1d]">
          <img
            src={coverSrc}
            alt={currentTrack.title}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold">Bit-Perfect Pass-Through</span>
          </div>
        </div>

        {/* Colonne Droite : Titre, Artiste, Caractéristiques Acoustiques */}
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {currentTrack.title}
            </h1>
            <button
              onClick={() => {
                setExpandedPlayerOpen(false);
                openArtist(currentTrack.artistId);
              }}
              className="text-base sm:text-xl font-extrabold text-cyan-400 hover:text-cyan-300 hover:underline mt-1 block cursor-pointer transition-colors"
            >
              {currentTrack.artistName}
            </button>
            <p className="text-xs sm:text-sm text-white/50 mt-0.5">
              {currentTrack.albumTitle} {currentTrack.releaseDate ? `(${currentTrack.releaseDate.split('-')[0]})` : ''}
            </p>
          </div>

          {/* Vecteurs Acoustiques Hi-Res */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-white/[0.08] border border-white/[0.12] backdrop-blur-md text-center shadow-md">
              <span className="text-[10px] text-white/60 uppercase block font-bold tracking-wider">Tempo</span>
              <span className="text-sm font-black text-white">{currentTrack.acousticVector?.bpm || 140} BPM</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.08] border border-white/[0.12] backdrop-blur-md text-center shadow-md">
              <span className="text-[10px] text-white/60 uppercase block font-bold tracking-wider">Tonalité</span>
              <span className="text-sm font-black text-cyan-300">{currentTrack.acousticVector?.camelotKey || '4A'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.08] border border-white/[0.12] backdrop-blur-md text-center shadow-md">
              <span className="text-[10px] text-white/60 uppercase block font-bold tracking-wider">Intensité</span>
              <span className="text-sm font-black text-white">{currentTrack.acousticVector?.loudnessLufs || '-5.4'} LUFS</span>
            </div>
          </div>

          {/* Rangée d'Actions : Favoris, Paroles, Égaliseur */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className={`flex-1 min-w-[130px] p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all backdrop-blur-md active:scale-95 cursor-pointer shadow-md ${
                currentTrack.isFavorite
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                  : 'bg-white/[0.10] border-white/20 text-white hover:bg-white/[0.18]'
              }`}
            >
              <Heart className={`w-4 h-4 ${currentTrack.isFavorite ? 'fill-emerald-400 text-emerald-400' : ''}`} />
              <span>{currentTrack.isFavorite ? 'Dans mes favoris' : 'Ajouter aux favoris'}</span>
            </button>

            <button
              onClick={() => {
                setExpandedPlayerOpen(false);
                setLyricsOpen(true);
              }}
              className="flex-1 min-w-[130px] p-3 rounded-2xl bg-white/[0.10] hover:bg-white/[0.18] active:bg-white/[0.25] border border-white/20 backdrop-blur-md text-white transition-all flex items-center justify-center gap-2 text-xs font-bold active:scale-95 cursor-pointer shadow-md"
            >
              <Mic2 className="w-4 h-4 text-emerald-400" />
              <span>Paroles & Karaoké</span>
            </button>

            <button
              onClick={() => {
                setExpandedPlayerOpen(false);
                setEqualizerModalOpen(true);
              }}
              className="p-3 rounded-2xl bg-white/[0.10] hover:bg-white/[0.18] active:bg-white/[0.25] border border-white/20 backdrop-blur-md text-white transition-all flex items-center justify-center gap-2 text-xs font-bold active:scale-95 cursor-pointer shadow-md"
            >
              <Sliders className="w-4 h-4 text-cyan-300" />
              <span className="hidden sm:inline">Égaliseur</span>
            </button>
          </div>

          {/* Fiche Technique & Protection d'écoute */}
          <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.10] backdrop-blur-lg space-y-2 text-xs">
            <div className="flex items-center justify-between text-white/60">
              <span>Code ISRC :</span>
              <span className="font-mono text-white font-medium">{currentTrack.isrc || 'FR-9W1-24-00330'}</span>
            </div>
            <div className="flex items-center justify-between text-white/60">
              <span>Format audio réel :</span>
              <span className="font-mono text-white font-medium">{currentTrack.bitrateKbps || 4608} kbps (FLAC {currentTrack.bitDepth || 24}-bit)</span>
            </div>
            <div className="flex items-center justify-between text-white/60">
              <span>Fréquence d'échantillonnage :</span>
              <span className="font-mono text-white font-medium">{(currentTrack.sampleRate || 96000) / 1000} kHz</span>
            </div>
            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
              <span className="text-red-400 font-semibold">Exclusion définitive :</span>
              <button
                onClick={() => {
                  if (confirm(`Voulez-vous bloquer définitivement "${currentTrack.artistName}" ? Il ne sera plus JAMAIS joué dans aucune radio ni mix.`)) {
                    blacklistEntity('artist', currentTrack.artistId, currentTrack.artistName);
                    setExpandedPlayerOpen(false);
                  }
                }}
                className="text-red-400 hover:text-red-300 hover:underline font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Bloquer cet artiste à 100 %</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandedPlayer;
