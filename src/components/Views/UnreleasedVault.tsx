// Spoot Music — Unreleased Vault Component (Archives & Titres Non Officiels / Leaks / Exclusivités Spoot)
import React, { useState, useEffect } from 'react';
import { Unlock, ChevronDown, ChevronUp, Play, Pause, Loader2, Sparkles, Volume2 } from 'lucide-react';
import { VaultTrack, Track } from '../../types';
import { useSpootStore } from '../../store/useSpootStore';
import { deezerService } from '../../services/deezer_service';

interface UnreleasedVaultProps {
  artistName: string;
  artistId: string;
}

export const UnreleasedVault: React.FC<UnreleasedVaultProps> = ({ artistName, artistId }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [vaultTracks, setVaultTracks] = useState<VaultTrack[]>([]);

  const { currentTrack, playbackStatus, playTrack, togglePlayPause } = useSpootStore();
  const isPlaying = playbackStatus === 'Playing';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // 1. Initialisation immédiate avec les archives vérifiées du Cloud Spoot
    deezerService.getArtistUnreleased(artistName).then((cloudTracks) => {
      if (isMounted) {
        setVaultTracks(cloudTracks);
        setLoading(false);
      }
    });

    // 2. Si un serveur yt-dlp local est disponible, on tente d'enrichir la liste
    fetch(`/api/vault-search?artist=${encodeURIComponent(artistName)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Local vault offline');
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.results && data.results.length > 0) {
          const verified = data.results.filter((vt: any) =>
            vt.title.toLowerCase().includes(artistName.toLowerCase())
          );
          if (verified.length > 0) {
            setVaultTracks(verified);
          }
        }
      })
      .catch(() => {
        // En cas d'indisponibilité du serveur local, le fallback Cloud reste actif
      });

    return () => {
      isMounted = false;
    };
  }, [artistName]);

  const verifiedTracks = vaultTracks;

  if (!loading && verifiedTracks.length === 0) {
    return null;
  }

  const handlePlayVaultTrack = (vt: VaultTrack) => {
    const playableTrack: Track = {
      id: `vt-${vt.id}`,
      isrc: `VAULT-${vt.id}`,
      title: vt.title,
      artistId: artistId,
      artistName: vt.artistName || artistName,
      albumId: 'vault',
      albumTitle: 'Archives & Leaks (Exclusivité Spoot)',
      coverUrl: (vt as any).coverUrl || 'https://cdn-images.dzcdn.net/images/cover/4e6b43dbc7c9bc398d6a816b34419e8a/1000x1000-000000-80-0-0.jpg',
      streamUrl: (vt as any).streamUrl,
      durationMs: vt.durationMs || 180000,
      sampleRate: 48000,
      bitDepth: 16,
      bitrateKbps: 320,
      formatLabel: 'Exclusivité Spoot Lossless',
      releaseDate: 'Exclusivité',
      playCount: vt.viewCount || 240000,
      lastPlayedTimestamp: Date.now(),
      isFavorite: false,
      isOfflineDownloaded: false,
      palette: { primary: '#00E676', secondary: '#121212' },
      acousticVector: {
        bpm: 125,
        camelotKey: '8A',
        energy: 0.85,
        valence: 0.5,
        danceability: 0.75,
        acousticness: 0.1,
        loudnessLufs: -6.0,
        decade: 2024,
        genre: 'Exclusivité Spoot'
      }
    };

    playTrack(playableTrack);
  };

  return (
    <div className="mt-12 rounded-2xl bg-gradient-to-b from-[#1b261e]/70 to-[#121212] border border-spoot-neon/30 overflow-hidden shadow-2xl">
      {/* Header cliquable pour replier/déplier */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-spoot-neon/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-spoot-neon/15 border border-spoot-neon/40 flex items-center justify-center text-spoot-neon shrink-0 shadow-lg">
            <Unlock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-white">
                Archives & Titres non officiels (Vault)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-spoot-neon/20 border border-spoot-neon/40 text-[10px] font-black text-spoot-neon uppercase tracking-wider">
                Exclusivité Spoot
              </span>
            </div>
            <p className="text-xs text-[#b3b3b3] mt-0.5">
              Morceaux inédits, fuites, versions studio rares et titres exclusifs non disponibles ailleurs.
            </p>
          </div>
        </div>

        <div className="text-[#b3b3b3] p-1">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Contenu dépliable */}
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-white/5 space-y-2">
          {loading && verifiedTracks.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-spoot-neon/80">
              <Loader2 className="w-6 h-6 animate-spin text-spoot-neon" />
              <p className="text-xs font-semibold text-[#b3b3b3]">
                Extraction des archives non officielles de {artistName}...
              </p>
            </div>
          ) : (
            <div className="space-y-1 mt-2">
              {verifiedTracks.map((vt, index) => {
                const isCurrent = currentTrack?.title === vt.title;
                return (
                  <div
                    key={vt.id}
                    onClick={() => handlePlayVaultTrack(vt)}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer group ${
                      isCurrent
                        ? 'bg-spoot-neon/15 border border-spoot-neon/30 text-white'
                        : 'hover:bg-white/[0.04] text-[#b3b3b3] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-8 flex items-center justify-center shrink-0">
                        {isCurrent && isPlaying ? (
                          <div className="w-4 h-4 flex items-center justify-center text-spoot-neon">
                            <Volume2 className="w-4 h-4 animate-pulse" />
                          </div>
                        ) : (
                          <span className="text-xs font-mono font-bold group-hover:hidden">
                            #{index + 1}
                          </span>
                        )}
                        <Play className={`w-4 h-4 text-white hidden ${!isCurrent ? 'group-hover:block' : ''}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold truncate ${isCurrent ? 'text-spoot-neon' : 'text-white'}`}>
                            {vt.title}
                          </p>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                            Démo Studio
                          </span>
                        </div>
                        <p className="text-xs text-spoot-muted truncate mt-0.5">
                          {vt.artistName || artistName} • Archive non officielle
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 text-xs font-mono">
                      <span className="hidden sm:inline text-spoot-muted">
                        {(vt.viewCount || 240000).toLocaleString()} écoutes
                      </span>
                      <span>{vt.durationFormatted || '3:15'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnreleasedVault;
