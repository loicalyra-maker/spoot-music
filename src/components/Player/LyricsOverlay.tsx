// Spoot Music — Synced Lyrics Overlay Component
import React from 'react';
import { useSpootStore } from '../../store/useSpootStore';
import { LyricsPanel } from './LyricsPanel';

export const LyricsOverlay: React.FC = () => {
  const { lyricsOpen, setLyricsOpen } = useSpootStore();

  if (!lyricsOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/95 backdrop-blur-3xl animate-in fade-in duration-200">
      <LyricsPanel onClose={() => setLyricsOpen(false)} isOverlay={true} />
    </div>
  );
};
