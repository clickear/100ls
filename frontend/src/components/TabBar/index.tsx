import type { TabId } from '../../types/player';
import styles from './styles.module.css';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'player', label: '播放器', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M10 8L16 12L10 16V8Z" fill="currentColor"/></svg> },
  { id: 'subtitles', label: '字幕列表', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="7" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5"/><line x1="7" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5"/></svg> },
  { id: 'vocabulary', label: '生词本', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 19.5C4 18.12 5.12 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M6.5 2H20V22H6.5C5.12 22 4 20.88 4 19.5V4.5C4 3.12 5.12 2 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: 'settings', label: '设置', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
];

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <>
      <nav className={styles.tabBar} id="tabBar">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`${styles.tabItem} ${activeTab === t.id ? styles.tabItemActive : ''}`}
            id={`tab-${t.id}`}
            data-tab={t.id}
            onClick={() => onTabChange(t.id)}
          >
            <div className={styles.tabIcon}>{t.icon}</div>
            <span className={styles.tabLabel}>{t.label}</span>
          </button>
        ))}
      </nav>
      <div className={styles.homeIndicatorArea}>
        <div className={styles.homeIndicator} />
      </div>
    </>
  );
}
