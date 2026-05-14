/**
 * Video data store — manages video metadata and files on disk.
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import type { VideoMeta, VideoSummary, PlayerData, Episode } from '../types/player.js';
import db from './db.js';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data/videos');

/**
 * Generate a short videoId from a URL.
 */
export function generateVideoId(url: string): string {
  const hash = createHash('md5').update(url).digest('hex').slice(0, 8);
  const ts = Date.now().toString(36).slice(-4);
  return `v-${hash}-${ts}`;
}

/**
 * Get the directory path for a video.
 */
export function getVideoDir(videoId: string): string {
  return path.join(DATA_DIR, videoId);
}

/**
 * Save video metadata and sentences to SQLite.
 */
export async function saveVideoMeta(videoId: string, meta: VideoMeta): Promise<void> {
  const dir = getVideoDir(videoId);
  await fs.mkdir(dir, { recursive: true });
  
  const insertVideo = db.prepare(`
    INSERT OR REPLACE INTO videos (id, title, sourceUrl, duration, videoFile, thumbnailFile, subEn, subCn, importedAt, currentStage, repetitionCount, lastPosition)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSentence = db.prepare(`
    INSERT INTO sentences (videoId, sentenceIndex, startTime, endTime, en, cn, keywords, isKey)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const deleteSentences = db.prepare(`DELETE FROM sentences WHERE videoId = ?`);

  const transaction = db.transaction(() => {
    insertVideo.run(
      meta.videoId,
      meta.title,
      meta.sourceUrl,
      meta.duration,
      meta.videoFile,
      meta.thumbnailFile || null,
      meta.subtitleFiles.en || null,
      meta.subtitleFiles.cn || null,
      meta.importedAt,
      meta.currentStage || 1,
      meta.repetitionCount || 0,
      meta.lastPosition || 0
    );

    deleteSentences.run(meta.videoId);

    for (let i = 0; i < meta.sentences.length; i++) {
      const s = meta.sentences[i];
      insertSentence.run(
        meta.videoId,
        i,
        s.startTime,
        s.endTime,
        s.en || '',
        s.cn || '',
        JSON.stringify(s.keywords || []),
        s.isKey ? 1 : 0
      );
    }
  });

  transaction();
}

/**
 * Read video metadata from SQLite.
 */
export async function getVideoMeta(videoId: string): Promise<VideoMeta | null> {
  const video = db.prepare(`SELECT * FROM videos WHERE id = ?`).get(videoId) as any;
  if (!video) return null;

  const sentencesRows = db.prepare(`SELECT * FROM sentences WHERE videoId = ? ORDER BY sentenceIndex`).all(videoId) as any[];
  
  const sentences = sentencesRows.map((row) => ({
    id: row.id,
    startTime: row.startTime,
    endTime: row.endTime,
    en: row.en,
    cn: row.cn || '',
    keywords: JSON.parse(row.keywords || '[]'),
    isKey: row.isKey === 1
  }));

  return {
    videoId: video.id,
    title: video.title,
    sourceUrl: video.sourceUrl,
    duration: video.duration,
    importedAt: video.importedAt,
    videoFile: video.videoFile,
    thumbnailFile: video.thumbnailFile || '',
    subtitleFiles: {
      en: video.subEn || undefined,
      cn: video.subCn || undefined
    },
    sentences,
    currentStage: video.currentStage || 1,
    repetitionCount: video.repetitionCount || 0,
    lastPosition: video.lastPosition || 0
  };
}

/**
 * List all imported videos from SQLite.
 */
export async function listVideos(): Promise<VideoSummary[]> {
  try {
    const rows = db.prepare(`
      SELECT v.*, COUNT(s.id) as sentenceCount 
      FROM videos v 
      LEFT JOIN sentences s ON v.id = s.videoId 
      GROUP BY v.id 
      ORDER BY v.importedAt DESC
    `).all() as any[];

    return rows.map(row => ({
      videoId: row.id,
      title: row.title,
      sourceUrl: row.sourceUrl,
      duration: row.duration,
      importedAt: row.importedAt,
      sentenceCount: row.sentenceCount,
      thumbnailUrl: row.thumbnailFile ? `/media/${row.id}/${row.thumbnailFile}` : '',
      currentStage: row.currentStage || 1,
      repetitionCount: row.repetitionCount || 0
    }));
  } catch (err) {
    console.error('Error listing videos', err);
    return [];
  }
}

/**
 * Delete a video and all its files.
 */
export async function deleteVideo(videoId: string): Promise<boolean> {
  try {
    const dir = getVideoDir(videoId);
    // 1. Check if directory exists before trying to delete it
    try {
      const stats = await fs.stat(dir);
      if (stats.isDirectory()) {
        await fs.rm(dir, { recursive: true, force: true });
      }
    } catch (e) {
      // Directory doesn't exist, ignore and proceed to DB
      console.log(`Directory for ${videoId} not found, proceeding with DB deletion.`);
    }

    // 2. Always attempt to delete from database
    const result = db.prepare(`DELETE FROM videos WHERE id = ?`).run(videoId);
    return result.changes > 0;
  } catch (err) {
    console.error(`Error deleting video ${videoId}:`, err);
    return false;
  }
}

/**
 * Convert stored VideoMeta into the PlayerData format the frontend expects.
 */
export function toPlayerData(meta: VideoMeta): PlayerData {
  // Generate default stage + episode data
  const episodes: Episode[] = Array.from({ length: 10 }, (_, i) => ({
    number: i + 1,
    status: i === 0 ? 'active' as const : 'locked' as const,
  }));

  return {
    videoId: meta.videoId,
    title: meta.title,
    isVip: false,
    videoUrl: `/media/${meta.videoId}/${meta.videoFile}`,
    thumbnailUrl: meta.thumbnailFile
      ? `/media/${meta.videoId}/${meta.thumbnailFile}`
      : '',
    subtitleUrls: {
      en: meta.subtitleFiles.en ? `/media/${meta.videoId}/${meta.subtitleFiles.en}` : undefined,
      cn: meta.subtitleFiles.cn ? `/media/${meta.videoId}/${meta.subtitleFiles.cn}` : undefined,
    },
    duration: meta.duration,
    stageInfo: {
      currentStage: meta.currentStage || 1,
      totalStages: 10,
      subtitleMode: '中英双语',
      currentProgress: 0,
      totalProgress: 100,
      repetitionCount: meta.repetitionCount || 0,
      lastPosition: meta.lastPosition || 0,
    },
    episodes,
    sentences: meta.sentences,
    abLoop: {
      active: false,
      startTime: 0,
      endTime: 0,
    },
    repetitionCount: meta.repetitionCount || 0,
  };
}
