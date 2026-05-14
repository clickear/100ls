import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import type { PlayerData } from '../../types/player';
import { fetchPlayerData } from '../../api/player';
import { usePlayer } from '../../hooks/usePlayer';
import StatusBar from '../../components/StatusBar';
import Header from '../../components/Header';
import StageBar from '../../components/StageBar';
import VideoPlayer from '../../components/VideoPlayer';
import ProgressBar from '../../components/ProgressBar';
import PlaybackControls from '../../components/PlaybackControls';
import SubtitleModes from '../../components/SubtitleModes';
import SentenceCard from '../../components/SentenceCard';
import TabBar from '../../components/TabBar';
import styles from './styles.module.css';

interface PlayerPageProps {
  videoId: string;
}

export default function PlayerPage({ videoId }: PlayerPageProps) {
  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchPlayerData(videoId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [videoId]);

  const player = usePlayer(data);
  const { state, currentSentence, videoRef } = player;

  const mainRef = useRef<HTMLElement | null>(null);

  // Luxury Quartic Easing (More fluid than Quad)
  const easeInOutQuart = (t: number, b: number, c: number, d: number) => {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t * t * t + b;
    t -= 2;
    return (-c / 2) * (t * t * t * t - 2) + b;
  };

  const slowScrollTo = (element: HTMLElement, target: number, duration: number) => {
    const start = element.scrollTop;
    const change = target - start;
    let startTime: number | null = null;

    const animateScroll = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const val = easeInOutQuart(progress, start, change, duration);
      element.scrollTop = val;
      if (progress < duration) {
        requestAnimationFrame(animateScroll);
      }
    };
    requestAnimationFrame(animateScroll);
  };

  // Auto-scroll when panel is expanded
  useEffect(() => {
    if (!isCollapsed && mainRef.current) {
      // Small delay to let the height transition start
      const timer = setTimeout(() => {
        const target = mainRef.current!.scrollHeight - mainRef.current!.clientHeight;
        slowScrollTo(mainRef.current!, target, 1000); // Slower, more deliberate 1s scroll
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isCollapsed]);

  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.errorMessage}>
          <p>加载失败</p>
          <p className={styles.errorDetail}>{error || '未知错误'}</p>
          <button className={styles.retryBtn} onClick={() => window.location.reload()}>
            重试
          </button>
        </div>
      </div>
    );
  }

  const videoDuration = data.duration;

  return (
    <div className={styles.appContainer} id="app">
      <StatusBar />
      <Header 
        title={data.title} 
        isVip={data.isVip} 
        onBack={() => setLocation('/')} 
      />

      <main className={styles.mainContent} id="mainContent" ref={mainRef}>
        <StageBar
          currentStage={state.currentStage}
          repetitionCount={state.repetitionCount}
          onStageSelect={player.setStage}
          onCheckIn={player.incrementRepetition}
        />
        <VideoPlayer
          videoRef={videoRef}
          videoUrl={data.videoUrl}
          thumbnailUrl={data.thumbnailUrl}
          abLoop={state.abLoop}
          currentSentence={currentSentence}
          subtitleMode={state.subtitleMode}
          isPlaying={state.isPlaying}
          isAudioMode={state.isAudioMode}
          onTogglePlay={player.togglePlayPause}
          onToggleAudioMode={player.toggleAudioMode}
        />
        <ProgressBar
          currentTime={state.currentTime}
          duration={videoDuration}
          abLoop={state.abLoop}
          onSeek={player.seek}
          onSetA={player.setPointA}
          onSetB={player.setPointB}
        />
        <PlaybackControls
          isPlaying={state.isPlaying}
          currentSpeed={state.currentSpeed}
          onPlayPause={player.togglePlayPause}
          onReplay={player.replay}
          onClearAB={player.toggleABLoop}
          onSpeedChange={player.cycleSpeed}
        />
        
        <div className={styles.collapsibleWrapper}>
          <div className={styles.divider}>
            <button 
              className={styles.collapseToggleMinimal} 
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? '展开' : '收起'}
            >
              <svg 
                className={isCollapsed ? styles.iconRotate : ''} 
                width="20" height="20" viewBox="0 0 24 24" fill="none"
              >
                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className={`${styles.controlsContent} ${isCollapsed ? styles.collapsed : ''}`}>
            <SubtitleModes
              currentMode={state.subtitleMode}
              onChange={player.setSubtitleMode}
            />
            {currentSentence && (
              <SentenceCard
                sentence={currentSentence}
                currentIndex={state.currentSentenceIndex}
                totalSentences={data.sentences.length}
                isLoopSentence={state.isLoopSentence}
                subtitleMode={state.subtitleMode}
                onPrev={player.goToPrevSentence}
                onNext={player.goToNextSentence}
                onToggleLoop={player.toggleLoopSentence}
                onToggleKey={player.toggleKeySentence}
                onSpeak={() => {}}
              />
            )}
          </div>
        </div>
      </main>

      <TabBar activeTab={state.activeTab} onTabChange={player.setActiveTab} />
    </div>
  );
}
