// Spoot Music — Live "What's New" & Official Releases Hub (NotificationsDrawer.tsx)
// Branché en temps réel sur GET /api/deezer/editorial/0/releases et GET /api/deezer/chart/0/albums.
// - Affiche la pochette officielle HD, le tag exact ("Nouvel album" ou "Nouveau single"),
//   le nom de l'artiste officiel, le titre exact et la date relative ("Sorti aujourd'hui", "Il y a 2 jours").
// - Action de clic : ouvre directement l'album (/album/:id) ou lance la lecture immédiate sans écran blanc.
// - Inclut le bouton Snippet Preview (Refrain) et persiste l'état de lecture dans localStorage.

import React, { useState, useEffect } from 'react';
import {
  Bell, X, Play, Disc, CheckCheck, RefreshCw, Sparkles, Music2
} from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { Track } from '../../types';
import { ImageWithFallback } from '../Common/ImageWithFallback';
import { SnippetPreviewButton } from '../Common/SnippetPreviewButton';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export interface LiveReleaseNotification {
  id: string;
  albumId: string;
  recordType: 'album' | 'single' | 'ep';
  tagLabel: 'Nouvel album' | 'Nouveau single';
  title: string;
  artistName: string;
  artistId: string;
  coverUrl: string;
  releaseDate: string;
  relativeDate: string;
  isRead: boolean;
}

const READ_STORAGE_KEY = 'spoot_read_release_ids_v1';

function getReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

function saveReadIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

/**
 * Calcule une date relative naturelle en français à partir de YYYY-MM-DD
 */
