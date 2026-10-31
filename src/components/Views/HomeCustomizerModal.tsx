// Spoot Music — Home Customizer Modal (home_layout.json / Widgets Modulaires)
// Interface intuitive permettant de cocher/décocher n'importe quel bloc, réordonner,
// masquer les recommandations en 1 clic, et épingler artistes/playlists.

import React, { useState } from 'react';
import {
  X, Check, ArrowUp, ArrowDown, Eye, EyeOff, Sliders,
  RotateCcw, Download, Upload, Sparkles, Music2, Pin
} from 'lucide-react';
import { useHomeLayoutStore, HomeWidget } from '../../store/useHomeLayoutStore';
import { useSpootStore } from '../../store/useSpootStore';

export const HomeCustomizerModal: React.FC = () => {
  const {
    widgets,
    isCustomizerOpen,
    closeCustomizer,
    toggleWidget,
    moveWidget,
    hideAllRecommendations,
    showAllWidgets,
    resetToDefault,
    exportLayoutJson,
    importLayoutJson,
    updateWidgetCustomData
  } = useHomeLayoutStore();

  const { playlists, artists } = useSpootStore();

  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);

  if (!isCustomizerOpen) return null;

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  const handleExport = () => {
    const json = exportLayoutJson();
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = importLayoutJson(importText);
    if (ok) {
      setShowImportArea(false);
      setImportText('');
    } else {
      alert('Format JSON de disposition invalide');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#0f0f12] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.9)] max-h-[90vh] flex flex-col text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Personnaliser l'Accueil</h2>
              <p className="text-xs text-white/50 mt-0.5">
                Activez, désactivez et ordonnez les modules de votre écran d'accueil
              </p>
            </div>
          </div>
          <button
            onClick={closeCustomizer}
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre d'actions rapides intelligentes */}
        <div className="py-4 flex items-center gap-2.5 flex-wrap border-b border-white/5">
          <button
            onClick={hideAllRecommendations}
            className="px-3.5 py-1.5 rounded-xl bg-spoot-neon/15 hover:bg-spoot-neon/25 text-spoot-neon border border-spoot-neon/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Masque les algorithmes pour ne voir que sa propre sélection"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ma Sélection Seule (Zéro Recommandation)</span>
          </button>

          <button
            onClick={showAllWidgets}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs font-semibold transition-all cursor-pointer"
          >
            Tout Activer
          </button>

          <button
            onClick={resetToDefault}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
            title="Réinitialiser l'ordre et l'affichage par défaut"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Défaut</span>
          </button>
        </div>

        {/* Liste des Widgets Ordonnables */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar pr-1">
          {sortedWidgets.map((widget, index) => (
            <div
              key={widget.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                widget.enabled
                  ? 'bg-white/[0.04] border-white/10 shadow-sm'
                  : 'bg-white/[0.01] border-white/5 opacity-50'
              }`}
            >
              {/* Gauche : Statut, Ordre & Nom */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Checkbox Toggle */}
                <button
                  onClick={() => toggleWidget(widget.id)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    widget.enabled
                      ? 'bg-spoot-neon text-black font-black'
                      : 'border border-white/30 text-transparent'
                  }`}
                  title={widget.enabled ? 'Désactiver' : 'Activer'}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white truncate">
                      {widget.title}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                      {widget.type}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 truncate mt-0.5">
                    {widget.type === 'shortcuts' && 'Accès direct aux artistes et pistes récents'}
                    {widget.type === 'user_playlists' && 'Bibliothèque et playlists créées par vous'}
                    {widget.type === 'recent_artists' && 'Artistes préférés et épinglés'}
                    {widget.type === 'daily_mix' && 'Sélections algorithmiques quotidiennes (2x2)'}
                    {widget.type === 'new_releases' && 'Vendredi des sorties officielles'}
                    {widget.type === 'custom_banner' && 'Bannière personnalisée ou Liquid Glass'}
                  </p>
                </div>
              </div>

              {/* Droite : Flèches de déplacement */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  disabled={index === 0}
                  onClick={() => moveWidget(widget.id, 'up')}
                  className={`p-2 rounded-xl border border-white/10 transition-colors ${
                    index === 0
                      ? 'opacity-20 cursor-not-allowed'
                      : 'hover:bg-white/10 text-white cursor-pointer active:scale-95'
                  }`}
                  title="Monter"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                <button
                  disabled={index === sortedWidgets.length - 1}
                  onClick={() => moveWidget(widget.id, 'down')}
                  className={`p-2 rounded-xl border border-white/10 transition-colors ${
                    index === sortedWidgets.length - 1
                      ? 'opacity-20 cursor-not-allowed'
                      : 'hover:bg-white/10 text-white cursor-pointer active:scale-95'
                  }`}
                  title="Descendre"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Section Import / Export JSON */}
          <div className="pt-4 border-t border-white/10 mt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
                Configuration JSON (home_layout.json)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 border border-white/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copié !' : 'Exporter JSON'}</span>
                </button>
                <button
                  onClick={() => setShowImportArea(!showImportArea)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 border border-white/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importer</span>
                </button>
              </div>
            </div>

            {showImportArea && (
              <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Collez ici le JSON de configuration..."
                  rows={4}
                  className="w-full rounded-2xl bg-black/60 border border-white/15 p-3 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-spoot-neon"
                />
                <button
                  onClick={handleImport}
                  className="w-full py-2 rounded-xl bg-spoot-neon text-black font-bold text-xs hover:scale-[1.01] active:scale-95 transition-transform cursor-pointer"
                >
                  Appliquer la configuration JSON
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer avec bouton Terminer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={closeCustomizer}
            className="px-6 py-2.5 rounded-2xl bg-white text-black font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
          >
            Enregistrer & Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeCustomizerModal;
