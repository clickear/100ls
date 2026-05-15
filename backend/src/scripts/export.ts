import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths configuration
const ROOT_DIR = path.resolve(__dirname, '../../../');
const DB_PATH = path.join(ROOT_DIR, 'backend/data/100ls.db');
const EXPORT_DIR = path.join(ROOT_DIR, 'frontend/public/static-data');

console.log('🚀 Starting Static Export from Backend...');

if (!fs.existsSync(DB_PATH)) {
  console.error(`❌ Database not found at: ${DB_PATH}`);
  process.exit(1);
}

const db = new Database(DB_PATH);

// Ensure export directory exists
if (fs.existsSync(EXPORT_DIR)) {
  fs.rmSync(EXPORT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(EXPORT_DIR, { recursive: true });
fs.mkdirSync(path.join(EXPORT_DIR, 'player'), { recursive: true });
fs.mkdirSync(path.join(EXPORT_DIR, 'media'), { recursive: true });

try {
  // 1. Export Videos List
  console.log('📦 Exporting videos list...');
  const videos = db.prepare(`
    SELECT v.*, 
    (SELECT count(*) FROM sentences WHERE videoId = v.id) as sentenceCount
    FROM videos v
    ORDER BY importedAt DESC
  `).all();

  const videosList = (videos as any[]).map(row => ({
    videoId: row.id,
    title: row.title,
    sourceUrl: row.sourceUrl,
    duration: row.duration,
    importedAt: row.importedAt,
    sentenceCount: row.sentenceCount,
    thumbnailUrl: row.thumbnailFile 
      ? (row.thumbnailFile.startsWith('http') ? row.thumbnailFile : `static-data/media/${row.id}/${row.thumbnailFile}`)
      : '',
    currentStage: row.currentStage || 1,
    repetitionCount: row.repetitionCount || 0
  }));

  fs.writeFileSync(
    path.join(EXPORT_DIR, 'videos.json'),
    JSON.stringify(videosList, null, 2)
  );

  // 2. Export Detailed Player Data for each video
  console.log('🎬 Exporting player details and media files...');
  for (const video of videos as any[]) {
    const sentences = db.prepare('SELECT * FROM sentences WHERE videoId = ? ORDER BY startTime ASC').all(video.id);
    
    // Process patterns for sentences
    for (const sentence of sentences as any[]) {
      const patterns = db.prepare(`
        SELECT pi.*, p.text as patternText
        FROM phrase_instances pi
        JOIN patterns p ON pi.patternId = p.id
        WHERE pi.sentenceId = ?
      `).all(sentence.id);
      sentence.patterns = patterns;
      
      // Keywords are stored as JSON string in DB, parse them
      try {
        sentence.keywords = JSON.parse(sentence.keywords || '[]');
      } catch (e) {
        sentence.keywords = [];
      }
    }

    const playerData = {
      videoId: video.id,
      title: video.title,
      isVip: false,
      videoUrl: video.videoFile.startsWith('http') 
        ? video.videoFile 
        : `static-data/media/${video.id}/${video.videoFile}`,
      thumbnailUrl: video.thumbnailFile
        ? (video.thumbnailFile.startsWith('http') ? video.thumbnailFile : `static-data/media/${video.id}/${video.thumbnailFile}`)
        : '',
      duration: video.duration,
      stageInfo: {
        currentStage: video.currentStage || 1,
        totalStages: 5,
        subtitleMode: 'bilingual',
        currentProgress: 0,
        totalProgress: 100,
        repetitionCount: video.repetitionCount || 0,
        lastPosition: video.lastPosition || 0
      },
      episodes: [
        { number: 1, status: 'active' }
      ],
      sentences: sentences,
      abLoop: { active: false, startTime: 0, endTime: 0 },
      repetitionCount: video.repetitionCount || 0
    };

    fs.writeFileSync(
      path.join(EXPORT_DIR, `player/${video.id}.json`),
      JSON.stringify(playerData, null, 2)
    );

    // Copy media files if local
    const mediaDir = path.join(EXPORT_DIR, `media/${video.id}`);
    fs.mkdirSync(mediaDir, { recursive: true });

    if (!video.videoFile.startsWith('http')) {
      const srcVideo = path.join(ROOT_DIR, 'backend/media', video.id, video.videoFile);
      if (fs.existsSync(srcVideo)) {
        fs.copyFileSync(srcVideo, path.join(mediaDir, video.videoFile));
      }
    }

    if (video.thumbnailFile && !video.thumbnailFile.startsWith('http')) {
      const srcThumb = path.join(ROOT_DIR, 'backend/media', video.id, video.thumbnailFile);
      if (fs.existsSync(srcThumb)) {
        fs.copyFileSync(srcThumb, path.join(mediaDir, video.thumbnailFile));
      }
    }
  }

  // 3. Export Pattern Book
  console.log('📖 Exporting pattern book...');
  const patterns = db.prepare('SELECT * FROM patterns').all();
  fs.writeFileSync(
    path.join(EXPORT_DIR, 'patterns.json'),
    JSON.stringify(patterns, null, 2)
  );

  const patternInstances = db.prepare(`
    SELECT pi.*, p.text as patternText, s.en, v.title as videoTitle, s.videoId
    FROM phrase_instances pi
    JOIN patterns p ON pi.patternId = p.id
    JOIN sentences s ON pi.sentenceId = s.id
    JOIN videos v ON s.videoId = v.id
  `).all();
  fs.writeFileSync(
    path.join(EXPORT_DIR, 'pattern-instances.json'),
    JSON.stringify(patternInstances, null, 2)
  );

  console.log('\n✅ Static Export Complete!');
  console.log(`📍 Files saved to: ${EXPORT_DIR}`);
  console.log('💡 You can now build and deploy the frontend with VITE_STATIC_MODE=true');

} catch (err) {
  console.error('❌ Export failed:', err);
  process.exit(1);
} finally {
  db.close();
}
