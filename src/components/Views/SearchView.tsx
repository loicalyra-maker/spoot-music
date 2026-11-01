// Spoot Music — Spotify Premium "Tout parcourir" & Universal Search View (Screenshot 2)
// Reproduction fidèle 100% de la vue Recherche et Cartes Anglées "Tout parcourir"

import React, { useState, useEffect } from 'react';
import {
  Search, Play, Pause, Plus, Check, Mic, Disc, User, Loader2, Music2,
  Calendar, Clock, MoreHorizontal, ArrowLeft, TrendingUp, Radio, X
} from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { VoiceAssistantButton } from '../Voice/VoiceAssistantButton';
import { spotifyApi, SpotifySearchResult } from '../../services/spotify_api';
import { deezerService, DeezerPodcast } from '../../services/deezer_service';
import { Track, PodcastEpisode } from '../../types';
import { SPOTIFY_BROWSE_CATEGORIES, BrowseCategory } from '../../data/categories_data';
import { SnippetPreviewButton } from '../Common/SnippetPreviewButton';

export const SearchView: React.FC = () => {
  const {
    searchQuery, setSearchQuery, playTrack, openArtist, openAlbum,
    playlists, addTrackToPlaylist, toggleFavorite, playbackStatus, currentTrack,
    togglePlayPause, tracks, setVoiceAssistantOpen
  } = useSpootStore();

  const isPlaying = playbackStatus === 'Playing';

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'tracks' | 'artists' | 'albums' | 'podcasts'>('all');
  const [results, setResults] = useState<SpotifySearchResult>({
    tracks: [],
    artists: [],
    albums: [],
    shows: [],
    episodes: [],
  });
  const [addedSuccessId, setAddedSuccessId] = useState<string | null>(null);

  // Catégorie sélectionnée
  const [selectedCategory, setSelectedCategory] = useState<BrowseCategory | null>(null);
  const [categoryTracks, setCategoryTracks] = useState<Track[]>([]);
  const [categoryPodcasts, setCategoryPodcasts] = useState<DeezerPodcast[]>([]);
  const [loadingCategory, setLoadingCategory] = useState(false);

  const handleCategoryClick = async (cat: BrowseCategory) => {
    setSelectedCategory(cat);
    setLoadingCategory(true);
    try {
      if (cat.id === 'cat-rankings') {
        const top50 = await deezerService.getTop50Tracks();
        setCategoryTracks(top50 && top50.length > 0 ? top50 : tracks.slice(0, 20));
      } else if (cat.id === 'cat-podcast-rankings' || cat.id === 'cat-podcasts') {
        const pods = await deezerService.getTopPodcasts();
        setCategoryPodcasts(pods);
      } else {
        const res = await deezerService.search(cat.query, 30);
        if (res && res.tracks && res.tracks.length > 0) {
          setCategoryTracks(res.tracks);
        } else {
          // Fallback déterministe avec les morceaux locaux correspondants
          const words = cat.query.toLowerCase().split(' ');
          const matching = tracks.filter((t) =>
            words.some((w) => t.title.toLowerCase().includes(w) || t.artistName.toLowerCase().includes(w))
          );
          setCategoryTracks(matching.length > 0 ? matching : tracks.slice(0, 15));
        }
      }
    } catch (err) {
      console.warn('Category fetch error, using local fallback:', err);
      setCategoryTracks(tracks.slice(0, 15));
    } finally {
      setLoadingCategory(false);
    }
  };

  // Recherche en direct à chaque frappe dans searchQuery via Deezer Public API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({ tracks: [], artists: [], albums: [], shows: [], episodes: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const deezerData = await deezerService.search(searchQuery, 30);
        setResults({
          tracks: deezerData.tracks,
          artists: deezerData.artists,
          albums: deezerData.albums,
          shows: [],
          episodes: []
        });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleQuickAdd = (playlistId: string, track: Track) => {
    addTrackToPlaylist(playlistId, track);
    setAddedSuccessId(`${track.id}-${playlistId}`);
    setTimeout(() => setAddedSuccessId(null), 1200);
  };

  const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex-1 overflow-y-auto pt-[max(env(safe-area-inset-top)+14px,20px)] px-4 pb-36 md:p-6 space-y-6 md:space-y-7 custom-scrollbar select-none text-white">
      {/* 1. Barre de Recherche Principale & Commande Vocale (Mobile & Desktop) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Recherche</h1>
          <VoiceAssistantButton
            size={38}
            onClick={() => setVoiceAssistantOpen(true)}
          />
        </div>

        {/* Capsule de Recherche avec Verre Dépoli Liquid Glass */}
        <div className="relative flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] focus-within:bg-white/[0.15] border border-white/[0.15] shadow-lg backdrop-blur-xl transition-all">
          <Search className="w-5 h-5 text-cyan-300 ml-3 shrink-0 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Que souhaitez-vous écouter ? (Titres, artistes, albums...)"
            className="flex-1 bg-transparent border-none text-sm font-semibold text-white placeholder:text-white/45 focus:outline-none py-2 px-1"
            autoFocus={false}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors mr-1.5 cursor-pointer"
              title="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Si aucune recherche active : Afficher la vue catégorie sélectionnée OU la grille "Tout parcourir" (Screenshot 2) */}
      {!searchQuery.trim() ? (
        selectedCategory ? (
          /* VUE DÉTAILLÉE D'UNE CATÉGORIE / CLASSEMENT */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Bouton Retour */}
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 text-xs font-bold text-[#b3b3b3] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à Tout parcourir</span>
            </button>

            {/* Bannière d'en-tête de la Catégorie */}
            <div
              style={{ backgroundColor: selectedCategory.hexColor }}
              className="p-8 rounded-2xl flex flex-col sm:flex-row items-end gap-6 shadow-2xl relative overflow-hidden"
            >
              <div className="w-36 h-36 rounded-lg overflow-hidden shadow-2xl shrink-0 bg-black/40">
                <img src={selectedCategory.coverUrl} alt={selectedCategory.title} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0 space-y-2 z-10">
                <span className="text-xs font-bold uppercase tracking-wider text-white/90">Spoot Hub Officiel</span>
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">{selectedCategory.title}</h1>
                <p className="text-xs text-white/80">
                  {selectedCategory.id === 'cat-rankings'
                    ? 'Le Top 50 des titres les plus écoutés dans le monde et en France en temps réel.'
                    : selectedCategory.id === 'cat-podcast-rankings'
                    ? 'Le classement officiel des émissions de podcasts les plus suivies.'
                    : `Les meilleurs morceaux et nouveautés sélectionnées pour ${selectedCategory.title}.`}
                </p>
              </div>

              {categoryTracks.length > 0 && (
                <button
                  onClick={() => playTrack(categoryTracks[0], categoryTracks)}
                  className="w-14 h-14 rounded-full bg-spoot-neon flex items-center justify-center text-black shadow-2xl hover:scale-105 active:scale-95 transition-transform z-10 shrink-0"
                  title="Écouter tout"
                >
                  <Play className="w-6 h-6 fill-black ml-0.5" />
                </button>
              )}
            </div>

            {/* Contenu */}
            {loadingCategory ? (
              <div className="py-20 text-center text-[#727272] flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-spoot-neon" />
                <span>Chargement du catalogue officiel en direct...</span>
              </div>
            ) : selectedCategory.id === 'cat-podcast-rankings' || selectedCategory.id === 'cat-podcasts' ? (
              /* Grille Podcasts */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                {categoryPodcasts.map((pod, idx) => (
                  <div
                    key={pod.id}
                    className="bg-[#181818] hover:bg-[#282828] p-4 rounded-xl transition-all group flex flex-col relative shadow-md"
                  >
                    <div className="aspect-square w-full rounded-lg overflow-hidden bg-[#242424] mb-3 shadow-lg relative">
                      <img src={pod.coverUrl} alt={pod.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-spoot-neon">
                        #{idx + 1}
                      </div>
                    </div>
                    <h3 className="font-bold text-sm text-white truncate mb-1">{pod.title}</h3>
                    <p className="text-xs text-[#b3b3b3] line-clamp-2 leading-relaxed">{pod.description}</p>
                    <span className="text-[10px] text-spoot-neon font-semibold mt-2 block">
                      {(pod.fans || 50000).toLocaleString('fr-FR')} abonnés
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* Liste des morceaux (Top 50 ou Genre) */
              <div className="space-y-1">
                {categoryTracks.map((track, idx) => {
                  const isThisPlaying = currentTrack?.id === track.id && isPlaying;
                  const isThisCurrent = currentTrack?.id === track.id;

                  return (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track, categoryTracks)}
                      className={`flex items-center justify-between p-2.5 rounded-lg hover:bg-[#282828]/70 group cursor-pointer transition-colors ${
                        isThisCurrent ? 'bg-[#242424]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                        {/* Badge de Rang 1 à 50 */}
                        <span className={`w-8 text-center text-sm font-bold ${
                          idx < 3 ? 'text-spoot-neon font-black text-base' : 'text-[#727272]'
                        }`}>
                          {idx + 1}
                        </span>

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

                      <div className="hidden md:block text-xs text-[#b3b3b3] truncate max-w-xs pr-8">
                        {track.albumTitle}
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-[#b3b3b3]">
                        <span>{formatDuration(track.durationMs)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* GRILLE TOUT PARCOURIR PAR DÉFAUT */
          <section className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Tout parcourir
            </h1>

            {/* Grille de Tuiles Colorées avec Pochettes Rotatives en bas à droite (Screenshot 2) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-5">
              {SPOTIFY_BROWSE_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  style={{ backgroundColor: cat.hexColor }}
                  className="relative h-48 rounded-2xl p-5 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl shadow-lg group border border-white/10"
                >
                  {/* Reflet Spéculaire iOS 26 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/30 pointer-events-none" />

                  {/* Titre et description de la catégorie */}
                  <div className="relative z-10 max-w-[70%]">
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight drop-shadow-md">
                      {cat.title}
                    </h2>
                    <p className="text-[11px] text-white/80 line-clamp-2 mt-1 font-medium leading-relaxed drop-shadow-sm">
                      {cat.description}
                    </p>
                  </div>

                  {/* Pochette Rotative en 3D dans le coin inférieur droit */}
                  <div className="absolute -bottom-3 -right-3 w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.5)] transform rotate-[25deg] translate-x-2 translate-y-2 pointer-events-none group-hover:scale-105 group-hover:rotate-[22deg] transition-all duration-300 border border-white/20">
                    <img
                      src={cat.coverUrl}
                      alt={cat.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&q=80';
                      }}
                    />
                  </div>

                  {/* Bouton de lecture rapide au survol */}
                  <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                    <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform">
                      <Play className="w-3.5 h-3.5 fill-black text-black ml-0.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      ) : (
        /* Si l'utilisateur est en train de chercher : Affichage des vrais résultats mondiaux */
        <div className="space-y-6">
          {/* Onglets de filtrage */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setActiveTab('tracks')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'tracks'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
              }`}
            >
              Titres
            </button>
            <button
              onClick={() => setActiveTab('artists')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'artists'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
              }`}
            >
              Artistes
            </button>
            <button
              onClick={() => setActiveTab('albums')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'albums'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
              }`}
            >
              Albums
            </button>
            <button
              onClick={() => setActiveTab('podcasts')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'podcasts'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
              }`}
            >
              Podcasts
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#b3b3b3]">
              <Loader2 className="w-8 h-8 animate-spin text-spoot-neon" />
              <p className="text-sm">Recherche dans le catalogue mondial Spotify & Deezer...</p>
            </div>
          ) : results.tracks.length === 0 && results.artists.length === 0 ? (
            <div className="py-20 text-center text-[#b3b3b3]">
              <p className="text-base font-bold text-white">Aucun résultat trouvé pour « {searchQuery} »</p>
              <p className="text-xs text-[#727272] mt-1">Vérifiez l'orthographe ou tentez une autre recherche</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Meilleur Résultat + 4 Premiers Titres */}
              {(activeTab === 'all' || activeTab === 'tracks') && results.tracks.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Meilleur Résultat */}
                  <div className="lg:col-span-5 bg-[#181818] hover:bg-[#242424] p-5 rounded-xl transition-all group relative cursor-pointer flex flex-col justify-between shadow-xl"
                    onClick={() => playTrack(results.tracks[0], results.tracks)}
                  >
                    <div>
                      <h2 className="text-xl font-bold text-white mb-4">Meilleur résultat</h2>
                      <div className="w-24 h-24 rounded-lg overflow-hidden mb-4 shadow-2xl bg-[#242424]">
                        <img
                          src={results.tracks[0].coverUrl}
                          alt={results.tracks[0].title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h3 className="text-3xl font-black text-white truncate tracking-tight">{results.tracks[0].title}</h3>
                      <p className="text-sm text-[#b3b3b3] mt-1 flex items-center gap-2">
                        <span>{results.tracks[0].artistName}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#727272]" />
                        <span className="text-xs bg-[#242424] px-2 py-0.5 rounded-full text-white font-bold uppercase">Titre</span>
                      </p>
                    </div>

                    <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all">
                      <div className="w-12 h-12 rounded-full bg-spoot-neon flex items-center justify-center text-black shadow-2xl hover:scale-105">
                        <Play className="w-6 h-6 fill-black ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* 4 Titres suivants */}
                  <div className="lg:col-span-7 space-y-2">
                    <h2 className="text-xl font-bold text-white mb-4">Titres</h2>
                    {results.tracks.slice(0, 4).map((track, idx) => (
                      <div
                        key={track.id}
                        onClick={() => playTrack(track, results.tracks)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#242424] group cursor-pointer transition-colors"
                      >
                        <div className="w-11 h-11 rounded overflow-hidden shrink-0 bg-[#242424]">
                          <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate group-hover:text-spoot-neon transition-colors">
                            {track.title}
                          </p>
                          <p className="text-xs text-[#b3b3b3] truncate">{track.artistName}</p>
                        </div>
                        <SnippetPreviewButton track={track} variant="pill" />
                        <span className="text-xs text-[#b3b3b3] hidden sm:inline">{formatDuration(track.durationMs)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(track.id);
                          }}
                          className="text-[#b3b3b3] hover:text-white p-1"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Liste Complète des Titres */}
              {activeTab === 'tracks' && (
                <div className="space-y-1">
                  {results.tracks.map((track, idx) => (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track)}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#242424] group cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <span className="w-5 text-right text-xs text-[#727272] group-hover:hidden">{idx + 1}</span>
                        <Play className="w-4 h-4 text-white hidden group-hover:block shrink-0 fill-white" />
                        <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded object-cover" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate group-hover:text-spoot-neon">{track.title}</p>
                          <p className="text-xs text-[#b3b3b3] truncate">{track.artistName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <SnippetPreviewButton track={track} variant="pill" />
                        <span className="text-xs text-[#b3b3b3]">{formatDuration(track.durationMs)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Artistes */}
              {(activeTab === 'all' || activeTab === 'artists') && results.artists.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold text-white">Artistes</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {results.artists.slice(0, 5).map((artist) => (
                      <div
                        key={artist.id}
                        onClick={() => openArtist(artist.id)}
                        className="bg-[#181818] hover:bg-[#282828] p-4 rounded-xl cursor-pointer transition-all group flex flex-col items-center text-center shadow-md"
                      >
                        <div className="w-32 h-32 rounded-full overflow-hidden mb-3 bg-[#242424] shadow-xl">
                          <img src={artist.avatarUrl} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <h3 className="text-sm font-bold text-white truncate w-full">{artist.name}</h3>
                        <span className="text-xs text-[#727272] mt-0.5">Artiste</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Albums */}
              {(activeTab === 'all' || activeTab === 'albums') && results.albums.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold text-white">Albums</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {results.albums.slice(0, 5).map((album) => (
                      <div
                        key={album.id}
                        onClick={() => openAlbum(album.id)}
                        className="bg-[#181818] hover:bg-[#282828] p-3.5 rounded-lg cursor-pointer transition-all group flex flex-col shadow-md"
                      >
                        <div className="aspect-square w-full rounded-md overflow-hidden bg-[#242424] mb-3 shadow-lg">
                          <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <h3 className="text-sm font-bold text-white truncate">{album.title}</h3>
                        <span className="text-xs text-[#b3b3b3] truncate mt-0.5">{album.artistName}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
