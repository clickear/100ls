import { useRef, useCallback } from 'react';
import type { ABLoop } from '../../types/player';
import styles from './styles.module.css';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  abLoop: ABLoop;
  onSeek: (time: number) => void;
  onSetA?: () => void;
  onSetB?: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ProgressBar({ currentTime, duration, abLoop, onSeek, onSetA, onSetB }: ProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const aPct = duration > 0 ? (abLoop.startTime / duration) * 100 : 0;
  const bPct = duration > 0 ? (abLoop.endTime / duration) * 100 : 100;
  const abDuration = Math.abs(abLoop.endTime - abLoop.startTime);

  const handleTrackInteraction = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  }, [duration, onSeek]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleTrackInteraction(e.clientX);
    const onMove = (ev: MouseEvent) => handleTrackInteraction(ev.clientX);
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [handleTrackInteraction]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleTrackInteraction(e.touches[0].clientX);
    const onMove = (ev: TouchEvent) => handleTrackInteraction(ev.touches[0].clientX);
    const onEnd = () => { document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd); };
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
  }, [handleTrackInteraction]);

  return (
    <div className={styles.progressSection} id="progressSection">
      <div className={styles.progressBarContainer}>
        <span className={styles.progressTime}>{formatTime(currentTime)}</span>
        <div className={styles.progressTrack} ref={trackRef} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart} id="progressTrack">
          <div className={styles.progressFilled} style={{ width: `${pct}%` }} />
          {abLoop.active && <div className={styles.progressMarker} style={{ left: `${aPct}%` }} id="markerA"><span className={styles.markerLabel}>A</span></div>}
          <div className={styles.progressThumb} style={{ left: `${pct}%` }} id="progressThumb" />
          {abLoop.active && <div className={styles.progressMarker} style={{ left: `${bPct}%` }} id="markerB"><span className={styles.markerLabel}>B</span></div>}
        </div>
        <span className={styles.progressTime}>{formatTime(duration)}</span>
      </div>
      <div className={styles.abControls}>
        <button className={`${styles.abBtn} ${abLoop.active ? styles.abBtnActive : ''}`} id="btn-a" onClick={onSetA}>A</button>
        <span className={styles.abDuration}>AB 区间时长  {formatTime(abDuration)}</span>
        <button className={`${styles.abBtn} ${abLoop.active ? styles.abBtnActive : ''}`} id="btn-b" onClick={onSetB}>B</button>
      </div>
    </div>
  );
}
