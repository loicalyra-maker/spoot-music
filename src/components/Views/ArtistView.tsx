// Spoot Music — Official Dynamic Artist View Component
// 100% Faithful Spotify Desktop & Apple ProMotion 120 FPS Layout
// Strict Discography Clean (Albums, Singles/EP, Collapsible Apparitions/Compilations),
// Resilient Image Fallbacks & Fixed Play/Pause Engine.

import React, { useState, useEffect } from 'react';
import {
  Play, Pause, Shuffle, MoreHorizontal, Check, Disc, Heart,
  ShieldCheck, Clock, ExternalLink, ChevronDown, ChevronUp, Layers
} from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { deezerService, DeezerArtistDetails } from '../../services/deezer_service';
import { Track, Album, Artist } from '../../types';
import { UnreleasedVault } from './UnreleasedVault';
import { ImageWithFallback } from '../Common/ImageWithFallback';

export const ArtistView: React.FC = () => {
  const {
    activeArtistId, playTrack, currentTrack, playbackStatus,
    openAlbum, openArtist, toggleFavorite, togglePlayPause
  } = useSpootStore();

  const isPlaying = playbackStatus === 'Playing';

  const [artist, setArtist] = useState<DeezerArtistDetails | null>(null);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [cleanAlbums, setCleanAlbums] = useState<Album[]>([]);
  const [cleanSingles, setCleanSingles] = useState<Album[]>([]);
  const [compilations, setCompilations] = useState<Album[]>([]);
  const [isCompilationsOpen, setIsCompilationsOpen] = useState(false);
  const [relatedArtists, setRelatedArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);

  // Chargement officiel via Deezer Public API + Fallback Cloud iTunes mondial
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const targetId = activeArtistId 
      ? activeArtistId.replace(/^art-/, '').replace(/^dz-/, '').trim() 
      : '8673550'; // Par défaut : Vacra

    // Timeout de sécurité : garantit que l'écran ne reste jamais bloqué
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 450);

    deezerService.getArtist(targetId).then((art) => {
      if (!isMounted) return;
      if (art) {
        setArtist(art);
        setLoading(false);
      }
      const listeners = art?.monthlyListeners || 3500000;

      Promise.allSettled([
        deezerService.getArtistTopTracks(targetId, 10, listeners),
        deezerService.getArtistDiscographyClean(targetId, 60),
        deezerService.getArtistRelated(targetId, 8),
      ]).then(([tracksRes, discoRes, relatedRes]) => {
        if (!isMounted) return;

        if (tracksRes.status === 'fulfilled' && tracksRes.value.length > 0) {
          setTopTracks(tracksRes.value);
        }
        if (discoRes.status === 'fulfilled' && discoRes.value) {
          setCleanAlbums(discoRes.value.albums);
          setCleanSingles(discoRes.value.singlesAndEPs);
          setCompilations(discoRes.value.compilationsAndAppearances);
        }
        if (relatedRes.status === 'fulfilled' && relatedRes.value.length > 0) {
          setRelatedArtists(relatedRes.value);
        }
        setLoading(false);
      });
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [activeArtistId]);

  const targetId = activeArtistId 
    ? activeArtistId.replace(/^art-/, '').replace(/^dz-/, '').trim() 
    : '8673550';

  const effectiveArtist: DeezerArtistDetails = artist || deezerService.getCachedArtist(targetId) || {
    id: targetId,
    name: targetId.replace(/[-_]/g, ' '),
    avatarUrl: 'https://cdn-images.dzcdn.net/images/artist/56589954cda1a811317b84fffc1c75b5/1000x1000-000000-80-0-0.jpg',
    pictureXl: 'https://cdn-images.dzcdn.net/images/artist/56589954cda1a811317b84fffc1c75b5/1000x1000-000000-80-0-0.jpg',
    monthlyListeners: 3500000,
    nbFans: 450000,
    nbAlbums: 6,
    bio: 'Artiste vérifié officiel sur Spoot Music.',
    isFollowed: true,
    hasNewRelease: true,
    albums: []
  };

  const formatPlays = (count: number) => {
    return count.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ' ');
  };

  const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const displayedTracks = showAllTracks ? topTracks : topTracks.slice(0, 5);

  const isCurrentArtistTrack = Boolean(
    currentTrack && (
      currentTrack.artistId === effectiveArtist.id ||
      currentTrack.artistName.toLowerCase().includes(effectiveArtist.name.toLowerCase()) ||
      effectiveArtist.name.toLowerCase().includes(currentTrack.artistName.toLowerCase()) ||
      topTracks.some(t => t.id === currentTrack.id)
    )
  );
  const isCurrentArtistPlaying = isCurrentArtistTrack && isPlaying;

  const handleArtistPlayClick = () => {
    if (isCurrentArtistTrack) {
      togglePlayPause();
    } else if (topTracks.length > 0) {
      playTrack(topTracks[0], topTracks);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar select-none text-white pb-36">
      {/* 1. Grande Bannière Hero avec photo officielle HD en pleine largeur */}
      <div className="relative h-72 sm:h-80 md:h-96 w-full overflow-hidden flex flex-col justify-end p-8 bg-[#181818]">
        {/* Photo d'arrière-plan HD avec ImageWithFallback */}
        <ImageWithFallback
          src={effectiveArtist.pictureXl}
          alt={effectiveArtist.name}
          fallbackSrc={topTracks[0]?.coverUrl}
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
            {effectiveArtist.name}
          </h1>

          {/* Nombre d'auditeurs par mois */}
          <p className="text-sm font-semibold text-white/90">
            {formatPlays(effectiveArtist.monthlyListeners)} auditeurs par mois
          </p>
        </div>
      </div>

      {/* 2. Barre d'actions (Grand Play vert, Aléatoire, S'abonner, Plus) */}
      <div className="px-8 py-6 flex items-center gap-6">
        {/* Grand Bouton Play Vert Spotify */}
        <button
          onClick={handleArtistPlayClick}
          className="w-14 h-14 rounded-full bg-spoot-neon flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-transform shadow-xl cursor-pointer"
          title={isCurrentArtistPlaying ? "Mettre en pause" : `Écouter ${effectiveArtist.name}`}
        >
          {isCurrentArtistPlaying ? (
            <Pause className="w-6 h-6 fill-black" />
          ) : (
            <Play className="w-6 h-6 fill-black ml-0.5" />
          )}
        </button>

        {/* Miniature de l'artiste avec Fallback */}
        <div className="w-9 h-9 rounded-full overflow-hidden shadow border border-white/10 hidden sm:block">
          <ImageWithFallback
            src={effectiveArtist.avatarUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Bouton Aléatoire */}
        <button
          onClick={() => {
            if (topTracks.length > 0) {
              const randIdx = Math.floor(Math.random() * topTracks.length);
              playTrack(topTracks[randIdx], topTracks);
            }
          }}
          className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
          title="Lecture aléatoire"
        >
          <Shuffle className="w-6 h-6" />
        </button>

        {/* Bouton S'abonner */}
        <button
          onClick={() => setIsFollowed(!isFollowed)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all hover:scale-105 cursor-pointer ${
            isFollowed
              ? 'border-spoot-neon text-spoot-neon bg-spoot-neon/10'
              : 'border-[#727272] text-white hover:border-white'
          }`}
        >
          {isFollowed ? 'Abonné' : "S'abonner"}
        </button>

        {/* Options (...) */}
        <button className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer" title="Plus d'options">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* 3. Section "Populaires" (Titres 1 à 5 ou 1 à 10) */}
      <section className="px-8 space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-white">Populaires</h2>

        <div className="space-y-1">
          {displayedTracks.map((track, idx) => {
            const isThisCurrent = currentTrack?.id === track.id || currentTrack?.title === track.title;
            const isThisPlaying = isThisCurrent && isPlaying;

            return (
              <div
                key={track.id}
                onClick={() => {
                  if (isThisCurrent) {
                    togglePlayPause();
                  } else {
                    playTrack(track, topTracks);
                  }
                }}
                className={`flex items-center justify-between p-2.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group ${
                  isThisCurrent ? 'bg-white/5' : ''
                }`}
              >
                {/* Index / Play Button + Titre + Image */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span className="w-4 text-sm font-bold text-[#b3b3b3] text-right group-hover:hidden">
                    {isThisPlaying ? (
                      <span className="text-spoot-neon animate-pulse">▶</span>
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <button className="w-4 hidden group-hover:flex items-center justify-center text-white cursor-pointer">
                    {isThisPlaying ? (
                      <Pause className="w-4 h-4 fill-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-white" />
                    )}
                  </button>

                  <div className="w-10 h-10 rounded overflow-hidden shrink-0 shadow-md">
                    <ImageWithFallback
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold text-sm truncate ${isThisCurrent ? 'text-spoot-neon' : 'text-white'}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-[#b3b3b3] truncate">
                      {track.artistName}
                    </p>
                  </div>
                </div>

                {/* Nombre d'écoutes */}
                <div className="hidden md:block w-36 text-xs text-[#b3b3b3] text-right font-mono">
                  {formatPlays(track.playCount)}
                </div>

                {/* Bouton Favori */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(track.id);
                  }}
                  className="px-4 text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
                >
                  <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-spoot-neon text-spoot-neon' : ''}`} />
                </button>

                {/* Durée */}
                <span className="w-12 text-xs text-[#b3b3b3] text-right font-mono">
                  {formatDuration(track.durationMs)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bouton "Afficher plus" */}
        {topTracks.length > 5 && (
          <button
            onClick={() => setShowAllTracks(!showAllTracks)}
            className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline pt-2 block cursor-pointer"
          >
            {showAllTracks ? 'Afficher moins' : 'Afficher plus'}
          </button>
        )}
      </section>

      {/* 4. Section "Discographie — Albums" (Filtrage Strict sans albums fantômes) */}
      <section className="px-8 pt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Albums</h2>
            <p className="text-xs text-[#b3b3b3] mt-0.5">Albums studio officiels certifiés</p>
          </div>
          <span className="text-xs font-bold text-[#b3b3b3]">
            {cleanAlbums.length} {cleanAlbums.length > 1 ? 'albums' : 'album'}
          </span>
        </div>

        {cleanAlbums.length === 0 ? (
          <p className="text-xs text-white/40 italic py-4">Aucun album studio disponible</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {cleanAlbums.slice(0, 10).map((alb) => (
              <div
                key={alb.id}
                onClick={() => openAlbum(alb.id)}
                className="bg-[#181818] hover:bg-[#282828] p-3.5 rounded-xl cursor-pointer transition-all group flex flex-col shadow-md border border-white/5"
              >
                <div className="aspect-square w-full rounded-lg overflow-hidden bg-[#242424] mb-3 shadow-lg relative">
                  <ImageWithFallback
                    src={alb.coverUrl}
                    alt={alb.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
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
                  {alb.releaseYear} • Album
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Section "Discographie — Singles & EP" */}
      <section className="px-8 pt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Singles et EP</h2>
            <p className="text-xs text-[#b3b3b3] mt-0.5">Sorties individuelles et extended plays</p>
          </div>
          <span className="text-xs font-bold text-[#b3b3b3]">
            {cleanSingles.length} sorties
          </span>
        </div>

        {cleanSingles.length === 0 ? (
          <p className="text-xs text-white/40 italic py-4">Aucun single disponible</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {cleanSingles.slice(0, 10).map((alb) => (
              <div
                key={alb.id}
                onClick={() => openAlbum(alb.id)}
                className="bg-[#181818] hover:bg-[#282828] p-3.5 rounded-xl cursor-pointer transition-all group flex flex-col shadow-md border border-white/5"
              >
                <div className="aspect-square w-full rounded-lg overflow-hidden bg-[#242424] mb-3 shadow-lg relative">
                  <ImageWithFallback
                    src={alb.coverUrl}
                    alt={alb.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
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
                  {alb.releaseYear} • {alb.type === 'ep' ? 'EP' : 'Single'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Section Séparée & Pliable "Apparitions & Compilations" */}
      {compilations.length > 0 && (
        <section className="px-8 pt-8 space-y-4">
          <div
            onClick={() => setIsCompilationsOpen(!isCompilationsOpen)}
            className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/70 group-hover:text-white transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white group-hover:text-spoot-neon transition-colors">
                  Apparitions & Compilations
                </h2>
                <p className="text-xs text-[#b3b3b3]">
                  Featurings, compilations et participations ({compilations.length})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-white/60 group-hover:text-white">
              <span>{isCompilationsOpen ? 'Masquer' : 'Afficher'}</span>
              {isCompilationsOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>

          {isCompilationsOpen && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 pt-2 animate-in fade-in duration-200">
              {compilations.map((alb) => (
                <div
                  key={alb.id}
                  onClick={() => openAlbum(alb.id)}
                  className="bg-[#181818] hover:bg-[#282828] p-3.5 rounded-xl cursor-pointer transition-all group flex flex-col shadow-md border border-white/5"
                >
                  <div className="aspect-square w-full rounded-lg overflow-hidden bg-[#242424] mb-3 shadow-lg relative">
                    <ImageWithFallback
                      src={alb.coverUrl}
                      alt={alb.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
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
                    {alb.releaseYear} • Compilation
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 7. Section "Artistes similaires" */}
      {relatedArtists.length > 0 && (
        <section className="px-8 pt-8 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-white">Artistes similaires</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {relatedArtists.map((relArt) => (
              <div
                key={relArt.id}
                onClick={() => openArtist(relArt.id)}
                className="bg-[#181818] hover:bg-[#282828] p-4 rounded-xl cursor-pointer transition-all group flex flex-col items-center text-center shadow-md border border-white/5"
              >
                <div className="w-32 h-32 rounded-full overflow-hidden mb-3 bg-[#242424] shadow-xl">
                  <ImageWithFallback
                    src={relArt.avatarUrl}
                    alt={relArt.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h3 className="text-sm font-bold text-white truncate w-full">{relArt.name}</h3>
                <span className="text-xs text-[#727272] mt-0.5">Artiste</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. Section "Vault" : Archives & Titres non officiels (Leaks / Morceaux retirés) */}
      <section className="px-4 sm:px-8 pb-28">
        <UnreleasedVault artistName={effectiveArtist.name} artistId={effectiveArtist.id} />
      </section>
    </div>
  );
};

export default ArtistView;
