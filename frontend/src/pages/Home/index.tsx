import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { listVideos, importVideo, deleteVideo } from '../../api/player';
import ConfirmDialog from '../../components/ConfirmDialog';
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
  const [importProgress, setImportProgress] = useState(0);
  const [importStep, setImportStep] = useState('');
  const [error, setError] = useState('');

  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    videoId: string;
    title: string;
  }>({ isOpen: false, videoId: '', title: '' });

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
          setImportStep(`正在下载视频与字幕... ${percent}%`);
        } else if (step === 'parsing') {
          setImportStep('下载完成，正在解析与切分字幕...');
        }
      });
      setImportUrl('');
      loadVideos(); // Refresh list after import
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setImporting(false);
      setImportProgress(0);
      setImportStep('');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, videoId: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, videoId, title });
  };

  const confirmDelete = async () => {
    try {
      await deleteVideo(deleteConfirm.videoId);
      loadVideos();
    } catch (err) {
      alert('删除失败');
    } finally {
      setDeleteConfirm({ isOpen: false, videoId: '', title: '' });
    }
  };

  return (
    <div className={styles.container}>
      <ConfirmDialog 
        isOpen={deleteConfirm.isOpen}
        title="确认删除视频？"
        message={`确定要删除“${deleteConfirm.title}”吗？此操作将永久移除视频文件及所有学习记录。`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
      />
      <header className={styles.header}>
        <h1 className={styles.title}>100LS 学习法</h1>
        <p className={styles.subtitle}>深度精听，建立语感</p>
      </header>

      <section className={styles.importSection}>
        <h2 className={styles.importTitle}>导入新视频</h2>
        <form onSubmit={handleImport} className={styles.importForm}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="粘贴 YouTube 或 B站链接..."
              className={styles.input}
              style={{ flex: 1 }}
              disabled={importing}
            />
            <button type="submit" className={styles.importBtn} disabled={importing || !importUrl}>
              {importing ? (
                <>
                  <div className={styles.spinner} />
                  导入中
                </>
              ) : (
                '开始导入'
              )}
            </button>
          </div>
          
          {importing && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span>{importStep || '初始化中...'}</span>
                {importProgress > 0 && <span>{importProgress}%</span>}
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-card-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    background: 'var(--green)', 
                    width: `${importProgress}%`,
                    transition: 'width 0.3s ease'
                  }} 
                />
              </div>
            </div>
          )}
          
          {error && <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '12px' }}>{error}</p>}
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
              <div key={video.videoId} className={styles.videoCardWrapper}>
                <Link href={`/player/${video.videoId}`} className={styles.videoCard}>
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
                <button 
                  className={styles.deleteBtn}
                  onClick={(e) => handleDeleteClick(e, video.videoId, video.title)}
                  title="删除视频"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
