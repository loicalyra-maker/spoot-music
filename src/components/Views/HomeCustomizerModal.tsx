// Spoot Music — Slot-Based Home Studio & Widget Customizer (HomeCustomizerModal.tsx)
// Permet :
// 1. L'injection libre de Slots (remplacer n'importe quel Daily Mix par un Artiste, une Playlist ou les Sorties)
// 2. La gestion modulaire des blocs d'accueil (Activer/Désactiver, Ordre, Mode "Zéro Recommandation")
// 3. Le contrôle du mode True Black OLED (#000000) & Burst/Sleep A18 Pro

import React, { useState } from 'react';
import {
  X, Eye, EyeOff, ArrowUp, ArrowDown, RotateCcw, Sparkles,
  Download, Upload, Check, Sliders, ShieldCheck, Layers,
  Search, User, ListMusic, Radio, Zap, BatteryCharging
} from 'lucide-react';
import { useHomeLayoutStore, HomeSlot } from '../../store/useHomeLayoutStore';
import { useSpootStore } from '../../store/useSpootStore';
import { useThemeStore } from '../../store/useThemeStore';
import { Image as ImageIcon, SlidersHorizontal, Trash2 } from 'lucide-react';
import { powerManager } from '../../services/PowerManager';
import { streamBufferPolicy } from '../../services/StreamBufferPolicy';

