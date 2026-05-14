import styles from './styles.module.css';

interface StageBarProps {
  currentStage: number;
  repetitionCount: number;
  onStageSelect: (stage: number) => void;
  onCheckIn?: () => void;
}

export default function StageBar({
  currentStage,
  repetitionCount,
  onStageSelect,
  onCheckIn,
}: StageBarProps) {
  // 10 stages of 100LS
  const stages = Array.from({ length: 10 }, (_, i) => i + 1);

  const getSubtitleModeName = (stage: number) => {
    if (stage === 1) return '中英双语';
    if (stage === 2) return '纯英文字幕';
    return '无字幕/跟读';
  };

  const getRecommendedStage = (count: number) => {
    if (count <= 2) return 1;
    if (count <= 10) return 2;
    if (count <= 25) return 3;
    if (count <= 40) return 4;
    if (count <= 55) return 5;
    if (count <= 70) return 6;
    if (count <= 80) return 7;
    if (count <= 90) return 8;
    if (count <= 99) return 9;
    return 10;
  };

  const recommendedStage = getRecommendedStage(repetitionCount);

  return (
    <div className={styles.container}>
      {/* Stage Info Row */}
      <div className={styles.stageInfo} id="stageInfo">
        <div className={styles.stageInfoLeft}>
          <span className={styles.stageLabel}>Stage {currentStage}</span>
          <span className={styles.stageSubtitleMode}>{getSubtitleModeName(currentStage)}</span>
        </div>
        
        <div className={styles.stageInfoRight}>
          <div className={styles.repetitionInfo}>
            <span>已重复 </span>
            <span className={styles.progressNumber}>{repetitionCount}</span>
            <span> 遍</span>
          </div>
          
          {onCheckIn && (
            <button className={styles.checkInBtn} onClick={onCheckIn}>
              打卡
            </button>
          )}
        </div>
      </div>

      {/* Stage Selection Row */}
      <div className={styles.episodeRow} id="stageRow">
        {stages.map((s) => {
          const isActive = s === currentStage;
          const isCompleted = s < currentStage;
          
          // Determine color group
          let groupClass = '';
          if (s <= 2) groupClass = styles.stageFoundation; // Stage 1-2: Bilingual & English
          else if (s <= 5) groupClass = styles.stageShadowing; // Stage 3-5: Active Shadowing
          else if (s <= 8) groupClass = styles.stageFluent;   // Stage 6-8: Fluency building
          else groupClass = styles.stageMastery;              // Stage 9-10: Mastery

          const classNames = [
            styles.episodeItem,
            groupClass,
            isCompleted ? styles.completed : '',
            isActive ? styles.episodeActive : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={s} className={styles.stageWrapper}>
              <button
                className={classNames}
                data-stage={s}
                onClick={() => onStageSelect(s)}
              >
                <span>{s}</span>
                {isCompleted && (
                  <span className={styles.epCheck}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5L4.5 7.5L8 3"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
                {s === recommendedStage && (
                  <span className={styles.recCrown} title="推荐阶段">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
