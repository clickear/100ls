import Database from 'better-sqlite3';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT_DIR, 'backend/data/100ls.db');
const MEDIA_SRC_DIR = path.join(ROOT_DIR, 'backend/data/videos');
const EXPORT_DIR = path.join(ROOT_DIR, 'frontend/public/static-data');

// Ensure export directory exists
if (fs.existsSync(EXPORT_DIR)) {
  fs.rmSync(EXPORT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(EXPORT_DIR, { recursive: true });
fs.mkdirSync(path.join(EXPORT_DIR, 'player'), { recursive: true });
fs.mkdirSync(path.join(EXPORT_DIR, 'media'), { recursive: true });

console.log('🚀 Starting Static Export from Database...');

const db = new Database(DB_PATH);

// 1. Export Videos List
console.log('📦 Exporting videos list...');
const videos = db.prepare(`
  SELECT v.*, COUNT(s.id) as sentenceCount 
  FROM videos v 
  LEFT JOIN sentences s ON v.id = s.videoId 
  GROUP BY v.id 
  ORDER BY v.importedAt DESC
`).all();

const videoSummaries = videos.map(row => ({
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
  JSON.stringify(videoSummaries, null, 2)
);

// 2. Export Detailed Player Data for each video
console.log('🎬 Exporting player details and media files...');
for (const video of videos) {
  console.log(`   - Processing: ${video.title}`);
  
  const sentencesRows = db.prepare(`SELECT * FROM sentences WHERE videoId = ? ORDER BY sentenceIndex`).all(video.id);
  
  // Fetch pattern instances
  const instances = db.prepare(`
    SELECT pi.sentenceId, pi.exactText, p.id as patternId, p.text as patternText
    FROM phrase_instances pi
    JOIN patterns p ON pi.patternId = p.id
    WHERE pi.sentenceId IN (SELECT id FROM sentences WHERE videoId = ?)
  `).all(video.id);

  const instanceMap = new Map();
  instances.forEach(inst => {
    if (!instanceMap.has(inst.sentenceId)) instanceMap.set(inst.sentenceId, []);
    instanceMap.get(inst.sentenceId).push({
      patternId: inst.patternId,
      patternText: inst.patternText,
      exactText: inst.exactText
    });
  });

  const sentences = sentencesRows.map((row) => ({
    id: row.id,
    startTime: row.startTime,
    endTime: row.endTime,
    en: row.en,
    cn: row.cn || '',
    isKey: row.isKey === 1,
    patterns: instanceMap.get(row.id) || []
  }));

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
      totalStages: 10,
      subtitleMode: '中英双语',
      currentProgress: 0,
      totalProgress: 100,
      repetitionCount: video.repetitionCount || 0,
      lastPosition: video.lastPosition || 0,
    },
    episodes: Array.from({ length: 10 }, (_, i) => ({
      number: i + 1,
      status: i === 0 ? 'active' : 'locked',
    })),
    sentences,
    abLoop: { active: false, startTime: 0, endTime: 0 },
    repetitionCount: video.repetitionCount || 0,
  };

  fs.writeFileSync(
    path.join(EXPORT_DIR, 'player', `${video.id}.json`),
    JSON.stringify(playerData, null, 2)
  );

  // Copy Media Files
  const srcMediaDir = path.join(MEDIA_SRC_DIR, video.id);
  const destMediaDir = path.join(EXPORT_DIR, 'media', video.id);
  
  if (fs.existsSync(srcMediaDir)) {
    fs.mkdirSync(destMediaDir, { recursive: true });
    
    // Copy mp4 if it is a local file
    if (!video.videoFile.startsWith('http')) {
      const videoPath = path.join(srcMediaDir, video.videoFile);
      if (fs.existsSync(videoPath)) {
        fs.copyFileSync(videoPath, path.join(destMediaDir, video.videoFile));
      }
    }
    
    // Copy thumbnail if it is a local file
    if (video.thumbnailFile && !video.thumbnailFile.startsWith('http')) {
      const thumbPath = path.join(srcMediaDir, video.thumbnailFile);
      if (fs.existsSync(thumbPath)) {
        fs.copyFileSync(thumbPath, path.join(destMediaDir, video.thumbnailFile));
      }
    }
  }
}

// 3. Export Patterns (Vocabulary)
console.log('📖 Exporting pattern book...');
const patterns = db.prepare(`
  SELECT p.*, COUNT(pi.id) as count
  FROM patterns p
  LEFT JOIN phrase_instances pi ON p.id = pi.patternId
  GROUP BY p.id
`).all();

const patternInstances = db.prepare(`
  SELECT pi.*, s.en, s.startTime, s.endTime, v.title as videoTitle, v.id as videoId
  FROM phrase_instances pi
  JOIN sentences s ON pi.sentenceId = s.id
  JOIN videos v ON s.videoId = v.id
`).all();

fs.writeFileSync(
  path.join(EXPORT_DIR, 'patterns.json'),
  JSON.stringify(patterns, null, 2)
);

fs.writeFileSync(
  path.join(EXPORT_DIR, 'pattern-instances.json'),
  JSON.stringify(patternInstances, null, 2)
);

console.log('\n✅ Static Export Complete!');
console.log(`📍 Files saved to: ${EXPORT_DIR}`);
console.log('💡 You can now build and deploy the frontend with VITE_STATIC_MODE=true');

db.close();
