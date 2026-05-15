/** Shared types — keep in sync with frontend/src/types/player.ts */

export interface Sentence {
  id: number;
  en: string;
  cn: string;
  startTime: number;
  endTime: number;
  isKey: boolean;
}

export interface StageInfo {
  currentStage: number;
  totalStages: number;
  subtitleMode: string;
  currentProgress: number;
  totalProgress: number;
  repetitionCount: number;
  lastPosition?: number;
}

export interface Episode {
  number: number;
  status: 'completed' | 'active' | 'locked';
}

export interface ABLoop {
  active: boolean;
  startTime: number;
  endTime: number;
}

export interface PlayerData {
  videoId: string;
  title: string;
  isVip: boolean;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  stageInfo: StageInfo;
  episodes: Episode[];
  sentences: Sentence[];
  abLoop: ABLoop;
}

/** Metadata stored in meta.json for each imported video */
export interface VideoMeta {
  videoId: string;
  title: string;
  sourceUrl: string;
  duration: number;
  importedAt: string;
  videoFile: string;       // relative filename, e.g. "video.mp4"
  thumbnailFile: string;   // relative filename, e.g. "thumbnail.jpg"
  sentences: Sentence[];
  currentStage: number;
  repetitionCount: number;
  lastPosition: number;
}

/** Summary returned by GET /api/videos list */
export interface VideoSummary {
  videoId: string;
  title: string;
  sourceUrl: string;
  duration: number;
  importedAt: string;
  sentenceCount: number;
  thumbnailUrl: string;
  currentStage: number;
  repetitionCount: number;
}

/** Request body for POST /api/videos */
export interface ImportVideoRequest {
  url: string;
}

/** Response for POST /api/videos */
export interface ImportVideoResponse {
  videoId: string;
  title: string;
  duration: number;
  sentenceCount: number;
  status: 'ready' | 'no_subtitles';
}
