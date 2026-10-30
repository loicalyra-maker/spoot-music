// Spoot Music — Folder Item Component (Dossier Pliable & Gestion Drag & Drop)
import React, { useState, useRef } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, MoreHorizontal, Edit2, Trash2, Music } from 'lucide-react';
import { PlaylistFolder, Playlist } from '../../types';
import { useSpootStore } from '../../store/useSpootStore';

interface FolderItemProps {
  folder: PlaylistFolder;
  playlists: Playlist[];
  activePlaylistId: string | null;
  onOpenPlaylist: (id: string) => void;
}

export const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  playlists,
  activePlaylistId,
  onOpenPlaylist,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const { renameFolder, deleteFolder, movePlaylistToFolder } = useSpootStore();
  const folderPlaylists = playlists.filter((p) => folder.playlistIds.includes(p.id));

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      renameFolder(folder.id, newName.trim());
      setIsEditing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const playlistId = e.dataTransfer.getData('text/playlist-id');
    if (playlistId) {
      movePlaylistToFolder(playlistId, folder.id);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-lg transition-colors ${
        isDragOver ? 'bg-spoot-neon/10 border border-spoot-neon/40' : ''
      }`}
    >
      {/* Folder Header */}
      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[#181818] group cursor-pointer text-white select-none relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 flex-1 min-w-0"
        >
          <div className="text-[#b3b3b3] group-hover:text-white transition-colors">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
          <div className="text-spoot-neon">
            {isOpen ? <FolderOpen className="w-5 h-5 fill-spoot-neon/20" /> : <Folder className="w-5 h-5 fill-spoot-neon/20" />}
          </div>

          {isEditing ? (
            <form onSubmit={handleRenameSubmit} onClick={(e) => e.stopPropagation()} className="flex-1">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => {
                  renameFolder(folder.id, newName.trim() || folder.name);
                  setIsEditing(false);
                }}
                autoFocus
                className="w-full bg-[#282828] text-xs font-bold text-white px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-spoot-neon"
              />
            </form>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate text-white">{folder.name}</p>
              <p className="text-[11px] text-[#727272]">
                {folderPlaylists.length} playlist{folderPlaylists.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Options Button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 text-[#727272] hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            title="Options du dossier"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Context menu */}
          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 w-44 bg-[#282828] border border-[#3e3e3e] rounded-md shadow-2xl py-1 z-50 text-xs font-semibold text-white"
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setIsEditing(true);
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#383838]"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#b3b3b3]" />
                <span>Renommer</span>
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  deleteFolder(folder.id, false);
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#383838] text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer le dossier</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenu du dossier (Playlists indentées) */}
      {isOpen && (
        <div className="pl-6 pr-1 space-y-0.5 border-l border-[#242424] ml-4 mt-0.5">
          {folderPlaylists.length === 0 ? (
            <p className="py-2 text-[11px] text-[#555555] italic">
              Glissez une playlist ici pour la ranger
            </p>
          ) : (
            folderPlaylists.map((pl) => {
              const isActive = activePlaylistId === pl.id;

              return (
                <div
                  key={pl.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/playlist-id', pl.id);
                  }}
                  onClick={() => onOpenPlaylist(pl.id)}
                  className={`flex items-center gap-2.5 p-1.5 rounded-md cursor-pointer transition-colors ${
                    isActive ? 'bg-[#282828] text-spoot-neon' : 'hover:bg-[#181818] text-[#d4d4d4]'
                  }`}
                >
                  <div className="w-7 h-7 rounded overflow-hidden bg-[#242424] shrink-0">
                    {pl.coverUrl ? (
                      <img src={pl.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-3.5 h-3.5 m-auto text-[#727272]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-spoot-neon' : 'text-white'}`}>
                      {pl.title}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
export default FolderItem;
