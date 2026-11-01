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

  const [activeTab, setActiveTab] = useState<'slots' | 'widgets' | 'power'>('slots');
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
        customImageUrl: 'https://cdn-images.dzcdn.net/images/cover/4e6b43dbc7c9bc398d6a816b34419e8a/500x500-000000-80-0-0.jpg',
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
