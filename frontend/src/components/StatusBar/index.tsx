import styles from './styles.module.css';

export default function StatusBar() {
  return (
    <div className={styles.statusBar}>
      <span className={styles.statusTime}>9:41</span>
      <div className={styles.statusIcons}>
        <svg className={styles.statusIcon} width="17" height="12" viewBox="0 0 17 12" fill="none">
          <rect x="0" y="4" width="3" height="8" rx="1" fill="white" />
          <rect x="4.5" y="3" width="3" height="9" rx="1" fill="white" />
          <rect x="9" y="1" width="3" height="11" rx="1" fill="white" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" fill="white" />
        </svg>
        <svg className={styles.statusIcon} width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 3.6C9.8 3.6 11.4 4.3 12.6 5.4L14 4C12.4 2.5 10.3 1.6 8 1.6C5.7 1.6 3.6 2.5 2 4L3.4 5.4C4.6 4.3 6.2 3.6 8 3.6Z" fill="white" />
          <path d="M8 7.2C9 7.2 9.9 7.6 10.6 8.2L12 6.8C10.9 5.8 9.5 5.2 8 5.2C6.5 5.2 5.1 5.8 4 6.8L5.4 8.2C6.1 7.6 7 7.2 8 7.2Z" fill="white" />
          <circle cx="8" cy="10.5" r="1.5" fill="white" />
        </svg>
        <div className={styles.batteryIcon}>
          <div className={styles.batteryBody}>
            <div className={styles.batteryFill} />
          </div>
          <div className={styles.batteryTip} />
        </div>
      </div>
    </div>
  );
}
