// Spoot Music — Add to Playlist Modal
import React, { useState } from 'react';
import { X, Plus, Check, ListMusic, Music } from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';

export const AddToPlaylistModal: React.FC = () => {
  const {
    addToPlaylistModalTrack, setAddToPlaylistModalTrack,
    playlists, addTrackToPlaylist, createPlaylist
  } = useSpootStore();

  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [addedPlaylistIds, setAddedPlaylistIds] = useState<Record<string, boolean>>({});

  if (!addToPlaylistModalTrack) return null;

  const handleAddToPlaylist = (playlistId: string) => {
    addTrackToPlaylist(playlistId, addToPlaylistModalTrack);
    setAddedPlaylistIds(prev => ({ ...prev, [playlistId]: true }));
    setTimeout(() => {
      setAddToPlaylistModalTrack(null);
    }, 800);
  };

  const handleCreateAndAdd = () => {
    if (!newPlaylistTitle.trim()) return;
    createPlaylist(newPlaylistTitle.trim());
    setNewPlaylistTitle('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#121212] border border-[#242424] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-3">
          <div className="flex items-center gap-3">
            <img
              src={addToPlaylistModalTrack.coverUrl}
              alt={addToPlaylistModalTrack.title}
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div className="truncate">
              <h2 className="text-white font-extrabold text-sm truncate">Ajouter à une playlist</h2>
              <p className="text-xs text-spoot-neon truncate">{addToPlaylistModalTrack.title} • {addToPlaylistModalTrack.artistName}</p>
            </div>
          </div>

          <button
            onClick={() => setAddToPlaylistModalTrack(null)}
            className="w-8 h-8 rounded-full bg-[#181818] border border-white/10 flex items-center justify-center text-white hover:bg-[#282828] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Playlists List */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {playlists.map((pl) => {
            const isAlreadyInside = pl.tracks.some(t => t.id === addToPlaylistModalTrack.id);
            const isJustAdded = !!addedPlaylistIds[pl.id];

            return (
              <div
                key={pl.id}
                onClick={() => handleAddToPlaylist(pl.id)}
                className="p-3 rounded-xl bg-[#161616] hover:bg-[#1e1e1e] border border-[#222222] hover:border-spoot-elevated cursor-pointer flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <ListMusic className="w-4 h-4 text-spoot-muted group-hover:text-spoot-neon transition-colors" />
                  <span className="font-bold text-xs text-white truncate">{pl.title}</span>
                </div>

                {isJustAdded ? (
                  <span className="text-[11px] font-bold text-spoot-neon flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Ajouté !
                  </span>
                ) : isAlreadyInside ? (
                  <span className="text-[10px] text-spoot-muted">Déjà présente</span>
                ) : (
                  <Plus className="w-4 h-4 text-spoot-muted group-hover:text-white" />
                )}
              </div>
            );
          })}
        </div>

        {/* Create new playlist directly */}
        <div className="pt-2 border-t border-[#1e1e1e] flex items-center gap-2">
          <input
            type="text"
            value={newPlaylistTitle}
            onChange={(e) => setNewPlaylistTitle(e.target.value)}
            placeholder="Nom de la nouvelle playlist..."
            className="flex-1 px-3 py-2 rounded-xl bg-[#181818] border border-[#282828] text-xs text-white placeholder-spoot-muted focus:outline-none focus:border-spoot-neon"
          />
          <button
            onClick={handleCreateAndAdd}
            disabled={!newPlaylistTitle.trim()}
            className="px-3 py-2 rounded-xl bg-spoot-neon text-black font-bold text-xs hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Créer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
