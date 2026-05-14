import Database from 'better-sqlite3';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(path.join(DATA_DIR, '100ls.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    sourceUrl TEXT NOT NULL,
    duration INTEGER NOT NULL,
    videoFile TEXT NOT NULL,
    thumbnailFile TEXT,
    subEn TEXT,
    subCn TEXT,
    importedAt TEXT NOT NULL,
    currentStage INTEGER DEFAULT 1,
    repetitionCount INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sentences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    videoId TEXT NOT NULL,
    sentenceIndex INTEGER NOT NULL,
    startTime REAL NOT NULL,
    endTime REAL NOT NULL,
    en TEXT NOT NULL,
    cn TEXT,
    keywords TEXT, -- JSON array of strings
    isKey INTEGER DEFAULT 0,
    FOREIGN KEY(videoId) REFERENCES videos(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sentences_videoId ON sentences(videoId);
`);

// Defensive migrations for existing databases
try { db.exec('ALTER TABLE videos ADD COLUMN currentStage INTEGER DEFAULT 1'); } catch (e) {}
try { db.exec('ALTER TABLE videos ADD COLUMN repetitionCount INTEGER DEFAULT 0'); } catch (e) {}
try { db.exec('ALTER TABLE videos ADD COLUMN lastPosition REAL DEFAULT 0'); } catch (e) {}

export default db;
