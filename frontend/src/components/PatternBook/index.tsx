import { useState, useEffect } from 'react';
import { fetchPatterns, fetchPatternDetails } from '../../api/player';
import type { Pattern, PatternInstance } from '../../types/player';
import styles from './styles.module.css';

interface PatternBookProps {
  onPlayInstance: (videoId: string, startTime: number) => void;
}

export default function PatternBook({ onPlayInstance }: PatternBookProps) {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [instances, setInstances] = useState<PatternInstance[]>([]);
  const [loading, setLoading] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const loadPatterns = async () => {
    setLoading(true);
    try {
      const data = await fetchPatterns();
      setPatterns(data);
    } catch (err) {
      console.error('Failed to fetch patterns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatterns();
  }, []);

  const handlePatternClick = async (pattern: Pattern) => {
    setSelectedPattern(pattern);
    setLoading(true);
    try {
      const data = await fetchPatternDetails(pattern.id);
      setInstances(data as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !patterns.length) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>正在分析全库句型...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {selectedPattern ? (
        <div className={styles.detailsView}>
          <button className={styles.backBtn} onClick={() => setSelectedPattern(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            返回列表
          </button>
          
          <div className={styles.patternHeader}>
            <div className={styles.patternTag}>句型框架</div>
            <h2 className={styles.patternTitle}>{selectedPattern.text}</h2>
            <p className={styles.patternDescription}>{selectedPattern.description}</p>
          </div>

          <div className={styles.instanceList}>
            <div className={styles.listHeader}>发现 {instances.length} 处实例</div>
            {instances.map((inst, idx) => (
              <div 
                key={inst.id} 
                className={styles.instanceCard}
                onClick={() => onPlayInstance(inst.videoId, inst.startTime)}
              >
                <div className={styles.instanceNumber}>#{idx + 1}</div>
                <div className={styles.instanceContent}>
                  <div className={styles.exactTextContainer}>
                    匹配原文: <span className={styles.highlight}>{inst.exactText}</span>
                  </div>
                  <div className={styles.fullSentence}>"{inst.en}"</div>
                  <div className={styles.videoInfo}>
                    <span className={styles.timestamp}>
                      {formatTime(inst.startTime)} - {formatTime(inst.endTime)}
                    </span>
                    <span className={styles.dotSeparator}>•</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                    </svg>
                    <span className={styles.videoTitleText}>{inst.videoTitle}</span>
                  </div>
                </div>
                <div className={styles.playIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.listView}>
          <header className={styles.header}>
            <h1 className={styles.title}>地道句型库</h1>
            <p className={styles.subtitle}>自动识别全视频库中的高频表达与固定搭配</p>
          </header>

          <div className={styles.patternGrid}>
            {patterns.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🔍</div>
                <p>暂未识别到句型</p>
                <p className={styles.emptyHint}>导入新视频后，系统会自动分析并在此列出地道表达</p>
              </div>
            ) : (
              patterns.map(p => (
                <div key={p.id} className={styles.patternCard} onClick={() => handlePatternClick(p)}>
                  <div className={styles.cardHeader}>
                    <span className={styles.countBadge}>{p.count} 处</span>
                  </div>
                  <div className={styles.cardMain}>
                    <div className={styles.cardText}>{p.text}</div>
                    <div className={styles.cardDesc}>{p.description}</div>
                  </div>
                  <div className={styles.cardFooter}>
                    点击查看全库例句 →
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
