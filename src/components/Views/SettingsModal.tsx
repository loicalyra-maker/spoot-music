// Spoot Music — Settings & Cache Manager Modal
import React, { useState } from 'react';
import {
  X, Settings, HardDrive, Trash2, ShieldAlert, Zap, Sliders, Check, RotateCcw
} from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';

export const SettingsModal: React.FC = () => {
  const {
    settingsModalOpen, setSettingsModalOpen, clearStreamingCache,
    crossfadeSeconds, gaplessEnabled, volumeNormalization, blacklist,
    cacheStreamingMb, trash, emptyTrash
  } = useSpootStore();

  const [audioQuality, setAudioQuality] = useState('flac_hires_192k');
  const [crossfade, setCrossfade] = useState(crossfadeSeconds);

  if (!settingsModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#121212] border border-[#242424] rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-spoot-neon/15 text-spoot-neon border border-spoot-neon/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-extrabold text-lg">Réglages Spoot Music</h2>
              <p className="text-xs text-spoot-muted">Qualité Hi-Res, gestion du cache et exclusion stricte.</p>
            </div>
          </div>

          <button
            onClick={() => setSettingsModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#181818] border border-white/10 flex items-center justify-center text-white hover:bg-[#282828] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Qualité Audio */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-spoot-neon" />
            <span>Qualité Audio & Streaming</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { id: 'low', label: 'Faible (96 kbps HE-AAC v2)', desc: 'Économie data extrême' },
              { id: 'normal', label: 'Normale (160 kbps AAC-LC)', desc: 'Usage cellulaire standard' },
              { id: 'high', label: 'Haute (320 kbps AAC-LC)', desc: 'Qualité transparente standard' },
              { id: 'flac_hires_192k', label: 'Hi-Res Lossless (FLAC 24/192 kHz)', desc: 'Direct Master Bit-Perfect' },
            ].map(opt => (
              <div
                key={opt.id}
                onClick={() => setAudioQuality(opt.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  audioQuality === opt.id
                    ? 'bg-spoot-neon/10 border-spoot-neon text-white'
                    : 'bg-[#161616] border-[#222222] text-spoot-muted hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{opt.label}</span>
                  {audioQuality === opt.id && <Check className="w-3.5 h-3.5 text-spoot-neon" />}
                </div>
                <p className="text-[11px] text-spoot-muted mt-1">{opt.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Transitions & DSP */}
        <div className="space-y-4 pt-2 border-t border-[#1e1e1e]">
          <h3 className="text-sm font-extrabold text-white">Transitions & Traitement Audio</h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white font-medium">Fondu enchaîné (Crossfade) :</span>
              <span className="font-mono text-spoot-neon font-bold">{crossfade} secondes</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              value={crossfade}
              onChange={(e) => setCrossfade(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#242424] accent-spoot-neon rounded-full appearance-none cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-1 text-xs">
            <div>
              <p className="text-white font-bold">Lecture Sans Blanc (Gapless Playback Vrai)</p>
              <p className="text-spoot-muted">Supprime les micro-silences entre pistes d'albums concepts ou concerts live.</p>
            </div>
            <span className="px-2 py-1 rounded-full bg-spoot-neon/20 text-spoot-neon font-bold text-[11px]">
              Actif (0 ms)
            </span>
          </div>
        </div>

        {/* Section 3: Gestionnaire de Cache Dédié (Cloisonnement Strict) */}
        <div className="space-y-3 pt-2 border-t border-[#1e1e1e]">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-spoot-cyan" />
            <span>Gestionnaire de Cache Strictement Cloisonné</span>
          </h3>

          <div className="p-4 rounded-2xl bg-[#161616] border border-[#222222] space-y-3">
            {/* Dynamic Storage Bar */}
            <div className="h-2.5 w-full bg-[#242424] rounded-full overflow-hidden flex">
              <div className="h-full bg-spoot-muted w-[5%]" title="App : 150 Mo" />
              <div
                className="h-full bg-spoot-cyan transition-all duration-500"
                style={{ width: `${Math.min(30, (cacheStreamingMb / 2000) * 100)}%` }}
                title={`Cache streaming : ${cacheStreamingMb.toFixed(0)} Mo`}
              />
              <div className="h-full bg-spoot-neon flex-1" title="Titres hors-ligne : 18.4 Go" />
            </div>

            <div className="flex items-center justify-between text-[11px] text-spoot-muted font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-spoot-muted" /> App (150 Mo)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-spoot-cyan" /> Cache Streaming ({cacheStreamingMb.toFixed(0)} Mo)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-spoot-neon" /> Titres Téléchargés (18.4 Go)
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <p className="text-xs text-spoot-muted max-w-sm">
                Vider le cache supprime les fichiers temporaires sans jamais effacer vos musiques téléchargées.
              </p>
              <button
                onClick={clearStreamingCache}
                disabled={cacheStreamingMb === 0}
                className="px-3.5 py-2 rounded-xl bg-spoot-danger/15 hover:bg-spoot-danger/25 text-spoot-danger border border-spoot-danger/30 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vider le cache de lecture ({cacheStreamingMb.toFixed(0)} Mo)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Gestion de la Corbeille */}
        <div className="space-y-3 pt-2 border-t border-[#1e1e1e]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-spoot-muted" />
              <span>Corbeille d'Application ({trash.length} éléments)</span>
            </h3>

            {trash.length > 0 && (
              <button
                onClick={emptyTrash}
                className="px-3 py-1.5 rounded-xl bg-spoot-danger/20 text-spoot-danger border border-spoot-danger/40 text-xs font-bold hover:bg-spoot-danger hover:text-black transition-colors"
              >
                Vider la corbeille
              </button>
            )}
          </div>
          <p className="text-xs text-spoot-muted">
            Les playlists et titres supprimés sont conservés 30 jours avant purge définitive.
          </p>
        </div>

        {/* Section 5: Blacklist Totale (Hardware Filtering) */}
        <div className="space-y-3 pt-2 border-t border-[#1e1e1e]">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-spoot-danger" />
            <span>Blacklist Totale & Définitive ({blacklist.length})</span>
          </h3>

          {blacklist.length === 0 ? (
            <p className="text-xs text-spoot-muted">Aucun artiste ni morceau bloqué pour l'instant.</p>
          ) : (
            <div className="space-y-1.5">
              {blacklist.map(rule => (
                <div key={rule.id} className="p-2.5 rounded-xl bg-[#161616] border border-[#222222] flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{rule.name}</span>
                  <span className="text-[10px] text-spoot-danger font-mono uppercase">100% Bloqué</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
