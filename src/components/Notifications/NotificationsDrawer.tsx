// Spoot Music — Interactive Notifications & New Releases Drawer (NotificationsDrawer.tsx)
// Real releases, playable tracks, artist updates & unread badges
import React, { useState } from 'react';
import {
  Bell, X, Play, Check, Sparkles, Disc, Radio, ExternalLink,
  Flame, Calendar, Music2, CheckCheck
} from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { Track } from '../../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SpootNotification {
  id: string;
  type: 'release' | 'playlist' | 'artist';
  title: string;
  subtitle: string;
  artistName: string;
  artistId?: string;
  coverUrl: string;
  timeAgo: string;
  isRead: boolean;
  track?: Partial<Track>;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const { playTrack, openArtist, openPlaylist } = useSpootStore();

  const [filter, setFilter] = useState<'all' | 'releases' | 'alerts'>('all');
  const [notifications, setNotifications] = useState<SpootNotification[]>([
    {
      id: 'notif-1',
      type: 'release',
      title: 'CARTIER SANTOS',
      subtitle: 'Nouvel album « ALVALM » disponible en Hi-Res',
      artistName: 'SDM',
      artistId: '604107',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
      timeAgo: 'Il y a 2 heures',
      isRead: false,
      track: {
        id: 'sdm-cartier',
        title: 'CARTIER SANTOS',
        artistName: 'SDM',
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
        durationMs: 183000,
      },
    },
    {
      id: 'notif-2',
      type: 'release',
      title: 'Monaco',
      subtitle: 'Nouveau single explosif avec clip exclusif',
      artistName: 'Guy2Bezbar',
      artistId: '11026886',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
      timeAgo: 'Hier',
      isRead: false,
      track: {
        id: 'guy2-monaco',
        title: 'Monaco',
        artistName: 'Guy2Bezbar',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
        durationMs: 195000,
      },
    },
    {
      id: 'notif-3',
      type: 'playlist',
      title: 'Votre Daily Mix 01 a été mis à jour',
      subtitle: '8 nouveaux titres sélectionnés selon vos écoutes récentes',
      artistName: 'Spoot Algorithme Hi-Res',
      coverUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80',
      timeAgo: 'Ce matin',
      isRead: false,
    },
    {
      id: 'notif-4',
      type: 'release',
      title: 'PONA NINI',
      subtitle: 'Nouveau hit en featuring avec SDM',
      artistName: 'Tiakola',
      artistId: '13918545',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
      timeAgo: 'Il y a 3 jours',
      isRead: true,
      track: {
        id: 'tiakola-pona',
        title: 'PONA NINI',
        artistName: 'Tiakola',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
        durationMs: 210000,
      },
    },
    {
      id: 'notif-5',
      type: 'artist',
      title: 'Strawberry Guy en tournée européenne',
      subtitle: 'Nouvelles dates annoncées pour 2026',
      artistName: 'Strawberry Guy',
      artistId: '14510531',
      coverUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&q=80',
      timeAgo: 'Il y a 5 jours',
      isRead: true,
    },
  ]);

  if (!isOpen) return null;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handlePlayNotification = (notif: SpootNotification) => {
    if (notif.track) {
      const fullTrack: Track = {
        id: notif.track.id || `notif-track-${Date.now()}`,
        isrc: `FR-NOTIF-${Date.now()}`,
        title: notif.track.title || notif.title,
        artistId: notif.artistId || 'artist-spoot',
        artistName: notif.artistName,
        albumId: 'notif-alb',
        albumTitle: notif.title,
        coverUrl: notif.coverUrl,
        durationMs: notif.track.durationMs || 180000,
        sampleRate: 48000,
        bitDepth: 24,
        bitrateKbps: 1411,
        formatLabel: 'Hi-Res 24-bit Flac',
        releaseDate: '2026',
        playCount: 150000,
        lastPlayedTimestamp: Date.now(),
        isFavorite: false,
        isOfflineDownloaded: false,
        palette: { primary: '#06b6d4', secondary: '#121212' },
        acousticVector: {
          bpm: 120,
          camelotKey: '8B',
          energy: 0.8,
          valence: 0.6,
          danceability: 0.7,
          acousticness: 0.2,
          loudnessLufs: -6,
          decade: 2026,
          genre: 'Nouveautés',
        },
        lyrics: [],
      };
      playTrack(fullTrack);
    } else if (notif.type === 'playlist') {
      openPlaylist('mix-1');
      onClose();
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'releases') return n.type === 'release';
    if (filter === 'alerts') return n.type === 'artist' || n.type === 'playlist';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md h-full bg-zinc-950/95 border-l border-white/[0.12] backdrop-blur-3xl shadow-2xl flex flex-col text-white animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/[0.10] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-teal-400 flex items-center justify-center text-black font-black shadow-md">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                <span>Nouveautés & Alertes</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-cyan-400 text-black text-[10px] font-black">
                    {unreadCount}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-cyan-200/70">
                Sorties officielles & mises à jour de vos artistes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-1.5 text-xs text-cyan-300 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
                title="Tout marquer comme lu"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="px-6 py-3 border-b border-white/[0.06] flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-white text-black shadow-md'
                : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white'
            }`}
          >
            Toutes ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('releases')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              filter === 'releases'
                ? 'bg-white text-black shadow-md'
                : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white'
            }`}
          >
            Sorties musicales
          </button>
          <button
            onClick={() => setFilter('alerts')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              filter === 'alerts'
                ? 'bg-white text-black shadow-md'
                : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white'
            }`}
          >
            Mises à jour
          </button>
        </div>

        {/* Liste des notifications */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredNotifs.map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 rounded-2xl border transition-all duration-200 group relative flex items-start gap-3.5 cursor-pointer ${
                notif.isRead
                  ? 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
                  : 'bg-cyan-500/[0.08] border-cyan-400/30 hover:bg-cyan-500/[0.12]'
              }`}
              onClick={() => handlePlayNotification(notif)}
            >
              {/* Image de la pochette avec fallback */}
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-md relative bg-zinc-900 border border-white/10">
                <img
                  src={notif.coverUrl}
                  alt={notif.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    // Fallback vers image de secours si indisponible
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80';
                  }}
                />
                {notif.track && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                      <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                    </div>
                  </div>
                )}
              </div>

              {/* Contenu textuel */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-cyan-300">
                    {notif.type === 'release' ? 'Nouvelle sortie' : notif.type === 'playlist' ? 'Mix actualisé' : 'Artiste'}
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">{notif.timeAgo}</span>
                </div>

                <h3 className="font-bold text-sm text-white truncate leading-tight group-hover:text-cyan-200 transition-colors">
                  {notif.title}
                </h3>
                <p className="text-xs text-white/60 truncate mt-0.5">{notif.subtitle}</p>
                <p className="text-[11px] font-semibold text-cyan-300/80 mt-1">{notif.artistName}</p>
              </div>

              {!notif.isRead && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1 shadow-[0_0_8px_#22d3ee]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsDrawer;
