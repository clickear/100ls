import { useState, useEffect } from 'react';
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

export default function PlayerPage() {
  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayerData('sunset-001')
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const player = usePlayer(data);
  const { state, currentSentence, videoRef } = player;

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

  const videoDuration = videoRef.current?.duration || data.duration;

  return (
    <div className={styles.appContainer} id="app">
      <StatusBar />
      <Header title={data.title} isVip={data.isVip} />

      <main className={styles.mainContent} id="mainContent">
        <StageBar
          stageInfo={data.stageInfo}
          episodes={data.episodes}
          onEpisodeSelect={player.selectEpisode}
        />
        <VideoPlayer
          videoRef={videoRef}
          videoUrl={data.videoUrl}
          thumbnailUrl={data.thumbnailUrl}
          abLoop={state.abLoop}
          currentSentence={currentSentence}
          subtitleMode={state.subtitleMode}
          isPlaying={state.isPlaying}
          onTogglePlay={player.togglePlayPause}
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
      </main>

      <TabBar activeTab={state.activeTab} onTabChange={player.setActiveTab} />
    </div>
  );
}
