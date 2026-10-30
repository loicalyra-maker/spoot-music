// Spoot Music — Refined Apple-Grade Top Header (Header.tsx)
// Liquid Glass Styling, Official SpootLogo, Workspace Toggle, Search Capsule
import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Home, Search,
  Bell, Minus, Square, X, Clock, Settings,
  PanelLeftClose, PanelLeft, PanelRight
} from 'lucide-react';
import { useSpootStore } from '../store/useSpootStore';
import { useThemeStore } from '../store/useThemeStore';
import { SpootLogo } from './Branding/SpootLogo';
import { NotificationsDrawer } from './Notifications/NotificationsDrawer';
import { VoiceAssistantButton } from './Voice/VoiceAssistantButton';
import { VoiceAssistantModal } from './Voice/VoiceAssistantModal';

export const Header: React.FC = () => {
  const {
    activeView, setActiveView, searchQuery, setSearchQuery,
    isHistoryOpen, setHistoryOpen,
    userProfile, setProfileModalOpen,
    goBack, goForward, canGoBack, canGoForward,
    isNowPlayingOpen, toggleNowPlayingOpen,
    setVoiceAssistantOpen
  } = useSpootStore();

  const {
    logoPosition,
    showLogo,
    profilePosition,
    themeMode,
    sidebarMode,
    setSidebarMode,
  } = useThemeStore();

  const isLiquidGlass = themeMode === 'liquid-glass';
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [isVoiceModalOpen, setVoiceModalOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (activeView !== 'search') {
      setActiveView('search');
    }
  };

  const toggleSidebar = () => {
    if (sidebarMode === 'expanded') setSidebarMode('compact-icons');
    else if (sidebarMode === 'compact-icons') setSidebarMode('hidden');
    else setSidebarMode('expanded');
  };

  return (
    <header
      className={`h-16 px-5 flex items-center justify-between z-30 select-none transition-all duration-300 ${
        isLiquidGlass
          ? 'bg-white/[0.04] backdrop-blur-2xl border-b border-white/[0.09] shadow-sm'
          : 'bg-black border-b border-[#141414]'
      }`}
    >
      {/* 1. Zone Gauche : Paramètres, Bascule Sidebar, Logo & Historique < > */}
      <div className="flex items-center gap-3">
        {/* Accès Paramètres restauré en haut à gauche */}
        <button
          onClick={() => setActiveView('settings')}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            activeView === 'settings'
              ? 'bg-cyan-400 text-black shadow-md scale-105'
              : 'text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 border border-white/[0.08]'
          }`}
          title="Paramètres de l'application"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Bouton de bascule de la barre latérale pour gain d'espace */}
        <button
          onClick={toggleSidebar}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 border border-white/[0.08] transition-all cursor-pointer"
          title={
            sidebarMode === 'expanded'
              ? 'Réduire la barre latérale (icônes seules)'
              : sidebarMode === 'compact-icons'
              ? 'Masquer la barre latérale'
              : 'Afficher la barre latérale complète'
          }
        >
          {sidebarMode === 'expanded' ? (
            <PanelLeftClose className="w-4 h-4 text-cyan-300" />
          ) : (
            <PanelLeft className="w-4 h-4 text-white/70" />
          )}
        </button>

        {showLogo && logoPosition === 'center-compact' && (
          <div
            onClick={() => setActiveView('home')}
            className="cursor-pointer hover:scale-105 transition-transform"
            title="Spoot Music Accueil"
          >
            <SpootLogo variant="liquid-glass" size={32} />
          </div>
        )}

        {/* Boutons d'historique de navigation circulaires < et > */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={goBack}
            disabled={!canGoBack()}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              !canGoBack()
                ? 'opacity-30 cursor-not-allowed text-white/40'
                : 'text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 border border-white/[0.08]'
            }`}
            title="Page précédente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goForward}
            disabled={!canGoForward()}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              !canGoForward()
                ? 'opacity-30 cursor-not-allowed text-white/40'
                : 'text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 border border-white/[0.08]'
            }`}
            title="Page suivante"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Zone Centrale : Logo (si haut-centre) & Capsule de Recherche Unique avec Bouton Accueil */}
      <div className="flex items-center gap-2.5 max-w-xl w-full justify-center">
        {showLogo && logoPosition === 'top-center' && (
          <div
            onClick={() => setActiveView('home')}
            className="cursor-pointer mr-3 group"
            title="Spoot Music Accueil"
          >
            <SpootLogo variant="liquid-glass" size={30} showText={true} />
          </div>
        )}

        {/* Bouton Accueil Unique Épuré */}
        <button
          onClick={() => {
            setSearchQuery('');
            setActiveView('home');
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${
            activeView === 'home'
              ? 'bg-white text-black shadow-lg'
              : 'bg-white/[0.08] hover:bg-white/[0.15] text-white/80 hover:text-white border border-white/[0.08]'
          }`}
          title="Accueil"
        >
          <Home className="w-4 h-4" />
        </button>

        {/* Capsule de Recherche Globale Liquid Glass */}
        <div className="flex items-center bg-white/[0.07] hover:bg-white/[0.1] focus-within:bg-white/[0.12] focus-within:border-cyan-400/60 h-10 rounded-full px-4 w-full transition-all border border-white/[0.08] shadow-inner">
          <Search className="w-4 h-4 text-white/50 mr-2.5 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              if (activeView !== 'search') setActiveView('search');
            }}
            placeholder="Que souhaitez-vous écouter ?"
            className="bg-transparent text-xs text-white placeholder-white/40 w-full focus:outline-none font-medium tracking-wide"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 hover:text-white text-white/40 rounded-full transition-colors"
              title="Effacer la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Bouton Commande Vocale Holographique iOS 26 Liquid Glass */}
        <VoiceAssistantButton
          size={38}
          onClick={() => setVoiceAssistantOpen(true)}
        />
      </div>

      {/* 3. Zone Droite : Panneau Now Playing, Alertes, Historique, Profil & Contrôles Fenêtre */}
      <div className="flex items-center gap-3">
        {/* Bascule volet "En cours d'écoute" à droite */}
        <button
          onClick={toggleNowPlayingOpen}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isNowPlayingOpen
              ? 'bg-cyan-400 text-black shadow-md'
              : 'text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08]'
          }`}
          title={isNowPlayingOpen ? "Masquer le volet En cours d'écoute" : "Afficher le volet En cours d'écoute"}
        >
          <PanelRight className="w-4 h-4" />
        </button>

        {/* Cloche de notifications / Nouveautés */}
        <button
          onClick={() => setNotifOpen(!isNotifOpen)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
            isNotifOpen
              ? 'bg-cyan-400 text-black shadow-md'
              : 'text-white/70 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08]'
          }`}
          title="Nouveautés et alertes"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute top-2 right-2 animate-pulse" />
        </button>

        {/* Bouton Historique d'écoute */}
        <button
          onClick={() => setHistoryOpen(!isHistoryOpen)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isHistoryOpen
              ? 'bg-cyan-400 text-black shadow-md'
              : 'text-white/70 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08]'
          }`}
          title="Historique d'écoute"
        >
          <Clock className="w-4 h-4" />
        </button>

        {/* Profil Utilisateur (Si profilePosition === 'right') */}
        {profilePosition === 'right' && (
          <button
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center gap-2 p-1 pr-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] transition-all cursor-pointer group shadow-sm"
            title={`Compte Spoot • ${userProfile.name}`}
          >
            <div className="w-7 h-7 rounded-full bg-white/10 p-[1.5px] border border-white/20 group-hover:scale-105 transition-transform overflow-hidden shadow-md">
              <img
                src={userProfile.avatarUrl}
                alt={`${userProfile.name} avatar`}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <span className="text-xs font-bold text-white/90 group-hover:text-white max-w-[100px] truncate hidden sm:inline">
              {userProfile.name}
            </span>
          </button>
        )}

        {/* Commandes de fenêtre macOS / Windows épurées */}
        <div className="flex items-center gap-1 pl-1 border-l border-white/[0.08] text-white/40">
          <button className="w-7 h-7 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors rounded">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button className="w-7 h-7 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors rounded">
            <Square className="w-3 h-3" />
          </button>
          <button className="w-7 h-7 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Drawer interactif Nouveautés et Alertes */}
      <NotificationsDrawer isOpen={isNotifOpen} onClose={() => setNotifOpen(false)} />
    </header>
  );
};

export default Header;
