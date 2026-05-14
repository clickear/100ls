import type { TabId } from '../../types/player';
import styles from './styles.module.css';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: '首页', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 9.5L12 3L21 9.5V19C21 20.1 20.1 21 19 21H15V14H9V21H5C3.9 21 3 20.1 3 19V9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: 'player', label: '播放', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M10 8L16 12L10 16V8Z" fill="currentColor"/></svg> },
  { id: 'vocabulary', label: '句型', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 19.5C4 18.12 5.12 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M6.5 2H20V22H6.5C5.12 22 4 20.88 4 19.5V4.5C4 3.12 5.12 2 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: 'settings', label: '设置', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
];

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className={styles.fixedBottomWrapper}>
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
    </div>
  );
}
