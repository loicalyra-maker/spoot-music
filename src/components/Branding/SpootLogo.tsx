// Spoot Music — Official Brand Identity Component (SpootLogo.tsx)
// Uses the Authentic 4K Official Spoot Music Visual Asset (Cosmic Celestial Crescent 'S', Cherry Blossoms, Waves & Hi-Res Badge)
import React, { useState } from 'react';

export type LogoVariant = 'default' | 'liquid-glass' | 'wave-monogram' | 'monochrome';

interface SpootLogoProps {
  variant?: LogoVariant;
  size?: number;
  className?: string;
  showText?: boolean;
}

export const SpootLogo: React.FC<SpootLogoProps> = ({
  size = 38,
  className = '',
  showText = true,
}) => {
  const [imageError, setImageError] = useState(false);

  const logoSrc = './brand/spoot_logo_official.png';
  const badgeSrc = './brand/spoot_badge.png';

  // Mode avec texte : Bannière Officielle Complète Spoot Music
  if (showText && !imageError) {
    const bannerHeight = Math.max(30, size);
    return (
      <div
        className={`flex items-center select-none group cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] ${className}`}
        title="Spoot Music — Hi-Res Audio"
      >
        <img
          src={logoSrc}
          alt="Spoot Music — Hi-Res Audio"
          style={{ height: `${bannerHeight}px`, width: 'auto' }}
          className="object-contain drop-shadow-[0_4px_16px_rgba(6,182,212,0.35)] transition-all group-hover:drop-shadow-[0_6px_22px_rgba(6,182,212,0.6)]"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Mode Icône Seule (Squircle Cosmique Officiel) ou Fallback
  return (
    <div
      className={`flex items-center gap-2.5 select-none group cursor-pointer ${className}`}
      title="Spoot Music — Hi-Res Audio"
    >
      <div
        style={{ width: size, height: size }}
        className="relative rounded-xl overflow-hidden shrink-0 shadow-[0_4px_16px_rgba(6,182,212,0.35)] transition-transform group-hover:scale-105 group-active:scale-95 border border-white/20 bg-[#03050f]"
      >
        <img
          src={badgeSrc}
          alt="Spoot Music Logo"
          className="w-full h-full object-cover rounded-xl"
        />
      </div>

      {showText && (
        <div className="flex flex-col select-none">
          <span className="font-black text-sm tracking-tight text-white leading-tight flex items-center gap-1.5">
            <span>Spoot</span>
            <span className="text-cyan-400 font-extrabold">Music</span>
          </span>
          <span className="text-[9px] font-bold text-cyan-300 tracking-wider uppercase font-mono">
            Hi-Res Audio
          </span>
        </div>
      )}
    </div>
  );
};

export default SpootLogo;
