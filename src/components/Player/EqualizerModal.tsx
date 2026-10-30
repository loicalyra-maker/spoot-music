// Spoot Music — 10-Band Parametric Equalizer Modal
import React from 'react';
import { X, Sliders, RotateCcw, Headphones, Save } from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { EQ_FREQUENCIES } from '../../audio/WebAudioEngine';

export const EqualizerModal: React.FC = () => {
  const {
    equalizerModalOpen, setEqualizerModalOpen, eqGains, setEqBand,
    eqPreset, setEqPreset
  } = useSpootStore();

  if (!equalizerModalOpen) return null;

  const presets = ['Flat', 'BassBoost', 'Acoustic', 'HipHop', 'Electro'];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#121212] border border-[#242424] rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-spoot-neon/15 text-spoot-neon border border-spoot-neon/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-extrabold text-lg">Égaliseur Paramétrique 10 Bandes</h2>
              <p className="text-xs text-spoot-muted">Traitement biquad RBJ haute précision avec mémorisation par périphérique.</p>
            </div>
          </div>

          <button
            onClick={() => setEqualizerModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#181818] border border-white/10 flex items-center justify-center text-white hover:bg-[#282828] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Presets Row */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          <div className="flex items-center gap-2">
            {presets.map((preset) => (
              <button
                key={preset}
                onClick={() => setEqPreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  eqPreset === preset
                    ? 'bg-spoot-neon text-black border-spoot-neon shadow-md'
                    : 'bg-[#181818] text-spoot-muted border-transparent hover:text-white hover:bg-[#202020]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <button
            onClick={() => setEqPreset('Flat')}
            className="p-1.5 rounded-xl bg-[#181818] text-spoot-muted hover:text-white transition-colors flex items-center gap-1 text-xs"
            title="Réinitialiser à plat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* 10 Vertical Sliders Grid */}
        <div className="grid grid-cols-10 gap-2 md:gap-4 items-center h-56 pt-4 px-2">
          {EQ_FREQUENCIES.map((freq, idx) => {
            const gain = eqGains[idx] || 0;
            const freqLabel = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;

            return (
              <div key={freq} className="flex flex-col items-center justify-between h-full group">
                <span className="text-[10px] font-mono text-spoot-neon font-bold">
                  {gain > 0 ? `+${gain}` : `${gain}`}
                </span>

                <div className="flex-1 flex items-center py-2">
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={gain}
                    onChange={(e) => setEqBand(idx, parseFloat(e.target.value))}
                    className="h-32 w-1.5 bg-[#242424] accent-spoot-neon rounded-full appearance-none cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                  />
                </div>

                <span className="text-[10px] font-mono text-spoot-muted group-hover:text-white transition-colors">
                  {freqLabel}
                </span>
              </div>
            );
          })}
        </div>

        {/* Device Persistence Badge */}
        <div className="pt-4 border-t border-[#1e1e1e] flex items-center justify-between text-xs text-spoot-muted">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-spoot-cyan" />
            <span>Profil mémorisé pour : <strong>Sortie Audio Principale (WASAPI / DirectSound)</strong></span>
          </div>

          <button
            onClick={() => setEqualizerModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-spoot-neon text-black font-bold hover:scale-105 active:scale-95 transition-transform"
          >
            Appliquer & Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
