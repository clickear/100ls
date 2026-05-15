import { useSettings } from '../../hooks/useSettings';
import styles from './styles.module.css';

export default function Settings() {
  const { settings, setTheme, setShadowingPauseFactor } = useSettings();

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>视觉主题 (Themes)</h3>
        <div className={styles.themeGrid}>
          <button 
            className={`${styles.themeCard} ${settings.theme === 'imperial-gold' ? styles.active : ''}`}
            onClick={() => setTheme('imperial-gold')}
          >
            <div className={styles.previewGold}>
              <div className={styles.previewDot} />
            </div>
            <span className={styles.themeName}>Imperial Gold</span>
            <span className={styles.themeDesc}>经典香槟金 · 优雅大气</span>
          </button>

          <button 
            className={`${styles.themeCard} ${settings.theme === 'midnight-blue' ? styles.active : ''}`}
            onClick={() => setTheme('midnight-blue')}
          >
            <div className={styles.previewMidnight}>
              <div className={styles.previewDot} />
            </div>
            <span className={styles.themeName}>Midnight Blue</span>
            <span className={styles.themeDesc}>深邃午夜蓝 · 极客护眼</span>
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>影子跟读配置 (Shadowing)</h3>
        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <span>暂停系数 (Pause Factor)</span>
            <span className={styles.value}>{settings.shadowingPauseFactor}x</span>
          </div>
          <p className={styles.hint}>跟读预留时长 = 句子时长 × 系数</p>
          <input 
            type="range" 
            min="1.0" 
            max="3.0" 
            step="0.1" 
            value={settings.shadowingPauseFactor}
            onChange={(e) => setShadowingPauseFactor(parseFloat(e.target.value))}
            className={styles.rangeInput}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>关于 100LS AI</h3>
        <div className={styles.aboutCard}>
          <p>Version 1.2.5 (Majestic Edition)</p>
          <p>© 2026 Antigravity. Designed for deep language learning.</p>
        </div>
      </section>
    </div>
  );
}
