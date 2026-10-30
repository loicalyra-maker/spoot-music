// Spoot Music — Device Picker & Output Audio Selector (setSinkId & Qualité Sélective)
import React, { useState, useEffect, useRef } from 'react';
import { Speaker, Laptop, Smartphone, Check, Radio, Headphones, X, Volume2, ShieldCheck, Zap } from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';

export const DevicePickerMenu: React.FC = () => {
  const {
    isDevicePickerOpen,
    setDevicePickerOpen,
    selectedAudioDeviceId,
    setSelectedAudioDeviceId,
    audioQuality,
    setAudioQuality,
  } = useSpootStore();

  const [devices, setDevices] = useState<{ deviceId: string; label: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((allDevices) => {
          const audioOutputs = allDevices
            .filter((d) => d.kind === 'audiooutput')
            .map((d, idx) => ({
              deviceId: d.deviceId || `device-${idx}`,
              label: d.label || (idx === 0 ? 'Haut-parleurs par défaut du système' : `Périphérique audio #${idx + 1}`),
            }));

          if (audioOutputs.length === 0) {
            audioOutputs.push({ deviceId: 'default', label: 'Haut-parleurs principaux (Système)' });
          }
          setDevices(audioOutputs);
        })
        .catch((err) => {
          console.warn('enumerateDevices error:', err);
          setDevices([{ deviceId: 'default', label: 'Périphérique par défaut du système' }]);
        });
    } else {
      setDevices([{ deviceId: 'default', label: 'Périphérique par défaut du système' }]);
    }
  }, [isDevicePickerOpen]);

  // Fermeture extérieure
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDevicePickerOpen(false);
      }
    };
    if (isDevicePickerOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isDevicePickerOpen, setDevicePickerOpen]);

  if (!isDevicePickerOpen) return null;

  const handleSelectDevice = async (deviceId: string) => {
    setErrorMsg(null);
    setSelectedAudioDeviceId(deviceId);

    // Tentative de setSinkId sur l'élément audio natif
    try {
      const audioEls = document.querySelectorAll('audio');
      for (const el of audioEls) {
        if ('setSinkId' in el && typeof (el as any).setSinkId === 'function') {
          await (el as any).setSinkId(deviceId === 'default' ? '' : deviceId);
        }
      }
    } catch (err: any) {
      console.warn('setSinkId failed, using OS default fallback:', err);
      setErrorMsg("Commutation matérielle directe indisponible, sortie gérée par l'OS.");
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute bottom-20 right-8 w-80 bg-[#282828] border border-[#3e3e3e]/80 rounded-xl shadow-2xl p-4 text-white z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none divide-y divide-[#3e3e3e]/40"
    >
      {/* Header */}
      <div className="pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Speaker className="w-5 h-5 text-spoot-neon" />
          <h3 className="text-sm font-black tracking-tight text-white">Connecter un appareil</h3>
        </div>
        <button
          onClick={() => setDevicePickerOpen(false)}
          className="p-1 rounded-full text-[#b3b3b3] hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 1. Sorties Audio Matérielles Détectées */}
      <div className="py-3 space-y-1">
        <p className="text-[11px] font-bold text-[#b3b3b3] uppercase tracking-wider mb-2">
          Périphériques audio détectés
        </p>

        {devices.map((d) => {
          const isSelected = selectedAudioDeviceId === d.deviceId;

          return (
            <button
              key={d.deviceId}
              onClick={() => handleSelectDevice(d.deviceId)}
              className={`w-full px-3 py-2 rounded-lg text-left flex items-center justify-between transition-colors ${
                isSelected
                  ? 'bg-spoot-neon/15 text-spoot-neon font-bold'
                  : 'hover:bg-[#383838] text-[#d4d4d4]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <Headphones className={`w-4 h-4 shrink-0 ${isSelected ? 'text-spoot-neon' : 'text-[#b3b3b3]'}`} />
                <span className="text-xs truncate">{d.label}</span>
              </div>
              {isSelected && <Check className="w-4 h-4 text-spoot-neon shrink-0" />}
            </button>
          );
        })}

        {errorMsg && (
          <p className="text-[10px] text-amber-400 mt-1 italic px-1">{errorMsg}</p>
        )}
      </div>

      {/* 2. Qualité Audio Sélective (Économie & Vitesse) */}
      <div className="pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-[#b3b3b3] uppercase tracking-wider">
            Qualité du streaming
          </p>
          <span className="text-[10px] text-spoot-neon font-semibold flex items-center gap-0.5">
            <Zap className="w-3 h-3" />
            yt-dlp
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setAudioQuality('normal')}
            className={`py-1.5 px-2 rounded-md text-xs font-bold transition-all ${
              audioQuality === 'normal'
                ? 'bg-spoot-neon text-black shadow-md'
                : 'bg-[#333333] hover:bg-[#3e3e3e] text-[#b3b3b3]'
            }`}
            title="Économie : 96 kbps Opus/AAC (<0.7 Mo/min)"
          >
            Éco (96k)
          </button>
          <button
            onClick={() => setAudioQuality('high')}
            className={`py-1.5 px-2 rounded-md text-xs font-bold transition-all ${
              audioQuality === 'high'
                ? 'bg-spoot-neon text-black shadow-md'
                : 'bg-[#333333] hover:bg-[#3e3e3e] text-[#b3b3b3]'
            }`}
            title="Normale : 160 kbps"
          >
            Normale (160k)
          </button>
          <button
            onClick={() => setAudioQuality('very_high')}
            className={`py-1.5 px-2 rounded-md text-xs font-bold transition-all ${
              audioQuality === 'very_high' || audioQuality === 'hi_res'
                ? 'bg-spoot-neon text-black shadow-md'
                : 'bg-[#333333] hover:bg-[#3e3e3e] text-[#b3b3b3]'
            }`}
            title="Très Élevée : 320 kbps bestaudio"
          >
            Hi-Fi (320k)
          </button>
        </div>
      </div>

    </div>
  );
};
export default DevicePickerMenu;
