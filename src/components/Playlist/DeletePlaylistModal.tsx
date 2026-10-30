// Spoot Music — Official Spotify "Supprimer de votre bibliothèque ?" Confirmation Modal
// Reproduction fidèle 100% de la fenêtre de confirmation de suppression de Spotify Desktop

import React, { useEffect } from 'react';
import { Playlist } from '../../types';
import { useSpootStore } from '../../store/useSpootStore';

interface DeletePlaylistModalProps {
  playlist: Playlist;
  isOpen: boolean;
  onClose: () => void;
}

export const DeletePlaylistModal: React.FC<DeletePlaylistModalProps> = ({
  playlist,
  isOpen,
  onClose,
}) => {
  const { deletePlaylist } = useSpootStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDelete = () => {
    deletePlaylist(playlist.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-[#282828] text-white rounded-lg shadow-2xl border border-[#3e3e3e]/80 p-6 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold tracking-tight text-white">
          Supprimer de votre bibliothèque ?
        </h2>

        <p className="text-sm text-[#b3b3b3] leading-relaxed">
          Cette action supprimera définitivement <span className="font-bold text-white">« {playlist.title} »</span> de <span className="font-bold text-white">Votre bibliothèque</span>.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full font-bold text-sm text-white hover:text-white/80 hover:scale-105 active:scale-95 transition-all"
          >
            Annuler
          </button>

          <button
            onClick={handleDelete}
            className="px-6 py-2.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};
