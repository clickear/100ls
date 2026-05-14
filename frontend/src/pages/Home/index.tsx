import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { listVideos, importVideo } from '../../api/player';
import VideoList from '../../components/VideoList';
import styles from './styles.module.css';

export default function HomePage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  
  // Import state
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStep, setImportStep] = useState('');
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
    setImportProgress(0);
    setImportStep('正在初始化下载...');
    setError('');
    
    try {
      await importVideo(importUrl, (percent, step) => {
        setImportProgress(percent);
        if (step === 'downloading') {
          setImportStep(`正在下载... ${percent}%`);
        } else if (step === 'parsing') {
          setImportStep('正在解析字幕...');
        }
      });
      setImportUrl('');
      loadVideos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>100LS 学习中心</h1>
        <p className={styles.subtitle}>深度精听，建立语感</p>
      </header>

      <section className={styles.importSection}>
        <form onSubmit={handleImport} className={styles.importForm}>
          <input
            type="url"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="粘贴 YouTube 或 B站链接导入新视频..."
            className={styles.input}
            disabled={importing}
          />
          <button type="submit" className={styles.importBtn} disabled={importing || !importUrl}>
            {importing ? '导入中...' : '导入视频'}
          </button>
        </form>
        {importing && (
          <div className={styles.progressContainer}>
            <div className={styles.progressLabel}>{importStep}</div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${importProgress}%` }} />
            </div>
          </div>
        )}
        {error && <p className={styles.error}>{error}</p>}
      </section>

      <div className={styles.divider} />

      <VideoList 
        currentVideoId="" 
        onSelectVideo={(id) => setLocation(`/player/${id}`)} 
      />
    </div>
  );
}
