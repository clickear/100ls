import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { listVideos, importVideo } from '../../api/player';
import styles from './styles.module.css';

interface VideoSummary {
  videoId: string;
  title: string;
  duration: number;
  sentenceCount: number;
  thumbnailUrl: string;
  importedAt?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function HomePage() {
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Import state
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

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

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;

    setImporting(true);
    setError('');
    
    try {
      await importVideo(importUrl);
      setImportUrl('');
      loadVideos(); // Refresh list after import
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>100LS 学习法</h1>
        <p className={styles.subtitle}>深度精听，建立语感</p>
      </header>

      <section className={styles.importSection}>
        <h2 className={styles.importTitle}>导入新视频</h2>
        <form onSubmit={handleImport} className={styles.importForm}>
          <input
            type="url"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="粘贴 YouTube 或 B站链接..."
            className={styles.input}
            disabled={importing}
          />
          <button type="submit" className={styles.importBtn} disabled={importing || !importUrl}>
            {importing ? (
              <>
                <div className={styles.spinner} />
                正在下载与解析字幕...
              </>
            ) : (
              '开始导入'
            )}
          </button>
          {error && <p style={{ color: '#ef4444', fontSize: 12 }}>{error}</p>}
        </form>
      </section>

      <section className={styles.listSection}>
        <div className={styles.listHeader}>
          <h2 className={styles.listTitle}>我的学习库</h2>
        </div>

        {loading ? (
          <div className={styles.emptyState}>加载中...</div>
        ) : videos.length === 0 ? (
          <div className={styles.emptyState}>
            还没有导入视频，试着粘贴一个链接吧！
          </div>
        ) : (
          <div className={styles.videoGrid}>
            {videos.map(video => (
              <Link key={video.videoId} href={`/player/${video.videoId}`} className={styles.videoCard}>
                <div className={styles.thumbnailWrapper}>
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt="" className={styles.thumbnail} />
                  ) : (
                    <div className={styles.thumbnail} style={{ background: '#333' }} />
                  )}
                  <span className={styles.durationBadge}>{formatTime(video.duration)}</span>
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle} title={video.title}>{video.title}</h3>
                  <div className={styles.cardMeta}>
                    <span className={styles.sentencesTag}>{video.sentenceCount} 句台词</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
