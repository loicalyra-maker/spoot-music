// Spoot Music — Listening History Drawer (Historique d'Écoute Chronologique)
import React from 'react';
import { X, Play, Clock, Trash2, Music } from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';

export const ListeningHistoryDrawer: React.FC = () => {
  const {
    isHistoryOpen,
    setHistoryOpen,
    listeningHistory,
    clearListeningHistory,
    playTrack,
    currentTrack,
    playbackStatus,
  } = useSpootStore();

  const isPlaying = playbackStatus === 'Playing';

  if (!isHistoryOpen) return null;

  const formatTimeAgo = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days} j`;
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-[#121212] border-l border-[#282828] z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#242424]">
        <div className="flex items-center gap-2 text-white">
          <Clock className="w-5 h-5 text-spoot-neon" />
          <h2 className="text-base font-black tracking-tight">Récemment écoutés</h2>
        </div>

        <div className="flex items-center gap-2">
          {listeningHistory.length > 0 && (
            <button
              onClick={clearListeningHistory}
              className="p-1.5 text-[#727272] hover:text-red-400 hover:bg-white/5 rounded-full transition-colors"
              title="Effacer l'historique"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setHistoryOpen(false)}
            className="p-1.5 text-[#b3b3b3] hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 custom-scrollbar">
        {listeningHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#727272]">
            <Music className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-semibold">Aucun morceau récent</p>
            <p className="text-xs mt-1 text-[#555555]">
              Vos morceaux écoutés apparaîtront ici chronologiquement.
            </p>
          </div>
        ) : (
          listeningHistory.map((item) => {
            const isThisPlaying = currentTrack?.id === item.track.id && isPlaying;
            const isThisCurrent = currentTrack?.id === item.track.id;

            return (
              <div
                key={item.id}
                onClick={() => playTrack(item.track)}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer group hover:bg-[#202020] transition-colors ${
                  isThisCurrent ? 'bg-[#1a1a1a]' : ''
                }`}
              >
                <div className="relative w-12 h-12 rounded overflow-hidden shrink-0 bg-[#242424] shadow-md">
                  <img
                    src={item.track.coverUrl}
                    alt={item.track.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-bold truncate ${
                      isThisCurrent ? 'text-spoot-neon' : 'text-white'
                    }`}
                  >
                    {item.track.title}
                  </p>
                  <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
                    {item.track.artistName}
                  </p>
                  <span className="text-[10px] text-[#727272] block mt-0.5">
                    {formatTimeAgo(item.playedAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
export default ListeningHistoryDrawer;
