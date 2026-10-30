// Spoot Music — Synchronized Lyrics Panel (Forwarding to Apple-Grade LyricsViewer)
import React from 'react';
import { LyricsViewer } from './LyricsViewer';

interface LyricsPanelProps {
  onClose?: () => void;
  isOverlay?: boolean;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = (props) => {
  return <LyricsViewer {...props} />;
};

export default LyricsPanel;
