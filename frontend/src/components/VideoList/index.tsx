import { useState, useEffect } from 'react';
import { listVideos, importVideo, deleteVideo } from '../../api/player';
import styles from './styles.module.css';

interface VideoSummary {
  videoId: string;
  title: string;
  duration: number;
  sentenceCount: number;
  thumbnailUrl: string;
}

interface VideoListProps {
  currentVideoId: string;
  onSelectVideo: (videoId: string) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoList({ currentVideoId, onSelectVideo }: VideoListProps) {
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
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
    setImportStep('正在初始化...');
    setError('');
    try {
      await importVideo(importUrl, (percent, step) => {
        setImportProgress(percent);
        if (step === 'downloading') setImportStep(`正在下载... ${percent}%`);
        else if (step === 'extracting_audio') setImportStep('正在提取音频...');
        else if (step === 'transcribing') setImportStep('正在进行 AI 语音识别...');
        else if (step === 'parsing') setImportStep('正在解析台词...');
        else if (step === 'translating') setImportStep('正在进行 AI 意译...');
      });
      setImportUrl('');
      loadVideos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    if (!window.confirm('确定要删除这个视频及其所有学习记录吗？')) return;
    
    try {
      await deleteVideo(videoId);
      if (videoId === currentVideoId) {
        onSelectVideo('');
      }
      loadVideos();
    } catch (err) {
      alert('删除失败');
    }
  };

  if (loading) {
    return <div className={styles.loading}>加载视频库...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>我的学习库</h2>
        <p className={styles.subtitle}>粘贴链接导入新视频或切换剧集</p>
      </header>

      <section className={styles.importSection}>
        <form onSubmit={handleImport} className={styles.importForm}>
          <input
            type="url"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="粘贴 YouTube / B站链接..."
            className={styles.input}
            disabled={importing}
          />
          <button type="submit" className={styles.importBtn} disabled={importing || !importUrl}>
            {importing ? '...' : '导入'}
          </button>
        </form>
        {importing && (
          <div className={styles.progressRow}>
            <div className={styles.progressBar}><div className={styles.progressFill} style={{width: `${importProgress}%`}} /></div>
            <span className={styles.progressText}>{importStep}</span>
          </div>
        )}
        {error && <p className={styles.errorText}>{error}</p>}
      </section>

      <div className={styles.grid}>
        {videos.map(video => (
          <div 
            key={video.videoId} 
            className={`${styles.card} ${video.videoId === currentVideoId ? styles.activeCard : ''}`}
            onClick={() => onSelectVideo(video.videoId)}
          >
            <div className={styles.thumbnailWrapper}>
              {video.thumbnailUrl ? (
                <img src={video.thumbnailUrl} alt="" className={styles.thumbnail} />
              ) : (
                <div className={styles.thumbnail} style={{ background: '#222' }} />
              )}
              <span className={styles.duration}>{formatTime(video.duration)}</span>
              {video.videoId === currentVideoId && (
                <div className={styles.playingBadge}>正在播放</div>
              )}
              <button 
                className={styles.deleteBtn} 
                onClick={(e) => handleDelete(e, video.videoId)}
                title="删除视频"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                </svg>
              </button>
            </div>
            <div className={styles.content}>
              <h3 className={styles.cardTitle}>{video.title}</h3>
              <p className={styles.meta}>{video.sentenceCount} 句台词</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
