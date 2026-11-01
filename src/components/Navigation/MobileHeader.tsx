// Spoot Music — Official Mobile Header (MobileHeader.tsx)
// Faithful to Apple Liquid Glass & Spotify iOS 26
// Displays: Official Spoot Music Logo, User Profile Avatar, Notifications Hub (Bell + Green Unread Dot),
// Slot/Widget Customizer, Settings, and Luminous Filter Pills.

import React, { useState } from 'react';
import { useSpootStore } from '../../store/useSpootStore';
import { Settings, Sliders, Bell } from 'lucide-react';
import { useHomeLayoutStore } from '../../store/useHomeLayoutStore';
import { SpootLogo } from '../Branding/SpootLogo';
import { NotificationsDrawer } from '../Notifications/NotificationsDrawer';

export const MobileHeader: React.FC = () => {
  const { openCustomizer } = useHomeLayoutStore();
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [unreadReleasesCount, setUnreadReleasesCount] = useState<number>(4);

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

  if (activeView === 'search') {
    return null;
  }

  return (
    <>
      <header className="w-full pt-[max(env(safe-area-inset-top)+8px,56px)] pb-3 px-4 flex flex-col gap-3 z-30 select-none bg-gradient-to-b from-[#000000]/95 via-[#03070d]/85 to-transparent backdrop-blur-xl border-b border-white/[0.08]">
        {/* 1. Ligne Supérieure : Logo Spoot Music Officiel, Profil, Alertes, Slots & Paramètres */}
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

            <div
              onClick={() => setActiveView('home')}
              className="cursor-pointer active:scale-98 transition-transform"
            >
              <SpootLogo size={32} showText={true} />
            </div>
          </div>

          {/* Droite : Cloche Nouveautés & Alertes + Studio Slots + Paramètres */}
          {activeView === 'home' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNotifOpen(true)}
                className="relative w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.12] hover:bg-white/[0.20] active:bg-white/[0.28] text-white border border-white/[0.22] backdrop-blur-xl shadow-md transition-all cursor-pointer active:scale-95"
                title="Nouveautés & Alertes"
              >
                <Bell className="w-4 h-4 text-emerald-300" />
                {unreadReleasesCount > 0 && (
                  <span
                    className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black shadow-[0_0_8px_#10b981]"
                    aria-label="Nouvelles sorties"
                  />
                )}
              </button>

              <button
                onClick={openCustomizer}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-cyan-500/15 hover:bg-cyan-500/25 active:bg-cyan-500/35 text-cyan-300 border border-cyan-400/30 backdrop-blur-xl shadow-md transition-all cursor-pointer active:scale-95"
                title="Personnaliser les widgets d'accueil"
              >
                <Sliders className="w-4 h-4 text-cyan-300" />
              </button>

              <button
                onClick={() => setActiveView('settings')}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.14] hover:bg-white/[0.22] active:bg-white/[0.28] text-white/90 hover:text-white border border-white/[0.25] backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all cursor-pointer active:scale-95"
                title="Paramètres de l'application"
              >
                <Settings className="w-4 h-4 text-cyan-300" />
              </button>
            </div>
          )}
        </div>

        {/* 2. Ligne Inférieure : Pilules de Filtres */}
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

      <NotificationsDrawer
        isOpen={isNotifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadCountChange={(count) => setUnreadReleasesCount(count)}
      />
    </>
  );
};

export default MobileHeader;
