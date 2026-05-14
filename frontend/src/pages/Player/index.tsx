import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import type { PlayerData, SubtitleMode } from '../../types/player';
import { fetchPlayerData } from '../../api/player';
import { usePlayer } from '../../hooks/usePlayer';
import StatusBar from '../../components/StatusBar';
import Header from '../../components/Header';
import StageBar from '../../components/StageBar';
import VideoPlayer from '../../components/VideoPlayer';
import ProgressBar from '../../components/ProgressBar';
import PlaybackControls from '../../components/PlaybackControls';
import SentenceCard from '../../components/SentenceCard';
import TabBar from '../../components/TabBar';
import PatternBook from '../../components/PatternBook';
import VideoList from '../../components/VideoList';
import VideoImport from '../../components/VideoImport';
import styles from './styles.module.css';

interface PlayerPageProps {
  videoId?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerPage({ videoId }: PlayerPageProps) {
  const [, setLocation] = useLocation();
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

  const [xpPops, setXpPops] = useState<{ id: number; amount: number }[]>([]);
  const popIdRef = useRef(0);

  const handleXpGain = (amount: number) => {
    if (amount <= 0) return;
    const id = ++popIdRef.current;
    setXpPops(prev => [...prev, { id, amount }]);
    // Remove after animation completes
    setTimeout(() => {
      setXpPops(prev => prev.filter(p => p.id !== id));
    }, 1200);
  };

  const player = usePlayer(data, handleXpGain);
  const { state, currentSentence, videoRef } = player;

  const mainRef = useRef<HTMLElement | null>(null);

  const loadVideos = () => {
    // In PlayerPage, we just want to refresh the list state
    // VideoList component handles its own fetching, so we can just trigger a re-render or do nothing
    window.location.reload(); 
  };

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

  // Manual scroll trigger will be handled by a button instead of this auto-effect


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
            <div style={{ padding: '0 var(--spacing-lg)' }}>
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <VideoImport onSuccess={loadVideos} />
              </div>
              <VideoList 
                currentVideoId="" 
                onSelectVideo={(id) => setLocation(`/player/${id}`)} 
              />
            </div>
          ) : state.activeTab === 'vocabulary' ? (
            <PatternBook 
              onPlayInstance={(id, t) => {
                player.setActiveTab('player');
                setLocation(`/player/${id}?t=${t}`);
              }}
            />
          ) : (
            <div className={styles.empty}>请从“首页”选择一个视频开始学习</div>
          )}
        </main>
        <TabBar 
        activeTab={state.activeTab} 
        onTabChange={(tab) => {
          if (tab === 'home') {
            setLocation('/');
          } else {
            setState(prev => ({ ...prev, activeTab: tab }));
          }
        }} 
      />
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

      {/* XP Popups */}
      <div className={styles.xpPopContainer}>
        {xpPops.map(pop => (
          <div key={pop.id} className={styles.xpPop}>
            XP +{pop.amount}
          </div>
        ))}
      </div>

      <main 
        className={styles.mainContent} 
        id="mainContent" 
        ref={mainRef}
        onScroll={() => {
          const btn = document.querySelector(`.${styles.fabLocation}`) as HTMLElement;
          if (btn && btn.style.opacity === '0') {
            btn.style.visibility = 'visible';
            btn.style.opacity = '1';
          }
        }}
      >
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
              isLooping={state.isLooping}
              currentSpeed={state.currentSpeed}
              subtitleMode={state.subtitleMode}
              onReplay={player.replay}
              onClearAB={player.toggleABLoop}
              onSpeedChange={player.cycleSpeed}
              onToggleLoop={player.toggleLoop}
              onSubtitleToggle={() => {
                const order: SubtitleMode[] = ['bilingual', 'pure-en', 'none'];
                const nextIndex = (order.indexOf(state.subtitleMode) + 1) % order.length;
                player.setSubtitleMode(order[nextIndex]);
              }}
            />
            
            <div className={styles.sentencesSection}>
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
                  onTogglePlay={player.togglePlayPause}
                />
              )}
            </div>
          </>
        ) : state.activeTab === 'subtitles' ? (
          <div className={styles.transcriptWrapper}>
            <div className={styles.transcriptContainer}>
              {data.sentences.map((s, idx) => (
                <div 
                  key={idx}
                  data-sentence-index={idx}
                  className={`${styles.transcriptItem} ${idx === state.currentSentenceIndex ? styles.transcriptActive : ''}`}
                  onClick={() => player.seek(s.startTime)}
                >
                  <div className={styles.transcriptTime}>{formatTime(s.startTime)}</div>
                  <div className={styles.transcriptText}>
                    <div className={styles.transcriptEn}>{s.en}</div>
                    <div className={styles.transcriptCn}>{s.cn}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Floating Action Button for Location */}
            <button 
              className={styles.fabLocation} 
              onClick={() => {
                const activeItem = document.querySelector(`[data-sentence-index="${state.currentSentenceIndex}"]`);
                if (activeItem) {
                  activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              title="定位当前台词"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </button>
          </div>
        ) : state.activeTab === 'vocabulary' ? (
            <PatternBook 
              onPlayInstance={(targetVideoId, startTime) => {
                player.setActiveTab('player');
                if (targetVideoId === videoId) {
                  player.seek(startTime);
                } else {
                  setLocation(`/player/${targetVideoId}?t=${startTime}`);
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

      <TabBar 
        activeTab={state.activeTab} 
        onTabChange={(tab) => {
          if (tab === 'home') {
            setLocation('/');
          } else {
            player.setActiveTab(tab);
          }
        }} 
      />
    </div>
  );
}
