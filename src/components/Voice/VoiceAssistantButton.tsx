// Spot Music — Voice Assistant Button (VoiceAssistantButton.tsx)
// Faithful reproduction of iOS 26 Liquid Glass Voice Orb with holographic rim (media_1793382868559_046f73da.png)
import React from 'react';
import { Mic } from 'lucide-react';

interface VoiceAssistantButtonProps {
  onClick: () => void;
  isListening?: boolean;
  className?: string;
  size?: number;
}

export const VoiceAssistantButton: React.FC<VoiceAssistantButtonProps> = ({
  onClick,
  isListening = false,
  className = '',
  size = 40,
}) => {
  return (
    <button
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`liquid-voice-assistant-orb group select-none shrink-0 ${
        isListening ? 'listening scale-105' : 'hover:scale-105'
      } ${className}`}
      title={isListening ? 'Assistant vocal à l’écoute...' : 'Activer la commande vocale'}
      aria-label="Assistant vocal Spoot"
    >
      {/* Cœur Verre Givré avec Reflet Circulaire Doux */}
      <div className="absolute inset-[1px] rounded-full bg-gradient-to-b from-white/30 via-white/10 to-transparent pointer-events-none" />

      {/* Icône Microphone Givrée Translucide selon la maquette */}
      <Mic
        style={{ width: size * 0.48, height: size * 0.48 }}
        className={`relative z-10 transition-all duration-300 ${
          isListening
            ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)] animate-pulse'
            : 'text-white/80 group-hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
        }`}
        strokeWidth={2.1}
      />
    </button>
  );
};

export default VoiceAssistantButton;
