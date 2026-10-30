// Spoot Music — Unreleased Vault Component (Archives & Titres Non Officiels / Leaks)
import React, { useState, useEffect } from 'react';
import { Unlock, ChevronDown, ChevronUp, Play, Pause, Loader2, Sparkles, Volume2 } from 'lucide-react';
import { VaultTrack, Track } from '../../types';
import { useSpootStore } from '../../store/useSpootStore';

interface UnreleasedVaultProps {
  artistName: string;
  artistId: string;
}

export const UnreleasedVault: React.FC<UnreleasedVaultProps> = ({ artistName, artistId }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [vaultTracks, setVaultTracks] = useState<VaultTrack[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { currentTrack, playbackStatus, playTrack, togglePlayPause } = useSpootStore();
  const isPlaying = playbackStatus === 'Playing';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/vault-search?artist=${encodeURIComponent(artistName)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to query vault');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setVaultTracks(data.results || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Vault fetch error:', err);
          setError('Impossible de charger les archives du Vault pour le moment.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [artistName]);

  // Filtrage strict : seuls les titres mentionnant explicitement l'artiste sont éligibles
  const verifiedTracks = vaultTracks.filter((vt) =>
    vt.title.toLowerCase().includes(artistName.toLowerCase())
  );

  // Si aucun résultat avéré n'existe et que le chargement est terminé : masquer totalement
  if (!loading && verifiedTracks.length === 0) {
    return null;
  }

  const handlePlayVaultTrack = (vt: VaultTrack) => {
    // Crée une piste interne jouable via le proxy audio
    const playableTrack: Track = {
      id: `vt-${vt.id}`,
      isrc: `VAULT-${vt.id}`,
      title: vt.title,
      artistId: artistId,
      artistName: vt.artistName,
      albumId: 'vault',
      albumTitle: 'Archives & Leaks (Vault Exclusive)',
      coverUrl: 'https://cdn-images.dzcdn.net/images/cover/4e6b43dbc7c9bc398d6a816b34419e8a/1000x1000-000000-80-0-0.jpg',
      durationMs: vt.durationMs,
      sampleRate: 48000,
      bitDepth: 16,
      bitrateKbps: 320,
      formatLabel: 'Vault Stream / Web Audio Hi-Res',
      releaseDate: 'Archive',
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
        genre: 'Vault Unreleased'
      }
    };

    playTrack(playableTrack);
  };

  return (
    <div className="mt-12 rounded-xl bg-gradient-to-b from-[#1b261e]/60 to-[#121212] border border-spoot-neon/20 overflow-hidden shadow-2xl">
      
      {/* Header cliquable pour replier/déplier */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-spoot-neon/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-spoot-neon/10 border border-spoot-neon/30 flex items-center justify-center text-spoot-neon shrink-0 shadow-lg">
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
              Morceaux inédits, fuites, versions live rares et titres retirés des plateformes officielles.
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
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-spoot-neon/80">
              <Loader2 className="w-6 h-6 animate-spin text-spoot-neon" />
              <p className="text-xs font-semibold text-[#b3b3b3]">
                Extraction des archives non officielles de {artistName}...
              </p>
            </div>
          ) : error ? (
            <p className="py-4 text-xs text-[#727272] text-center">{error}</p>
          ) : vaultTracks.length === 0 ? (
            <p className="py-4 text-xs text-[#727272] text-center">
              Aucun leak ou inédit répertorié pour cet artiste.
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {verifiedTracks.map((vt, idx) => {
                const isThisCurrent = currentTrack?.id === `vt-${vt.id}`;
                const isThisPlaying = isThisCurrent && isPlaying;

                return (
                  <div
                    key={vt.id}
                    onClick={() => handlePlayVaultTrack(vt)}
                    className={`flex items-center justify-between py-3 px-3 rounded-lg hover:bg-white/5 group cursor-pointer transition-colors ${
                      isThisCurrent ? 'bg-spoot-neon/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-4">
                      <span className="w-5 text-center text-xs font-bold text-[#727272] group-hover:hidden">
                        {idx + 1}
                      </span>
                      <button className="w-5 text-center text-spoot-neon hidden group-hover:block">
                        {isThisPlaying ? (
                          <Pause className="w-4 h-4 fill-current mx-auto" />
                        ) : (
                          <Play className="w-4 h-4 fill-current mx-auto" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <p
                          className={`text-sm font-bold truncate ${
                            isThisCurrent ? 'text-spoot-neon' : 'text-white'
                          }`}
                        >
                          {vt.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#b3b3b3] mt-0.5">
                          <span className="text-spoot-neon/90 text-[10px] font-semibold flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            Vault Audio
                          </span>
                          <span>•</span>
                          <span>{vt.artistName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-[#b3b3b3]">
                      {vt.viewCount && (
                        <span className="hidden sm:inline text-[#727272]">
                          {vt.viewCount.toLocaleString('fr-FR')} écoutes
                        </span>
                      )}
                      <span>{vt.durationFormatted}</span>
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
