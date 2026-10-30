// Spoot Music — Spoot Connect Multi-Device Handoff Modal
import React from 'react';
import { X, Cast, Laptop, Smartphone, Speaker, Car, Check, Volume2 } from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';

export const SpootConnectModal: React.FC = () => {
  const { connectModalOpen, setConnectModalOpen, devices } = useSpootStore();

  if (!connectModalOpen) return null;

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'computer': return <Laptop className="w-5 h-5" />;
      case 'smartphone': return <Smartphone className="w-5 h-5" />;
      case 'speaker': return <Speaker className="w-5 h-5" />;
      case 'car': return <Car className="w-5 h-5" />;
      default: return <Cast className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#121212] border border-[#242424] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-spoot-neon/15 text-spoot-neon border border-spoot-neon/30">
              <Cast className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-extrabold text-base">Spoot Connect</h2>
              <p className="text-xs text-spoot-muted">Bascule de flux instantanée sans interruption audio.</p>
            </div>
          </div>

          <button
            onClick={() => setConnectModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#181818] border border-white/10 flex items-center justify-center text-white hover:bg-[#282828] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Devices List */}
        <div className="space-y-2">
          {devices.map((device) => (
            <div
              key={device.id}
              onClick={() => {
                alert(`Lecture transférée sur "${device.name}" sans coupure audio.`);
                setConnectModalOpen(false);
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                device.isCurrent
                  ? 'bg-spoot-neon/10 border-spoot-neon text-white'
                  : 'bg-[#161616] border-[#222222] text-spoot-muted hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={device.isCurrent ? 'text-spoot-neon' : 'text-spoot-muted'}>
                  {getDeviceIcon(device.type)}
                </div>
                <div>
                  <p className="font-bold text-xs text-white">{device.name}</p>
                  <p className="text-[10px] text-spoot-muted">
                    {device.isCurrent ? 'Appareil actif en écoute' : 'Disponible sur le réseau local / Wi-Fi'}
                  </p>
                </div>
              </div>

              {device.isCurrent && (
                <div className="flex items-center gap-1.5 text-spoot-neon text-xs font-bold font-mono">
                  <Check className="w-4 h-4" />
                  <span>Actif</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
