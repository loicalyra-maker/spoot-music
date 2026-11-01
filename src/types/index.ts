// Spoot Music — Core Type Definitions

export type ViewType = 'home' | 'playlist' | 'artist' | 'album' | 'search' | 'library' | 'settings' | 'lyrics' | 'queue';

export type PlaybackStatus = 'Stopped' | 'Playing' | 'Paused' | 'Seeking' | 'Transitioning';

export type ShuffleMode = 'Off' | 'TrueRandom' | 'SmartShuffle' | 'UserWeighted';
export type RepeatMode = 'Off' | 'RepeatAll' | 'RepeatOne';

export type MediaFilterMode = 'music_only' | 'podcasts' | 'audiobooks';

export interface LyricLine {
  timeMs: number;
  text: string;
  translatedText?: string;
}

export interface AcousticVector {
  bpm: number;
  camelotKey: string;
  energy: number;      // 0.0 - 1.0
  valence: number;     // 0.0 - 1.0 (happiness/melancholy)
  danceability: number;
  acousticness: number;
  loudnessLufs: number;
  decade: number;
  genre: string;
}

export interface Track {
  id: string;
  isrc: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  coverUrl: string;
  durationMs: number;
  sampleRate: number;      // e.g. 96000, 192000
  bitDepth: number;        // 16 or 24
  bitrateKbps: number;     // 320 or 9216 (Hi-Res)
  formatLabel: string;     // 'FLAC 24-bit / 96 kHz'
  releaseDate: string;
  playCount: number;
  lastPlayedTimestamp: number;
  addedAt?: number;
  isFavorite: boolean;
  isOfflineDownloaded: boolean;
  isLocalFile?: boolean;
  streamUrl?: string;
  lyrics?: LyricLine[];
  acousticVector: AcousticVector;
  palette: {
    primary: string;
    secondary: string;
  };
  audioGenSeed?: number;   // Seed for procedural high-fidelity web synthesizer
  isExplicit?: boolean;
  hasVideo?: boolean;
  canvasUrl?: string;
  isInstrumental?: boolean;
  isUnreleased?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  coverUrl: string;
  releaseYear: number;
  type: 'album' | 'single' | 'ep' | 'live' | 'compilation';
  trackCount: number;
  totalDurationMs: number;
  tracks: Track[];
}

export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  monthlyListeners: number;
  bio: string;
  isFollowed: boolean;
  hasNewRelease: boolean;
  albums: Album[];
  tourDates?: {
    date: string;
    city: string;
    venue: string;
    ticketUrl: string;
  }[];
}

export interface PlaylistFolder {
  id: string;
  name: string;
  parentFolderId: string | null;
  playlistIds: string[];
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  ownerName: string;
  parentFolderId: string | null;
  isCollaborative: boolean;
  isPrivate?: boolean;
  isAddedToProfile?: boolean;
  isOfflineDownloaded?: boolean;
  collaborators?: { id: string; name: string; avatarUrl: string }[];
  excludeFromTasteProfile: boolean;
  tracks: Track[];
}

export interface FriendActivityItem {
  userId: string;
  userName: string;
  userAvatar: string;
  currentTrack: Track;
  playlistOrAlbumName: string;
  lastActive: string;
  isPlaying: boolean;
}

export interface BlacklistRule {
  id: string;
  type: 'artist' | 'track';
  entityId: string;
  name: string;
  addedAt: string;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  type: 'computer' | 'smartphone' | 'speaker' | 'tv' | 'car';
  isCurrent: boolean;
  volume: number;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  showTitle: string;
  coverUrl: string;
  durationMs: number;
  releaseDate: string;
  audioUrl?: string;
}

export interface SpotifyShow {
  id: string;
  title: string;
  publisher: string;
  description: string;
  coverUrl: string;
  totalEpisodes: number;
  episodes: PodcastEpisode[];
}

export interface Folder {
  id: string;
  name: string;
  playlistIds: string[];
  createdAt: number;
}

export interface ListeningHistoryItem {
  id: string;
  track: Track;
  playedAt: number;
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
}

export interface VaultTrack {
  id: string;
  youtubeId?: string;
  title: string;
  artistName: string;
  durationFormatted: string;
  durationMs: number;
  url: string;
  coverUrl?: string;
  streamUrl?: string;
  uploader?: string;
  viewCount?: number;
}
