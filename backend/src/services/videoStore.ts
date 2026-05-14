/**
 * Video data store — manages video metadata and files on disk.
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import type { VideoMeta, VideoSummary, PlayerData, Episode } from '../types/player.js';

const DATA_DIR = path.resolve(import.meta.dirname, '../../data/videos');

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
 * Save video metadata to disk.
 */
export async function saveVideoMeta(videoId: string, meta: VideoMeta): Promise<void> {
  const dir = getVideoDir(videoId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');
}

/**
 * Read video metadata from disk.
 */
export async function getVideoMeta(videoId: string): Promise<VideoMeta | null> {
  try {
    const content = await fs.readFile(path.join(getVideoDir(videoId), 'meta.json'), 'utf-8');
    return JSON.parse(content) as VideoMeta;
  } catch {
    return null;
  }
}

/**
 * List all imported videos.
 */
export async function listVideos(): Promise<VideoSummary[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
    const summaries: VideoSummary[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const meta = await getVideoMeta(entry.name);
      if (!meta) continue;
      summaries.push({
        videoId: meta.videoId,
        title: meta.title,
        sourceUrl: meta.sourceUrl,
        duration: meta.duration,
        importedAt: meta.importedAt,
        sentenceCount: meta.sentences.length,
        thumbnailUrl: `/media/${meta.videoId}/${meta.thumbnailFile}`,
      });
    }

    return summaries.sort((a, b) =>
      new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
    );
  } catch {
    return [];
  }
}

/**
 * Delete a video and all its files.
 */
export async function deleteVideo(videoId: string): Promise<boolean> {
  const dir = getVideoDir(videoId);
  try {
    await fs.rm(dir, { recursive: true, force: true });
    return true;
  } catch {
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
      currentStage: 1,
      totalStages: 10,
      subtitleMode: '中英双语',
      currentProgress: 0,
      totalProgress: 100,
    },
    episodes,
    sentences: meta.sentences,
    abLoop: {
      active: false,
      startTime: 0,
      endTime: 0,
    },
  };
}
