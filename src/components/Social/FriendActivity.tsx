// Spoot Music — Friend Activity Live Drawer
import React from 'react';
import { X, Users, Play, Radio } from 'lucide-react';
import { useSpootStore } from '../../store/useSpootStore';

export const FriendActivity: React.FC = () => {
  const { friendActivityOpen, toggleFriendActivity, friends, playTrack } = useSpootStore();

  if (!friendActivityOpen) return null;

  return (
    <aside className="w-72 bg-spoot-bg border-l border-[#181818] h-full flex flex-col p-4 z-20 select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#181818] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-spoot-neon" />
          <h3 className="font-extrabold text-sm text-white">Activité de vos amis</h3>
        </div>

        <button
          onClick={toggleFriendActivity}
          className="p-1 rounded-lg text-spoot-muted hover:text-white hover:bg-[#181818] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Friends Stream */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {friends.map((friend) => (
          <div
            key={friend.userId}
            onClick={() => playTrack(friend.currentTrack)}
            className="p-3 rounded-2xl bg-[#121212] hover:bg-[#181818] border border-[#1e1e1e] cursor-pointer group transition-all space-y-2.5"
          >
            {/* User Profile */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden relative">
                  <img src={friend.userAvatar} alt={friend.userName} className="w-full h-full object-cover" />
                  {friend.isPlaying && (
                    <span className="w-2.5 h-2.5 rounded-full bg-spoot-neon border-2 border-[#121212] absolute bottom-0 right-0" />
                  )}
                </div>
                <span className="font-bold text-xs text-white">{friend.userName}</span>
              </div>

              <span className="text-[10px] text-spoot-muted font-mono">{friend.lastActive}</span>
            </div>

            {/* Currently Listening Track */}
            <div className="flex items-center gap-2.5 pl-2 border-l-2 border-spoot-neon/60">
              <div className="truncate flex-1">
                <p className="font-bold text-xs text-white truncate group-hover:text-spoot-neon transition-colors">
                  {friend.currentTrack.title}
                </p>
                <p className="text-[11px] text-spoot-muted truncate">
                  {friend.currentTrack.artistName} • {friend.playlistOrAlbumName}
                </p>
              </div>

              <div className="p-1.5 rounded-full bg-spoot-neon/15 text-spoot-neon opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-3 h-3 fill-current" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
