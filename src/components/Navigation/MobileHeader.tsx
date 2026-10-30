// Spoot Music — Mobile Native iPhone Header Component (MobileHeader.tsx)
// Faithful to Spotify iOS 26: Round User Avatar, Horizontal Filter Pills ([Tout], [Musique], [Podcasts], [Livres audio])
import React from 'react';
import { useSpootStore } from '../../store/useSpootStore';
import { Settings, Search, X } from 'lucide-react';
import { VoiceAssistantButton } from '../Voice/VoiceAssistantButton';

export const MobileHeader: React.FC = () => {
  const {
    userProfile,
    setProfileModalOpen,
    homeTab,
    setHomeTab,
    activeView,
    setActiveView,
    searchQuery,
    setSearchQuery,
    setVoiceAssistantOpen,
  } = useSpootStore();

  const handleTabClick = (tab: 'all' | 'music' | 'podcasts' | 'audiobooks') => {
    setHomeTab(tab);
    if (activeView !== 'home') {
      setActiveView('home');
    }
  };

  return (
    <header className="w-full pt-[max(env(safe-area-inset-top),10px)] pb-2 px-3.5 flex items-center justify-between gap-2.5 z-30 select-none bg-gradient-to-b from-[#03070d]/90 to-transparent backdrop-blur-md border-b border-white/[0.05]">
      {/* 1. Avatar Utilisateur Rond (cliquable pour profil) */}
      <button
        onClick={() => setProfileModalOpen(true)}
        className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-white/20 shrink-0 active:scale-95 transition-transform shadow-md"
        title={`Profil de ${userProfile.name}`}
      >
        <img
          src={userProfile.avatarUrl}
          alt={userProfile.name}
          className="w-full h-full object-cover"
        />
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-black" />
      </button>

      {/* 2. Vue Recherche Active : Barre de Saisie Pleine Largeur */}
      {activeView === 'search' ? (
        <div className="flex-1 flex items-center gap-2 animate-in fade-in duration-200">
          <div className="flex-1 relative flex items-center rounded-xl bg-white/[0.10] border border-white/15 px-3 py-1.5 shadow-inner">
            <Search className="w-4 h-4 text-cyan-300 shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Titres, artistes..."
              className="flex-1 bg-transparent border-0 text-xs font-semibold text-white placeholder:text-white/45 focus:outline-none"
              autoFocus={true}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-white/50 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <VoiceAssistantButton
            size={34}
            onClick={() => setVoiceAssistantOpen(true)}
          />
        </div>
      ) : (
        /* 2. Vue Normale (Accueil, etc.) : Filtres en Pilules Défilables Horizontales */
        <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => handleTabClick('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all shrink-0 cursor-pointer ${
              homeTab === 'all' && activeView === 'home'
                ? 'bg-emerald-400 text-black font-extrabold shadow-[0_2px_10px_rgba(52,211,153,0.3)]'
                : 'bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.08] font-bold'
            }`}
          >
            Tout
          </button>

          <button
            onClick={() => handleTabClick('music')}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all shrink-0 cursor-pointer ${
              homeTab === 'music' && activeView === 'home'
                ? 'bg-emerald-400 text-black font-extrabold shadow-[0_2px_10px_rgba(52,211,153,0.3)]'
                : 'bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.08] font-bold'
            }`}
          >
            Musique
          </button>

          <button
            onClick={() => handleTabClick('podcasts')}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all shrink-0 cursor-pointer ${
              homeTab === 'podcasts' && activeView === 'home'
                ? 'bg-emerald-400 text-black font-extrabold shadow-[0_2px_10px_rgba(52,211,153,0.3)]'
                : 'bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.08] font-bold'
            }`}
          >
            Podcasts
          </button>

          <button
            onClick={() => handleTabClick('audiobooks')}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all shrink-0 cursor-pointer ${
              homeTab === 'audiobooks' && activeView === 'home'
                ? 'bg-emerald-400 text-black font-extrabold shadow-[0_2px_10px_rgba(52,211,153,0.3)]'
                : 'bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.08] font-bold'
            }`}
          >
            Livres audio
          </button>
        </div>
      )}

      {/* 3. Boutons d'Action Droite : Commande Vocale & Paramètres */}
      {activeView !== 'search' && (
        <div className="flex items-center gap-1.5 shrink-0">
          <VoiceAssistantButton
            size={34}
            onClick={() => setVoiceAssistantOpen(true)}
          />
          <button
            onClick={() => setActiveView(activeView === 'settings' ? 'home' : 'settings')}
            className={`w-8 h-8 rounded-full flex items-center justify-center border border-white/[0.08] transition-all cursor-pointer ${
              activeView === 'settings'
                ? 'bg-cyan-400 text-black shadow-md'
                : 'bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/[0.12]'
            }`}
            title="Paramètres"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};

export default MobileHeader;
