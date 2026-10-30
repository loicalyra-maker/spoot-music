// Spoot Music — Official Playlist Context Menu Component (...)
// Exact Reproduction of Spotify Desktop Options Menu (Screenshot: media_1793322464512_d5e0ea9c.png)

import React, { useRef, useEffect } from 'react';
import {
  ListPlus, User, Edit3, MinusCircle, ArrowDownCircle, Lock, Unlock,
  UserPlus, Ban, FolderInput, Plus, Share2, ChevronRight
} from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { Playlist } from '../../types';

interface PlaylistOptionsMenuProps {
  playlist: Playlist;
  isOpen: boolean;
  onClose: () => void;
  onOpenEditModal: () => void;
  onOpenDeleteModal: () => void;
}

export const PlaylistOptionsMenu: React.FC<PlaylistOptionsMenuProps> = ({
  playlist,
  isOpen,
  onClose,
  onOpenEditModal,
  onOpenDeleteModal,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  const {
    addPlaylistToQueue,
    togglePlaylistOffline,
    togglePlaylistPrivacy,
    togglePlaylistProfile,
    togglePlaylistTasteProfile,
    createSimilarPlaylist,
  } = useSpootStore();

  // Fermer le menu lors d'un clic extérieur ou appui sur Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleShare = () => {
    const shareUrl = `https://spootmusic.app/playlist/${playlist.id}`;
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    onClose();
  };

  const handleInvite = () => {
    const colabUrl = `https://spootmusic.app/collab/${playlist.id}`;
    navigator.clipboard.writeText(colabUrl).catch(() => {});
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute top-full left-0 mt-2 w-64 bg-[#282828] border border-[#3e3e3e]/60 rounded-md shadow-2xl py-1.5 z-50 text-white select-none animate-in fade-in duration-100 text-sm font-semibold divide-y divide-[#3e3e3e]/40"
    >
      {/* 1. Groupe Principal */}
      <div className="py-1">
        {/* Ajouter à la file d'attente */}
        <button
          onClick={() => {
            addPlaylistToQueue(playlist.id);
            onClose();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-[#3e3e3e] hover:text-white text-[#d4d4d4] transition-colors"
        >
          <ListPlus className="w-4 h-4 text-[#b3b3b3]" />
          <span>Ajouter à la file d'attente</span>
        </button>

        {/* Ajouter / Retirer du profil */}
        <button
          onClick={() => {
            togglePlaylistProfile(playlist.id);
            onClose();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-[#3e3e3e] hover:text-white text-[#d4d4d4] transition-colors"
        >
          <User className="w-4 h-4 text-[#b3b3b3]" />
          <span>{playlist.isAddedToProfile ? 'Retirer du profil' : 'Ajouter au profil'}</span>
        </button>

        {/* Modifier les informations */}
        <button
          onClick={() => {
            onClose();
            onOpenEditModal();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-[#3e3e3e] hover:text-white text-[#d4d4d4] transition-colors"
        >
          <Edit3 className="w-4 h-4 text-[#b3b3b3]" />
          <span>Modifier les informations</span>
        </button>

        {/* Supprimer */}
        <button
          onClick={() => {
            onClose();
            onOpenDeleteModal();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-[#3e3e3e] text-red-400 hover:text-red-300 transition-colors"
        >
          <MinusCircle className="w-4 h-4 text-red-400" />
          <span>Supprimer</span>
        </button>
      </div>

      {/* 2. Groupe Hors-ligne & Confidentialité */}
      <div className="py-1">
        {/* Télécharger */}
        <button
          onClick={() => {
            togglePlaylistOffline(playlist.id);
            onClose();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-[#3e3e3e] hover:text-white text-[#d4d4d4] transition-colors"
        >
          <ArrowDownCircle className={`w-4 h-4 ${playlist.isOfflineDownloaded ? 'text-spoot-neon' : 'text-[#b3b3b3]'}`} />
          <span>{playlist.isOfflineDownloaded ? 'Téléchargé (Hors-ligne)' : 'Télécharger'}</span>
        </button>

        {/* Rendre privée / Rendre publique */}
        <button
          onClick={() => {
            togglePlaylistPrivacy(playlist.id);
            onClose();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-[#3e3e3e] hover:text-white text-[#d4d4d4] transition-colors"
        >
          {playlist.isPrivate ? (
            <Unlock className="w-4 h-4 text-[#b3b3b3]" />
          ) : (
            <Lock className="w-4 h-4 text-[#b3b3b3]" />
          )}
          <span>{playlist.isPrivate ? 'Rendre publique' : 'Rendre privée'}</span>
        </button>

        {/* Inviter des collaborateurs */}
        <button
          onClick={handleInvite}
          className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-[#3e3e3e] hover:text-white text-[#d4d4d4] transition-colors"
        >
          <UserPlus className="w-4 h-4 text-[#b3b3b3]" />
          <span>Inviter des collaborateurs</span>
        </button>

        {/* Exclure de votre profil d'écoute */}
        <button
          onClick={() => {
            togglePlaylistTasteProfile(playlist.id);
            onClose();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-[#3e3e3e] hover:text-white text-[#d4d4d4] transition-colors"
        >
          <Ban className="w-4 h-4 text-[#b3b3b3]" />
          <span>{playlist.excludeFromTasteProfile ? 'Inclure dans le profil' : 'Exclure de votre profil d\'écoute'}</span>
        </button>
      </div>

      {/* 3. Groupe Organisation & Partage */}
      <div className="py-1">
        {/* Créer une playlist similaire */}
        <button
          onClick={() => {
            createSimilarPlaylist(playlist.id);
            onClose();
          }}
          className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#3e3e3e] hover:text-white text-[#d4d4d4] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Plus className="w-4 h-4 text-[#b3b3b3]" />
            <span>Créer une playlist similaire</span>
          </div>
        </button>

        {/* Déplacer vers le dossier */}
        <button
          onClick={onClose}
          className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#3e3e3e] hover:text-white text-[#d4d4d4] transition-colors"
        >
          <div className="flex items-center gap-3">
            <FolderInput className="w-4 h-4 text-[#b3b3b3]" />
            <span>Déplacer vers le dossier</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#727272]" />
        </button>

        {/* Partager */}
        <button
          onClick={handleShare}
          className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#3e3e3e] hover:text-white text-[#d4d4d4] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Share2 className="w-4 h-4 text-[#b3b3b3]" />
            <span>Partager</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#727272]" />
        </button>
      </div>
    </div>
  );
};
export default PlaylistOptionsMenu;
