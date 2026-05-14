import type { StageInfo, Episode } from '../../types/player';
import styles from './styles.module.css';

interface StageBarProps {
  stageInfo: StageInfo;
  episodes: Episode[];
  onEpisodeSelect: (ep: number) => void;
  onStageDetail?: () => void;
}

export default function StageBar({
  stageInfo,
  episodes,
  onEpisodeSelect,
  onStageDetail,
}: StageBarProps) {
  return (
    <>
      {/* Stage Info */}
      <div className={styles.stageInfo} id="stageInfo">
        <div className={styles.stageInfoLeft}>
          <span className={styles.stageLabel}>第 {stageInfo.currentStage} 阶段</span>
          <span className={styles.stageSubtitleMode}>{stageInfo.subtitleMode}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="#999"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className={styles.stageInfoCenter}>
          <span>当前进度 </span>
          <span className={styles.progressNumber}>{stageInfo.currentProgress}</span>
          <span> / {stageInfo.totalProgress} 遍</span>
        </div>
        <button className={styles.stageDetailBtn} id="btn-stage-detail" onClick={onStageDetail}>
          阶段详情
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M4.5 3L7.5 6L4.5 9"
              stroke="#4ADE80"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Episode Row */}
      <div className={styles.episodeRow} id="episodeRow">
        {episodes.map((ep) => {
          const classNames = [
            styles.episodeItem,
            ep.status === 'completed' ? styles.completed : '',
            ep.status === 'active' ? styles.episodeActive : '',
            ep.status === 'locked' ? styles.locked : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={ep.number}
              className={classNames}
              data-ep={ep.number}
              onClick={() => onEpisodeSelect(ep.number)}
            >
              <span>{ep.number}</span>
              {ep.status === 'completed' && (
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
            </button>
          );
        })}
      </div>
    </>
  );
}
