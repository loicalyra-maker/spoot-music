// Spoot Music — Official Spotify Desktop Queue View ("File d'attente")
import React from 'react';
import { Play, Pause, Trash2, Music, Clock, ListMusic } from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';

export const QueueView: React.FC = () => {
  const {
    currentTrack, activeQueue, queueIndex, playTrack,
    playbackStatus, togglePlayPause, removeFromQueue, clearQueue,
    openArtist, openAlbum
  } = useSpootStore();

  const isPlaying = playbackStatus === 'Playing';

  const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const upcomingTracks = activeQueue.slice(queueIndex + 1);

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar select-none text-white pb-36">
      {/* En-tête */}
      <div className="flex items-center justify-between border-b border-[#242424] pb-4">
        <div className="flex items-center gap-3">
          <ListMusic className="w-7 h-7 text-spoot-neon" />
          <h1 className="text-3xl font-black tracking-tight text-white">File d'attente</h1>
        </div>

        {upcomingTracks.length > 0 && (
          <button
            onClick={clearQueue}
            className="px-4 py-1.5 rounded-full border border-[#727272] hover:border-white text-xs font-bold text-white hover:bg-white hover:text-black transition-all"
          >
            Vider la file d'attente
          </button>
        )}
      </div>

      {/* 1. Titre en cours d'écoute */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#727272]">En cours de lecture</h2>

        {currentTrack ? (
          <div className="bg-[#181818] p-4 rounded-xl flex items-center justify-between border border-white/5 shadow-md">
            <div className="flex items-center gap-4 min-w-0 pr-4">
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 rounded-full bg-spoot-neon text-black flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform shadow-lg"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
              </button>

              <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#242424] shrink-0 shadow-md">
                <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
              </div>

              <div className="min-w-0">
                <p className="font-bold text-base text-spoot-neon truncate">{currentTrack.title}</p>
                <p
                  onClick={() => openArtist(currentTrack.artistId)}
                  className="text-xs text-[#b3b3b3] hover:underline hover:text-white cursor-pointer mt-0.5 truncate"
                >
                  {currentTrack.artistName}
                </p>
                <span className="text-[10px] text-[#727272]">{currentTrack.albumTitle}</span>
              </div>
            </div>

            <div className="text-xs font-mono text-[#b3b3b3] pr-4">
              {formatDuration(currentTrack.durationMs)}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#727272]">Aucun morceau en cours d'écoute.</p>
        )}
      </section>

      {/* 2. Suivant dans la file d'attente */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#727272]">
            Suivant dans la file d'attente ({upcomingTracks.length})
          </h2>
        </div>

        {upcomingTracks.length === 0 ? (
          <div className="py-12 text-center text-[#727272] border border-dashed border-[#282828] rounded-xl">
            <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Votre file d'attente est vide.</p>
            <p className="text-xs mt-1">Ajoutez des morceaux via le menu « ... » pour enrichir votre écoute.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {upcomingTracks.map((track, i) => {
              const actualQueueIndex = queueIndex + 1 + i;
              return (
                <div
                  key={`${track.id}-${actualQueueIndex}`}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#202020] group transition-colors cursor-pointer"
                  onClick={() => playTrack(track, activeQueue)}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1 pr-4">
                    <span className="w-6 text-center text-xs font-mono text-[#727272] group-hover:hidden">
                      {i + 1}
                    </span>
                    <button className="w-6 text-center text-white hidden group-hover:block">
                      <Play className="w-3.5 h-3.5 fill-current mx-auto" />
                    </button>

                    <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-[#242424] shadow">
                      <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-sm text-white group-hover:text-spoot-neon truncate transition-colors">
                        {track.title}
                      </p>
                      <p className="text-xs text-[#b3b3b3] truncate">{track.artistName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-[#b3b3b3]">
                    <span>{formatDuration(track.durationMs)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(actualQueueIndex);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 transition-all"
                      title="Retirer de la file d'attente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
