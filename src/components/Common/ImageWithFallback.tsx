// Spoot Music — ImageWithFallback.tsx
// Composant d'image haute résilience : protection anti-CORS/Referrer, zéro pochette cassée,
// et fallback systématique élégant avec l'illustration dédiée.

import React, { useState } from 'react';
import { Music2 } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  iconClassName?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc = '/default-cover.jpg',
  alt = 'Pochette',
  className = '',
  iconClassName = 'w-1/3 h-1/3 opacity-40',
  ...props
}) => {
  const [error, setError] = useState(false);

  // Si pas de source ou si le chargement échoue
  if (error || !src) {
    if (fallbackSrc && fallbackSrc !== src) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          className={className}
          onError={() => setError(true)}
          {...props}
        />
      );
    }
    return (
      <div className={`flex items-center justify-center bg-[#141416] text-white/30 border border-white/5 select-none ${className}`}>
        <Music2 className={iconClassName} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => setError(true)}
      className={className}
      {...props}
    />
  );
};

export default ImageWithFallback;
