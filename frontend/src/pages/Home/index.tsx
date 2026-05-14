import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { listVideos } from '../../api/player';
import VideoList from '../../components/VideoList';
import VideoImport from '../../components/VideoImport';
import styles from './styles.module.css';

import TabBar from '../../components/TabBar';

export default function HomePage() {
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
      </main>

      <TabBar activeTab="subtitles" onTabChange={(tab) => {
        // Handle home-specific tab changes if needed
      }} />
    </div>
  );
}
