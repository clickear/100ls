import type { ABLoop, Sentence, SubtitleMode } from '../../types/player';
import styles from './styles.module.css';

interface VideoPlayerProps {
  videoRef: React.RefCallback<HTMLVideoElement>;
  videoUrl: string;
  thumbnailUrl: string;
  abLoop: ABLoop;
  currentSentence: Sentence | null;
  subtitleMode: SubtitleMode;
  isPlaying: boolean;
  onTogglePlay: () => void;
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
  onTogglePlay,
}: VideoPlayerProps) {
  const showEn = subtitleMode !== 'none';
  const showCn = subtitleMode === 'bilingual';

  return (
    <div className={styles.videoArea} id="videoArea">
      <div className={styles.videoContainer} onClick={onTogglePlay}>
        {videoUrl ? (
          <video
            ref={videoRef}
            className={styles.videoThumb}
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

        {/* Play overlay when paused */}
        {!isPlaying && (
          <div className={styles.playOverlay}>
            <div className={styles.playOverlayBtn}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M14 8V32L34 20L14 8Z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
          </div>
        )}

        {/* AB Loop Overlay */}
        {abLoop.active && abLoop.endTime > abLoop.startTime && (
          <div className={styles.abOverlay}>
            <div className={styles.abStatus}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="12" height="12" rx="2" stroke="#4ADE80" strokeWidth="1.5" />
                <text x="3" y="10" fontSize="7" fill="#4ADE80" fontWeight="bold">AB</text>
              </svg>
              <span className={styles.abStatusText}>循环中</span>
            </div>
            <div className={styles.abRangeLabel}>
              A {formatTime(abLoop.startTime)} → B {formatTime(abLoop.endTime)}
            </div>
          </div>
        )}

        {/* Fullscreen */}
        <button
          className={styles.fullscreenBtn}
          id="btn-fullscreen"
          aria-label="全屏"
          onClick={(e) => {
            e.stopPropagation();
            const video = document.querySelector('video');
            video?.requestFullscreen?.();
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 6V3C2 2.45 2.45 2 3 2H6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 2H15C15.55 2 16 2.45 16 3V6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 12V15C16 15.55 15.55 16 15 16H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 16H3C2.45 16 2 15.55 2 15V12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Subtitle on video */}
        {currentSentence && showEn && (
          <div className={styles.videoSubtitle}>
            <p className={styles.videoSubtitleEn}>
              {renderSubtitleEn(currentSentence, subtitleMode)}
            </p>
            {showCn && (
              <p className={styles.videoSubtitleCn}>{currentSentence.cn}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
