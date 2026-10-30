// Spoot Music — Official Dynamic Playlist View with Manual Search & Contextual Suggestions
// Reproduction fidèle 100% de la capture Spotify Desktop (Screenshot 1)

import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, Shuffle, ArrowDownCircle, UserPlus, MoreHorizontal,
  Search, ListFilter, Plus, Edit2, Clock, Trash2, Check, Sparkles, Loader2,
  ChevronUp, ChevronDown, CheckCheck, Music, Heart
} from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { deezerService } from '../../services/deezer_service';
import { Track } from '../../types';
import { PlaylistOptionsMenu } from '../Playlist/PlaylistOptionsMenu';
import { EditPlaylistModal } from '../Playlist/EditPlaylistModal';
import { DeletePlaylistModal } from '../Playlist/DeletePlaylistModal';

type SortField = 'custom' | 'title' | 'artist' | 'album' | 'date' | 'duration';
type SortOrder = 'asc' | 'desc';

export const PlaylistView: React.FC = () => {
  const {
    activePlaylistId, playlists, playTrack, currentTrack,
    playbackStatus, openArtist, openAlbum, addTrackToPlaylist,
    removeTrackFromPlaylist, toggleFavorite, togglePlayPause,
    togglePlaylistOffline, setActiveView
  } = useSpootStore();

  const isPlaying = playbackStatus === 'Playing';

  // Menu d'options & Modals
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Recherche interne dans la playlist
  const [filterQuery, setFilterQuery] = useState('');
  const [showFilterInput, setShowFilterInput] = useState(false);

  // Tri de la playlist
  const [sortField, setSortField] = useState<SortField>('custom');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  // Recherche manuelle de morceaux pour enrichir la playlist
  const [enrichQuery, setEnrichQuery] = useState('');
  const [enrichResults, setEnrichResults] = useState<Track[]>([]);
  const [searchingEnrich, setSearchingEnrich] = useState(false);
  const [showEnrichSection, setShowEnrichSection] = useState(false);

  // Suggestions contextuelles dynamiques
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  // Fermer le menu de tri au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    if (isSortMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortMenuOpen]);

  // Playlist active — avec résolution transparente des identifiants équivalents
  const playlist = playlists.find((p) =>
    p.id === activePlaylistId ||
    ((activePlaylistId === 'playlist-liked' || activePlaylistId === 'liked') && (p.id === 'pl-fav' || p.title.toLowerCase() === 'titres likés'))
  );

  // Recherche en direct Deezer à chaque frappe dans enrichQuery
  useEffect(() => {
    if (!enrichQuery.trim()) {
      setEnrichResults([]);
      setSearchingEnrich(false);
      return;
    }

    setSearchingEnrich(true);
    const timer = setTimeout(async () => {
      try {
        const res = await deezerService.search(enrichQuery, 10);
        setEnrichResults(res.tracks);
      } catch (err) {
        console.error('Enrich search error:', err);
      } finally {
        setSearchingEnrich(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [enrichQuery]);

  // Chargement des recommandations contextuelles
  useEffect(() => {
    if (!playlist || playlist.tracks.length === 0) {
      deezerService.search('Tiakola SDM Guy2Bezbar', 8).then(res => {
        setRecommendations(res.tracks);
      });
      return;
    }

    setLoadingRecommendations(true);
    const lastArtist = playlist.tracks[playlist.tracks.length - 1].artistName;
    const lastArtistId = playlist.tracks[playlist.tracks.length - 1].artistId;

    deezerService.getArtistTopTracks(lastArtistId, 6).then(tracks => {
      if (tracks.length > 0) {
        setRecommendations(tracks.filter(t => !playlist.tracks.some(pt => pt.title.toLowerCase() === t.title.toLowerCase())));
      } else {
        deezerService.search(lastArtist, 6).then(res => {
          setRecommendations(res.tracks.filter(t => !playlist.tracks.some(pt => pt.title.toLowerCase() === t.title.toLowerCase())));
        });
      }
    }).finally(() => {
      setLoadingRecommendations(false);
    });
  }, [playlist?.tracks.length]);

  // Si l'ID est absent ou non trouvé dans la bibliothèque : vue 404 propre
  if (!playlist) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none text-[#b3b3b3] space-y-4">
        <div className="w-20 h-20 rounded-full bg-[#181818] flex items-center justify-center border border-[#282828] text-spoot-neon">
          <Music className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white">Playlist introuvable</h2>
        <p className="text-sm text-[#727272] max-w-md">
          Cette playlist n'existe pas ou a été supprimée de votre bibliothèque Spoot Music.
        </p>
        <button
          onClick={() => setActiveView('home')}
          className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-lg"
        >
          Retourner à l'accueil
        </button>
      </div>
    );
  }

  const handleAddTrack = (track: Track) => {
    addTrackToPlaylist(playlist.id, track);
    setAddedAnimationId(track.id);
    setTimeout(() => setAddedAnimationId(null), 1200);
  };

  const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '5 mai 2026';
    const d = new Date(timestamp);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const totalDurationMs = playlist.tracks.reduce((acc, t) => acc + t.durationMs, 0);
  const totalHours = Math.floor(totalDurationMs / 3600000);
  const totalMins = Math.floor((totalDurationMs % 3600000) / 60000);
  const durationFormatted = totalHours > 0 ? `${totalHours} h ${totalMins} min` : `${totalMins} min`;

  const isCurrentPlaylistPlaying = playlist.tracks.some(t => t.id === currentTrack?.id) && isPlaying;

  // Filtrage et Tri effectif des pistes
  let displayedTracks = [...playlist.tracks];
  if (filterQuery.trim()) {
    const q = filterQuery.toLowerCase();
    displayedTracks = displayedTracks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artistName.toLowerCase().includes(q) ||
      t.albumTitle.toLowerCase().includes(q)
    );
  }

  if (sortField === 'title') {
    displayedTracks.sort((a, b) => sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
  } else if (sortField === 'artist') {
    displayedTracks.sort((a, b) => sortOrder === 'asc' ? a.artistName.localeCompare(b.artistName) : b.artistName.localeCompare(a.artistName));
  } else if (sortField === 'album') {
    displayedTracks.sort((a, b) => sortOrder === 'asc' ? a.albumTitle.localeCompare(b.albumTitle) : b.albumTitle.localeCompare(a.albumTitle));
  } else if (sortField === 'date') {
    displayedTracks.sort((a, b) => {
      const da = a.addedAt || a.lastPlayedTimestamp || 0;
      const db = b.addedAt || b.lastPlayedTimestamp || 0;
      return sortOrder === 'asc' ? da - db : db - da;
    });
  } else if (sortField === 'duration') {
    displayedTracks.sort((a, b) => sortOrder === 'asc' ? a.durationMs - b.durationMs : b.durationMs - a.durationMs);
  }

  const handleSortSelect = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setIsSortMenuOpen(false);
  };

  const getSortLabel = () => {
    switch (sortField) {
      case 'title': return 'Titre';
      case 'artist': return 'Artiste';
      case 'album': return 'Album';
      case 'date': return "Date d'ajout";
      case 'duration': return 'Durée';
      default: return 'Tri personnalisé';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar select-none text-white pb-36">
      {/* 1. En-tête de la playlist avec dégradé officiel fidèle */}
      <div className={`relative px-8 pt-16 pb-8 flex flex-col md:flex-row items-end gap-6 shadow-2xl ${
        playlist.id === 'pl-fav' || playlist.title.toLowerCase() === 'titres likés'
          ? 'bg-gradient-to-b from-indigo-700 via-purple-900 to-[#121212]'
          : playlist.id.startsWith('mix-')
          ? 'bg-gradient-to-b from-cyan-900 via-teal-950 to-[#121212]'
          : 'bg-gradient-to-b from-[#401f5e] via-[#241238] to-[#121212]'
      }`}>
        {/* Grande jaquette carrée officielle */}
        {playlist.id === 'pl-fav' || playlist.title.toLowerCase() === 'titres likés' ? (
          <div className="w-52 h-52 lg:w-60 lg:h-60 rounded-xl overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.6)] shrink-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
            <Heart className="w-24 h-24 fill-white text-white drop-shadow-2xl" />
          </div>
        ) : (
          <div className="w-52 h-52 lg:w-60 lg:h-60 rounded-xl overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.6)] shrink-0 bg-[#282828]">
            <img
              src={playlist.coverUrl || 'https://cdn-images.dzcdn.net/images/cover/4e6b43dbc7c9bc398d6a816b34419e8a/1000x1000-000000-80-0-0.jpg'}
              alt={playlist.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Détails texte de la playlist */}
        <div className="flex-1 min-w-0 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">
            {playlist.id.startsWith('mix-') ? 'Daily Mix • Conçu pour vous' : 'Playlist publique'}
          </span>

          {/* Titre de la playlist */}
          <div className="flex items-center gap-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white line-clamp-2 leading-none">
              {playlist.title}
            </h1>
          </div>

          {playlist.description && (
            <p className="text-sm text-white/70 line-clamp-2 max-w-2xl font-medium pt-1">
              {playlist.description}
            </p>
          )}

          {/* Métadonnées : Utilisateur, Nombre de titres, Durée totale */}
          <div className="flex items-center gap-2 text-xs text-white/90 pt-3 flex-wrap font-medium">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
              <img
                src="https://cdn-images.dzcdn.net/images/artist/7774cf4dc130f4665d000669059bee1f/250x250-000000-80-0-0.jpg"
                alt="slowii"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-white hover:underline cursor-pointer">{playlist.ownerName || 'slowii'}</span>
            <span>•</span>
            <span>{playlist.tracks.length} titres, {durationFormatted}</span>
          </div>
        </div>
      </div>

      {/* 2. Barre d'actions (Grand Play vert, Aléatoire, Télécharger, Inviter, Options, Tri) */}
      <div className="px-8 py-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6">
          {/* Grand Bouton Play/Pause Vert Spotify */}
          <button
            onClick={() => {
              if (isCurrentPlaylistPlaying) {
                togglePlayPause();
              } else if (playlist.tracks.length > 0) {
                playTrack(playlist.tracks[0], playlist.tracks);
              }
            }}
            className="w-14 h-14 rounded-full bg-spoot-neon flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-transform shadow-xl"
            title={isCurrentPlaylistPlaying ? "Mettre en pause" : "Écouter la playlist"}
          >
            {isCurrentPlaylistPlaying ? (
              <Pause className="w-6 h-6 fill-black" />
            ) : (
              <Play className="w-6 h-6 fill-black ml-0.5" />
            )}
          </button>

          {/* Miniature */}
          <div className="w-9 h-9 rounded overflow-hidden shadow border border-white/10 hidden sm:block">
            <img src={playlist.coverUrl} alt="" className="w-full h-full object-cover" />
          </div>

          {/* Aléatoire */}
          <button
            onClick={() => {
              if (playlist.tracks.length > 0) {
                const rand = Math.floor(Math.random() * playlist.tracks.length);
                playTrack(playlist.tracks[rand], playlist.tracks);
              }
            }}
            className="text-[#b3b3b3] hover:text-white transition-colors"
            title="Lecture aléatoire"
          >
            <Shuffle className="w-6 h-6" />
          </button>

          {/* Téléchargement */}
          <button
            onClick={() => togglePlaylistOffline(playlist.id)}
            className={`hover:text-white transition-colors ${
              playlist.isOfflineDownloaded ? 'text-spoot-neon' : 'text-[#b3b3b3]'
            }`}
            title={playlist.isOfflineDownloaded ? "Téléchargé pour écoute hors-ligne" : "Télécharger"}
          >
            <ArrowDownCircle className="w-6 h-6" />
          </button>

          {/* Inviter des collaborateurs */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(`https://spootmusic.app/collab/${playlist.id}`).catch(() => {});
            }}
            className="text-[#b3b3b3] hover:text-white transition-colors"
            title="Inviter des collaborateurs (Lien copié)"
          >
            <UserPlus className="w-6 h-6" />
          </button>

          {/* Options (...) */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-[#b3b3b3] hover:text-white transition-colors"
              title="Plus d'options"
            >
              <MoreHorizontal className="w-6 h-6" />
            </button>
            <PlaylistOptionsMenu
              playlist={playlist}
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              onOpenEditModal={() => setIsEditModalOpen(true)}
              onOpenDeleteModal={() => setIsDeleteModalOpen(true)}
            />
          </div>
        </div>

        {/* Côté droit : Recherche et Tri personnalisé ≣ (Screenshot 1) */}
        <div className="flex items-center gap-3 text-[#b3b3b3] relative">
          {showFilterInput ? (
            <div className="flex items-center bg-[#282828] border border-white/20 rounded-full px-3 py-1 transition-all">
              <Search className="w-3.5 h-3.5 text-[#b3b3b3] mr-2" />
              <input
                type="text"
                autoFocus
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filtrer par titre, artiste..."
                className="bg-transparent text-xs text-white placeholder-[#727272] focus:outline-none w-36 sm:w-48"
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  className="text-xs text-[#b3b3b3] hover:text-white ml-1 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowFilterInput(true)}
              className="p-1.5 hover:text-white transition-colors"
              title="Filtrer les titres"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Menu déroulant de Tri */}
          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
              className="flex items-center gap-1.5 text-xs font-bold hover:text-white transition-colors py-1.5 px-2.5 rounded-full hover:bg-[#282828] border border-transparent hover:border-white/10"
              title="Trier la playlist"
            >
              <span>{getSortLabel()}</span>
              {sortField !== 'custom' && (
                <span className="text-[11px] text-spoot-neon font-black">{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
              <ListFilter className="w-4 h-4 ml-0.5" />
            </button>

            {isSortMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#282828] border border-[#3e3e3e]/80 rounded-md shadow-2xl py-1.5 z-50 text-white text-xs font-semibold animate-in fade-in duration-100 divide-y divide-white/5">
                <div className="px-3 py-1 text-[10px] font-bold text-[#727272] uppercase tracking-wider">
                  Trier par
                </div>
                <div className="py-1">
                  {[
                    { field: 'custom' as SortField, label: 'Ordre personnalisé' },
                    { field: 'title' as SortField, label: 'Titre' },
                    { field: 'artist' as SortField, label: 'Artiste' },
                    { field: 'album' as SortField, label: 'Album' },
                    { field: 'date' as SortField, label: "Date d'ajout" },
                    { field: 'duration' as SortField, label: 'Durée' },
                  ].map(({ field, label }) => (
                    <button
                      key={field}
                      onClick={() => handleSortSelect(field)}
                      className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#3e3e3e] text-[#d4d4d4] hover:text-white transition-colors"
                    >
                      <span>{label}</span>
                      {sortField === field && (
                        <span className="text-spoot-neon text-xs font-bold">
                          {sortOrder === 'asc' ? '✓' : '↓'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Boutons d'édition rapide (+ Ajouter, Nom et informations, Screenshot 1) */}
      <div className="px-8 pb-4 flex items-center gap-3">
        <button
          onClick={() => setShowEnrichSection(!showEnrichSection)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all hover:scale-105 ${
            showEnrichSection
              ? 'bg-spoot-neon text-black border-spoot-neon'
              : 'border-[#727272] text-white hover:border-white'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showEnrichSection ? 'Fermer ajout' : 'Ajouter'}</span>
        </button>

        <button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#727272] hover:border-white text-xs font-bold text-white hover:scale-105 transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Nom et informations</span>
        </button>
      </div>

      {/* 4. Tableau des pistes officielles (Screenshot 1) */}
      <div className="px-8">
        <table className="w-full text-left text-sm text-[#b3b3b3]">
          <thead>
            <tr className="border-b border-[#282828] text-xs font-semibold uppercase tracking-wider pb-2">
              <th className="w-12 py-2 text-center">#</th>
              <th
                onClick={() => handleSortSelect('title')}
                className="py-2 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Titre</span>
                  {sortField === 'title' && (
                    <span className="text-spoot-neon text-[10px]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSortSelect('album')}
                className="py-2 hidden md:table-cell cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Album</span>
                  {sortField === 'album' && (
                    <span className="text-spoot-neon text-[10px]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSortSelect('date')}
                className="py-2 hidden lg:table-cell cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Date d'ajout</span>
                  {sortField === 'date' && (
                    <span className="text-spoot-neon text-[10px]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSortSelect('duration')}
                className="w-20 py-2 text-right pr-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <Clock className="w-4 h-4" />
                  {sortField === 'duration' && (
                    <span className="text-spoot-neon text-[10px]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-transparent pt-2">
            {displayedTracks.map((track, idx) => {
              const isThisPlaying = currentTrack?.id === track.id && isPlaying;
              const isThisCurrent = currentTrack?.id === track.id;

              return (
                <tr
                  key={`${track.id}-${idx}`}
                  onMouseEnter={() => setHoveredTrackId(track.id)}
                  onMouseLeave={() => setHoveredTrackId(null)}
                  onClick={() => playTrack(track, displayedTracks)}
                  className={`group hover:bg-[#282828]/60 rounded-md transition-colors cursor-pointer ${
                    isThisCurrent ? 'bg-[#242424]' : ''
                  }`}
                >
                  {/* Numéro ou Bouton Play */}
                  <td className="py-2.5 text-center text-sm w-12 font-mono">
                    {hoveredTrackId === track.id ? (
                      <button className="text-white hover:text-spoot-neon transition-colors mx-auto block">
                        {isThisPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>
                    ) : isThisPlaying ? (
                      <span className="text-spoot-neon font-bold">▶</span>
                    ) : (
                      <span className={isThisCurrent ? 'text-spoot-neon font-bold' : 'text-[#727272]'}>
                        {idx + 1}
                      </span>
                    )}
                  </td>

                  {/* Pochette, Titre, Artiste */}
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-[#242424] shadow-md">
                        <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className={`font-bold text-sm truncate ${
                          isThisCurrent ? 'text-spoot-neon' : 'text-white'
                        }`}>
                          {track.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-[#b3b3b3] mt-0.5">
                          <span className="px-1 rounded bg-white/10 text-[9px] font-bold text-[#b3b3b3]">E</span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              openArtist(track.artistId);
                            }}
                            className="hover:underline hover:text-white truncate"
                          >
                            {track.artistName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Album */}
                  <td className="py-2.5 text-xs text-[#b3b3b3] hidden md:table-cell truncate max-w-xs">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        openAlbum(track.albumId);
                      }}
                      className="hover:underline hover:text-white"
                    >
                      {track.albumTitle}
                    </span>
                  </td>

                  {/* Date d'ajout */}
                  <td className="py-2.5 text-xs text-[#727272] hidden lg:table-cell">
                    {formatDate(track.addedAt || track.lastPlayedTimestamp)}
                  </td>

                  {/* Durée, Favori & Suppression */}
                  <td className="py-2.5 text-right pr-4 text-xs font-mono text-[#b3b3b3]">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(track.id);
                        }}
                        className={`p-1 transition-all ${
                          track.isFavorite
                            ? 'text-cyan-400 opacity-100'
                            : 'opacity-0 group-hover:opacity-100 hover:text-white text-white/50'
                        }`}
                        title={track.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-cyan-400' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTrackFromPlaylist(playlist.id, track.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-1"
                        title="Retirer de la playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span>{formatDuration(track.durationMs)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Module d'Ajout Manuel de Titres (« Chercher des titres pour enrichir votre playlist ») */}
      <section className="px-8 pt-12 space-y-4">
        <div className="border-t border-[#242424] pt-8 space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Chercher des titres pour enrichir votre playlist
          </h2>

          {/* Champ de recherche direct Deezer */}
          <div className="relative max-w-lg">
            <Search className="w-4 h-4 text-[#727272] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={enrichQuery}
              onChange={(e) => setEnrichQuery(e.target.value)}
              placeholder="Chercher des titres ou artistes..."
              className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#282828] text-sm text-white pl-10 pr-4 py-2.5 rounded-full border border-transparent focus:border-white/40 focus:outline-none transition-all"
            />
            {searchingEnrich && (
              <Loader2 className="w-4 h-4 animate-spin text-spoot-neon absolute right-3.5 top-1/2 -translate-y-1/2" />
            )}
          </div>
        </div>

        {/* Résultats en direct de la recherche d'enrichissement */}
        {enrichResults.length > 0 && (
          <div className="bg-[#181818] p-4 rounded-xl space-y-2 border border-[#242424] shadow-xl">
            <span className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider block mb-2">
              Résultats trouvés ({enrichResults.length})
            </span>
            {enrichResults.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#242424] transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-[#242424]">
                    <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">{track.title}</p>
                    <p className="text-xs text-[#b3b3b3] truncate">{track.artistName} • {track.albumTitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-[#727272]">{formatDuration(track.durationMs)}</span>
                  <button
                    onClick={() => handleAddTrack(track)}
                    className="px-4 py-1.5 rounded-full border border-[#727272] hover:border-white text-xs font-bold text-white hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 bg-[#242424] hover:bg-white hover:text-black"
                  >
                    {addedAnimationId === track.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-spoot-neon" />
                        <span>Ajouté !</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Recommandations Contextuelles Basées sur la Playlist */}
      <section className="px-8 pt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-spoot-neon" />
            <h2 className="text-xl font-bold tracking-tight text-white">Recommandations pour cette playlist</h2>
          </div>
          <span className="text-xs text-[#727272]">Basé sur vos titres récents</span>
        </div>

        <div className="space-y-1">
          {recommendations.slice(0, 5).map((track) => (
            <div
              key={track.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1f1f1f] transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-[#242424]">
                  <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-white truncate">{track.title}</p>
                  <p className="text-xs text-[#b3b3b3] truncate">{track.artistName} • {track.albumTitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono text-[#727272]">{formatDuration(track.durationMs)}</span>
                <button
                  onClick={() => handleAddTrack(track)}
                  className="px-4 py-1.5 rounded-full border border-[#727272] hover:border-white text-xs font-bold text-white hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 bg-[#242424] hover:bg-white hover:text-black"
                >
                  {addedAnimationId === track.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-spoot-neon" />
                      <span>Ajouté</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modales d'édition et de suppression */}
      <EditPlaylistModal
        playlist={playlist}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      <DeletePlaylistModal
        playlist={playlist}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
