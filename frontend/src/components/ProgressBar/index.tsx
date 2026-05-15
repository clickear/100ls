import { useRef, useCallback, useState, useEffect } from 'react';
import type { ABLoop } from '../../types/player';
import styles from './styles.module.css';

const PATTERN_COLORS = [
  '#4ADE80', // Green
  '#60A5FA', // Blue
  '#F472B6', // Pink
  '#FB923C', // Orange
  '#A78BFA', // Purple
  '#FACC15', // Yellow
  '#2DD4BF', // Teal
  '#F87171', // Red
];

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  abLoop: ABLoop;
  onSeek: (time: number) => void;
  onSetA?: () => void;
  onSetB?: () => void;
  markers?: { 
    time: number; 
    patternId: number; 
    patternText: string; 
    sentenceEn: string;
  }[];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ProgressBar({ currentTime, duration, abLoop, onSeek, onSetA, onSetB, markers }: ProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const [suppressedIndex, setSuppressedIndex] = useState<number | null>(null);
  const hideTimerRef = useRef<any>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const startHideTimer = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setActiveMarker(null);
    }, 3000); // Auto hide after 3s
  }, []);

  const handleMarkerInteraction = useCallback((index: number | null) => {
    setActiveMarker(index);
    if (index !== null) {
      startHideTimer();
    } else {
      clearHideTimer();
    }
  }, [startHideTimer]);

  // Clear active marker when clicking elsewhere or when video changes
  useEffect(() => {
    const handleGlobalClick = () => {
      handleMarkerInteraction(null);
      setSuppressedIndex(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      clearHideTimer();
    };
  }, [handleMarkerInteraction]);

  useEffect(() => {
    handleMarkerInteraction(null);
    setSuppressedIndex(null);
  }, [duration, handleMarkerInteraction]); // Removed markers from dependency to stop auto-hide on re-render

  const handleJump = useCallback((time: number, index: number) => {
    onSeek(time);
    setSuppressedIndex(index);
    // Automatically lift suppression after 1s
    setTimeout(() => setSuppressedIndex(null), 1000);
  }, [onSeek]);

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
          
          {/* Pattern Markers */}
          {duration > 0 && markers?.map((m, i) => {
            const color = PATTERN_COLORS[m.patternId % PATTERN_COLORS.length];
            const isActive = activeMarker === i;
            const markerPct = (m.time / duration) * 100;
            
            return (
              <div 
                key={`${m.patternId}-${m.time}`}
                className={`${styles.patternMarker} ${isActive ? styles.activeMarker : ''} ${suppressedIndex === i ? styles.suppressed : ''}`} 
                style={{ 
                  left: `${markerPct}%`,
                  background: color,
                  boxShadow: `0 0 6px ${color}88`,
                  cursor: 'pointer',
                } as any} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (isActive) {
                    handleJump(m.time, i);
                  } else {
                    handleMarkerInteraction(i);
                  }
                }}
                onMouseEnter={() => handleMarkerInteraction(i)}
                // Removed aggressive onMouseLeave to prevent flickering during playback
              />
            );
          })}

          {abLoop.active && <div className={styles.progressMarker} style={{ left: `${aPct}%` }} id="markerA"><span className={styles.markerLabel}>A</span></div>}
          <div className={styles.progressThumb} style={{ left: `${pct}%` }} id="progressThumb" />
          {abLoop.active && <div className={styles.progressMarker} style={{ left: `${bPct}%` }} id="markerB"><span className={styles.markerLabel}>B</span></div>}
        </div>
        <span className={styles.progressTime}>{formatTime(duration)}</span>

        {/* Single Globally Centered Tooltip - Moved outside of Track */}
        {activeMarker !== null && markers?.[activeMarker] && (
          <div 
            className={`${styles.markerTooltip} ${styles.activeTooltip}`}
            onMouseEnter={clearHideTimer}
            onMouseLeave={startHideTimer}
            onClick={(e) => {
              e.stopPropagation();
              const m = markers[activeMarker];
              handleJump(m.time, activeMarker);
            }}
          >
            <div 
              className={styles.tooltipPattern} 
              style={{ color: PATTERN_COLORS[markers[activeMarker].patternId % PATTERN_COLORS.length] }}
            >
              {markers[activeMarker].patternText}
            </div>
            <div className={styles.tooltipSentence}>
              {markers[activeMarker].sentenceEn}
            </div>
          </div>
        )}
      </div>
      <div className={styles.abControls}>
        <button className={`${styles.abBtn} ${abLoop.active ? styles.abBtnActive : ''}`} id="btn-a" onClick={onSetA}>A</button>
        <span className={styles.abDuration}>AB 区间时长  {formatTime(abDuration)}</span>
        <button className={`${styles.abBtn} ${abLoop.active ? styles.abBtnActive : ''}`} id="btn-b" onClick={onSetB}>B</button>
      </div>
    </div>
  );
}
