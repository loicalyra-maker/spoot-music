// Spoot Music — Spotify Premium Settings Screen
// Parité intégrale avec les paramètres officiels Spotify Premium :
// Qualité sonore, normalisation, crossfade, gapless, automix, affichage, stockage et connexion Web API.

import React, { useState } from 'react';
import {
  ArrowLeft, Sliders, Volume2, Disc, Shield, HardDrive,
  Users, Key, Check, Zap, Sparkles, RefreshCw, Trash2, Smartphone, Car
} from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';
import { useThemeStore } from '../../store/useThemeStore';
import { AudioInspector } from '../Player/AudioInspector';

export const SettingsView: React.FC = () => {
  const themeStore = useThemeStore();
  const {
    setActiveView,
    audioQuality, setAudioQuality,
    volumeNormalization, setVolumeNormalization,
    crossfadeSeconds, setCrossfadeSeconds,
    gaplessEnabled, toggleGapless,
    automixEnabled, toggleAutomix,
    showUnavailableTracks, toggleShowUnavailableTracks,
    autoCarMode, toggleAutoCarMode,
    canvasEnabled, toggleCanvas,
    privateSession, togglePrivateSession,
    shareListeningActivity, toggleShareListeningActivity,
    cacheStreamingMb, clearStreamingCache,
    trash, emptyTrash,
    spotifyClientId, spotifyClientSecret, spotifyConnected, setSpotifyCredentials
  } = useSpootStore();

  const [inputClientId, setInputClientId] = useState(spotifyClientId);
  const [inputClientSecret, setInputClientSecret] = useState(spotifyClientSecret);
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(spotifyConnected);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSaveSpotifyAuth = async () => {
    setAuthLoading(true);
    setStatusMessage(null);
    try {
      const ok = await setSpotifyCredentials(inputClientId, inputClientSecret);
      setAuthSuccess(ok);
      if (ok) {
        setStatusMessage('Connecté avec succès au catalogue officiel Spotify (Client Credentials).');
      } else {
        setStatusMessage('Identifiants enregistrés. Mode hybride mondial actif (Spotify + Deezer + Apple Music).');
      }
    } catch (e) {
      setStatusMessage('Erreur de connexion. Mode hybride automatique maintenu.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto w-full select-none pb-36 space-y-10 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex items-center gap-4 border-b border-[#1f1f1f] pb-6">
        <button
          onClick={() => setActiveView('home')}
          className="p-2.5 rounded-full bg-[#181818] hover:bg-[#252525] text-spoot-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Préférences</h1>
          <p className="text-xs text-spoot-muted">Gestion intégrale de votre compte et du moteur Spoot & Spotify</p>
        </div>
      </div>

      {/* 1. Connexion Spotify Web API (Client Credentials) */}
      <section className="space-y-4 p-6 rounded-3xl bg-[#141414] border border-[#222222]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-spoot-neon/15 border border-spoot-neon/30 flex items-center justify-center text-spoot-neon">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Connexion Spotify Web API</h2>
              <p className="text-xs text-spoot-muted">Flux standard Client Credentials pour l'accès sans restriction au catalogue mondial</p>
            </div>
          </div>

          <span className={`text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
            authSuccess
              ? 'bg-spoot-neon/15 text-spoot-neon border-spoot-neon/30'
              : 'bg-spoot-cyan/15 text-spoot-cyan border-spoot-cyan/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${authSuccess ? 'bg-spoot-neon animate-pulse' : 'bg-spoot-cyan'}`} />
            {authSuccess ? 'Spotify Web API Connecté' : 'Mode Hybride Actif (Global)'}
          </span>
        </div>

        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-spoot-muted uppercase tracking-wider block mb-1">
                Client ID Spotify
              </label>
              <input
                type="text"
                value={inputClientId}
                onChange={(e) => setInputClientId(e.target.value)}
                placeholder="Ex: c47a0e3864fe4619a9..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2c2c2c] text-white text-xs placeholder-spoot-muted focus:outline-none focus:border-spoot-neon font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-spoot-muted uppercase tracking-wider block mb-1">
                Client Secret Spotify
              </label>
              <input
                type="password"
                value={inputClientSecret}
                onChange={(e) => setInputClientSecret(e.target.value)}
                placeholder="••••••••••••••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2c2c2c] text-white text-xs placeholder-spoot-muted focus:outline-none focus:border-spoot-neon font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-spoot-muted">
              Disponible gratuitement sur le <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" className="text-spoot-neon underline hover:text-white">Spotify Developer Dashboard</a>.
            </p>

            <button
              onClick={handleSaveSpotifyAuth}
              disabled={authLoading}
              className="px-4 py-2 rounded-xl bg-spoot-neon text-black font-extrabold text-xs hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              {authLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{authLoading ? 'Vérification...' : 'Connecter Spotify'}</span>
            </button>
          </div>

          {statusMessage && (
            <p className="text-xs text-spoot-cyan font-medium pt-1 bg-[#181818] p-2.5 rounded-xl border border-white/5">
              {statusMessage}
            </p>
          )}
        </div>
      </section>

      {/* 2. Qualité Sonore (Audio Quality) */}
      <section className="space-y-6 p-6 rounded-3xl bg-[#141414] border border-[#222222]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-spoot-cyan/15 border border-spoot-cyan/30 flex items-center justify-center text-spoot-cyan">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Qualité Sonore & Streaming</h2>
            <p className="text-xs text-spoot-muted">Configuration du débit et de la fidélité de restitution acoustique</p>
          </div>
        </div>

        {/* Streaming Wi-Fi / Données */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-spoot-muted uppercase tracking-wider block">
            Qualité du streaming (Wi-Fi et Données Mobiles)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            {[
              { id: 'auto', label: 'Automatique', sub: 'Ajustement dynamique' },
              { id: 'normal', label: 'Normale (96k)', sub: 'Économie data' },
              { id: 'high', label: 'Élevée (160k)', sub: 'Standard mobile' },
              { id: 'very_high', label: 'Très élevée (320k)', sub: 'Haute fidélité' },
              { id: 'hi_res', label: 'Hi-Res Lossless', sub: 'FLAC 24-bit / 192k' },
            ].map((q) => (
              <button
                key={q.id}
                onClick={() => setAudioQuality(q.id as any)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  audioQuality === q.id
                    ? 'bg-spoot-neon/10 border-spoot-neon text-white shadow-lg'
                    : 'bg-[#181818] border-[#262626] text-spoot-muted hover:border-white/20'
                }`}
              >
                <p className={`font-extrabold text-xs ${audioQuality === q.id ? 'text-spoot-neon' : 'text-white'}`}>{q.label}</p>
                <p className="text-[10px] text-spoot-muted mt-0.5">{q.sub}</p>
              </button>
            ))}
          </div>

          {/* Inspecteur de Qualité Audio & Banc de Test en Direct */}
          <AudioInspector />
        </div>

        {/* Normalisation du volume */}
        <div className="flex items-center justify-between border-t border-[#1e1e1e] pt-4">
          <div>
            <p className="font-extrabold text-sm text-white">Normalisation du volume</p>
            <p className="text-xs text-spoot-muted">Uniformise le volume de tous les morceaux pour éviter les variations brusques</p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#181818] p-1 rounded-xl border border-[#2a2a2a]">
            {(['Quiet', 'Normal', 'Loud'] as const).map((norm) => (
              <button
                key={norm}
                onClick={() => setVolumeNormalization(norm)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  volumeNormalization === norm
                    ? 'bg-spoot-neon text-black'
                    : 'text-spoot-muted hover:text-white'
                }`}
              >
                {norm === 'Quiet' ? 'Silencieux' : norm === 'Normal' ? 'Normal' : 'Fort'}
              </button>
            ))}
          </div>
        </div>

        {/* Crossfade Slider */}
        <div className="space-y-2 border-t border-[#1e1e1e] pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-extrabold text-sm text-white">Fondu enchaîné (Crossfade)</p>
              <p className="text-xs text-spoot-muted">Permet un enchaînement progressif entre la fin d'un titre et le début du suivant</p>
            </div>
            <span className="font-mono text-spoot-neon font-bold text-xs bg-[#1a1a1a] px-2.5 py-1 rounded-lg border border-spoot-neon/20">
              {crossfadeSeconds} secondes
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={crossfadeSeconds}
            onChange={(e) => setCrossfadeSeconds(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[#282828] accent-spoot-neon rounded-full appearance-none cursor-pointer"
          />
        </div>

        {/* Gapless Playback Toggle */}
        <div className="flex items-center justify-between border-t border-[#1e1e1e] pt-4">
          <div>
            <p className="font-extrabold text-sm text-white">Lecture sans blanc (Gapless Playback)</p>
            <p className="text-xs text-spoot-muted">Supprime les micro-silences entre les pistes (idéal pour opéras, live et albums concepts)</p>
          </div>
          <button
            onClick={toggleGapless}
            className={`w-12 h-6 rounded-full transition-colors relative p-1 ${gaplessEnabled ? 'bg-spoot-neon' : 'bg-[#282828]'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-black transition-transform ${gaplessEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Automix Toggle */}
        <div className="flex items-center justify-between border-t border-[#1e1e1e] pt-4">
          <div>
            <p className="font-extrabold text-sm text-white">Automix intelligent</p>
            <p className="text-xs text-spoot-muted">Transition acoustique intelligente synchronisée sur les mesures et tempos des morceaux</p>
          </div>
          <button
            onClick={toggleAutomix}
            className={`w-12 h-6 rounded-full transition-colors relative p-1 ${automixEnabled ? 'bg-spoot-neon' : 'bg-[#282828]'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-black transition-transform ${automixEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </section>

      {/* 3. Affichage & Lecture */}
      <section className="space-y-4 p-6 rounded-3xl bg-[#141414] border border-[#222222]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-spoot-purple/15 border border-spoot-purple/30 flex items-center justify-center text-spoot-purple">
            <Disc className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Affichage & Lecture</h2>
            <p className="text-xs text-spoot-muted">Options visuelles et modes contextuels d'utilisation</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-white">Afficher les titres non disponibles</p>
              <p className="text-xs text-spoot-muted">Affiche les morceaux grisés temporairement non diffusables dans votre région</p>
            </div>
            <button
              onClick={toggleShowUnavailableTracks}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${showUnavailableTracks ? 'bg-spoot-neon' : 'bg-[#282828]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-black transition-transform ${showUnavailableTracks ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-[#1e1e1e] pt-4">
            <div>
              <p className="font-bold text-sm text-white">Mode Voiture automatique</p>
              <p className="text-xs text-spoot-muted">Bascule automatique vers l'interface ultra-lisible lors de la connexion Bluetooth véhicule</p>
            </div>
            <button
              onClick={toggleAutoCarMode}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${autoCarMode ? 'bg-spoot-neon' : 'bg-[#282828]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-black transition-transform ${autoCarMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-[#1e1e1e] pt-4">
            <div>
              <p className="font-bold text-sm text-white">Toile de fond animée (Canvas)</p>
              <p className="text-xs text-spoot-muted">Affiche des boucles vidéo courtes et immersives sur les morceaux compatibles</p>
            </div>
            <button
              onClick={toggleCanvas}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${canvasEnabled ? 'bg-spoot-neon' : 'bg-[#282828]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-black transition-transform ${canvasEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-[#1e1e1e] pt-4">
            <div>
              <p className="font-bold text-sm text-white">Fluidité d'affichage & Animations</p>
              <p className="text-xs text-spoot-muted">ProMotion 120 Hz optimisé pour l'écran Super Retina XDR de l'iPhone 16 Pro Max</p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#181818] p-1 rounded-xl border border-[#2a2a2a]">
              <button
                onClick={() => themeStore.setAnimationIntensity('full')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  themeStore.animationIntensity === 'full'
                    ? 'bg-spoot-neon text-black shadow-md'
                    : 'text-spoot-muted hover:text-white'
                }`}
              >
                120 FPS (ProMotion)
              </button>
              <button
                onClick={() => themeStore.setAnimationIntensity('reduced')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  themeStore.animationIntensity === 'reduced'
                    ? 'bg-spoot-neon text-black'
                    : 'text-spoot-muted hover:text-white'
                }`}
              >
                Éco
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Stockage & Cache Cloisonné */}
      <section className="space-y-5 p-6 rounded-3xl bg-[#141414] border border-[#222222]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Stockage & Cache Strictement Cloisonné</h2>
            <p className="text-xs text-spoot-muted">Vider le cache ne supprime jamais vos téléchargements hors-ligne</p>
          </div>
        </div>

        {/* Jauge Visuelle de Stockage */}
        <div className="space-y-3">
          <div className="h-3.5 bg-[#202020] rounded-full overflow-hidden flex p-0.5 border border-[#2c2c2c]">
            <div className="bg-spoot-neon h-full rounded-full" style={{ width: '22%' }} title="Titres téléchargés (18.4 Go)" />
            <div
              className="bg-spoot-cyan h-full rounded-full mx-1 transition-all duration-500"
              style={{ width: cacheStreamingMb > 0 ? '8%' : '0%' }}
              title={`Cache streaming (${cacheStreamingMb.toFixed(0)} Mo)`}
            />
            <div className="bg-[#333333] h-full rounded-full flex-1" title="Espace libre (245.8 Go)" />
          </div>

          <div className="flex items-center justify-between text-xs text-spoot-muted font-medium pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-spoot-neon" />
              Titres hors-ligne (18.4 Go)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-spoot-cyan" />
              Cache streaming ({cacheStreamingMb.toFixed(0)} Mo)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#555555]" />
              Espace libre (245.8 Go)
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-spoot-muted max-w-md">
              Purge les fragments audio temporaires et les images en mémoire vive sans altérer vos playlists téléchargées.
            </p>
            <button
              onClick={clearStreamingCache}
              disabled={cacheStreamingMb === 0}
              className="px-4 py-2 rounded-xl bg-[#1e1e1e] hover:bg-[#282828] border border-white/10 hover:border-spoot-neon text-white font-bold text-xs transition-all disabled:opacity-40"
            >
              Vider le cache ({cacheStreamingMb.toFixed(0)} Mo)
            </button>
          </div>
        </div>

        {/* Corbeille Révocatoire */}
        <div className="flex items-center justify-between border-t border-[#1e1e1e] pt-4">
          <div>
            <p className="font-bold text-sm text-white">Corbeille de playlists & titres ({trash.length} éléments)</p>
            <p className="text-xs text-spoot-muted">Les éléments supprimés sont conservés 30 jours pour annulation immédiate</p>
          </div>
          <button
            onClick={emptyTrash}
            disabled={trash.length === 0}
            className="px-3.5 py-1.5 rounded-xl bg-spoot-danger/10 hover:bg-spoot-danger/20 border border-spoot-danger/30 text-spoot-danger font-bold text-xs transition-all disabled:opacity-40 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vider la corbeille</span>
          </button>
        </div>
      </section>

      {/* 5. Réseaux & Social */}
      <section className="space-y-4 p-6 rounded-3xl bg-[#141414] border border-[#222222]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-spoot-neon/15 border border-spoot-neon/30 flex items-center justify-center text-spoot-neon">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Réseaux & Fonctionnalités Sociales</h2>
            <p className="text-xs text-spoot-muted">Confidentialité et partage avec vos amis</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-white">Session d'écoute privée</p>
              <p className="text-xs text-spoot-muted">Vos écoutes ne sont ni partagées avec vos amis ni utilisées pour vos recommandations</p>
            </div>
            <button
              onClick={togglePrivateSession}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${privateSession ? 'bg-spoot-neon' : 'bg-[#282828]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-black transition-transform ${privateSession ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-[#1e1e1e] pt-4">
            <div>
              <p className="font-bold text-sm text-white">Partager mon activité d'écoute</p>
              <p className="text-xs text-spoot-muted">Affiche en direct le titre que vous écoutez dans le volet Activité de vos amis</p>
            </div>
            <button
              onClick={toggleShareListeningActivity}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${shareListeningActivity ? 'bg-spoot-neon' : 'bg-[#282828]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-black transition-transform ${shareListeningActivity ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
