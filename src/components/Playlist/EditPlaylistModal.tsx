// Spoot Music — Official Spotify "Modifier les informations" Modal
// Reproduction fidèle 100% de la fenêtre d'édition de métadonnées de Spotify Desktop

import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Music } from 'lucide-react';
import { Playlist } from '../../types';
import { useSpootStore } from '../../store/useSpootStore';

interface EditPlaylistModalProps {
  playlist: Playlist;
  isOpen: boolean;
  onClose: () => void;
}

export const EditPlaylistModal: React.FC<EditPlaylistModalProps> = ({
  playlist,
  isOpen,
  onClose,
}) => {
  const { updatePlaylistDetails } = useSpootStore();

  const [title, setTitle] = useState(playlist.title);
  const [description, setDescription] = useState(playlist.description || '');
  const [coverUrl, setCoverUrl] = useState(playlist.coverUrl || '');
  const [showUrlInput, setShowUrlInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(playlist.title);
      setDescription(playlist.description || '');
      setCoverUrl(playlist.coverUrl || '');
      setShowUrlInput(false);
    }
  }, [isOpen, playlist]);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    updatePlaylistDetails(playlist.id, {
      title: title.trim(),
      description: description.trim(),
      coverUrl: coverUrl.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#282828] text-white rounded-lg shadow-2xl border border-[#3e3e3e]/80 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header de la Modal */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-xl font-bold tracking-tight">Modifier les informations</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#b3b3b3] hover:text-white hover:bg-white/10 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps du Formulaire */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Zone de Pochette / Image */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="group relative w-44 h-44 rounded bg-[#181818] overflow-hidden cursor-pointer shadow-lg border border-[#3e3e3e] flex items-center justify-center shrink-0"
                title="Cliquer pour changer l'URL de la pochette"
              >
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={title}
                    className="w-full h-full object-cover group-hover:brightness-50 transition-all"
                  />
                ) : (
                  <Music className="w-16 h-16 text-[#727272]" />
                )}

                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-2 text-center">
                  <ImageIcon className="w-8 h-8 text-white mb-1" />
                  <span className="text-xs font-bold text-white">Choisir une photo</span>
                </div>
              </div>
            </div>

            {/* Champs Nom et Description */}
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#b3b3b3] block mb-1">Nom</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nom de la playlist"
                  required
                  className="w-full px-3 py-2 bg-[#3e3e3e]/60 hover:bg-[#3e3e3e] focus:bg-[#333333] border border-transparent focus:border-white/30 rounded text-sm text-white placeholder-[#727272] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#b3b3b3] block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ajouter une description facultative"
                  rows={4}
                  className="w-full px-3 py-2 bg-[#3e3e3e]/60 hover:bg-[#3e3e3e] focus:bg-[#333333] border border-transparent focus:border-white/30 rounded text-sm text-white placeholder-[#727272] outline-none resize-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Champ d'URL de couverture (si activé) */}
          {showUrlInput && (
            <div className="pt-2 animate-in fade-in">
              <label className="text-[11px] font-bold text-[#b3b3b3] block mb-1">URL de la pochette d'album</label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-[#3e3e3e]/60 hover:bg-[#3e3e3e] focus:bg-[#333333] border border-transparent focus:border-white/30 rounded text-xs text-white placeholder-[#727272] outline-none transition-colors"
              />
            </div>
          )}

          {/* Avertissement Droits d'auteur Spotify */}
          <p className="text-[11px] text-[#b3b3b3] leading-relaxed pt-1">
            En continuant, vous autorisez Spoot Music à accéder à l'image que vous choisissez d'importer. Assurez-vous d'avoir le droit d'importer cette image.
          </p>

          {/* Bouton d'action "Enregistrer" */}
          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-8 py-3 rounded-full bg-white text-black font-bold text-sm hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
