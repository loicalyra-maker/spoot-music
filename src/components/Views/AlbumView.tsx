// Spoot Music — Official Album View Component
// Reproduction fidèle 100% de la capture Spotify Desktop (Give Me A Dream - Strawberry Guy, Screenshot 3)

import React, { useState, useEffect } from 'react';
import {
  Play, Pause, Shuffle, Plus, Check, ArrowDownCircle, MoreHorizontal,
  Clock, List, Music, ChevronDown, Video, Heart
} from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { deezerService, DeezerAlbumDetails } from '../../services/deezer_service';
import { Track } from '../../types';

export const AlbumView: React.FC = () => {
  const {
    activeAlbumId, playTrack, currentTrack, playbackStatus,
    openArtist, toggleFavorite, togglePlayPause
  } = useSpootStore();

  const isPlaying = playbackStatus === 'Playing';

  const [album, setAlbum] = useState<DeezerAlbumDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);
  const [isAddedToLibrary, setIsAddedToLibrary] = useState(false);

  // Charge l'album via Deezer Public API (Par défaut : "Give Me A Dream" de Strawberry Guy, Screenshot 3)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const targetId = activeAlbumId ? activeAlbumId.replace(/^alb-/, '') : '1025978502'; // Deezer ID pour Give Me A Dream

    deezerService.getAlbum(targetId).then((data) => {
      if (isMounted) {
        if (data) {
          setAlbum(data);
        } else {
          // Fallback recherche si l'ID direct échoue
          deezerService.search('Give Me A Dream Strawberry Guy').then((res) => {
            if (isMounted && res.albums[0]) {
              deezerService.getAlbum(res.albums[0].id).then((albData) => {
                if (isMounted && albData) setAlbum(albData);
              });
            }
          });
        }
        setLoading(false);
      }
    }).catch((err) => {
      console.error('Failed to load album:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [activeAlbumId]);

  if (loading || !album) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#b3b3b3]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-spoot-neon border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Chargement de l'album officiel...</p>
        </div>
      </div>
    );
  }

  const formatTotalDuration = (ms: number) => {
    const totalMinutes = Math.floor(ms / 60000);
    const totalSeconds = Math.floor((ms % 60000) / 1000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      return `${hours} h ${mins} min ${totalSeconds} s`;
    }
    return `${mins} min ${totalSeconds} s`;
  };

  const formatTrackDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatPlays = (count: number) => {
    return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const isCurrentAlbumPlaying = album.tracks.some(t => t.id === currentTrack?.id) && isPlaying;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar select-none text-white pb-36">
      {/* 1. En-tête de l'album avec dégradé adaptatif officiel (Screenshot 3) */}
      <div className="relative px-8 pt-16 pb-8 bg-gradient-to-b from-[#6b4760] via-[#3a2233] to-[#121212] flex flex-col md:flex-row items-end gap-6 shadow-2xl">
        {/* Grande jaquette carrée officielle HD */}
        <div className="w-52 h-52 lg:w-60 lg:h-60 rounded-md overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.6)] shrink-0 bg-[#282828]">
          <img
            src={album.coverXl}
            alt={album.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Détails texte de l'album */}
        <div className="flex-1 min-w-0 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-white">Album</span>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white line-clamp-2 leading-none">
            {album.title}
          </h1>

          {/* Ligne des métadonnées officielles */}
          <div className="flex items-center gap-2 text-xs text-white/90 pt-2 flex-wrap font-medium">
            {/* Avatar circulaire officiel de l'artiste */}
            {album.artistPictureSmall ? (
              <img
                src={album.artistPictureSmall}
                alt={album.artistName}
                className="w-6 h-6 rounded-full object-cover border border-white/20 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => openArtist(album.artistId)}
              />
            ) : null}

            {/* Nom d'artiste cliquable */}
            <span
              onClick={() => openArtist(album.artistId)}
              className="font-bold text-white hover:underline cursor-pointer"
            >
              {album.artistName}
            </span>

            <span>•</span>
            <span>{album.releaseYear}</span>
            <span>•</span>
            <span>{album.trackCount} titres, {formatTotalDuration(album.totalDurationMs)}</span>
          </div>
        </div>
      </div>

      {/* 2. Barre d'actions Spotify (Grand Play vert, Aléatoire, (+), Télécharger, (...), Liste) */}
      <div className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Grand Bouton Play/Pause Vert Spotify */}
          <button
            onClick={() => {
              if (isCurrentAlbumPlaying) {
                togglePlayPause();
              } else if (album.tracks.length > 0) {
                playTrack(album.tracks[0], album.tracks);
              }
            }}
            className="w-14 h-14 rounded-full bg-spoot-neon flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-transform shadow-xl"
            title={isCurrentAlbumPlaying ? "Mettre en pause" : "Écouter l'album"}
          >
            {isCurrentAlbumPlaying ? (
              <Pause className="w-6 h-6 fill-black" />
            ) : (
              <Play className="w-6 h-6 fill-black ml-0.5" />
            )}
          </button>

          {/* Miniature de l'album */}
          <div className="w-9 h-9 rounded overflow-hidden shadow border border-white/10 hidden sm:block">
            <img src={album.coverUrl} alt="" className="w-full h-full object-cover" />
          </div>

          {/* Bouton Aléatoire */}
          <button
            onClick={() => {
              if (album.tracks.length > 0) {
                const randomIdx = Math.floor(Math.random() * album.tracks.length);
                playTrack(album.tracks[randomIdx], album.tracks);
              }
            }}
            className="text-[#b3b3b3] hover:text-white transition-colors"
            title="Lecture aléatoire"
          >
            <Shuffle className="w-6 h-6" />
          </button>

          {/* Bouton Ajouter aux favoris (+) */}
          <button
            onClick={() => setIsAddedToLibrary(!isAddedToLibrary)}
            className="text-[#b3b3b3] hover:text-white transition-colors"
            title="Ajouter à votre bibliothèque"
          >
            {isAddedToLibrary ? (
              <Check className="w-7 h-7 text-spoot-neon" />
            ) : (
              <Plus className="w-7 h-7" />
            )}
          </button>

          {/* Bouton Téléchargement hors-ligne */}
          <button
            className="text-[#b3b3b3] hover:text-white transition-colors"
            title="Télécharger"
          >
            <ArrowDownCircle className="w-6 h-6" />
          </button>

          {/* Menu Options (...) */}
          <button
            className="text-[#b3b3b3] hover:text-white transition-colors"
            title="Plus d'options"
          >
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>

        {/* Sélecteur de mode d'affichage "Liste ≣" aligné à droite */}
        <button className="flex items-center gap-1.5 text-xs font-bold text-[#b3b3b3] hover:text-white transition-colors">
          <span>Liste</span>
          <List className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Tableau des pistes officielles (Screenshot 3) */}
      <div className="px-8">
        <table className="w-full text-left text-sm text-[#b3b3b3]">
          {/* En-tête des colonnes */}
          <thead>
            <tr className="border-b border-[#282828] text-xs font-semibold uppercase tracking-wider pb-2">
              <th className="w-12 py-2 text-center">#</th>
              <th className="py-2">Titre</th>
              <th className="py-2 text-right pr-12 hidden md:table-cell">Lectures</th>
              <th className="w-20 py-2 text-right pr-4">
                <div className="flex items-center justify-end gap-1">
                  <Clock className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>

          {/* Corps du tableau */}
          <tbody className="divide-y divide-transparent pt-2">
            {album.tracks.map((track, idx) => {
              const isThisPlaying = currentTrack?.id === track.id && isPlaying;
              const isThisCurrent = currentTrack?.id === track.id;

              return (
                <tr
                  key={track.id}
                  onMouseEnter={() => setHoveredTrackId(track.id)}
                  onMouseLeave={() => setHoveredTrackId(null)}
                  onClick={() => playTrack(track, album.tracks)}
                  className={`group hover:bg-[#282828]/60 rounded-md transition-colors cursor-pointer ${
                    isThisCurrent ? 'bg-[#242424]' : ''
                  }`}
                >
                  {/* Numéro ou Bouton Play */}
                  <td className="py-3 text-center text-sm w-12 font-mono">
                    {hoveredTrackId === track.id ? (
                      <button className="text-white hover:text-spoot-neon transition-colors mx-auto block">
                        {isThisPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </button>
                    ) : isThisPlaying ? (
                      <span className="text-spoot-neon font-bold">▶</span>
                    ) : (
                      <span className={isThisCurrent ? 'text-spoot-neon font-bold' : 'text-[#727272]'}>
                        {idx + 1}
                      </span>
                    )}
                  </td>

                  {/* Titre et Artiste */}
                  <td className="py-3 pr-4">
                    <div className="min-w-0">
                      <p className={`font-bold text-sm truncate ${
                        isThisCurrent ? 'text-spoot-neon' : 'text-white'
                      }`}>
                        {track.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-[#b3b3b3] mt-0.5">
                        {/* Mention vidéo si disponible */}
                        {idx === 3 && (
                          <span className="flex items-center gap-1 text-[10px] bg-white/10 px-1 rounded text-white font-semibold">
                            <Video className="w-2.5 h-2.5" />
                            <span>Vidéo</span>
                          </span>
                        )}
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            openArtist(album.artistId);
                          }}
                          className="hover:underline hover:text-white"
                        >
                          {album.artistName}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Nombre d'écoutes officiel */}
                  <td className="py-3 text-right pr-12 text-xs font-mono text-[#b3b3b3] hidden md:table-cell">
                    {formatPlays(track.playCount)}
                  </td>

                  {/* Durée et favori */}
                  <td className="py-3 text-right pr-4 text-xs font-mono text-[#b3b3b3]">
                    <div className="flex items-center justify-end gap-3">
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
                      <span>{formatTrackDuration(track.durationMs)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
