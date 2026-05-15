import type { Sentence, SubtitleMode } from '../../types/player';
import HighlightedText from '../HighlightedText';
import styles from './styles.module.css';

interface SentenceCardProps {
  sentence: Sentence;
  currentIndex: number;
  totalSentences: number;
  isLoopSentence: boolean;
  subtitleMode: SubtitleMode;
  onPrev: () => void;
  onNext: () => void;
  onToggleLoop: () => void;
  onToggleKey: () => void;
  onSpeak: () => void;
  onTogglePlay: () => void;
  isWaitingForShadowing: boolean;
}


/** SentenceCard Component */

export default function SentenceCard({
  sentence,
  currentIndex,
  totalSentences,
  isLoopSentence,
  subtitleMode,
  onPrev,
  onNext,
  onToggleLoop,
  onToggleKey,
  onSpeak,
  onTogglePlay,
  isWaitingForShadowing
}: SentenceCardProps) {
  const showCn = subtitleMode === 'bilingual';

  // Speak using Web Speech API
  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sentence.en);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
    onSpeak();
  };

  // Pagination dots
  const dotIndex = currentIndex % 3;

  return (
    <div className={styles.sentenceSection} id="sentenceSection" data-sentence-index={currentIndex}>
      <div className={styles.sentenceHeader}>
        <span className={styles.sentenceCounter}>
          当前句子  <strong>{currentIndex + 1}</strong>/{totalSentences}
        </span>
        <button
          className={`${styles.keySentenceBtn} ${!sentence.isKey ? styles.keySentenceBtnInactive : ''}`}
          id="btn-key-sentence"
          onClick={onToggleKey}
        >
          <span>重点句</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1L8.76 4.97L13 5.35L9.86 8.17L10.82 12.35L7 10.2L3.18 12.35L4.14 8.17L1 5.35L5.24 4.97L7 1Z"
              fill={sentence.isKey ? '#F59E0B' : '#666'}
              stroke={sentence.isKey ? '#F59E0B' : '#666'}
              strokeWidth="0.5"
            />
          </svg>
        </button>
      </div>

      <div className={styles.sentenceCard} id="sentenceCard" onClick={onTogglePlay} style={{ cursor: 'pointer' }}>
        <div className={styles.sentenceContent}>
          {subtitleMode !== 'none' && (
            <p className={styles.sentenceEn}>
              <HighlightedText 
                text={sentence.en} 
                patterns={sentence.patterns} 
              />
            </p>
          )}
          {subtitleMode === 'none' && (
            <p className={styles.sentenceEnHidden}>（无字幕模式）</p>
          )}
          {showCn && (
            <div className={styles.sentenceCnRow}>
              <p className={styles.sentenceCn}>{sentence.cn}</p>
              <button
                className={styles.speakBtn}
                id="btn-speak"
                aria-label="朗读"
                onClick={handleSpeak}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 8V12H6L10 16V4L6 8H3Z" fill="#999" />
                  <path
                    d="M13 7.5C13.83 8.33 14.33 9.47 14.33 10.75C14.33 12.03 13.83 13.17 13 14"
                    stroke="#999"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          )}
          {!showCn && subtitleMode !== 'none' && (
            <div className={styles.sentenceCnRow}>
              <button
                className={styles.speakBtn}
                id="btn-speak"
                aria-label="朗读"
                onClick={handleSpeak}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 8V12H6L10 16V4L6 8H3Z" fill="#999" />
                  <path
                    d="M13 7.5C13.83 8.33 14.33 9.47 14.33 10.75C14.33 12.03 13.83 13.17 13 14"
                    stroke="#999"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Shadowing status indicator */}
        <div className={styles.visualizerSection}>
          {isWaitingForShadowing && (
            <div className={styles.shadowingOverlay}>
              <span className={styles.shadowingPulse}>●</span>
              正在等待跟读...
            </div>
          )}
        </div>
      </div>

      {/* Sentence Navigation */}
      <div className={styles.sentenceNav} id="sentenceNav">
        <button className={styles.navBtn} id="btn-prev-sentence" onClick={onPrev} disabled={currentIndex <= 0}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>上一句</span>
        </button>
        <button
          className={`${styles.loopSentenceBtn} ${isLoopSentence ? styles.loopActive : ''}`}
          id="btn-loop-sentence"
          onClick={onToggleLoop}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8C2 4.69 4.69 2 8 2C10 2 11.78 3 12.83 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14 8C14 11.31 11.31 14 8 14C6 14 4.22 13 3.17 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M11 3L13 5L11 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 10L3 12L5 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{isLoopSentence ? '循环中' : '循环本句'}</span>
        </button>
        <button className={styles.navBtn} id="btn-next-sentence" onClick={onNext} disabled={currentIndex >= totalSentences - 1}>
          <span>下一句</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Pagination Dots */}
      <div className={styles.paginationDots}>
        {[0, 1, 2].map(i => (
          <span key={i} className={`${styles.dot} ${i === dotIndex ? styles.dotActive : ''}`} />
        ))}
      </div>
    </div>
  );
}
