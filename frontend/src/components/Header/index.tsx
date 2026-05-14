import styles from './styles.module.css';

interface HeaderProps {
  title: string;
  isVip: boolean;
  onBack?: () => void;
  onMenu?: () => void;
}

export default function Header({ title, isVip, onBack, onMenu }: HeaderProps) {
  return (
    <header className={styles.header} id="header">
      <button
        className={styles.headerBtn}
        id="btn-back"
        aria-label="返回"
        onClick={onBack}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className={styles.headerTitle}>
        <span className={styles.titleText}>{title}</span>
        {isVip && <span className={styles.vipBadge}>VIP</span>}
      </div>
      <button
        className={styles.headerBtn}
        id="btn-menu"
        aria-label="更多"
        onClick={onMenu}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="19" r="2" fill="currentColor" />
        </svg>
      </button>
    </header>
  );
}
