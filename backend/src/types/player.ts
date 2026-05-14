/** Shared types — keep in sync with frontend/src/types/player.ts */

export interface Sentence {
  id: number;
  en: string;
  cn: string;
  keywords: string[];
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
