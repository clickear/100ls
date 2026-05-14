import { useState, useEffect, useRef } from 'react';
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
import PatternBook from '../../components/PatternBook';
import VideoList from '../../components/VideoList';
import styles from './styles.module.css';

interface PlayerPageProps {
  videoId?: string;
}

export default function PlayerPage({ videoId }: PlayerPageProps) {
  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    if (!videoId) {
      setLoading(false);
      setData(null);
      return;
    }
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

  // Sync scroll to current sentence in list
  useEffect(() => {
    if (!isCollapsed && state.currentSentenceIndex !== -1 && mainRef.current) {
      const activeItem = document.querySelector(`[data-sentence-index="${state.currentSentenceIndex}"]`);
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [state.currentSentenceIndex, isCollapsed]);


  // If there's an error and we have a videoId, show error
  if (error && videoId) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.errorMessage}>
          <p>加载失败</p>
          <p className={styles.errorDetail}>{error}</p>
          <button className={styles.retryBtn} onClick={() => window.location.reload()}>
            重试
          </button>
        </div>
      </div>
    );
  }

  // If loading or root path, show loading or Home tab
  if (loading || !videoId || !data) {
    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
        </div>
      );
    }

    return (
      <div className={styles.container}>
        <main className={styles.mainContent}>
          {state.activeTab === 'subtitles' ? (
            <VideoList 
              currentVideoId="" 
              onSelectVideo={(id) => window.location.href = `/player/${id}`} 
            />
          ) : state.activeTab === 'vocabulary' ? (
            <PatternBook 
              onPlayInstance={(id, t) => window.location.href = `/player/${id}?t=${t}`}
            />
          ) : (
            <div className={styles.empty}>请从“首页”选择一个视频开始学习</div>
          )}
        </main>
        <TabBar activeTab={state.activeTab} onTabChange={player.setActiveTab} />
      </div>
    );
  }

  // Now data is guaranteed to be non-null
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
        {state.activeTab === 'player' ? (
          <>
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
              markers={data.sentences
                .filter(s => s.patterns && s.patterns.length > 0)
                .flatMap(s => (s.patterns || []).map(p => ({
                  time: s.startTime,
                  patternId: p.patternId,
                  patternText: p.patternText,
                  sentenceEn: s.en
                })))
              }
            />
            <PlaybackControls
              isPlaying={state.isPlaying}
              isLooping={state.isLooping}
              currentSpeed={state.currentSpeed}
              onPlayPause={player.togglePlayPause}
              onReplay={player.replay}
              onClearAB={player.toggleABLoop}
              onSpeedChange={player.cycleSpeed}
              onToggleLoop={player.toggleLoop}
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
          </>
        ) : state.activeTab === 'subtitles' ? (
          <VideoList 
            currentVideoId={videoId} 
            onSelectVideo={(newId) => {
              window.location.href = `/player/${newId}`;
            }} 
          />
        ) : state.activeTab === 'vocabulary' ? (
          <PatternBook 
            onPlayInstance={(targetVideoId, startTime) => {
              if (targetVideoId === videoId) {
                player.seek(startTime);
                player.setActiveTab('player');
              } else {
                window.location.href = `/player/${targetVideoId}?t=${startTime}`;
              }
            }}
          />
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚧</div>
            <h3>模块 {state.activeTab} 建设中</h3>
            <p style={{ fontSize: '14px', marginTop: '10px' }}>我们正在努力完善此功能...</p>
          </div>
        )}
      </main>

      <TabBar activeTab={state.activeTab} onTabChange={player.setActiveTab} />
    </div>
  );
}