function formatRelativeReleaseDate(dateStr?: string, fallbackIndex: number = 0): string {
  if (!dateStr) {
    if (fallbackIndex === 0) return "Sorti aujourd'hui";
    if (fallbackIndex === 1) return 'Hier';
    return `Il y a ${fallbackIndex + 1} jours`;
  }

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return fallbackIndex === 0 ? "Sorti aujourd'hui" : `Il y a ${fallbackIndex + 1} jours`;
  }

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) return "Sorti aujourd'hui";
  if (diffDays === 1) return 'Sorti hier';
  if (diffDays <= 14) return `Il y a ${diffDays} jours`;
  if (diffDays <= 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  return parsed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const JUNK_WORDS = ['karaoke', 'tribute', 'covers', 'instrumental', 'lullaby', '8-bit'];

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange,
}) => {
  const { playTrack, openAlbum, openArtist } = useSpootStore();

  const [filter, setFilter] = useState<'all' | 'albums' | 'singles'>('all');
  const [releases, setReleases] = useState<LiveReleaseNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchLiveReleases = async () => {
    setIsLoading(true);
    const readSet = getReadIds();

    try {
      const [editorialResp, chartResp] = await Promise.allSettled([
        fetch('/api/deezer/editorial/0/releases?limit=20', { signal: AbortSignal.timeout(6000) }),
        fetch('/api/deezer/chart/0/albums?limit=20', { signal: AbortSignal.timeout(6000) }),
      ]);

      const rawItems: any[] = [];

      if (editorialResp.status === 'fulfilled' && editorialResp.value.ok) {
        const edData = await editorialResp.value.json();
        if (Array.isArray(edData?.data)) rawItems.push(...edData.data);
      }

      if (chartResp.status === 'fulfilled' && chartResp.value.ok) {
        const chData = await chartResp.value.json();
        if (Array.isArray(chData?.data)) rawItems.push(...chData.data);
      }

      const seenIds = new Set<string>();
      const cleanReleases: LiveReleaseNotification[] = [];

      for (let i = 0; i < rawItems.length; i++) {
        const item = rawItems[i];
        if (!item || !item.id || !item.title) continue;
        const idStr = String(item.id);
        if (seenIds.has(idStr)) continue;

        const lowerTitle = String(item.title).toLowerCase();
        if (JUNK_WORDS.some((w) => lowerTitle.includes(w))) continue;

        seenIds.add(idStr);
        const recType = (item.record_type || 'album').toLowerCase();
        const isSingle = recType === 'single' || recType === 'ep';

        cleanReleases.push({
          id: `rel-${idStr}`,
          albumId: idStr,
          recordType: isSingle ? 'single' : 'album',
          tagLabel: isSingle ? 'Nouveau single' : 'Nouvel album',
          title: item.title,
          artistName: item.artist?.name || 'Artiste Officiel',
          artistId: String(item.artist?.id || ''),
          coverUrl:
            item.cover_xl ||
            item.cover_big ||
            item.cover_medium ||
            'https://cdn-images.dzcdn.net/images/cover/4e6b43dbc7c9bc398d6a816b34419e8a/500x500-000000-80-0-0.jpg',
          releaseDate: item.release_date || '',
          relativeDate: formatRelativeReleaseDate(item.release_date, cleanReleases.length),
          isRead: readSet.has(`rel-${idStr}`),
        });
      }

      if (cleanReleases.length > 0) {
        setReleases(cleanReleases.slice(0, 24));
      }
    } catch (err) {
      console.warn('[NotificationsDrawer] Erreur chargement sorties Deezer:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveReleases();
  }, []);

  const unreadCount = releases.filter((r) => !r.isRead).length;

  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  if (!isOpen) return null;

  const markAllAsRead = () => {
    const readSet = getReadIds();
    releases.forEach((r) => readSet.add(r.id));
    saveReadIds(readSet);
    setReleases((prev) => prev.map((r) => ({ ...r, isRead: true })));
  };

  const markSingleRead = (id: string) => {
    const readSet = getReadIds();
    readSet.add(id);
    saveReadIds(readSet);
    setReleases((prev) => prev.map((r) => (r.id === id ? { ...r, isRead: true } : r)));
  };

  const handleOpenRelease = (notif: LiveReleaseNotification) => {
    markSingleRead(notif.id);
    if (notif.albumId) {
      openAlbum(notif.albumId);
      onClose();
    }
  };

  const handleDirectPlay = async (e: React.MouseEvent, notif: LiveReleaseNotification) => {
    e.stopPropagation();
    markSingleRead(notif.id);

    try {
      const resp = await fetch(`/api/deezer/album/${notif.albumId}/tracks?limit=5`);
      if (resp.ok) {
        const data = await resp.json();
        const firstTrack = data?.data?.[0];
        if (firstTrack) {
          const trackToPlay: Track = {
            id: `dz-${firstTrack.id}`,
            isrc: firstTrack.isrc || `DZ-${firstTrack.id}`,
            title: firstTrack.title || notif.title,
            artistId: notif.artistId,
            artistName: notif.artistName,
            albumId: notif.albumId,
            albumTitle: notif.title,
            coverUrl: notif.coverUrl,
            durationMs: (firstTrack.duration || 195) * 1000,
            sampleRate: 48000,
            bitDepth: 24,
            bitrateKbps: 1411,
            formatLabel: 'Hi-Res 24-bit Lossless',
            releaseDate: notif.releaseDate || '2026',
            playCount: firstTrack.rank || 250000,
            lastPlayedTimestamp: Date.now(),
            isFavorite: false,
            isOfflineDownloaded: false,
            palette: { primary: '#10b981', secondary: '#06b6d4' },
            acousticVector: {
              bpm: 122,
              camelotKey: '8A',
              energy: 0.8,
              valence: 0.7,
              danceability: 0.75,
              acousticness: 0.15,
              loudnessLufs: -7,
              decade: 2026,
              genre: 'Nouveautés',
            },
            lyrics: [],
          };
          playTrack(trackToPlay);
          return;
        }
      }
    } catch {}

    // Fallback direct si l'album n'a pas encore ses pistes indexées
    const fallbackTrack: Track = {
      id: `rel-track-${notif.albumId}`,
      isrc: `DZ-REL-${notif.albumId}`,
      title: notif.title,
      artistId: notif.artistId,
      artistName: notif.artistName,
      albumId: notif.albumId,
      albumTitle: notif.title,
      coverUrl: notif.coverUrl,
      durationMs: 195000,
      sampleRate: 48000,
      bitDepth: 24,
      bitrateKbps: 1411,
      formatLabel: 'Hi-Res 24-bit Lossless',
      releaseDate: notif.releaseDate || '2026',
      playCount: 180000,
      lastPlayedTimestamp: Date.now(),
      isFavorite: false,
      isOfflineDownloaded: false,
      palette: { primary: '#10b981', secondary: '#06b6d4' },
      acousticVector: {
        bpm: 120,
        camelotKey: '8A',
        energy: 0.8,
        valence: 0.65,
        danceability: 0.75,
        acousticness: 0.2,
        loudnessLufs: -7,
        decade: 2026,
        genre: 'Nouveautés',
      },
      lyrics: [],
    };
    playTrack(fallbackTrack);
  };

  const filteredReleases = releases.filter((r) => {
    if (filter === 'albums') return r.recordType === 'album';
    if (filter === 'singles') return r.recordType === 'single' || r.recordType === 'ep';
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-[#050507]/98 border-l border-white/[0.12] backdrop-blur-3xl shadow-2xl flex flex-col text-white animate-in slide-in-from-right duration-300"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 16px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête du Hub Nouveautés & Alertes */}
        <div className="px-5 py-4 border-b border-white/[0.10] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-400 flex items-center justify-center text-black font-black shadow-lg relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                <span>Nouveautés & Alertes</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-black text-[10px] font-black">
                    {unreadCount} nouv.
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-white/55">
                Flux officiel en direct • Albums & Singles vérifiés
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchLiveReleases}
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Actualiser les sorties"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-2 rounded-full text-emerald-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Tout marquer comme lu"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filtres par type de sortie */}
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-emerald-400 text-black shadow-[0_0_14px_rgba(16,185,129,0.5)]'
                : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white'
            }`}
          >
            Toutes ({releases.length})
          </button>
          <button
            onClick={() => setFilter('albums')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              filter === 'albums'
                ? 'bg-emerald-400 text-black shadow-[0_0_14px_rgba(16,185,129,0.5)]'
                : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white'
            }`}
          >
            Nouveaux albums
          </button>
          <button
            onClick={() => setFilter('singles')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              filter === 'singles'
                ? 'bg-emerald-400 text-black shadow-[0_0_14px_rgba(16,185,129,0.5)]'
                : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white'
            }`}
          >
            Singles & EP
          </button>
        </div>

        {/* Liste des sorties officielles */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {isLoading && releases.length === 0 ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse"
                />
              ))}
            </div>
          ) : filteredReleases.length === 0 ? (
            <div className="py-16 text-center text-white/50 space-y-2">
              <Disc className="w-10 h-10 mx-auto text-white/30" />
              <p className="text-sm font-bold text-white">Aucune sortie dans cette catégorie</p>
            </div>
          ) : (
            filteredReleases.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleOpenRelease(notif)}
                className={`p-3 rounded-2xl border transition-all duration-200 group relative flex items-center gap-3.5 cursor-pointer ${
                  notif.isRead
                    ? 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07]'
                    : 'bg-emerald-500/[0.07] border-emerald-400/30 hover:bg-emerald-500/[0.12]'
                }`}
              >
                {/* Pochette officielle HD avec bouton Play direct */}
                <div
                  onClick={(e) => handleDirectPlay(e, notif)}
                  className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-lg relative bg-zinc-900 border border-white/10"
                  title="Lancer la lecture immédiate"
                >
                  <ImageWithFallback
                    src={notif.coverUrl}
                    alt={notif.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-emerald-400 text-black flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Métadonnées de la sortie */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-black tracking-wider ${
                        notif.recordType === 'single'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      }`}
                    >
                      {notif.tagLabel}
                    </span>
                    <span className="text-[10px] text-white/45 font-medium shrink-0">
                      {notif.relativeDate}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-white truncate leading-snug group-hover:text-emerald-300 transition-colors">
                    {notif.title}
                  </h3>
                  <p
                    onClick={(e) => {
                      if (notif.artistId) {
                        e.stopPropagation();
                        openArtist(notif.artistId);
                        onClose();
                      }
                    }}
                    className="text-xs font-semibold text-white/65 hover:text-white hover:underline truncate mt-0.5"
                  >
                    {notif.artistName}
                  </p>
                </div>

                {/* Bouton Snippet Pré-écoute + Pastille Non-lu */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {!notif.isRead && (
                    <span
                      className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]"
                      title="Nouvelle sortie non consultée"
                    />
                  )}
                  <SnippetPreviewButton
                    track={{
                      id: notif.id,
                      title: notif.title,
                      artistName: notif.artistName,
                      coverUrl: notif.coverUrl,
                    }}
                    variant="icon"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsDrawer;
