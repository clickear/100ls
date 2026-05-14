import type { PlaybackSpeed } from '../../types/player';
import styles from './styles.module.css';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentSpeed: PlaybackSpeed;
  onPlayPause: () => void;
  onReplay: () => void;
  onClearAB: () => void;
  onSpeedChange: () => void;
}

export default function PlaybackControls({ isPlaying, currentSpeed, onPlayPause, onReplay, onClearAB, onSpeedChange }: PlaybackControlsProps) {
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

      <button className={styles.playBtn} id="btn-play" aria-label={isPlaying ? '暂停' : '播放'} onClick={onPlayPause}>
        {isPlaying ? (
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="7" y="5" width="5" height="18" rx="1" fill="#111" />
            <rect x="16" y="5" width="5" height="18" rx="1" fill="#111" />
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className={styles.playBtnIcon}>
            <path d="M8 4.5V23.5L23 14L8 4.5Z" fill="#111" />
          </svg>
        )}
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

      <button className={styles.controlBtn} id="btn-speed" onClick={onSpeedChange}>
        <div className={`${styles.controlIcon} ${styles.speedText}`}>{currentSpeed}</div>
        <span className={styles.controlLabel}>倍速</span>
      </button>
    </div>
  );
}
