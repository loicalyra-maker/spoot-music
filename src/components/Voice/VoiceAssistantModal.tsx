// Spot Music — Voice Assistant Modal (VoiceAssistantModal.tsx)
// Interactive Voice Recognition with iOS 26 Liquid Glass HUD & Smart Intent Execution
import React, { useEffect, useState, useRef } from 'react';
import { Mic, X, Volume2, Sparkles, CheckCircle2, Play, AlertCircle } from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { useThemeStore } from '../../store/useThemeStore';
import { deezerService } from '../../services/deezer_service';
import { audioCore } from '../../audio/WebAudioEngine';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose }) => {
  const {
    playTrack, togglePlayPause, nextTrack, previousTrack,
    setVolume, setActiveView, setSearchQuery, openPlaylist, tracks
  } = useSpootStore();
  const { cornerRadius } = useThemeStore();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'info' | 'error'>('info');
  const recognitionRef = useRef<any>(null);

  // Initialisation et écoute de la parole (Web Speech API)
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      setTranscript('');
      setFeedback(null);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setFeedback('Reconnaissance vocale non supportée sur ce navigateur. Utilisez les suggestions ci-dessous.');
      setFeedbackType('info');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setFeedback('À votre écoute... Dites par exemple : "Joue SDM" ou "Pause"');
      setFeedbackType('info');
    };

    recognition.onresult = (event: any) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);

      if (event.results[0].isFinal) {
        handleVoiceCommand(current);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setFeedback('Microphone désactivé. Autorisez le micro ou cliquez sur les commandes suggérées.');
      } else {
        setFeedback('Aucune voix détectée. Vous pouvez réessayer ou cliquer sur une commande.');
      }
      setFeedbackType('error');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.warn('Could not start recognition automatically:', e);
    }

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [isOpen]);

  // Analyse sémantique et exécution de l'ordre vocal
  const handleVoiceCommand = async (rawText: string) => {
    const text = rawText.toLowerCase().trim();
    setTranscript(rawText);

    // 1. Commande Pause / Arrêter
    if (text.includes('pause') || text.includes('stop') || text.includes('arrête') || text.includes('coupe')) {
      audioCore.pause();
      setFeedback('Lecture mise en pause.');
      setFeedbackType('success');
      setTimeout(onClose, 1400);
      return;
    }

    // 2. Commande Reprendre / Play
    if (text.includes('reprends') || text.includes('lecture') || text.includes('rejoue') || text === 'play') {
      audioCore.resume();
      setFeedback('Reprise de la lecture.');
      setFeedbackType('success');
      setTimeout(onClose, 1400);
      return;
    }

    // 3. Commande Suivant
    if (text.includes('suivant') || text.includes('suivante') || text.includes('next') || text.includes('passe')) {
      nextTrack();
      setFeedback('Passage au morceau suivant.');
      setFeedbackType('success');
      setTimeout(onClose, 1400);
      return;
    }

    // 4. Commande Précédent
    if (text.includes('précédent') || text.includes('précédente') || text.includes('previous') || text.includes('retour')) {
      previousTrack();
      setFeedback('Retour au morceau précédent.');
      setFeedbackType('success');
      setTimeout(onClose, 1400);
      return;
    }

    // 5. Commande Titres likés / Favoris
    if (text.includes('liké') || text.includes('aimé') || text.includes('favori')) {
      openPlaylist('pl-fav');
      setFeedback('Ouverture de vos Titres likés.');
      setFeedbackType('success');
      setTimeout(onClose, 1400);
      return;
    }

    // 6. Commande Réglage du Volume (ex: "volume 50%", "mets le volume à 80")
    const volMatch = text.match(/volume.*?(\d+)/);
    if (volMatch) {
      const volPercent = Math.min(100, Math.max(0, parseInt(volMatch[1], 10)));
      setVolume(volPercent / 100);
      setFeedback(`Volume réglé à ${volPercent}%.`);
      setFeedbackType('success');
      setTimeout(onClose, 1400);
      return;
    }

    // 7. Commande Recherche ou Lancement de Musique ("Joue SDM", "Mets du rap", "Écoute Damso")
    let searchQuery = text;
    const prefixes = ['joue', 'mets', 'écoute', 'lance', 'recherche', 'cherche'];
    for (const p of prefixes) {
      if (searchQuery.startsWith(p)) {
        searchQuery = searchQuery.replace(p, '').trim();
        break;
      }
    }

    if (searchQuery) {
      setFeedback(`Recherche et lecture de "${searchQuery}"...`);
      setFeedbackType('info');

      // Chercher d'abord dans les titres locaux
      const localMatch = tracks.find(
        (t) =>
          t.title.toLowerCase().includes(searchQuery) ||
          t.artistName.toLowerCase().includes(searchQuery)
      );

      if (localMatch) {
        playTrack(localMatch);
        setFeedback(`Lecture de "${localMatch.title}" de ${localMatch.artistName}`);
        setFeedbackType('success');
        setTimeout(onClose, 1500);
        return;
      }

      // Sinon interroger Deezer en direct
      try {
        const deezerRes = await deezerService.search(searchQuery, 10);
        if (deezerRes.tracks.length > 0) {
          const target = deezerRes.tracks[0];
          playTrack(target, deezerRes.tracks);
          setFeedback(`Lecture de "${target.title}" par ${target.artistName}`);
          setFeedbackType('success');
          setTimeout(onClose, 1500);
          return;
        }
      } catch (err) {
        console.warn('Deezer search via voice failed:', err);
      }

      // Si non trouvé, rediriger vers la recherche avec la requête
      setSearchQuery(searchQuery);
      setActiveView('search');
      setFeedback(`Recherche globale ouverte pour "${searchQuery}".`);
      setFeedbackType('success');
      setTimeout(onClose, 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md p-6 ${cornerRadius} liquid-glass-surface bg-zinc-950/90 border border-white/25 shadow-2xl relative text-white flex flex-col items-center text-center`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Fermer l'assistant"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Orbe Vocal Pulsant Fidèle à la Maquette (media_1793382868559_046f73da.png) */}
        <div className="relative my-4">
          <div
            onClick={() => {
              if (recognitionRef.current && !isListening) {
                try {
                  recognitionRef.current.start();
                } catch (e) {}
              }
            }}
            className={`w-24 h-24 rounded-full liquid-voice-assistant-orb shadow-2xl cursor-pointer ${
              isListening ? 'listening scale-110' : 'hover:scale-105'
            }`}
          >
            <Mic
              className={`w-10 h-10 transition-colors ${
                isListening ? 'text-cyan-300 animate-pulse' : 'text-white/80'
              }`}
              strokeWidth={2.2}
            />
          </div>

          {/* Anneau iridescent de réfraction */}
          <div className="absolute -inset-3 rounded-full border border-cyan-400/30 animate-spin-slow pointer-events-none opacity-60" />
        </div>

        {/* Titre & État */}
        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <span>Commande Vocale Spot Music</span>
          <Sparkles className="w-4 h-4 text-cyan-300" />
        </h3>

        {/* Barres d'ondes audio animées pendant l'écoute */}
        <div className="flex items-center gap-1.5 h-6 my-2">
          {[40, 75, 100, 60, 85].map((h, i) => (
            <div
              key={i}
              style={{
                height: isListening ? `${h}%` : '20%',
                transition: 'height 0.15s ease'
              }}
              className="w-1 rounded-full bg-gradient-to-t from-cyan-400 to-teal-300 animate-pulse"
            />
          ))}
        </div>

        {/* Retranscription en temps réel */}
        <div className="min-h-[48px] w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center my-2">
          <p className="text-sm font-medium text-white/90 italic">
            {transcript ? `« ${transcript} »` : isListening ? "Parlez maintenant..." : "Cliquez sur l'orbe ou dites une commande"}
          </p>
        </div>

        {/* Message de confirmation / aide */}
        {feedback && (
          <div className={`text-xs font-semibold mt-1 flex items-center gap-1.5 ${
            feedbackType === 'success' ? 'text-emerald-400' : feedbackType === 'error' ? 'text-amber-300' : 'text-cyan-300'
          }`}>
            {feedbackType === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback}</span>
          </div>
        )}

        {/* Commandes rapides suggérées */}
        <div className="w-full pt-4 mt-3 border-t border-white/10">
          <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2.5">
            Commandes instantanées (cliquez pour tester)
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: 'Joue SDM', cmd: 'joue SDM' },
              { label: 'Pause', cmd: 'pause' },
              { label: 'Reprends', cmd: 'reprends' },
              { label: 'Suivant', cmd: 'suivant' },
              { label: 'Volume 80%', cmd: 'volume 80%' },
              { label: 'Titres likés', cmd: 'titres likés' },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleVoiceCommand(chip.cmd)}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/[0.08] hover:bg-white/[0.16] hover:text-cyan-300 border border-white/15 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistantModal;
