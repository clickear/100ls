import { useState, useRef } from 'react';
import type { ABLoop, Sentence, SubtitleMode } from '../../types/player';
import HighlightedText from '../HighlightedText';
import styles from './styles.module.css';

interface VideoPlayerProps {
  videoRef: React.RefCallback<HTMLVideoElement>;
  videoUrl: string;
  thumbnailUrl: string;
  subtitleUrls?: {
    en?: string;
    cn?: string;
  };
  abLoop: ABLoop;
  currentSentence: Sentence | null;
  subtitleMode: SubtitleMode;
  isPlaying: boolean;
  isAudioMode: boolean;
  onTogglePlay: () => void;
  onToggleAudioMode: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Render subtitle text based on mode */
function renderSubtitleEn(sentence: Sentence, mode: SubtitleMode): string {
  if (mode === 'none') return '';
  if (mode === 'pure-en' || mode === 'bilingual') return sentence.en;

  // Keyword mode: show only keywords, blank out others
  if (mode === 'keyword') {
    return sentence.en.split(/\b/).map(word => {
      const lower = word.toLowerCase().trim();
      if (!lower || /^\W+$/.test(word)) return word;
      return sentence.keywords.some(k => k.toLowerCase() === lower) ? word : '____';
    }).join('');
  }

  // Dictation mode: blank out keywords
  if (mode === 'dictation') {
    return sentence.en.split(/\b/).map(word => {
      const lower = word.toLowerCase().trim();
      if (!lower || /^\W+$/.test(word)) return word;
      return sentence.keywords.some(k => k.toLowerCase() === lower) ? '____' : word;
    }).join('');
  }

  return sentence.en;
}

export default function VideoPlayer({
  videoRef,
  videoUrl,
  thumbnailUrl,
  abLoop,
  currentSentence,
  subtitleMode,
  isPlaying,
  isAudioMode,
  onTogglePlay,
  onToggleAudioMode,
}: VideoPlayerProps) {
  const [feedback, setFeedback] = useState<'play' | 'pause' | null>(null);
  const timerRef = useRef<any>(null);

  const handleTogglePlay = () => {
    onTogglePlay();
    setFeedback(isPlaying ? 'pause' : 'play');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setFeedback(null), 600);
  };

  const showCn = subtitleMode === 'bilingual';

  return (
    <div className={styles.videoArea} id="videoArea">
      <div className={styles.videoContainer} onClick={handleTogglePlay}>
        {videoUrl ? (
          <video
            ref={videoRef}
            className={`${styles.videoThumb} ${isAudioMode ? styles.hiddenVideo : ''}`}
            poster={thumbnailUrl}
            playsInline
            preload="auto"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <img
            src={thumbnailUrl}
            alt="视频封面"
            className={styles.videoThumb}
          />
        )}

        {/* Tap Feedback Icon */}
        {feedback && (
          <div className={styles.tapFeedback}>
            {feedback === 'play' ? (
              <svg width="60" height="60" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg width="60" height="60" viewBox="0 0 24 24" fill="white">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </div>
        )}

        {/* Audio Mode Overlay */}
        {isAudioMode && (
          <div className={styles.audioModeOverlay}>
            <div className={styles.audioDisk}>
              <img src={thumbnailUrl} alt="" className={styles.diskCover} />
              <div className={styles.diskHole}></div>
            </div>
            <div className={styles.listeningText}>
              <span className={styles.listeningIcon}>🎧</span>
              纯音频练习模式
            </div>
          </div>
        )}

        {/* Play overlay when paused */}
        {!isPlaying && (
          <div className={styles.playOverlay}>
            <div className={styles.playOverlayBtn}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M14 8V32L34 20L14 8Z" fill="currentColor" fillOpacity="0.9" />
              </svg>
            </div>
          </div>
        )}

        {/* AB Loop Overlay */}
        {abLoop.active && abLoop.endTime > abLoop.startTime && (
          <div className={styles.abOverlay}>
            <div className={styles.abStatus}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="12" height="12" rx="2" stroke="#D97706" strokeWidth="1.5" />
                <text x="3" y="10" fontSize="7" fill="#D97706" fontWeight="bold">AB</text>
              </svg>
              <span className={styles.abStatusText}>循环中</span>
            </div>
            <div className={styles.abRangeLabel}>
              A {formatTime(abLoop.startTime)} → B {formatTime(abLoop.endTime)}
            </div>
          </div>
        )}

        {/* Mode Toggles */}
        <div className={styles.playerTopActions}>
          <button
            className={`${styles.actionBtn} ${isAudioMode ? styles.activeAction : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleAudioMode();
            }}
            title={isAudioMode ? '切换到视频模式' : '切换到音频模式'}
          >
            {isAudioMode ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 7L16 12L23 17V7Z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            )}
          </button>
          
          <button
            className={styles.actionBtn}
            id="btn-fullscreen"
            aria-label="全屏"
            onClick={(e) => {
              e.stopPropagation();
              const video = document.querySelector('video');
              video?.requestFullscreen?.();
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 6V3C2 2.45 2.45 2 3 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 2H15C15.55 2 16 2.45 16 3V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 12V15C16 15.55 15.55 16 15 16H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 16H3C2.45 16 2 15.55 2 15V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Subtitle on video - Moved to last to ensure it's on top */}
        {currentSentence && (subtitleMode !== 'none') && (
          <div className={styles.subtitles}>
            <div className={styles.enSub}>
              {(subtitleMode === 'pure-en' || subtitleMode === 'bilingual') ? (
                <HighlightedText 
                  text={currentSentence.en} 
                  patterns={currentSentence.patterns} 
                />
              ) : (
                renderSubtitleEn(currentSentence, subtitleMode)
              )}
            </div>
            {showCn && (
              <div className={styles.cnSub}>{currentSentence.cn}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
