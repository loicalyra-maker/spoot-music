// Spoot Music — Profile Edit Modal (Édition du Profil & Avatar Personnalisé)
import React, { useState, useRef } from 'react';
import { X, Upload, User, Check } from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';

export const ProfileEditModal: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    isProfileModalOpen,
    setProfileModalOpen,
  } = useSpootStore();

  const [name, setName] = useState(userProfile.name);
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isProfileModalOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateUserProfile({
      name: name.trim() || 'slowii',
      avatarUrl: avatarUrl || userProfile.avatarUrl,
    });
    setProfileModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#181818] border border-[#2e2e2e] rounded-xl shadow-2xl overflow-hidden flex flex-col text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#282828]">
          <h2 className="text-lg font-black tracking-tight">Détails du profil</h2>
          <button
            onClick={() => setProfileModalOpen(false)}
            className="p-1 rounded-full text-[#b3b3b3] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Avatar preview & change */}
          <div className="flex items-center gap-5">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full overflow-hidden bg-[#242424] cursor-pointer group shadow-lg border border-white/10 shrink-0"
              title="Changer la photo"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#727272]">
                  <User className="w-10 h-10" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-center p-1 transition-opacity">
                <Upload className="w-5 h-5 text-white mb-1" />
                <span className="text-[10px] font-bold text-white">Changer</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider block">
                Nom d'affichage
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre pseudo"
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-spoot-neon transition-colors"
              />
            </div>
          </div>

          {/* URL Alternative */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#b3b3b3]">
              Ou collez l'URL d'une image
            </label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white placeholder-[#727272] focus:outline-none focus:border-spoot-neon transition-colors"
            />
          </div>

          <p className="text-[11px] text-[#727272]">
            En poursuivant, vous acceptez de permettre à Spoot Music d'afficher cet avatar sur votre profil et votre activité.
          </p>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#282828] bg-[#141414]">
          <button
            onClick={() => setProfileModalOpen(false)}
            className="px-4 py-2 text-xs font-bold text-[#b3b3b3] hover:text-white transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-spoot-neon text-black text-xs font-black rounded-full hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 shadow-lg"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Enregistrer</span>
          </button>
        </div>

      </div>
    </div>
  );
};
export default ProfileEditModal;
