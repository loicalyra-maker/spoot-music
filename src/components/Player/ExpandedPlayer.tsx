// Spoot Music — Expanded Now Playing View & Audiophile Credits
import React from 'react';
import {
  X, Heart, ShieldAlert, Sliders, Mic2, Disc3, Zap, Info, Radio, Plus
} from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';

export const ExpandedPlayer: React.FC = () => {
  const {
    currentTrack, expandedPlayerOpen, setExpandedPlayerOpen,
    setEqualizerModalOpen, setLyricsOpen, toggleFavorite,
    blacklistEntity, openArtist
  } = useSpootStore();

  if (!expandedPlayerOpen || !currentTrack) return null;

  return (
    <div
      className="fixed inset-0 bg-[#0B0B0B]/95 backdrop-blur-3xl z-50 flex flex-col p-6 md:p-12 animate-in fade-in duration-300 select-none overflow-y-auto"
      style={{
        background: `radial-gradient(circle at 50% 20%, ${currentTrack.palette.primary}55 0%, #0B0B0B 80%)`
      }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono text-spoot-neon uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" />
          <span>{currentTrack.formatLabel}</span>
        </div>

        <button
          onClick={() => setExpandedPlayerOpen(false)}
          className="w-10 h-10 rounded-full bg-[#181818] border border-white/10 flex items-center justify-center text-white hover:bg-[#282828] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center my-auto py-8">
        {/* Left: Album Artwork with Vinyl Shadow */}
        <div className="relative group max-w-md mx-auto aspect-square w-full rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
          />
          <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-mono text-spoot-cyan flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-spoot-cyan animate-pulse" />
            <span>Bit-Perfect Pass-Through</span>
          </div>
        </div>

        {/* Right: Metadata, Acoustic Profile & Hard Blacklist */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {currentTrack.title}
            </h1>
            <button
              onClick={() => {
                setExpandedPlayerOpen(false);
                openArtist(currentTrack.artistId);
              }}
              className="text-lg md:text-xl font-bold text-spoot-neon hover:underline mt-1 block"
            >
              {currentTrack.artistName}
            </button>
            <p className="text-sm text-spoot-muted mt-0.5">{currentTrack.albumTitle} ({currentTrack.releaseDate.split('-')[0]})</p>
          </div>

          {/* Acoustic Vector Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#141414] border border-[#242424] text-center">
              <span className="text-[10px] text-spoot-muted uppercase block font-semibold">Tempo</span>
              <span className="text-sm font-extrabold text-white">{currentTrack.acousticVector.bpm} BPM</span>
            </div>
            <div className="p-3 rounded-xl bg-[#141414] border border-[#242424] text-center">
              <span className="text-[10px] text-spoot-muted uppercase block font-semibold">Tonalité</span>
              <span className="text-sm font-extrabold text-spoot-cyan">{currentTrack.acousticVector.camelotKey}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#141414] border border-[#242424] text-center">
              <span className="text-[10px] text-spoot-muted uppercase block font-semibold">Intensité</span>
              <span className="text-sm font-extrabold text-white">{currentTrack.acousticVector.loudnessLufs} LUFS</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                currentTrack.isFavorite
                  ? 'bg-spoot-neon/20 border-spoot-neon text-spoot-neon'
                  : 'bg-[#181818] border-white/10 text-white hover:bg-[#222222]'
              }`}
            >
              <Heart className={`w-4 h-4 ${currentTrack.isFavorite ? 'fill-spoot-neon' : ''}`} />
              <span>{currentTrack.isFavorite ? 'Dans mes favoris' : 'Ajouter aux favoris'}</span>
            </button>

            <button
              onClick={() => {
                setExpandedPlayerOpen(false);
                setLyricsOpen(true);
              }}
              className="p-3 rounded-xl bg-[#181818] border border-white/10 text-white hover:bg-[#222222] transition-colors flex items-center gap-2 text-xs font-bold"
            >
              <Mic2 className="w-4 h-4 text-spoot-neon" />
              <span>Paroles & Karaoké</span>
            </button>

            <button
              onClick={() => {
                setExpandedPlayerOpen(false);
                setEqualizerModalOpen(true);
              }}
              className="p-3 rounded-xl bg-[#181818] border border-white/10 text-white hover:bg-[#222222] transition-colors flex items-center gap-2 text-xs font-bold"
            >
              <Sliders className="w-4 h-4 text-spoot-cyan" />
              <span>Égaliseur</span>
            </button>
          </div>

          {/* Technical Specs & Hardware Blacklist */}
          <div className="p-4 rounded-xl bg-[#101010] border border-[#202020] space-y-2 text-xs">
            <div className="flex items-center justify-between text-spoot-muted">
              <span>Code ISRC :</span>
              <span className="font-mono text-white">{currentTrack.isrc}</span>
            </div>
            <div className="flex items-center justify-between text-spoot-muted">
              <span>Format audio réel :</span>
              <span className="font-mono text-white">{currentTrack.bitrateKbps} kbps (FLAC {currentTrack.bitDepth}-bit)</span>
            </div>
            <div className="flex items-center justify-between text-spoot-muted">
              <span>Fréquence d'échantillonnage :</span>
              <span className="font-mono text-white">{currentTrack.sampleRate / 1000} kHz</span>
            </div>
            <div className="pt-2 border-t border-[#1e1e1e] flex items-center justify-between">
              <span className="text-spoot-danger font-semibold">Exclusion définitive :</span>
              <button
                onClick={() => {
                  if (confirm(`Voulez-vous bloquer définitivement "${currentTrack.artistName}" ? Il ne sera plus JAMAIS joué dans aucune radio ni mix.`)) {
                    blacklistEntity('artist', currentTrack.artistId, currentTrack.artistName);
                    setExpandedPlayerOpen(false);
                  }
                }}
                className="text-spoot-danger hover:underline font-bold flex items-center gap-1"
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
