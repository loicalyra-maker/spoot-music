// Spoot Music — Apple iOS 26 / macOS Tahoe Liquid Glass Navigation Layout (NavigationLayout.tsx)
// Authentic Oceanic Sea Liquid Glass Ambiance, Dynamic Mesh Drift, Floating Island Player & Space Gain
import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NowPlayingSidebar } from './Player/NowPlayingSidebar';
import { MiniPlayer } from './Player/MiniPlayer';
import { MobileHeader } from './Navigation/MobileHeader';
import { MobileBottomNav } from './Navigation/MobileBottomNav';
import { MobileMiniPlayer } from './Player/MobileMiniPlayer';
import { LiveCustomizerDrawer } from './Views/LiveCustomizerDrawer';
import { VoiceAssistantModal } from './Voice/VoiceAssistantModal';
import { useSpootStore } from '../store/useSpootStore';
import { useThemeStore, PRESET_COLORS } from '../store/useThemeStore';

interface NavigationLayoutProps {
  children: React.ReactNode;
}

export const NavigationLayout: React.FC<NavigationLayoutProps> = ({ children }) => {
  const {
    activeView,
    gamerModeActive,
    isNowPlayingOpen,
    currentTrack,
    voiceAssistantOpen,
    setVoiceAssistantOpen,
  } = useSpootStore();

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    themeMode,
    colorPreset,
    customColor,
    backgroundStyle,
    playerMode,
    sidebarMode,
    displayDensity,
    cornerRadius,
    glassBlur,
    glassOpacity,
    backgroundOpacity,
    backgroundImageUrl,
  } = useThemeStore();

  const isLiquidGlass = themeMode === 'liquid-glass';

  // Couleurs d'ambiance dynamiques (réactives au preset choisi ou à l'album si le mode album est actif)
  const activePreset = colorPreset || 'ocean';
  const presetTheme = activePreset === 'custom'
    ? {
        primary: customColor,
        secondary: '#0284c7',
        glow: `${customColor}55`,
        highlight: `${customColor}aa`,
        gradient: `linear-gradient(117deg, ${customColor} 0%, #0284c7 100%)`,
        baseBg: `linear-gradient(145deg, #031018 0%, ${customColor}22 50%, #01080d 100%)`,
      }
    : PRESET_COLORS[activePreset] || PRESET_COLORS.ocean;

  // L'ambiance couleur suit le preset actif; l'adaptation pochette n'a lieu qu'en mode backgroundStyle === 'album-adaptive'
  const isAdaptive = backgroundStyle === 'album-adaptive' && !!currentTrack?.palette?.primary;
  const dynamicColor = isAdaptive ? currentTrack!.palette!.primary! : presetTheme.primary;
  const secondaryColor = isAdaptive ? currentTrack!.palette!.secondary! : presetTheme.secondary;

  // Hauteur de padding inférieure dynamique pour que le contenu ne soit jamais masqué
  const mainBottomPadding = useMemo(() => {
    switch (playerMode) {
      case 'floating-pill':
        return displayDensity === 'ultra-compact' ? 'pb-24' : 'pb-28';
      case 'docked-full':
        return 'pb-4';
      case 'sidebar-mini':
      case 'hidden':
        return 'pb-4';
      default:
        return 'pb-28';
    }
  }, [playerMode, displayDensity]);

  return (
    <div
      style={{
        ['--glass-blur-val' as any]: `${glassBlur}px`,
        ['--glass-opacity' as any]: glassOpacity,
        ['--accent-primary' as any]: dynamicColor,
        ['--accent-secondary' as any]: secondaryColor,
      }}
      className={`flex flex-col h-screen w-screen overflow-hidden relative text-white select-none transition-colors duration-700 ${
        gamerModeActive ? 'gamer-mode-throttle' : ''
      } ${
        isLiquidGlass ? 'bg-[#04131a]' : 'bg-[#0B0B0C]'
      }`}
    >
      {/* 1. FOND DYNAMIQUE : Mesh Gradient Animé (mouvement lent 45s) & Teinte Réactive */}
      {isLiquidGlass && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Base d'Ambiance selon le Preset Actif (Océan, Aurore, Crépuscule, Minuit, Monochrome) */}
          <div
            className="absolute inset-0 transition-all duration-700 ease-out"
            style={{
              background: backgroundImageUrl
                ? `url(${backgroundImageUrl}) center/cover no-repeat`
                : presetTheme.baseBg,
            }}
          />

          {/* Vagues subtiles pour le thème Océan */}
          {activePreset === 'ocean' && !backgroundImageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay transition-opacity duration-700"
              style={{
                backgroundImage: 'url(./liquid-glass-bg.svg)',
              }}
            />
          )}

          {/* Blobs organiques animés optimisés GPU (Mesh drift 45s, ProMotion 120Hz) */}
          <div
            className="absolute -top-32 left-1/4 w-[750px] h-[520px] rounded-full blur-[40px] md:blur-[110px] opacity-40 animate-fluid-mesh pointer-events-none transition-all duration-1000 ease-out will-change-transform"
            style={{
              background: `radial-gradient(circle, ${dynamicColor} 0%, ${secondaryColor} 60%, transparent 80%)`,
              transform: 'translate3d(0, 0, 0)',
            }}
          />
          <div
            className="absolute -bottom-24 right-1/4 w-[650px] h-[480px] rounded-full blur-[35px] md:blur-[100px] opacity-30 animate-wave-pulse pointer-events-none transition-all duration-1000 ease-out will-change-transform"
            style={{
              background: `radial-gradient(circle, ${secondaryColor} 0%, ${dynamicColor} 60%, transparent 80%)`,
              transform: 'translate3d(0, 0, 0)',
            }}
          />

          {/* Filtre d'assombrissement réglable en direct */}
          <div
            className="absolute inset-0 bg-black transition-opacity duration-300"
            style={{ opacity: backgroundOpacity }}
          />
        </div>
      )}

      {/* Mode Classique Sombre */}
      {!isLiquidGlass && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#0B0B0C]">
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full blur-[160px] opacity-20 transition-all duration-1000 ease-out"
            style={{
              background: `radial-gradient(circle, ${dynamicColor} 0%, transparent 70%)`,
            }}
          />
        </div>
      )}

      {/* 2. Header : Mobile Native Header sur iPhone (< 768px), Desktop Header sur écran large */}
      {isMobile ? <MobileHeader /> : <Header />}

      {/* 3. Corps Principal : Edge-to-Edge sur Mobile, 3 Colonnes sur Desktop */}
      <div className="flex flex-1 overflow-hidden relative z-10 min-h-0">
        {/* Colonne de Gauche : Bibliothèque Desktop (masquée sur iPhone) */}
        {!isMobile && sidebarMode !== 'hidden' && <Sidebar />}

        {/* Colonne Centrale : Vue Déroulante avec Verre Dépoli Apple */}
        <main
          className={`flex-1 overflow-hidden flex flex-col relative transition-all duration-300 min-h-0 ${
            isMobile
              ? 'm-0 p-0'
              : `${mainBottomPadding} ${
                  isLiquidGlass
                    ? `liquid-glass-surface ${cornerRadius} ${
                        displayDensity === 'compact' || displayDensity === 'ultra-compact' ? 'm-2' : 'm-3'
                      }`
                    : `bg-[#121212]/95 ${cornerRadius} overflow-hidden m-2 border border-[#1f1f1f]`
                }`
          }`}
        >
          {children}

          {/* Barre de Lecture Flottante Desktop */}
          {!isMobile && playerMode === 'floating-pill' && (
            <div className="absolute bottom-3.5 left-4 right-4 z-40 flex justify-center pointer-events-none">
              <div className="pointer-events-auto w-full max-w-4xl">
                <MiniPlayer />
              </div>
            </div>
          )}
        </main>

        {/* Colonne Droite Desktop : Escamotable "En cours d'écoute" */}
        {!isMobile && (
          <AnimatePresence>
            {isNowPlayingOpen && activeView !== 'lyrics' && (
              <motion.div
                initial={{ opacity: 0, x: 40, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: 40, width: 0 }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                className="overflow-hidden h-full flex"
              >
                <NowPlayingSidebar />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Lecteurs & Navigation Mobile iPhone */}
      {isMobile && (
        <>
          <MobileMiniPlayer />
          <MobileBottomNav />
        </>
      )}

      {/* Mode Dock Pleine Largeur Ancré au bas de la fenêtre (Desktop uniquement) */}
      {!isMobile && playerMode === 'docked-full' && (
        <div className="relative z-30 shrink-0 w-full">
          <MiniPlayer />
        </div>
      )}

      {/* Si playerMode === 'sidebar-mini', le mini-lecteur est intégré dans la Sidebar pour un gain de place total ! */}

      {/* 5. Studio de Personnalisation en Drawer Rétractable */}
      <LiveCustomizerDrawer />

      {/* 6. Assistant Vocal Spoot Global (Mobile & Desktop) */}
      <VoiceAssistantModal
        isOpen={voiceAssistantOpen}
        onClose={() => setVoiceAssistantOpen(false)}
      />
    </div>
  );
};

export default NavigationLayout;
