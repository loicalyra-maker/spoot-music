// Spoot Music — Official Mobile Header (MobileHeader.tsx)
// Faithful to Apple Liquid Glass & Spotify iOS 26
// Displays: Official Spoot Music Logo, User Profile Avatar, Luminous Filter Pills, and Settings (Exclusively on Home)

import React from 'react';
import { useSpootStore } from '../../store/useSpootStore';
import { Settings } from 'lucide-react';
import { SpootLogo } from '../Branding/SpootLogo';

export const MobileHeader: React.FC = () => {
  const {
    userProfile,
    setProfileModalOpen,
    homeTab,
    setHomeTab,
    activeView,
    setActiveView,
  } = useSpootStore();

  const handleTabClick = (tab: 'all' | 'music' | 'podcasts' | 'audiobooks') => {
    setHomeTab(tab);
    if (activeView !== 'home') {
      setActiveView('home');
    }
  };

  // Sur la vue Recherche, la barre de recherche complète et l'assistant vocal sont gérés directement dans SearchView
  if (activeView === 'search') {
    return null;
  }

  return (
    <header className="w-full pt-[max(env(safe-area-inset-top)+8px,56px)] pb-3 px-4 flex flex-col gap-3 z-30 select-none bg-gradient-to-b from-[#03070d]/95 via-[#03070d]/80 to-transparent backdrop-blur-xl border-b border-white/[0.08]">
      {/* 1. Ligne Supérieure : Logo Spoot Music Officiel, Profil & Paramètres (Exclusif Accueil) */}
      <div className="flex items-center justify-between w-full">
        {/* Gauche : Avatar utilisateur + Logo Spoot Music officiel HD */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setProfileModalOpen(true)}
            className="relative w-8 h-8 rounded-full overflow-hidden border border-white/25 shrink-0 active:scale-95 transition-transform shadow-md cursor-pointer"
            title={`Profil de ${userProfile.name}`}
          >
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-black" />
          </button>

          {/* Logo Officiel Spoot Music avec texte et badge Hi-Res */}
          <div
            onClick={() => setActiveView('home')}
            className="cursor-pointer active:scale-98 transition-transform"
          >
            <SpootLogo size={32} showText={true} />
          </div>
        </div>

        {/* Droite : Bouton Paramètres (Strictement sur l'Accueil pour ne pas gêner la recherche) */}
        {activeView === 'home' && (
          <button
            onClick={() => setActiveView('settings')}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.14] hover:bg-white/[0.22] active:bg-white/[0.28] text-white/90 hover:text-white border border-white/[0.25] backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all cursor-pointer active:scale-95"
            title="Paramètres de l'application"
          >
            <Settings className="w-4 h-4 text-cyan-300" />
          </button>
        )}
      </div>

      {/* 2. Ligne Inférieure : Pilules de Filtres LÉGÈRES, LUMINEUSES et HAUTE DÉFINITION (Apple Liquid Glass) */}
      {activeView === 'home' && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5 pb-0.5">
          <button
            onClick={() => handleTabClick('all')}
            className={`px-4 py-1.5 rounded-full text-xs transition-all shrink-0 cursor-pointer ${
              homeTab === 'all'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black shadow-[0_0_18px_rgba(52,211,153,0.7)] border border-emerald-200 scale-[1.02]'
                : 'bg-white/[0.18] text-white font-bold hover:bg-white/[0.28] border border-white/[0.25] backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
            }`}
          >
            Tout
          </button>

          <button
            onClick={() => handleTabClick('music')}
            className={`px-4 py-1.5 rounded-full text-xs transition-all shrink-0 cursor-pointer ${
              homeTab === 'music'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black shadow-[0_0_18px_rgba(52,211,153,0.7)] border border-emerald-200 scale-[1.02]'
                : 'bg-white/[0.18] text-white font-bold hover:bg-white/[0.28] border border-white/[0.25] backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
            }`}
          >
            Musique
          </button>

          <button
            onClick={() => handleTabClick('podcasts')}
            className={`px-4 py-1.5 rounded-full text-xs transition-all shrink-0 cursor-pointer ${
              homeTab === 'podcasts'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black shadow-[0_0_18px_rgba(52,211,153,0.7)] border border-emerald-200 scale-[1.02]'
                : 'bg-white/[0.18] text-white font-bold hover:bg-white/[0.28] border border-white/[0.25] backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
            }`}
          >
            Podcasts
          </button>

          <button
            onClick={() => handleTabClick('audiobooks')}
            className={`px-4 py-1.5 rounded-full text-xs transition-all shrink-0 cursor-pointer ${
              homeTab === 'audiobooks'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black shadow-[0_0_18px_rgba(52,211,153,0.7)] border border-emerald-200 scale-[1.02]'
                : 'bg-white/[0.18] text-white font-bold hover:bg-white/[0.28] border border-white/[0.25] backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
            }`}
          >
            Livres audio
          </button>
        </div>
      )}
    </header>
  );
};

export default MobileHeader;
