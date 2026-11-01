// Spoot Music — Live Customizer Drawer (Style Apple macOS / iOS Tahoe Inspector)
// Real-time Sliders, Color Presets, Typography, Space Gain Indicator, Before/After Comparison & JSON Export/Import
import React, { useState, useEffect, useRef } from 'react';
import {
  X, RotateCcw, Sliders, Moon, Eye, EyeOff, Check,
  ChevronUp, ChevronDown, User, Waves, ArrowRightLeft,
  Download, Upload, Copy, Sparkles, CheckCheck, FileText,
  SlidersHorizontal, Monitor, LayoutGrid, ListFilter,
  Image as ImageIcon
} from 'lucide-react';
import {
  useThemeStore,
  ThemeConfig,
  ColorPreset,
  PlayerMode,
  SidebarMode,
  DisplayDensity,
  CardSize,
  HomeLayout,
  FontFamily,
  AnimationIntensity,
  CornerRadius,
  PRESET_COLORS,
} from '../../store/useThemeStore';
import { useSpootStore } from '../../store/useSpootStore';

export const LiveCustomizerDrawer: React.FC = () => {
  const themeStore = useThemeStore();
  const { currentTrack } = useSpootStore();

  const {
    isCustomizerOpen,
    closeCustomizer,
    applyFullConfig,
    resetTheme,
    exportConfigJson,
    importConfigJson,
  } = themeStore;

  // Snapshot de l'état initial à l'ouverture pour rollback "Annuler"
  const [initialSnapshot, setInitialSnapshot] = useState<ThemeConfig | null>(null);

  // État de comparaison "Avant / Après"
  const [isComparingBefore, setIsComparingBefore] = useState(false);

  // Notifications d'exportation
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // À l'ouverture du tiroir, mémoriser la configuration actuelle
  useEffect(() => {
    if (isCustomizerOpen && !initialSnapshot) {
      setInitialSnapshot({
        themeMode: themeStore.themeMode,
        colorPreset: themeStore.colorPreset,
        customColor: themeStore.customColor,
        playerBarColor: themeStore.playerBarColor,
        defaultCoverUrl: themeStore.defaultCoverUrl,
        backgroundBlur: themeStore.backgroundBlur,
        backgroundStyle: themeStore.backgroundStyle,
        playerMode: themeStore.playerMode,
        sidebarMode: themeStore.sidebarMode,
        displayDensity: themeStore.displayDensity,
        cardSize: themeStore.cardSize,
        homeLayout: themeStore.homeLayout,
        fontFamily: themeStore.fontFamily,
        animationIntensity: themeStore.animationIntensity,
        cornerRadius: themeStore.cornerRadius,
        glassBlur: themeStore.glassBlur,
        glassOpacity: themeStore.glassOpacity,
        showLogo: themeStore.showLogo,
        logoPosition: themeStore.logoPosition,
        profilePosition: themeStore.profilePosition,
        backgroundImageUrl: themeStore.backgroundImageUrl,
        backgroundOpacity: themeStore.backgroundOpacity,
        sections: [...themeStore.sections],
      });
    } else if (!isCustomizerOpen) {
      setInitialSnapshot(null);
      setIsComparingBefore(false);
    }
  }, [isCustomizerOpen]);

  if (!isCustomizerOpen) return null;

  // Configuration active affichée (permet le toggle Comparer avant/après)
  const displayedConfig: ThemeConfig = isComparingBefore && initialSnapshot
    ? initialSnapshot
    : {
        themeMode: themeStore.themeMode,
        colorPreset: themeStore.colorPreset,
        customColor: themeStore.customColor,
        playerBarColor: themeStore.playerBarColor,
        defaultCoverUrl: themeStore.defaultCoverUrl,
        backgroundBlur: themeStore.backgroundBlur,
        backgroundStyle: themeStore.backgroundStyle,
        playerMode: themeStore.playerMode,
        sidebarMode: themeStore.sidebarMode,
        displayDensity: themeStore.displayDensity,
        cardSize: themeStore.cardSize,
        homeLayout: themeStore.homeLayout,
        fontFamily: themeStore.fontFamily,
        animationIntensity: themeStore.animationIntensity,
        cornerRadius: themeStore.cornerRadius,
        glassBlur: themeStore.glassBlur,
        glassOpacity: themeStore.glassOpacity,
        showLogo: themeStore.showLogo,
        logoPosition: themeStore.logoPosition,
        profilePosition: themeStore.profilePosition,
        backgroundImageUrl: themeStore.backgroundImageUrl,
        backgroundOpacity: themeStore.backgroundOpacity,
        sections: themeStore.sections,
      };

  // Import d'image récurrente / pochette par défaut avec compression
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (!result) return;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            themeStore.setDefaultCoverUrl(compressed);
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Annuler les modifications et revenir à la configuration initiale
  const handleCancel = () => {
    if (initialSnapshot) {
      applyFullConfig(initialSnapshot);
    }
    closeCustomizer();
  };

  // Import d'image personnalisée pour l'arrière-plan avec compression matérielle
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (!result) return;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1920;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            themeStore.setBackgroundImageUrl(compressed);
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Sauvegarder et valider
  const handleApplyAndSave = () => {
    closeCustomizer();
  };

  // Calcul dynamique du gain d'espace
  const calculateSpaceGain = () => {
    let heightGain = 0;
    let label = '';
    if (displayedConfig.playerMode === 'sidebar-mini') {
      heightGain = 112;
      label = '+112 px (100% hauteur utile libérée)';
    } else if (displayedConfig.playerMode === 'floating-pill') {
      heightGain = 84;
      label = '+84 px de hauteur utile (îlot flottant)';
    } else {
      label = '0 px (Dock pleine largeur classique)';
    }

    if (displayedConfig.sidebarMode === 'compact-icons') {
      label += ' • +208 px de largeur';
    } else if (displayedConfig.sidebarMode === 'hidden') {
      label += ' • +280 px de largeur';
    }
    return label;
  };

  // Copie JSON dans le presse-papier
  const handleCopyJson = () => {
    const json = exportConfigJson();
    navigator.clipboard.writeText(json).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    });
  };

  // Téléchargement du fichier de configuration
  const handleDownloadJson = () => {
    const json = exportConfigJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spoot-theme-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Validation de l'import JSON
  const handleValidateImport = () => {
    setImportError(null);
    const success = importConfigJson(importJsonText);
    if (success) {
      setImportModalOpen(false);
      setImportJsonText('');
    } else {
      setImportError('Format JSON invalide. Veuillez vérifier la structure du fichier.');
    }
  };

  const primaryGlow = currentTrack?.palette?.primary || PRESET_COLORS[displayedConfig.colorPreset]?.primary || '#06b6d4';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Panneau Latéral Coulissant iOS/macOS Inspector */}
      <div
        className="w-full max-w-lg h-full bg-zinc-950/95 border-l border-white/[0.12] backdrop-blur-3xl shadow-2xl flex flex-col text-white animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header du Drawer */}
        <div className="px-6 py-4.5 border-b border-white/[0.10] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-teal-400 flex items-center justify-center text-black font-black shadow-md">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                <span>Studio de Personnalisation</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                  Live
                </span>
              </h2>
              <p className="text-[11px] text-cyan-200/70">
                Architecture Liquid Glass & Ergonomie Tahoe
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton Toggle Comparer Avant / Après */}
            <button
              onClick={() => setIsComparingBefore(!isComparingBefore)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isComparingBefore
                  ? 'bg-amber-400 text-black border-amber-300 shadow-lg'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/80 border-white/[0.10]'
              }`}
              title="Basculer instantanément entre la version initiale et la version modifiée"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{isComparingBefore ? 'Vue Initiale' : 'Comparer'}</span>
            </button>

            <button
              onClick={handleCancel}
              className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Fermer le studio sans appliquer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Corps Défilable du Drawer */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar select-none">

          {/* 1. Miniature Interactive en Direct avec Badge de Gain d'Espace */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300 block">
                Miniature Interactive en Direct
              </span>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {calculateSpaceGain()}
              </span>
            </div>

            {/* Cadre de simulation Live */}
            <div className={`w-full aspect-[16/9] ${displayedConfig.cornerRadius} border border-white/[0.18] bg-[#051c24] relative overflow-hidden shadow-2xl p-2.5 flex flex-col justify-between transition-all duration-300`}>
              {/* Fond de la miniature selon le preset actif */}
              <div
                className="absolute inset-0 bg-cover bg-center pointer-events-none transition-all duration-500"
                style={{
                  backgroundImage: `url(${displayedConfig.backgroundImageUrl || '/liquid-glass-bg.svg'})`,
                }}
              >
                <div
                  className="absolute inset-0 bg-black transition-opacity"
                  style={{ opacity: displayedConfig.backgroundOpacity }}
                />
                <div
                  className="absolute -top-[10%] left-[20%] w-[80%] h-[80%] rounded-full blur-xl opacity-40 animate-pulse pointer-events-none"
                  style={{ backgroundColor: primaryGlow }}
                />
              </div>

              {/* Simulation Header Miniature */}
              <div className="relative z-10 flex items-center justify-between pb-1 border-b border-white/[0.12]">
                <div className="flex items-center gap-1.5">
                  {displayedConfig.showLogo && (
                    <div className="w-3.5 h-3.5 rounded bg-cyan-400 flex items-center justify-center text-[7px] font-black text-black">
                      S
                    </div>
                  )}
                  {displayedConfig.showLogo && (
                    <span className="text-[9px] font-black tracking-tight text-white">Spoot</span>
                  )}
                </div>
                <div className="w-16 h-2 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-cyan-400/80" />
              </div>

              {/* Simulation Contenu : Sidebar + Grille */}
              <div className="relative z-10 flex-1 grid grid-cols-4 gap-1.5 py-1 min-h-0">
                {/* Colonne latérale */}
                {displayedConfig.sidebarMode !== 'hidden' && (
                  <div
                    className={`${
                      displayedConfig.sidebarMode === 'compact-icons' ? 'col-span-1' : 'col-span-1'
                    } rounded-lg bg-white/[0.08] border border-white/[0.12] p-1 flex flex-col justify-between`}
                  >
                    <div className="space-y-1">
                      <div className="w-full h-1.5 rounded-full bg-cyan-400/60" />
                      <div className="w-3/4 h-1 rounded-full bg-white/30" />
                      <div className="w-2/3 h-1 rounded-full bg-white/20" />
                    </div>
                    {displayedConfig.playerMode === 'sidebar-mini' && (
                      <div className="w-full h-3 rounded bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                )}

                {/* Zone de contenu */}
                <div
                  className={`${
                    displayedConfig.sidebarMode === 'hidden' ? 'col-span-4' : 'col-span-3'
                  } rounded-lg bg-white/[0.06] border border-white/[0.1] p-1.5 space-y-1 overflow-hidden`}
                >
                  <div className="w-12 h-1.5 rounded bg-white/50" />
                  <div
                    className={`grid ${
                      displayedConfig.homeLayout === 'list'
                        ? 'grid-cols-1 gap-0.5'
                        : displayedConfig.displayDensity === 'ultra-compact'
                        ? 'grid-cols-3 gap-1'
                        : 'grid-cols-2 gap-1'
                    }`}
                  >
                    <div className="h-5 rounded bg-white/[0.12] border border-white/[0.15] p-0.5 flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-cyan-400/70 shrink-0" />
                      <div className="w-6 h-1 rounded bg-white/40" />
                    </div>
                    <div className="h-5 rounded bg-white/[0.12] border border-white/[0.15] p-0.5 flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-teal-400/70 shrink-0" />
                      <div className="w-6 h-1 rounded bg-white/40" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulation Player Inférieur */}
              {displayedConfig.playerMode === 'floating-pill' && (
                <div className="relative z-10 mx-3 mb-0.5 h-3.5 rounded-full bg-white/[0.22] border border-white/[0.3] backdrop-blur-md px-2 flex items-center justify-between shadow-lg">
                  <div className="w-1.5 h-1.5 rounded bg-cyan-300" />
                  <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                  <div className="w-4 h-0.5 rounded-full bg-white/40" />
                </div>
              )}
              {displayedConfig.playerMode === 'docked-full' && (
                <div className="relative z-10 w-full h-3.5 bg-white/[0.14] border-t border-white/[0.2] px-2 flex items-center justify-between">
                  <div className="w-1.5 h-1.5 rounded bg-cyan-300" />
                  <div className="w-2 h-2 rounded-full bg-white" />
                  <div className="w-4 h-0.5 rounded-full bg-white/40" />
                </div>
              )}
            </div>
          </div>

          {/* 2. Presets de Couleur (Section 5 du Prompt) */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
              Presets de Couleur & Ambiance
            </span>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'ocean', name: 'Océan', desc: 'Bleu / Menthe (Réf)', color: '#06b6d4' },
                  { id: 'aurora', name: 'Aurore', desc: 'Rose / Violet', color: '#ec4899' },
                  { id: 'sunset', name: 'Crépuscule', desc: 'Orange / Ambre', color: '#f97316' },
                  { id: 'midnight', name: 'Minuit', desc: 'Bleu nuit profond', color: '#38bdf8' },
                  { id: 'monochrome', name: 'Monochrome', desc: 'Verre fumé neutre', color: '#ffffff' },
                  { id: 'custom', name: 'Custom', desc: 'Sélecteur libre', color: displayedConfig.customColor },
                ] as const
              ).map((preset) => {
                const isSelected = displayedConfig.colorPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => themeStore.setColorPreset(preset.id as ColorPreset)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-white/[0.15] border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-white/20"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span className="text-xs font-bold text-white truncate">{preset.name}</span>
                    </div>
                    <p className="text-[10px] text-white/50 truncate">{preset.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Sélecteur de couleur hex si Custom sélectionné */}
            {displayedConfig.colorPreset === 'custom' && (
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-between gap-3 animate-in fade-in duration-200">
                <span className="text-xs font-bold text-white">Couleur personnalisée</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={displayedConfig.customColor}
                    onChange={(e) => themeStore.setCustomColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-cyan-300 font-bold uppercase">
                    {displayedConfig.customColor}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Image d'Arrière-Plan Personnalisée (Upload Local & Sliders de Flou/Assombrissement) */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
                Arrière-plan & Image Personnalisée
              </span>
              <span className="text-[10px] text-cyan-300 font-mono">Upload HD</span>
            </div>

            <div className="flex items-center gap-3">
              {displayedConfig.backgroundImageUrl ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/20 shrink-0 shadow-md group">
                  <img
                    src={displayedConfig.backgroundImageUrl}
                    alt="Fond personnalisé"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => themeStore.setBackgroundImageUrl(null)}
                    className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-rose-300 font-bold transition-opacity cursor-pointer"
                    title="Supprimer l'image"
                  >
                    Effacer
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white/[0.05] border border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 shrink-0">
                  <ImageIcon className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px]">Défaut</span>
                </div>
              )}

              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-bold text-white transition-all cursor-pointer border border-white/[0.10] flex items-center justify-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{displayedConfig.backgroundImageUrl ? "Remplacer l'image..." : "Importer une image de fond..."}</span>
                </button>

                {displayedConfig.backgroundImageUrl && (
                  <button
                    onClick={() => themeStore.setBackgroundImageUrl(null)}
                    className="text-[11px] text-rose-300/80 hover:text-rose-200 transition-colors block text-left cursor-pointer"
                  >
                    Rétablir le fond Océan par défaut
                  </button>
                )}
              </div>
            </div>

            {/* Presets rapides de fond */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => themeStore.setBackgroundImageUrl('/assets/default-cover.jpg')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-white text-left transition-colors flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                <span className="truncate">Sasuke (Aura)</span>
              </button>
              <button
                onClick={() => themeStore.setBackgroundImageUrl('/assets/wallpaper-sample.jpg')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-white text-left transition-colors flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <span className="truncate">Sasuke (Combat)</span>
              </button>
            </div>

            {/* Sliders Assombrissement & Flou d'ambiance effectif */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white/70">Flou d'ambiance (Backdrop Blur)</span>
                  <span className="font-mono text-cyan-300 font-bold">{themeStore.backgroundBlur ?? 0} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={themeStore.backgroundBlur ?? 0}
                  onChange={(e) => themeStore.setBackgroundBlur(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white/70">Assombrissement du fond</span>
                  <span className="font-mono text-cyan-300 font-bold">{Math.round((themeStore.backgroundOpacity ?? 0.35) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.85"
                  step="0.05"
                  value={themeStore.backgroundOpacity ?? 0.35}
                  onChange={(e) => themeStore.setBackgroundOpacity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Image Récurrente / Pochette par Défaut Universelle */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
                Image Récurrente (Pochette par défaut)
              </span>
              <span className="text-[10px] text-purple-300 font-mono">Universel</span>
            </div>
            <p className="text-[11px] text-white/60">
              Cette image remplace automatiquement les pochettes manquantes (Vault leaks, playlists, etc.).
            </p>

            <input
              type="file"
              ref={coverInputRef}
              onChange={handleCoverUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/20 shrink-0 shadow-md bg-black/60">
                <img
                  src={themeStore.defaultCoverUrl || '/default-cover.jpg'}
                  alt="Couverture active"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-1.5">
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full py-1.5 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 border border-purple-400/30 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Changer l'image récurrente...</span>
                </button>
                {themeStore.defaultCoverUrl && themeStore.defaultCoverUrl !== '/default-cover.jpg' && (
                  <button
                    onClick={() => themeStore.setDefaultCoverUrl('/default-cover.jpg')}
                    className="text-[10px] text-rose-300 hover:text-rose-200 cursor-pointer block"
                  >
                    Rétablir Sasuke par défaut
                  </button>
                )}
              </div>
            </div>

            {/* Presets rapides */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => themeStore.setDefaultCoverUrl('/default-cover.jpg')}
                className={`p-2 rounded-xl border text-[11px] font-bold text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                  themeStore.defaultCoverUrl === '/default-cover.jpg'
                    ? 'bg-purple-500/20 border-purple-400 text-white'
                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                <span className="truncate">Sasuke (Aura)</span>
              </button>
              <button
                onClick={() => themeStore.setDefaultCoverUrl('/assets/wallpaper-sample.jpg')}
                className={`p-2 rounded-xl border text-[11px] font-bold text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                  themeStore.defaultCoverUrl === '/assets/wallpaper-sample.jpg'
                    ? 'bg-purple-500/20 border-purple-400 text-white'
                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <span className="truncate">Sasuke (Combat)</span>
              </button>
            </div>
          </div>

          {/* 3. Architecture du Lecteur & Gain de Place */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
                Mode du Lecteur Audio
              </span>
              <span className="text-[10px] font-mono text-cyan-300">Section 4</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => themeStore.setPlayerMode('floating-pill')}
                className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer text-center ${
                  displayedConfig.playerMode === 'floating-pill'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                <div className="w-8 h-4 rounded-full bg-cyan-400/30 border border-cyan-400/50 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-xs font-bold">Îlot Flottant</span>
                <span className="text-[9px] text-cyan-200/70">+84 px haut.</span>
              </button>

              <button
                onClick={() => themeStore.setPlayerMode('docked-full')}
                className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer text-center ${
                  displayedConfig.playerMode === 'docked-full'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                <div className="w-8 h-4 rounded-none bg-white/20 border-t border-white/40 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-xs font-bold">Dock Ancré</span>
                <span className="text-[9px] text-white/40">Standard</span>
              </button>

              <button
                onClick={() => themeStore.setPlayerMode('sidebar-mini')}
                className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer text-center ${
                  displayedConfig.playerMode === 'sidebar-mini'
                    ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                <div className="w-8 h-4 rounded-lg bg-emerald-400/30 border border-emerald-400/50 flex items-center justify-start pl-1">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-xs font-bold">Dans Sidebar</span>
                <span className="text-[9px] text-emerald-300 font-bold">+112 px (Max)</span>
              </button>
            </div>
          </div>

          {/* Couleur de la barre de lecture (Mini-Player & Progression) */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
                Couleur de cette barre (Lecteur & Progression)
              </span>
              <span className="text-[10px] text-cyan-300 font-mono">
                {themeStore.playerBarColor ? themeStore.playerBarColor.toUpperCase() : 'Auto'}
              </span>
            </div>

            {/* Aperçu en direct de la barre de lecture */}
            <div
              className="p-2.5 rounded-xl border border-white/10 flex items-center justify-between gap-2.5 shadow-md"
              style={{
                background: 'rgba(16, 17, 20, 0.94)',
                borderColor: themeStore.playerBarColor ? `${themeStore.playerBarColor}44` : 'rgba(255, 255, 255, 0.14)',
              }}
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0">
                <img
                  src={themeStore.defaultCoverUrl || '/default-cover.jpg'}
                  alt="Mini"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="text-[11px] font-bold text-white block truncate">Titre en cours</span>
                <span
                  className="text-[10px] font-medium block truncate"
                  style={{ color: themeStore.playerBarColor || 'var(--accent-color, #00e676)' }}
                >
                  Artiste officiel
                </span>
              </div>
              <div className="w-16 h-1 rounded-full bg-white/15 overflow-hidden shrink-0">
                <div
                  className="h-full rounded-full w-2/3"
                  style={{ backgroundColor: themeStore.playerBarColor || 'var(--accent-color, #00e676)' }}
                />
              </div>
            </div>

            {/* Pastilles de couleur & custom color picker */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <button
                onClick={() => themeStore.setPlayerBarColor(null)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                  themeStore.playerBarColor === null
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                Auto (Album)
              </button>

              {[
                { label: 'Spoot Vert', color: '#00E676' },
                { label: 'Sunset Orange', color: '#F97316' },
                { label: 'Améthyste', color: '#A855F7' },
                { label: 'Crimson', color: '#FF0055' },
                { label: 'Cyan', color: '#06B6D4' },
                { label: 'Gold', color: '#EAB308' },
                { label: 'Blanc', color: '#FFFFFF' },
              ].map((cp) => (
                <button
                  key={cp.color}
                  onClick={() => themeStore.setPlayerBarColor(cp.color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                    themeStore.playerBarColor === cp.color
                      ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.6)]'
                      : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{ backgroundColor: cp.color }}
                  title={cp.label}
                >
                  {themeStore.playerBarColor === cp.color && (
                    <span className="w-1.5 h-1.5 rounded-full bg-black/80" />
                  )}
                </button>
              ))}

              <label
                className="w-6 h-6 rounded-full border border-white/30 hover:border-white flex items-center justify-center cursor-pointer transition-all bg-gradient-to-tr from-pink-500 via-amber-400 to-cyan-400 overflow-hidden shrink-0 shadow-sm"
                title="Choisir une couleur sur-mesure"
              >
                <input
                  type="color"
                  value={themeStore.playerBarColor || '#00E676'}
                  onChange={(e) => themeStore.setPlayerBarColor(e.target.value)}
                  className="opacity-0 w-0 h-0 absolute cursor-pointer"
                />
                <span className="text-[9px] text-black font-black">+</span>
              </label>
            </div>
          </div>

          {/* 4. Barre Latérale & Densité */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
              Barre Latérale Rétractable
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => themeStore.setSidebarMode('expanded')}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  displayedConfig.sidebarMode === 'expanded'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                Déployée (280px)
              </button>
              <button
                onClick={() => themeStore.setSidebarMode('compact-icons')}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  displayedConfig.sidebarMode === 'compact-icons'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                Icônes seules (72px)
              </button>
              <button
                onClick={() => themeStore.setSidebarMode('hidden')}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  displayedConfig.sidebarMode === 'hidden'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                Masquée
              </button>
            </div>
          </div>

          {/* 5. Niveaux de Densité & Taille des Cartes */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
              Densité d'Affichage & Cartes
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => themeStore.setDisplayDensity('comfortable')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  displayedConfig.displayDensity === 'comfortable'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                Confortable
              </button>
              <button
                onClick={() => themeStore.setDisplayDensity('compact')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  displayedConfig.displayDensity === 'compact'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                Compacte
              </button>
              <button
                onClick={() => themeStore.setDisplayDensity('ultra-compact')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  displayedConfig.displayDensity === 'ultra-compact'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                Ultra-compacte
              </button>
            </div>
          </div>

          {/* 6. Sliders de Translucidité & Flou Optique (Liquid Glass) */}
          <div className="space-y-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <span className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
              Paramètres Optiques du Verre (Liquid Glass)
            </span>

            {/* Flou du verre (10 à 60 px) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/80 font-semibold">Flou du verre (Blur)</span>
                <span className="font-mono text-cyan-300 font-bold">{displayedConfig.glassBlur} px</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="2"
                value={displayedConfig.glassBlur}
                onChange={(e) => themeStore.setGlassBlur(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Opacité du verre (5% à 40%) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/80 font-semibold">Opacité de la surface en verre</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {Math.round(displayedConfig.glassOpacity * 100)} %
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.40"
                step="0.01"
                value={displayedConfig.glassOpacity}
                onChange={(e) => themeStore.setGlassOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Assombrissement du fond (0 à 90%) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/80 font-semibold">Assombrissement du fond</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {Math.round(displayedConfig.backgroundOpacity * 100)} %
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.90"
                step="0.05"
                value={displayedConfig.backgroundOpacity}
                onChange={(e) => themeStore.setBackgroundOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* 7. Typographie Officielle Apple (Section 6 du Prompt) */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
              Typographie du Système
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => themeStore.setFontFamily('plus-jakarta')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center font-['Plus_Jakarta_Sans'] ${
                  displayedConfig.fontFamily === 'plus-jakarta'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                Plus Jakarta Sans
              </button>
              <button
                onClick={() => themeStore.setFontFamily('inter')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center font-sans ${
                  displayedConfig.fontFamily === 'inter'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                Inter
              </button>
              <button
                onClick={() => themeStore.setFontFamily('sf-pro')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  displayedConfig.fontFamily === 'sf-pro'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                SF Pro
              </button>
            </div>
          </div>

          {/* 8. Animations & Fluides 120 FPS ProMotion */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
              Fluidité des Animations (ProMotion 120Hz)
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => themeStore.setAnimationIntensity('full')}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  displayedConfig.animationIntensity === 'full'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                Fluide 120 FPS
              </button>
              <button
                onClick={() => themeStore.setAnimationIntensity('reduced')}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  displayedConfig.animationIntensity === 'reduced'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                Discrète
              </button>
              <button
                onClick={() => themeStore.setAnimationIntensity('none')}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  displayedConfig.animationIntensity === 'none'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                Désactivée
              </button>
            </div>
          </div>

          {/* 9. Rayons de Courbure (Squircles Apple) */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
              Rayon de Courbure des Panneaux
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => themeStore.setCornerRadius('rounded-xl')}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  displayedConfig.cornerRadius === 'rounded-xl'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                Discret (xl)
              </button>
              <button
                onClick={() => themeStore.setCornerRadius('rounded-2xl')}
                className={`p-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  displayedConfig.cornerRadius === 'rounded-2xl'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                Apple (2xl)
              </button>
              <button
                onClick={() => themeStore.setCornerRadius('rounded-3xl')}
                className={`p-2 rounded-3xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  displayedConfig.cornerRadius === 'rounded-3xl'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                Ample (3xl)
              </button>
            </div>
          </div>

          {/* 10. Export / Import de la Configuration JSON */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <span className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
              Export / Import de Configuration
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyJson}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-bold text-white transition-all cursor-pointer border border-white/[0.10]"
              >
                {copiedSuccess ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSuccess ? 'JSON Copié !' : 'Copier JSON'}</span>
              </button>

              <button
                onClick={handleDownloadJson}
                className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white transition-colors cursor-pointer border border-white/[0.10]"
                title="Télécharger fichier .json"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => setImportModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-bold text-white transition-all cursor-pointer border border-white/[0.10]"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importer JSON</span>
              </button>
            </div>
          </div>

          {/* 11. Modules de l'Accueil Réorganisables */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-white/50 block">
                Ordre des Sections de l'Accueil
              </span>
              <span className="text-[10px] text-cyan-300 font-medium">Réorganisable</span>
            </div>

            <div className="space-y-2">
              {displayedConfig.sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    sec.enabled
                      ? 'bg-white/[0.04] border-white/[0.1]'
                      : 'bg-white/[0.01] border-white/[0.04] opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => themeStore.moveSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-0.5 text-white/40 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Monter la section"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => themeStore.moveSection(idx, 'down')}
                        disabled={idx === displayedConfig.sections.length - 1}
                        className="p-0.5 text-white/40 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Descendre la section"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-xs font-bold text-white truncate">
                      {sec.name}
                    </span>
                  </div>

                  <button
                    onClick={() => themeStore.toggleSection(sec.id)}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      sec.enabled
                        ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
                        : 'bg-white/5 text-white/30 border border-white/5'
                    }`}
                    title={sec.enabled ? 'Masquer la section' : 'Afficher la section'}
                  >
                    {sec.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Pied d'action : Annuler (Rollback) vs Appliquer */}
        <div className="p-4 border-t border-white/[0.10] flex items-center justify-between gap-3 bg-white/[0.02]">
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white text-xs font-bold transition-all cursor-pointer border border-white/[0.10]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Annuler</span>
          </button>

          <button
            onClick={handleApplyAndSave}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-black text-xs font-black tracking-wide transition-all shadow-lg active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Appliquer</span>
          </button>
        </div>
      </div>

      {/* Modal d'importation JSON */}
      {importModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Importer une configuration JSON</span>
              </h3>
              <button
                onClick={() => setImportModalOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Collez le JSON exporté ici..."
              className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-cyan-200 resize-none focus:outline-none focus:border-cyan-400"
            />

            {importError && (
              <p className="text-xs text-rose-400">{importError}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white/70 hover:text-white"
              >
                Fermer
              </button>
              <button
                onClick={handleValidateImport}
                className="px-4 py-2 rounded-xl bg-cyan-400 text-black text-xs font-black hover:bg-cyan-300 transition-colors"
              >
                Valider l'import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveCustomizerDrawer;
