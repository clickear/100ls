/** A single sentence/subtitle in the video */
export interface Sentence {
  id: number;
  en: string;
  cn: string;
  keywords: string[];
  startTime: number; // seconds
  endTime: number;   // seconds
  isKey: boolean;     // 重点句
  patterns?: {
    patternId: number;
    patternText: string;
    exactText: string;
  }[];
}

/** Subtitle display mode */
export type SubtitleMode =
  | 'pure-en'
  | 'bilingual'
  | 'none';

/** Playback speed option */
export type PlaybackSpeed = '0.5x' | '0.75x' | '1.0x' | '1.25x' | '1.5x';

/** Stage info for the learning session */
export interface StageInfo {
  currentStage: number;
  totalStages: number;
  subtitleMode: string; // e.g. "纯英文字幕"
  currentProgress: number;
  totalProgress: number;
  repetitionCount: number;
}

/** Episode (阶段) status */
export interface Episode {
  number: number;
  status: 'completed' | 'active' | 'locked';
}

/** AB Loop region */
export interface ABLoop {
  active: boolean;
  startTime: number;
  endTime: number;
}

/** Tab bar items */
export type TabId = 'player' | 'subtitles' | 'vocabulary' | 'settings';

/** Full player page data from API */
export interface PlayerData {
  videoId: string;
  title: string;
  isVip: boolean;
  videoUrl: string;
  thumbnailUrl: string;
  subtitleUrls?: {
    en?: string;
    cn?: string;
  };
  duration: number; // seconds
  stageInfo: StageInfo;
  episodes: Episode[];
  sentences: Sentence[];
  abLoop: ABLoop;
  repetitionCount: number;
}

/** Player UI state (managed by frontend) */
export interface PlayerState {
  isPlaying: boolean;
  currentSpeed: PlaybackSpeed;
  currentSentenceIndex: number;
  subtitleMode: SubtitleMode;
  isLoopSentence: boolean;
  activeTab: TabId;
  currentTime: number;
  abLoop: ABLoop;
  currentStage: number;
  repetitionCount: number;
  isAudioMode: boolean;
  isLooping: boolean;
}

export interface Pattern {
  id: number;
  text: string;
  description: string;
  category: string | null;
  count: number;
}

export interface PatternInstance {
  id: number;
  patternId: number;
  sentenceId: number;
  exactText: string;
  en: string;
  startTime: number;
  endTime: number;
  videoTitle: string;
  videoId: string;
}
