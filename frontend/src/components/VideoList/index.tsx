import { useState, useEffect } from 'react';
import { listVideos, deleteVideo } from '../../api/player';
import VideoImport from '../VideoImport';
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
  refreshTrigger?: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoList({ currentVideoId, onSelectVideo, refreshTrigger }: VideoListProps) {
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVideos = () => {
    setLoading(true);
    listVideos()
      .then(setVideos)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVideos();
  }, [refreshTrigger]);

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

  if (loading && videos.length === 0) {
    return <div className={styles.loading}>正在载入库...</div>;
  }

  return (
    <div className={styles.container}>
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
              <h3 className={styles.cardTitle}>
                <span className={styles.cardTitleText}>{video.title}</span>
              </h3>
              <p className={styles.meta}>{video.sentenceCount} 句台词</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
