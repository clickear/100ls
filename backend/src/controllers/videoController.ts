/**
 * Video import controller — handles video download and subtitle processing.
 */
import type { Request, Response } from 'express';
import * as path from 'node:path';
import { downloadVideo } from '../services/downloader.js';
import { parseSubtitleFile, buildSentences } from '../services/subtitleParser.js';
import {
  generateVideoId,
  getVideoDir,
  saveVideoMeta,
  listVideos as listVideosStore,
  deleteVideo as deleteVideoStore,
} from '../services/videoStore.js';
import type { VideoMeta, ImportVideoResponse } from '../types/player.js';

/**
 * POST /api/videos — Import a video from a URL.
 */
export async function importVideo(req: Request, res: Response): Promise<void> {
  const { url } = req.body as { url?: string };

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: '请提供视频 URL' });
    return;
  }

  try {
    const videoId = generateVideoId(url);
    const outputDir = getVideoDir(videoId);

    console.log(`\n🎬 Importing video: ${url}`);
    console.log(`   Video ID: ${videoId}`);

    // Step 1: Download video + subtitles + thumbnail
    const result = await downloadVideo(url, outputDir);

    // Step 2: Parse subtitles
    let enCues = undefined;
    let cnCues = undefined;

    if (result.subtitleFiles.en) {
      console.log('📝 Parsing English subtitles...');
      enCues = await parseSubtitleFile(result.subtitleFiles.en);
      console.log(`   Found ${enCues.length} English cues`);
    }

    if (result.subtitleFiles.cn) {
      console.log('📝 Parsing Chinese subtitles...');
      cnCues = await parseSubtitleFile(result.subtitleFiles.cn);
      console.log(`   Found ${cnCues.length} Chinese cues`);
    }

    // Step 3: Build sentences
    const sentences = enCues ? buildSentences(enCues, cnCues) : [];
    console.log(`📊 Generated ${sentences.length} sentences`);

    // Step 4: Save metadata
    const meta: VideoMeta = {
      videoId,
      title: result.title,
      sourceUrl: url,
      duration: result.duration,
      importedAt: new Date().toISOString(),
      videoFile: path.basename(result.videoFile),
      thumbnailFile: result.thumbnailFile ? path.basename(result.thumbnailFile) : '',
      subtitleFiles: {
        en: result.subtitleFiles.en ? path.basename(result.subtitleFiles.en) : undefined,
        cn: result.subtitleFiles.cn ? path.basename(result.subtitleFiles.cn) : undefined,
      },
      sentences,
    };

    await saveVideoMeta(videoId, meta);

    const response: ImportVideoResponse = {
      videoId,
      title: result.title,
      duration: result.duration,
      sentenceCount: sentences.length,
      status: sentences.length > 0 ? 'ready' : 'no_subtitles',
    };

    console.log(`✅ Import complete: ${videoId} — ${sentences.length} sentences\n`);
    res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Import failed:', message);
    res.status(500).json({ error: `导入失败: ${message}` });
  }
}

/**
 * GET /api/videos — List all imported videos.
 */
export async function getVideos(_req: Request, res: Response): Promise<void> {
  const videos = await listVideosStore();
  res.json(videos);
}

/**
 * DELETE /api/videos/:videoId — Delete an imported video.
 */
export async function removeVideo(req: Request, res: Response): Promise<void> {
  const videoId = req.params.videoId as string;
  const deleted = await deleteVideoStore(videoId);
  if (deleted) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: '视频未找到' });
  }
}
