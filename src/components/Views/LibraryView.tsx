// Spoot Music — Library View (Mobile Folder Reorganization & Trash Recovery)
import React, { useState } from 'react';
import {
  FolderPlus, Plus, Trash2, RotateCcw, ArrowUpDown, Download,
  Music, Check, Folder
} from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';

export const LibraryView: React.FC = () => {
  const {
    playlists, folders, trash, openPlaylist, createPlaylist,
    createFolder, undoLastAction, emptyTrash
  } = useSpootStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'downloaded' | 'collaborative'>('all');

  const filteredPlaylists = playlists.filter(p => {
    if (activeFilter === 'downloaded') return p.tracks.some(t => t.isOfflineDownloaded);
    if (activeFilter === 'collaborative') return p.isCollaborative;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full select-none pb-32">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Votre Bibliothèque</h1>
          <p className="text-xs text-spoot-muted mt-1">Organisation par dossiers, glisser-déposer tactile et sauvegarde hors-ligne.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => createFolder(`Nouveau Dossier ${folders.length + 1}`)}
            className="px-3 py-2 rounded-xl bg-[#141414] border border-[#242424] text-xs font-bold text-white hover:border-spoot-neon transition-colors flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4 text-spoot-neon" />
            <span>Nouveau Dossier</span>
          </button>

          <button
            onClick={() => createPlaylist(`Nouvelle Playlist #${playlists.length + 1}`)}
            className="px-4 py-2 rounded-xl bg-spoot-neon text-black text-xs font-bold hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Créer Playlist</span>
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'all'
              ? 'bg-white text-black'
              : 'bg-[#141414] text-spoot-muted hover:text-white border border-[#242424]'
          }`}
        >
          Tout ({playlists.length})
        </button>

        <button
          onClick={() => setActiveFilter('downloaded')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
            activeFilter === 'downloaded'
              ? 'bg-spoot-cyan text-black'
              : 'bg-[#141414] text-spoot-muted hover:text-white border border-[#242424]'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Téléchargés Hors-Ligne</span>
        </button>

        <button
          onClick={() => setActiveFilter('collaborative')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'collaborative'
              ? 'bg-spoot-neon text-black'
              : 'bg-[#141414] text-spoot-muted hover:text-white border border-[#242424]'
          }`}
        >
          Collaboratives
        </button>
      </div>

      {/* Playlists & Folders Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPlaylists.map(pl => (
          <div
            key={pl.id}
            onClick={() => openPlaylist(pl.id)}
            className="p-4 rounded-2xl bg-[#121212] hover:bg-[#181818] border border-[#1e1e1e] hover:border-spoot-elevated cursor-pointer group transition-all"
          >
            <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 shadow-md">
              <img src={pl.coverUrl} alt={pl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <h3 className="font-bold text-sm text-white truncate">{pl.title}</h3>
            <p className="text-xs text-spoot-muted mt-1">{pl.tracks.length} titres • {pl.ownerName}</p>
          </div>
        ))}
      </div>

      {/* Corbeille & Historique de Suppression (Trash Recovery Section) */}
      {trash.length > 0 && (
        <section className="mt-12 pt-8 border-t border-[#1c1c1c] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-spoot-danger" />
              <h2 className="text-base font-extrabold text-white">Corbeille Sécurisée ({trash.length} éléments)</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-spoot-muted">Restauration en 1 clic</span>
              <button
                onClick={emptyTrash}
                className="px-3 py-1.5 rounded-xl bg-spoot-danger/20 text-spoot-danger border border-spoot-danger/40 text-xs font-bold hover:bg-spoot-danger hover:text-black transition-colors"
              >
                Vider la corbeille
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {trash.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#121212] border border-[#1e1e1e] flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-sm text-white">
                    {'title' in item.item ? item.item.title : 'Élément supprimé'}
                  </p>
                  <p className="text-xs text-spoot-muted">
                    Supprimé le {new Date(item.deletedAt).toLocaleTimeString('fr-FR')} • Expire dans 30 jours
                  </p>
                </div>

                <button
                  onClick={undoLastAction}
                  className="px-3 py-1.5 rounded-xl bg-[#1c1c1c] hover:bg-[#282828] text-spoot-neon border border-spoot-neon/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurer</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
