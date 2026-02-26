export interface User {
  id: string;
  username: string;
  password: string;
}

export interface InsertUser {
  username: string;
  password: string;
}

export interface WatchHistory {
  id: string;
  sessionId: string;
  userId: string | null;
  mediaId: string;
  title: string;
  posterImage: string | null;
  duration: number;
  watchedSeconds: number;
  progress: number;
  lastWatchedAt: Date;
  category: string | null;
}

export interface InsertWatchHistory {
  sessionId: string;
  userId?: string | null;
  mediaId: string;
  title: string;
  posterImage?: string | null;
  duration: number;
  watchedSeconds?: number;
  progress?: number;
  category?: string | null;
}