export const HomeCustomizerModal: React.FC = () => {
  const {
    widgets,
    slots,
    isCustomizerOpen,
    closeCustomizer,
    toggleWidget,
    moveWidget,
    updateSlot,
    resetSlotsToDefault,
    hideAllRecommendations,
    showAllWidgets,
    resetToDefault,
    exportLayoutJson,
    importLayoutJson,
  } = useHomeLayoutStore();

  const { playlists } = useSpootStore();
  const themeStore = useThemeStore();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const coverInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleImageFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
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
  };

  const handleCoverFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
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
  };


  const [activeTab, setActiveTab] = useState<'slots' | 'widgets' | 'wallpaper' | 'power'>('slots');
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [artistQuery, setArtistQuery] = useState('');
  const [artistResults, setArtistResults] = useState<any[]>([]);
  const [isSearchingArtist, setIsSearchingArtist] = useState(false);

  const [oledEnabled, setOledEnabled] = useState(() => powerManager.isOledTrueBlack());
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  if (!isCustomizerOpen) return null;

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);
  const sortedSlots = [...slots].sort((a, b) => a.position - b.position);
  const bufferStats = streamBufferPolicy.getStats();

  const handleSearchArtistForSlot = async (q: string) => {
    setArtistQuery(q);
    if (q.trim().length < 2) {
      setArtistResults([]);
      return;
    }
    setIsSearchingArtist(true);
    try {
      const resp = await fetch(`/api/deezer/search/artist?q=${encodeURIComponent(q.trim())}&limit=5`);
      if (resp.ok) {
        const data = await resp.json();
        setArtistResults(Array.isArray(data?.data) ? data.data : []);
      }
    } catch {} finally {
      setIsSearchingArtist(false);
    }
  };

  const handleAssignArtistToSlot = (slotId: string, artist: any) => {
    updateSlot(slotId, {
      type: 'custom_artist',
      title: artist.name,
      subtitle: 'Artiste Épinglé • Discographie & Vault',
      targetId: String(artist.id),
      customImageUrl: artist.picture_xl || artist.picture_big || artist.picture_medium,
    });
    setEditingSlotId(null);
    setArtistQuery('');
    setArtistResults([]);
  };

  const handleAssignPlaylistToSlot = (slotId: string, pl: any) => {
    updateSlot(slotId, {
      type: 'custom_playlist',
      title: pl.title,
      subtitle: `${pl.tracks?.length || 0} titres • Playlist personnelle`,
      targetId: pl.id,
      customImageUrl: pl.coverUrl,
    });
    setEditingSlotId(null);
  };

  const handleAssignPresetToSlot = (slotId: string, presetType: HomeSlot['type'], idx: number) => {
    if (presetType === 'daily_mix') {
      updateSlot(slotId, {
        type: 'daily_mix',
        title: `Daily Mix 0${(idx % 4) + 1}`,
        subtitle: 'Sélection dynamique Hi-Res',
        targetId: `mix-${(idx % 4) + 1}`,
        customImageUrl: '/default-cover.jpg',
      });
    } else if (presetType === 'recent_releases') {
      updateSlot(slotId, {
        type: 'recent_releases',
        title: 'Radar des Sorties',
        subtitle: 'Nouveaux albums & singles vérifiés',
        targetId: 'radar-releases',
        customImageUrl: 'https://cdn-images.dzcdn.net/images/cover/9a8fb8d63e0d3d5646f4f7776c7432a9/500x500-000000-80-0-0.jpg',
      });
    }
    setEditingSlotId(null);
  };

  const handleToggleOled = () => {
    const next = powerManager.toggleOledTrueBlack();
    setOledEnabled(next);
  };

  const handleExport = () => {
    const json = exportLayoutJson();
    navigator.clipboard?.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    if (importLayoutJson(importText)) {
      setShowImport(false);
      setImportText('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#07090e] border border-white/15 rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 via-emerald-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                Studio d'Accueil & Énergie A18 Pro
              </h2>
              <p className="text-[11px] text-white/60">
                Injection de Slots, Widgets Modulaires & OLED True Black
              </p>
            </div>
          </div>
          <button
            onClick={closeCustomizer}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation par Onglets */}
        <div className="px-6 py-2.5 bg-white/[0.02] border-b border-white/10 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('slots')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'slots'
                ? 'bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-white/5 text-white/70 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Slots (Grille)</span>
          </button>
          <button
            onClick={() => setActiveTab('widgets')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'widgets'
                ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                : 'bg-white/5 text-white/70 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Sections</span>
          </button>
          <button
            onClick={() => setActiveTab('wallpaper')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'wallpaper'
                ? 'bg-purple-400 text-black shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-white/5 text-white/70 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Fond d'Écran</span>
          </button>
          <button
            onClick={() => setActiveTab('power')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'power'
                ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                : 'bg-white/5 text-white/70 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>OLED & A18 Pro</span>
          </button>
        </div>

        {/* Contenu selon l'onglet actif */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {activeTab === 'slots' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-white/65">
                  Remplacez librement n'importe quel emplacement Daily Mix par un artiste, une playlist ou les sorties :
                </p>
                <button
                  onClick={resetSlotsToDefault}
                  className="text-[11px] font-bold text-cyan-300 hover:underline shrink-0 ml-2 cursor-pointer"
                >
                  Réinitialiser les slots
                </button>
              </div>

              {sortedSlots.map((slot, index) => {
                const isEditing = editingSlotId === slot.slotId;

                return (
                  <div
                    key={slot.slotId}
                    className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 border border-white/15 shrink-0 relative">
                          <img
                            src={slot.customImageUrl || '/logo.png'}
                            alt={slot.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-0.5 left-0.5 px-1.5 py-0.2 rounded bg-black/80 text-[9px] font-black text-emerald-400">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                              {slot.type === 'custom_artist'
                                ? 'Artiste'
                                : slot.type === 'custom_playlist'
                                ? 'Playlist'
                                : slot.type === 'recent_releases'
                                ? 'Sorties'
                                : 'Daily Mix'}
                            </span>
                            <h4 className="text-sm font-extrabold text-white truncate">
                              {slot.title}
                            </h4>
                          </div>
                          <p className="text-[11px] text-white/50 truncate mt-0.5">
                            {slot.subtitle}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setEditingSlotId(isEditing ? null : slot.slotId)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 text-xs font-extrabold transition-all shrink-0 cursor-pointer"
                      >
                        {isEditing ? 'Fermer' : 'Remplacer'}
                      </button>
                    </div>

                    {/* Panneau d'injection de slot */}
                    {isEditing && (
                      <div className="pt-3 border-t border-white/10 space-y-3 animate-in fade-in duration-150">
                        {/* Recherche d'artiste Deezer en direct */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span>1. Injecter un Artiste officiel (Recherche Deezer)</span>
                          </label>
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={artistQuery}
                              onChange={(e) => handleSearchArtistForSlot(e.target.value)}
                              placeholder="Ex: Damso, Kendrick Lamar, Vacra, Daft Punk..."
                              className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                          {isSearchingArtist && (
                            <p className="text-[10px] text-white/40">Recherche en cours...</p>
                          )}
                          {artistResults.length > 0 && (
                            <div className="grid grid-cols-1 gap-1.5 pt-1">
                              {artistResults.map((art) => (
                                <button
                                  key={art.id}
                                  onClick={() => handleAssignArtistToSlot(slot.slotId, art)}
                                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 text-left transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={art.picture_small || art.picture_medium}
                                      alt={art.name}
                                      className="w-7 h-7 rounded-full object-cover"
                                    />
                                    <span className="text-xs font-bold text-white">{art.name}</span>
                                  </div>
                                  <span className="text-[10px] font-extrabold text-cyan-300">
                                    Choisir →
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Injection d'une Playlist personnelle */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                            <ListMusic className="w-3.5 h-3.5" />
                            <span>2. Ou injecter une de vos Playlists</span>
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {playlists.slice(0, 5).map((pl) => (
                              <button
                                key={pl.id}
                                onClick={() => handleAssignPlaylistToSlot(slot.slotId, pl)}
                                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 text-[11px] font-bold text-white transition-colors cursor-pointer"
                              >
                                {pl.title}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Injection de Presets */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleAssignPresetToSlot(slot.slotId, 'daily_mix', index)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-white/80 cursor-pointer"
                          >
                            Remettre en Daily Mix
                          </button>
                          <button
                            onClick={() => handleAssignPresetToSlot(slot.slotId, 'recent_releases', index)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-white/80 cursor-pointer"
                          >
                            Radar des Sorties
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'widgets' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-white/10">
                <button
                  onClick={hideAllRecommendations}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Ma Sélection Seule (Zéro Recommandation)</span>
                </button>
                <button
                  onClick={showAllWidgets}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tout afficher</span>
                </button>
              </div>

              {sortedWidgets.map((widget, index) => (
                <div
                  key={widget.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    widget.enabled
                      ? 'bg-white/[0.05] border-white/15 text-white'
                      : 'bg-white/[0.01] border-white/5 text-white/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleWidget(widget.id)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        widget.enabled
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                          : 'bg-white/5 text-white/30 border border-white/5'
                      }`}
                    >
                      {widget.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{widget.title}</p>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-white/40">
                        Position #{index + 1} • {widget.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveWidget(widget.id, 'up')}
                      disabled={index === 0}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 text-white transition-colors cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveWidget(widget.id, 'down')}
                      disabled={index === sortedWidgets.length - 1}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 text-white transition-colors cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'wallpaper' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-cyan-300" />
                      <span>Arrière-Plan Personnalisé</span>
                    </h4>
                    <p className="text-xs text-white/50">
                      Importez une image pour l'écran d'accueil avec compression matérielle GPU
                    </p>
                  </div>
                  {themeStore.backgroundImageUrl && (
                    <button
                      onClick={() => themeStore.setBackgroundImageUrl(null)}
                      className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Supprimer</span>
                    </button>
                  )}
                </div>

                {/* Zone de Drag & Drop / Input File */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageFile(f);
                  }}
                  accept="image/*"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleImageFile(f);
                  }}
                  className="border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-all"
                >
                  {themeStore.backgroundImageUrl ? (
                    <div className="w-full flex items-center gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/20 shrink-0">
                        <img
                          src={themeStore.backgroundImageUrl}
                          alt="Aperçu fond d'écran"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1 text-left">
                        <span className="text-xs font-bold text-white block">Image de fond active</span>
                        <span className="text-[11px] text-cyan-300 block">Cliquez ou glissez pour remplacer</span>
                        <span className="text-[10px] text-white/40 block">Compressé en direct (zéro lag)</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-white">Glissez une image ici ou parcourez vos fichiers</span>
                      <span className="text-[10px] text-white/40">JPG, PNG, WebP (Optimisé jusqu'à 1080p)</span>
                    </>
                  )}
                </div>

                {/* Presets rapides avec les illustrations Sasuke */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-white/60 block">Tester immédiatement nos illustrations d'ambiance :</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => themeStore.setBackgroundImageUrl('/assets/default-cover.jpg')}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-white text-left transition-colors flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      <span>Sasuke (Aura Violette)</span>
                    </button>
                    <button
                      onClick={() => themeStore.setBackgroundImageUrl('/assets/wallpaper-sample.jpg')}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-white text-left transition-colors flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span>Sasuke (Posture Combat)</span>
                    </button>
                  </div>
                </div>

                {/* Sliders de réglage : Assombrissement & Flou */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                  {/* Slider Assombrissement */}
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

                  {/* Slider Flou d'ambiance */}
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
                </div>

                {/* 2. IMAGE RÉCURRENTE / COUVERTURE PAR DÉFAUT */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                        <span>Image Récurrente (Pochette de secours universelle)</span>
                      </h4>
                      <p className="text-[10px] text-white/50 mt-0.5">
                        Image affichée quand un morceau, un leak du Vault ou une playlist n'a pas de pochette officielle.
                      </p>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={coverInputRef}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleCoverFile(f);
                    }}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Aperçu de la couverture active & boutons de choix */}
                  <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-black/60 shadow-md">
                      <img
                        src={themeStore.defaultCoverUrl || '/default-cover.jpg'}
                        alt="Couverture par défaut active"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">Pochette par défaut active</span>
                        {themeStore.defaultCoverUrl && themeStore.defaultCoverUrl !== '/default-cover.jpg' && (
                          <button
                            onClick={() => themeStore.setDefaultCoverUrl('/default-cover.jpg')}
                            className="text-[10px] text-rose-300/80 hover:text-rose-200 cursor-pointer font-bold"
                          >
                            Réinitialiser
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => coverInputRef.current?.click()}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-200 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Importer une autre image récurrente...</span>
                      </button>
                    </div>
                  </div>

                  {/* Presets rapides de couverture récurrente */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => themeStore.setDefaultCoverUrl('/default-cover.jpg')}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-left transition-all cursor-pointer flex items-center gap-2 ${
                        themeStore.defaultCoverUrl === '/default-cover.jpg'
                          ? 'bg-purple-500/20 border-purple-400 text-white'
                          : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0" />
                      <span className="truncate">Sasuke (Aura Violette)</span>
                    </button>
                    <button
                      onClick={() => themeStore.setDefaultCoverUrl('/assets/wallpaper-sample.jpg')}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-left transition-all cursor-pointer flex items-center gap-2 ${
                        themeStore.defaultCoverUrl === '/assets/wallpaper-sample.jpg'
                          ? 'bg-purple-500/20 border-purple-400 text-white'
                          : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
                      <span className="truncate">Sasuke (Combat)</span>
                    </button>
                    <button
                      onClick={() => themeStore.setDefaultCoverUrl('/brand/spoot_logo_official.png')}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-left transition-all cursor-pointer flex items-center gap-2 ${
                        themeStore.defaultCoverUrl === '/brand/spoot_logo_official.png'
                          ? 'bg-purple-500/20 border-purple-400 text-white'
                          : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="truncate">Spoot Néon Officiel</span>
                    </button>
                    <button
                      onClick={() => themeStore.setDefaultCoverUrl('https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=800&q=80')}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-left transition-all cursor-pointer flex items-center gap-2 ${
                        themeStore.defaultCoverUrl?.includes('unsplash')
                          ? 'bg-purple-500/20 border-purple-400 text-white'
                          : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="truncate">Abstrait Minimaliste</span>
                    </button>
                  </div>
                </div>

                {/* 3. COULEUR DE LA BARRE DE LECTURE (MINI-PLAYER & PROGRESSION) */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Couleur de cette barre (Mini-Player & Progression)</span>
                      </h4>
                      <p className="text-[10px] text-white/50 mt-0.5">
                        Personnalisez la couleur de la barre de progression, des icônes et de l'ambiance du lecteur.
                      </p>
                    </div>
                  </div>

                  {/* Aperçu en direct de la mini-barre */}
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
                      <span className="text-[11px] font-bold text-white block truncate">Titre de démonstration</span>
                      <span
                        className="text-[10px] font-medium block truncate"
                        style={{ color: themeStore.playerBarColor || 'var(--accent-color, #00e676)' }}
                      >
                        Artiste • En lecture
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs shrink-0">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: themeStore.playerBarColor || 'var(--accent-color, #00e676)' }}
                      />
                      <span className="text-[10px] font-mono text-white/60">
                        {themeStore.playerBarColor ? themeStore.playerBarColor.toUpperCase() : 'Auto'}
                      </span>
                    </div>
                  </div>

                  {/* Bouton Auto + Pastilles de couleur */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => themeStore.setPlayerBarColor(null)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          themeStore.playerBarColor === null
                            ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        Automatique (Pochette)
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
                          className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                            themeStore.playerBarColor === cp.color
                              ? 'border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.6)]'
                              : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: cp.color }}
                          title={cp.label}
                        >
                          {themeStore.playerBarColor === cp.color && (
                            <span className="w-1.5 h-1.5 rounded-full bg-black/80" />
                          )}
                        </button>
                      ))}

                      {/* Sélecteur de couleur personnalisée */}
                      <label
                        className="w-7 h-7 rounded-full border border-white/30 hover:border-white flex items-center justify-center cursor-pointer transition-all bg-gradient-to-tr from-pink-500 via-amber-400 to-cyan-400 overflow-hidden shrink-0 shadow-sm"
                        title="Choisir une couleur sur-mesure"
                      >
                        <input
                          type="color"
                          value={themeStore.playerBarColor || '#00E676'}
                          onChange={(e) => themeStore.setPlayerBarColor(e.target.value)}
                          className="opacity-0 w-0 h-0 absolute cursor-pointer"
                        />
                        <span className="text-[10px] text-black font-black">+</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'power' && (
            <div className="space-y-4">
              {/* True Black OLED Toggle */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                      Super Retina XDR
                    </span>
                    <h4 className="text-sm font-extrabold text-white">
                      True Black OLED (#000000)
                    </h4>
                  </div>
                  <p className="text-xs text-white/55">
                    Éteint physiquement les sous-pixels noirs de l'iPhone 16 Pro Max (0.00 mW).
                  </p>
                </div>
                <button
                  onClick={handleToggleOled}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                    oledEnabled
                      ? 'bg-emerald-400 text-black shadow-[0_0_16px_rgba(16,185,129,0.5)]'
                      : 'bg-white/10 text-white/70'
                  }`}
                >
                  {oledEnabled ? 'ACTIF (#000)' : 'DÉSACTIVÉ'}
                </button>
              </div>

              {/* Statut Matériel A18 Pro & Modem Burst/Sleep */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BatteryCharging className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-sm font-extrabold text-white">
                      Protocole A18 Pro "Burst & Sleep"
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-[10px] font-black text-cyan-300">
                    {bufferStats.radioState}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-[10px] text-white/45 block">Décodage Audio</span>
                    <span className="font-bold text-white">DSP Matériel AAC/M4A</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-[10px] text-white/45 block">Veille Arrière-Plan</span>
                    <span className="font-bold text-emerald-400">Zéro CPU (WebKit Freeze)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showImport && (
            <div className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-2">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Collez votre configuration home_config.json ici..."
                className="w-full h-24 bg-black/60 border border-white/10 rounded-xl p-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleImport}
                className="w-full py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs cursor-pointer"
              >
                Appliquer le JSON
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Exporter JSON'}</span>
            </button>
            <button
              onClick={() => setShowImport(!showImport)}
              className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importer</span>
            </button>
          </div>
          <button
            onClick={resetToDefault}
            className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeCustomizerModal;
