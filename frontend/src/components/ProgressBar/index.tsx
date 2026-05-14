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

  // Clear active marker when clicking elsewhere
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveMarker(null);
      setSuppressedIndex(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleJump = useCallback((time: number, index: number) => {
    onSeek(time);
    setActiveMarker(null);
    setSuppressedIndex(index);
    // Automatically lift suppression after 1s or if mouse moves significantly
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
            
            // Smart boundary adjustment for tooltip using CSS variables
            const xOffset = markerPct < 20 ? '0' : markerPct > 80 ? '-100%' : '-50%';
            const leftPos = markerPct < 20 ? '0' : markerPct > 80 ? '100%' : '50%';
            
            return (
              <div 
                key={i}
                className={`${styles.patternMarker} ${isActive ? styles.activeMarker : ''} ${suppressedIndex === i ? styles.suppressed : ''}`} 
                style={{ 
                  left: `${markerPct}%`,
                  background: color,
                  boxShadow: `0 0 6px ${color}88`,
                  cursor: 'pointer',
                  // @ts-ignore
                  '--tooltip-left': leftPos,
                  '--tooltip-x': xOffset
                } as any} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (isActive || suppressedIndex !== i) {
                    handleJump(m.time, i);
                  } else {
                    setActiveMarker(i);
                    setSuppressedIndex(null);
                  }
                }}
                onMouseEnter={() => setSuppressedIndex(null)}
              >
                <div 
                  className={styles.markerTooltip}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJump(m.time, i);
                  }}
                >
                  <div className={styles.tooltipPattern} style={{ color }}>{m.patternText}</div>
                  <div className={styles.tooltipSentence}>
                    {m.sentenceEn.split(new RegExp(`(${m.patternText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*?')})`, 'gi')).map((part, idx) => {
                      // Check if this part matches the pattern (roughly)
                      const isMatch = idx % 2 === 1;
                      return isMatch ? <span key={idx} style={{ color, fontWeight: 'bold' }}>{part}</span> : part;
                    })}
                  </div>
                </div>
              </div>
            );
          })}

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
