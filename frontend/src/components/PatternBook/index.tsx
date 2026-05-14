import { useState, useEffect, useMemo } from 'react';
import { fetchPatterns, fetchPatternDetails } from '../../api/player';
import type { Pattern, PatternInstance } from '../../types/player';
import styles from './styles.module.css';

interface PatternBookProps {
  onPlayInstance: (videoId: string, startTime: number) => void;
}

const GET_LEVEL = (xp: number) => {
  if (xp >= 300) return 4;
  if (xp >= 150) return 3;
  if (xp >= 50) return 2;
  if (xp >= 10) return 1;
  return 0;
};

const LEVEL_NAMES = ["初出茅庐", "渐入佳境", "驾轻就熟", "炉火纯青", "化境入魂"];

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

  const categorizedPatterns = useMemo(() => {
    const groups: Record<string, Pattern[]> = {};
    patterns.forEach(p => {
      const cat = p.category || '其他';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [patterns]);

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
        <p>正在同步你的熟练度墙...</p>
      </div>
    );
  }

  if (selectedPattern) {
    const level = GET_LEVEL(selectedPattern.masteryXp);
    const nextXp = level === 4 ? 300 : [10, 50, 150, 300][level];
    const progress = Math.min(100, (selectedPattern.masteryXp / nextXp) * 100);

    return (
      <div 
        className={styles.detailsView}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          (window as any)._swipeStartX = touch.clientX;
        }}
        onTouchEnd={(e) => {
          const startX = (window as any)._swipeStartX;
          const endX = e.changedTouches[0].clientX;
          if (startX && endX - startX > 80) { // Swipe Right to go back
            setSelectedPattern(null);
          }
        }}
      >
        <button className={styles.backBtn} onClick={() => setSelectedPattern(null)} title="返回技能矩阵">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className={styles.patternHeader}>
          <div className={styles.patternTag}>{selectedPattern.category}</div>
          <h2 className={styles.patternTitle}>{selectedPattern.text}</h2>
          <p className={styles.patternDescription}>{selectedPattern.description}</p>
          
          <div className={styles.masteryStatus}>
            <div className={`${styles.masteryBadge} ${styles['badge_' + level]}`}>
              LEVEL {level}: {LEVEL_NAMES[level]}
            </div>
            <div className={styles.xpBar}>
              <div className={styles.xpFill} style={{ width: `${progress}%` }}></div>
            </div>
            <div className={styles.xpText}>{selectedPattern.masteryXp} / {nextXp} XP</div>
          </div>
        </div>

        <div className={styles.instanceList}>
          {instances.map((inst) => (
            <div 
              key={inst.id} 
              className={styles.instanceCard}
              onClick={() => onPlayInstance(inst.videoId, inst.startTime)}
            >
              <div className={styles.fullSentence}>
                {inst.en.split(inst.exactText).map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && <span className={styles.highlight}>{inst.exactText}</span>}
                  </span>
                ))}
              </div>
              <div className={styles.videoInfo}>
                <span className={styles.timestamp}>{formatTime(inst.startTime)}</span>
                <span>•</span>
                <span className={styles.videoTitleText}>{inst.videoTitle}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>100LS 熟练度之墙</h1>
        <p className={styles.subtitle}>通过复读和打卡点亮你的地道句型图谱</p>
      </header>

      {Object.entries(categorizedPatterns).map(([cat, items]) => (
        <section key={cat} className={styles.categorySection}>
          <h3 className={styles.categoryTitle}>{cat}</h3>
          <div className={styles.patternGrid}>
            {items.map(p => {
              const level = GET_LEVEL(p.masteryXp);
              return (
                <div 
                  key={p.id} 
                  className={`${styles.patternCard} ${styles['level_' + level]}`} 
                  onClick={() => handlePatternClick(p)}
                >
                  <div className={styles.cardMain}>
                    <div className={styles.cardText}>{p.text}</div>
                    <div className={styles.cardDesc}>{p.description}</div>
                  </div>
                  <div className={styles.cardFooter}>
                    <div className={`${styles.masteryBadge} ${styles['badge_' + level]}`}>
                      LV.{level}
                    </div>
                    <span className={styles.countText}>{p.count} 处</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {patterns.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.spinner} style={{ animation: 'none', borderColor: '#222' }}></div>
          <p>暂未识别到地道句型</p>
        </div>
      )}
    </div>
  );
}
