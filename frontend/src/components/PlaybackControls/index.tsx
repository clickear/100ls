import type { PlaybackSpeed, SubtitleMode } from '../../types/player';
import styles from './styles.module.css';

interface PlaybackControlsProps {
  isLooping: boolean;
  currentSpeed: PlaybackSpeed;
  subtitleMode: SubtitleMode;
  onReplay: () => void;
  onClearAB: () => void;
  onSpeedChange: () => void;
  onToggleLoop: () => void;
  onSubtitleToggle: () => void;
}

export default function PlaybackControls({ 
  isLooping,
  currentSpeed, 
  subtitleMode,
  onReplay, 
  onClearAB, 
  onSpeedChange,
  onToggleLoop,
  onSubtitleToggle
}: PlaybackControlsProps) {
  const subtitleLabel = subtitleMode === 'bilingual' ? '双语' : subtitleMode === 'pure-en' ? '纯英' : '无';
  return (
    <div className={styles.playbackControls} id="playbackControls">
      <button className={styles.controlBtn} id="btn-replay" onClick={onReplay}>
        <div className={styles.controlIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 12C3 7.03 7.03 3 12 3C14.76 3 17.22 4.23 18.88 6.16" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M21 12C21 16.97 16.97 21 12 21C9.24 21 6.78 19.77 5.12 17.84" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M17 3L19 6L16 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className={styles.controlLabel}>重播</span>
      </button>


      <button className={styles.controlBtn} id="btn-clear-ab" onClick={onClearAB}>
        <div className={styles.controlIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
            <path d="M15 9L9 15" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M9 9L15 15" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <span className={styles.controlLabel}>清除 AB</span>
      </button>

      <button 
        className={`${styles.controlBtn} ${isLooping ? styles.active : ''}`} 
        id="btn-loop" 
        onClick={onToggleLoop}
        title={isLooping ? '取消循环' : '循环播放'}
      >
        <div className={styles.controlIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M17 1L21 5L17 9" stroke={isLooping ? "var(--green)" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 11V9a4 4 0 014-4h14" stroke={isLooping ? "var(--green)" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 23L3 19L7 15" stroke={isLooping ? "var(--green)" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 13v2a4 4 0 01-4 4H3" stroke={isLooping ? "var(--green)" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className={`${styles.controlLabel} ${isLooping ? styles.activeText : ''}`}>循环</span>
      </button>

      <button className={styles.controlBtn} id="btn-subtitle-toggle" onClick={onSubtitleToggle}>
        <div className={`${styles.controlIcon} ${styles.speedText}`}>{subtitleLabel}</div>
        <span className={styles.controlLabel}>字幕</span>
      </button>

      <button className={styles.controlBtn} id="btn-speed" onClick={onSpeedChange}>
        <div className={`${styles.controlIcon} ${styles.speedText}`}>{currentSpeed}</div>
        <span className={styles.controlLabel}>倍速</span>
      </button>
    </div>
  );
}
