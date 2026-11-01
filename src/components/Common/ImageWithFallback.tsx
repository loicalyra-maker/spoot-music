// Spoot Music — ImageWithFallback.tsx
// Protection anti-CORS/Referrer, zéro pochette cassée,
// et restriction stricte de l'image de fallback (Sasuke) aux seuls titres Vault / Unreleased.

import React, { useState, useEffect } from 'react';
import { Music2 } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  iconClassName?: string;
  isUnreleased?: boolean;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc,
  alt = 'Pochette',
  className = '',
  iconClassName = 'w-1/3 h-1/3 opacity-40',
  isUnreleased = false,
  ...props
}) => {
  const [errorCount, setErrorCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const storeDefaultCover = useThemeStore((s) => s.defaultCoverUrl);

  // Synchronise si la prop src change
  useEffect(() => {
    setCurrentSrc(src);
    setErrorCount(0);
  }, [src]);

  const handleError = () => {
    // Si c'est un titre Unreleased / Vault, on peut utiliser le storeDefaultCover (Sasuke)
    if (isUnreleased) {
      const sasukeFallback = fallbackSrc || storeDefaultCover || '/default-cover.jpg';
      if (currentSrc !== sasukeFallback) {
        setCurrentSrc(sasukeFallback);
        return;
      }
      setErrorCount((prev) => prev + 1);
      return;
    }

    // Cas officiel (isUnreleased === false) : INTERDICTION FORMELLE DE SASUKE
    // On tente une résolution intermédiaire si c'est une image Deezer ou iTunes
    if (errorCount === 0 && currentSrc) {
      if (currentSrc.includes('1000x1000')) {
        setCurrentSrc(currentSrc.replace('1000x1000', '500x500'));
        setErrorCount(1);
        return;
      }
      if (currentSrc.includes('cover_xl')) {
        setCurrentSrc(currentSrc.replace('cover_xl', 'cover_big'));
        setErrorCount(1);
        return;
      }
    } else if (errorCount === 1 && currentSrc) {
      if (currentSrc.includes('500x500')) {
        setCurrentSrc(currentSrc.replace('500x500', '250x250'));
        setErrorCount(2);
        return;
      }
      if (currentSrc.includes('cover_big')) {
        setCurrentSrc(currentSrc.replace('cover_big', 'cover_medium'));
        setErrorCount(2);
        return;
      }
    }

    // Si un fallback non-Sasuke a été explicitement fourni
    if (fallbackSrc && fallbackSrc !== '/default-cover.jpg' && fallbackSrc !== storeDefaultCover && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setErrorCount(3);
      return;
    }

    // Si tout a échoué ou pas de source : passer en mode placeholder neutre
    setErrorCount(99);
  };

  // Si pas de source ou si toutes les tentatives d'images ont échoué
  if (!currentSrc || errorCount >= 99) {
    if (isUnreleased) {
      const sasuke = fallbackSrc || storeDefaultCover || '/default-cover.jpg';
      return (
        <img
          src={sasuke}
          alt={alt}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          className={className}
          onError={() => setErrorCount(999)}
          {...props}
        />
      );
    }

    // Placeholder neutre officiel : carte Liquid Glass sombre avec icône musicale en verre
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-[#1a1a1f] to-[#0e0e12] text-white/40 border border-white/10 select-none overflow-hidden ${className}`}>
        <Music2 className={iconClassName} />
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={handleError}
      className={className}
      {...props}
    />
  );
};

export default ImageWithFallback;
