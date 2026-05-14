import { useState } from 'react';
import { importVideo } from '../../api/player';
import styles from './styles.module.css';

interface VideoImportProps {
  onSuccess: () => void;
}

export default function VideoImport({ onSuccess }: VideoImportProps) {
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStep, setImportStep] = useState('');
  const [error, setError] = useState('');

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;

    setImporting(true);
    setImportProgress(0);
    setImportStep('正在初始化...');
    setError('');
    
    try {
      await importVideo(importUrl, (percent, step) => {
        setImportProgress(percent);
        if (step === 'downloading') setImportStep(`正在下载... ${percent}%`);
        else if (step === 'parsing') setImportStep('正在解析台词...');
        else if (step === 'translating') setImportStep('正在进行 AI 翻译...');
      });
      setImportUrl('');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className={styles.importWrapper}>
      <form onSubmit={handleImport} className={styles.importForm}>
        <input
          type="url"
          value={importUrl}
          onChange={(e) => setImportUrl(e.target.value)}
          placeholder="粘贴 YouTube / B站链接..."
          className={styles.mainInputField}
          disabled={importing}
        />
        <button type="submit" className={styles.submitBtn} disabled={importing || !importUrl}>
          {importing ? '...' : '导入'}
        </button>
      </form>
      
      {importing && (
        <div className={styles.statusRow}>
          <div className={styles.progressTrack}>
            <div className={styles.progressIndicator} style={{ width: `${importProgress}%` }} />
          </div>
          <span className={styles.statusLabel}>{importStep}</span>
        </div>
      )}
      
      {error && <p className={styles.errorMessage}>{error}</p>}
    </section>
  );
}
