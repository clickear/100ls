import type { SubtitleMode } from '../../types/player';
import styles from './styles.module.css';

interface SubtitleModesProps {
  currentMode: SubtitleMode;
  onChange: (mode: SubtitleMode) => void;
}

const modes: { id: SubtitleMode; label: string; icon: React.ReactNode }[] = [
  { id: 'pure-en', label: '纯英文', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><text x="5" y="13" fontSize="6" fill="currentColor" fontWeight="600">En</text></svg> },
  { id: 'bilingual', label: '中英双语', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><text x="4" y="10" fontSize="5" fill="currentColor" fontWeight="600">En</text><text x="4" y="16" fontSize="5" fill="currentColor" fontWeight="600">中</text></svg> },
  { id: 'keyword', label: '关键词提示', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><text x="4" y="13" fontSize="5" fill="currentColor">关</text><text x="12" y="13" fontSize="5" fill="currentColor">…</text></svg> },
  { id: 'dictation', label: '听写填空', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><text x="4" y="10" fontSize="5" fill="currentColor">En</text><line x1="4" y1="14" x2="10" y2="14" stroke="currentColor" strokeWidth="1.2"/><line x1="12" y1="14" x2="18" y2="14" stroke="currentColor" strokeWidth="1.2"/></svg> },
  { id: 'none', label: '无字幕', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><line x1="5" y1="7" x2="17" y2="15" stroke="currentColor" strokeWidth="1.2"/></svg> },
];

export default function SubtitleModes({ currentMode, onChange }: SubtitleModesProps) {
  return (
    <div className={styles.subtitleModeSection} id="subtitleModeSection">
      <h3 className={styles.sectionTitle}>字幕模式</h3>
      <div className={styles.subtitleModes}>
        {modes.map(m => (
          <button
            key={m.id}
            className={`${styles.modeBtn} ${currentMode === m.id ? styles.modeBtnActive : ''}`}
            id={`mode-${m.id}`}
            data-mode={m.id}
            onClick={() => onChange(m.id)}
          >
            <div className={styles.modeIcon}>{m.icon}</div>
            <span className={styles.modeLabel}>{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
