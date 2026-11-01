// Spoot Music — Mobile Native iPhone Bottom Navigation Bar (MobileBottomNav.tsx)
// 5 Tab Items: Accueil, Recherche, Bibliothèque, Studio (Personnaliser), Coffre (Vault)
// Réactif à 100% à la couleur d'accentuation dynamique (--accent-color / --accent-rgb)
import React from 'react';
import { Home, Search, Library, Sliders, Settings } from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { useThemeStore } from '../../store/useThemeStore';

export const MobileBottomNav: React.FC = () => {
  const { activeView, setActiveView } = useSpootStore();
  const { openCustomizer } = useThemeStore();

  const navItems = [
    {
      id: 'home',
      label: 'Accueil',
      icon: Home,
      action: () => setActiveView('home'),
      isActive: activeView === 'home',
    },
    {
      id: 'search',
      label: 'Recherche',
      icon: Search,
      action: () => setActiveView('search'),
      isActive: activeView === 'search',
    },
    {
      id: 'library',
      label: 'Bibliothèque',
      icon: Library,
      action: () => setActiveView('library'),
      isActive: activeView === 'library',
    },
    {
      id: 'customizer',
      label: 'Studio',
      icon: Sliders,
      action: () => openCustomizer(),
      isActive: false,
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: Settings,
      action: () => setActiveView('settings'),
      isActive: activeView === 'settings',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 select-none bg-[#030811]/92 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-8px_32px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-around px-2 pt-2 pb-[max(env(safe-area-inset-bottom,12px),12px)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer active:scale-90 ${
                item.isActive
                  ? 'scale-105'
                  : 'text-white/50 hover:text-white/80'
              }`}
              style={
                item.isActive
                  ? {
                      color: 'var(--accent-color, #00e676)',
                      background: 'rgba(var(--accent-rgb, 0, 230, 118), 0.08)',
                    }
                  : undefined
              }
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    item.isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'
                  }`}
                  style={item.isActive ? { color: 'var(--accent-color, #00e676)' } : undefined}
                />
                {item.isActive && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--accent-color, #00e676)',
                      boxShadow: '0 0 8px var(--accent-color, #00e676)',
                    }}
                  />
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight ${
                  item.isActive ? 'font-bold' : 'font-medium text-white/50'
                }`}
                style={item.isActive ? { color: 'var(--accent-color, #00e676)' } : undefined}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
