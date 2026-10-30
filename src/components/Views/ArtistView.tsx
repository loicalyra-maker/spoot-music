// Spoot Music — Official Dynamic Artist View Component
// Reproduction fidèle 100% de la capture Spotify Desktop (Vacra, Screenshot 2)

import React, { useState, useEffect } from 'react';
import {
  Play, Pause, Shuffle, MoreHorizontal, Check, Disc, Heart,
  ShieldCheck, Clock, ExternalLink
} from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { deezerService, DeezerArtistDetails } from '../../services/deezer_service';
import { Track, Album, Artist } from '../../types';
import { UnreleasedVault } from './UnreleasedVault';

export const ArtistView: React.FC = () => {
  const {
    activeArtistId, playTrack, currentTrack, playbackStatus,
    openAlbum, openArtist, toggleFavorite, togglePlayPause
  } = useSpootStore();

  const isPlaying = playbackStatus === 'Playing';

  const [artist, setArtist] = useState<DeezerArtistDetails | null>(null);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [relatedArtists, setRelatedArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [discoTab, setDiscoTab] = useState<'popular' | 'albums' | 'singles'>('popular');

  // Chargement officiel via Deezer Public API (Routage strict par artist_id Deezer)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const targetId = activeArtistId 
      ? activeArtistId.replace(/^art-/, '').replace(/^dz-/, '') 
      : '8673550'; // Par défaut : Vacra (Screenshot 2 & 4)

    deezerService.getArtist(targetId).then((art) => {
      if (!isMounted) return;
      if (art) setArtist(art);
      const listeners = art?.monthlyListeners || 3500000;

      Promise.allSettled([
        deezerService.getArtistTopTracks(targetId, 10, listeners),
        deezerService.getArtistAlbums(targetId, 24),
        deezerService.getArtistRelated(targetId, 8),
      ]).then(([tracksRes, albumsRes, relatedRes]) => {
        if (!isMounted) return;

        if (tracksRes.status === 'fulfilled') {
          setTopTracks(tracksRes.value);
        }
        if (albumsRes.status === 'fulfilled') {
          setAlbums(albumsRes.value);
        }
        if (relatedRes.status === 'fulfilled') {
          setRelatedArtists(relatedRes.value);
        }
        setLoading(false);
      });
    });

    return () => {
      isMounted = false;
    };
  }, [activeArtistId]);

  if (loading || !artist) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#b3b3b3]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-spoot-neon border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Chargement de la page artiste officielle...</p>
        </div>
      </div>
    );
  }

  const formatPlays = (count: number) => {
    return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const displayedTracks = showAllTracks ? topTracks : topTracks.slice(0, 5);

  const filteredAlbums = discoTab === 'albums'
    ? albums.filter(a => a.type === 'album')
    : discoTab === 'singles'
    ? albums.filter(a => a.type === 'single' || a.type === 'ep')
    : albums;

  const isCurrentArtistPlaying = currentTrack?.artistName.toLowerCase() === artist.name.toLowerCase() && isPlaying;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar select-none text-white pb-36">
      {/* 1. Grande Bannière Hero avec photo officielle HD en pleine largeur (Screenshot 2) */}
      <div className="relative h-72 sm:h-80 md:h-96 w-full overflow-hidden flex flex-col justify-end p-8 bg-[#181818]">
        {/* Photo d'arrière-plan HD avec fallback automatique vers le top album si erreur */}
        <img
          src={artist.pictureXl}
          alt={artist.name}
          onError={(e) => {
            if (topTracks.length > 0 && topTracks[0].coverUrl) {
              e.currentTarget.src = topTracks[0].coverUrl;
            }
          }}
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent" />

        {/* Détails superposés de l'artiste */}
        <div className="relative z-10 space-y-3">
          {/* Badge Artiste Vérifié */}
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <span className="w-5 h-5 rounded-full bg-[#1ed760] text-black flex items-center justify-center font-black">
              ✓
            </span>
            <span>Artiste vérifié</span>
          </div>

          {/* Nom en très grand format */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-none">
            {artist.name}
          </h1>

          {/* Nombre d'auditeurs par mois */}
          <p className="text-sm font-semibold text-white/90">
            {formatPlays(artist.monthlyListeners)} auditeurs par mois
          </p>
        </div>
      </div>

      {/* 2. Barre d'actions (Grand Play vert, Aléatoire, S'abonner, Plus) */}
      <div className="px-8 py-6 flex items-center gap-6">
        {/* Grand Bouton Play Vert Spotify */}
        <button
          onClick={() => {
            if (isCurrentArtistPlaying) {
              togglePlayPause();
            } else if (topTracks.length > 0) {
              playTrack(topTracks[0], topTracks);
            }
          }}
          className="w-14 h-14 rounded-full bg-spoot-neon flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-transform shadow-xl"
          title={isCurrentArtistPlaying ? "Mettre en pause" : `Écouter ${artist.name}`}
        >
          {isCurrentArtistPlaying ? (
            <Pause className="w-6 h-6 fill-black" />
          ) : (
            <Play className="w-6 h-6 fill-black ml-0.5" />
          )}
        </button>

        {/* Miniature de l'artiste */}
        <div className="w-9 h-9 rounded-full overflow-hidden shadow border border-white/10 hidden sm:block">
          <img src={artist.avatarUrl} alt="" className="w-full h-full object-cover" />
        </div>

        {/* Bouton Aléatoire */}
        <button
          onClick={() => {
            if (topTracks.length > 0) {
              const randIdx = Math.floor(Math.random() * topTracks.length);
              playTrack(topTracks[randIdx], topTracks);
            }
          }}
          className="text-[#b3b3b3] hover:text-white transition-colors"
          title="Lecture aléatoire"
        >
          <Shuffle className="w-6 h-6" />
        </button>

        {/* Bouton S'abonner (Screenshot 2) */}
        <button
          onClick={() => setIsFollowed(!isFollowed)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all hover:scale-105 ${
            isFollowed
              ? 'border-spoot-neon text-spoot-neon bg-spoot-neon/10'
              : 'border-[#727272] text-white hover:border-white'
          }`}
        >
          {isFollowed ? 'Abonné' : "S'abonner"}
        </button>

        {/* Options (...) */}
        <button className="text-[#b3b3b3] hover:text-white transition-colors" title="Plus d'options">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* 3. Section "Populaires" (Titres 1 à 5, Screenshot 2) */}
      <section className="px-8 space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-white">Populaires</h2>

        <div className="space-y-1">
          {displayedTracks.map((track, idx) => {
            const isThisPlaying = currentTrack?.id === track.id && isPlaying;
            const isThisCurrent = currentTrack?.id === track.id;

            return (
              <div
                key={track.id}
                onClick={() => playTrack(track, topTracks)}
                className={`flex items-center justify-between p-2 rounded-lg hover:bg-[#282828]/70 group cursor-pointer transition-colors ${
                  isThisCurrent ? 'bg-[#242424]' : ''
                }`}
              >
                {/* Numéro, Pochette, Titre */}
                <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                  <span className="w-6 text-center text-sm font-semibold text-[#727272] group-hover:hidden">
                    {isThisPlaying ? <span className="text-spoot-neon">▶</span> : idx + 1}
                  </span>
                  <button className="w-6 text-center text-white hidden group-hover:block text-sm">
                    {isThisPlaying ? <Pause className="w-4 h-4 fill-white mx-auto" /> : <Play className="w-4 h-4 fill-white mx-auto" />}
                  </button>

                  <div className="w-11 h-11 rounded overflow-hidden shrink-0 bg-[#242424] shadow-md">
                    <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="min-w-0">
                    <p className={`font-bold text-sm truncate ${
                      isThisCurrent ? 'text-spoot-neon' : 'text-white'
                    }`}>
                      {track.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-[#b3b3b3]">
                      <span className="px-1 rounded bg-white/10 text-[10px] font-bold text-[#b3b3b3]">E</span>
                      <span className="truncate">{track.artistName}</span>
                    </div>
                  </div>
                </div>

                {/* Nombre d'écoutes officiel */}
                <div className="hidden sm:block text-right text-xs font-mono text-[#b3b3b3] pr-8">
                  {formatPlays(track.playCount)}
                </div>

                {/* Durée et Favori */}
                <div className="flex items-center gap-4 text-xs font-mono text-[#b3b3b3]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(track.id);
                    }}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                      track.isFavorite ? 'opacity-100 text-spoot-neon' : 'hover:text-white'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-spoot-neon' : ''}`} />
                  </button>
                  <span>{formatDuration(track.durationMs)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bouton "Afficher plus" (Screenshot 2) */}
        {topTracks.length > 5 && (
          <button
            onClick={() => setShowAllTracks(!showAllTracks)}
            className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline pt-2 block"
          >
            {showAllTracks ? 'Afficher moins' : 'Afficher plus'}
          </button>
        )}
      </section>

      {/* 4. Section "Sélection de l'artiste" (Screenshot 2) */}
      {topTracks.length > 0 && (
        <section className="px-8 pt-8 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-white">Sélection de l'artiste</h2>

          <div
            onClick={() => playTrack(topTracks[0], topTracks)}
            className="bg-[#181818] hover:bg-[#242424] p-4 rounded-xl flex items-center gap-4 max-w-md cursor-pointer transition-colors shadow-lg group"
          >
            <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 shadow-md">
              <img src={topTracks[0].coverUrl} alt={topTracks[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[#b3b3b3]">
                <img src={artist.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                <span className="truncate">« {topTracks[0].title} » est disponible 💙💙</span>
              </div>
              <p className="font-bold text-sm text-white truncate">{topTracks[0].title}</p>
              <span className="text-xs text-[#727272] block">Single / Sortie Populaire</span>
            </div>
          </div>
        </section>
      )}

      {/* 5. Section "Discographie" (Albums, Singles, EP, Screenshot 2) */}
      <section className="px-8 pt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-white">Discographie</h2>
          <button className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline">
            Tout afficher
          </button>
        </div>

        {/* Pilules de filtrage Discographie */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDiscoTab('popular')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              discoTab === 'popular' ? 'bg-white text-black' : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
            }`}
          >
            Sorties populaires
          </button>
          <button
            onClick={() => setDiscoTab('albums')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              discoTab === 'albums' ? 'bg-white text-black' : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
            }`}
          >
            Albums
          </button>
          <button
            onClick={() => setDiscoTab('singles')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              discoTab === 'singles' ? 'bg-white text-black' : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
            }`}
          >
            Singles et EP
          </button>
        </div>

        {/* Grille de sorties */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {filteredAlbums.slice(0, 10).map((alb) => (
            <div
              key={alb.id}
              onClick={() => openAlbum(alb.id)}
              className="bg-[#181818] hover:bg-[#282828] p-3.5 rounded-lg cursor-pointer transition-all group flex flex-col shadow-md"
            >
              <div className="aspect-square w-full rounded-md overflow-hidden bg-[#242424] mb-3 shadow-lg relative">
                <img src={alb.coverUrl} alt={alb.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all">
                  <div className="w-11 h-11 rounded-full bg-spoot-neon flex items-center justify-center text-black shadow-2xl hover:scale-105">
                    <Play className="w-5 h-5 fill-black ml-0.5" />
                  </div>
                </div>
              </div>

              <h3 className="font-bold text-sm text-white truncate mb-1" title={alb.title}>
                {alb.title}
              </h3>
              <p className="text-xs text-[#b3b3b3] truncate">
                {alb.releaseYear} • {alb.type === 'album' ? 'Album' : 'Single/EP'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Section "Artistes similaires" */}
      {relatedArtists.length > 0 && (
        <section className="px-8 pt-8 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-white">Artistes similaires</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {relatedArtists.map((relArt) => (
              <div
                key={relArt.id}
                onClick={() => openArtist(relArt.id)}
                className="bg-[#181818] hover:bg-[#282828] p-4 rounded-xl cursor-pointer transition-all group flex flex-col items-center text-center shadow-md"
              >
                <div className="w-32 h-32 rounded-full overflow-hidden mb-3 bg-[#242424] shadow-xl">
                  <img src={relArt.avatarUrl} alt={relArt.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <h3 className="text-sm font-bold text-white truncate w-full">{relArt.name}</h3>
                <span className="text-xs text-[#727272] mt-0.5">Artiste</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Section "Vault" : Archives & Titres non officiels (Leaks / Morceaux retirés) */}
      <section className="px-8 pb-12">
        <UnreleasedVault artistName={artist.name} artistId={artist.id} />
      </section>
    </div>
  );
};
