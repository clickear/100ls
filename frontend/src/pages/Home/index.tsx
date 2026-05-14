import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { listVideos } from '../../api/player';
import VideoList from '../../components/VideoList';
import VideoImport from '../../components/VideoImport';
import styles from './styles.module.css';
import TabBar from '../../components/TabBar';
import PatternBook from '../../components/PatternBook';
import type { TabId } from '../../types/player';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  const loadVideos = () => {
    setLoading(true);
    listVideos()
      .then(setVideos)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVideos();
  }, []);

  return (
    <div className={styles.container}>
      <main className={styles.mainContent}>
        {activeTab === 'home' ? (
          <>
            <header className={styles.header}>
              <h1 className={styles.title}>100LS 学习中心</h1>
              <p className={styles.subtitle}>深度精听，建立语感</p>
            </header>

            <VideoImport onSuccess={loadVideos} />

            <div style={{ height: 'var(--spacing-2xl)' }} />

            <VideoList 
              currentVideoId="" 
              onSelectVideo={(id) => setLocation(`/player/${id}`)} 
            />
          </>
        ) : activeTab === 'vocabulary' ? (
          <div style={{ padding: '0 var(--spacing-lg)' }}>
            <header className={styles.header}>
              <h1 className={styles.title}>我的句型库</h1>
              <p className={styles.subtitle}>温故而知新</p>
            </header>
            <PatternBook 
              onPlayInstance={(targetVideoId, startTime) => {
                setLocation(`/player/${targetVideoId}?t=${startTime}`);
              }}
            />
          </div>
        ) : activeTab === 'player' ? (
          <div className={styles.empty}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎧</div>
            <h3>尚未选择视频</h3>
            <p>请在“首页”选择一个视频开始学习</p>
          </div>
        ) : (
          <div className={styles.empty}>模块建设中...</div>
        )}
      </main>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
