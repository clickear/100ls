/**
 * Video import controller — handles video download and subtitle processing.
 */
import type { Request, Response } from 'express';
import * as path from 'node:path';
import { downloadVideo } from '../services/downloader.js';
import { parseSubtitleFile, buildSentences, buildSentencesFromWhisper } from '../services/subtitleParser.js';
import { extractAudio, transcribeAudio } from '../services/whisperService.js';
import { scanSentencesForPatterns } from '../services/patternService.js';
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

  // Setup SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Ensure headers are sent immediately

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const videoId = generateVideoId(url);
    const outputDir = getVideoDir(videoId);

    console.log(`\n🎬 Importing video: ${url}`);
    console.log(`   Video ID: ${videoId}`);

    // Step 1: Download video + subtitles + thumbnail
    let lastPercent = -1;
    const result = await downloadVideo(url, outputDir, (percent) => {
      // Throttle updates to ~1% increments to avoid flooding
      const p = Math.floor(percent);
      if (p !== lastPercent) {
        lastPercent = p;
        sendEvent('progress', { percent: p, step: 'downloading' });
      }
    });

    // Step 2: Extract audio for Whisper
    sendEvent('progress', { percent: 100, step: 'extracting_audio' });
    console.log('🎵 Extracting audio for Whisper...');
    const wavFile = path.join(outputDir, 'audio.wav');
    await extractAudio(result.videoFile, wavFile);

    // Step 3: Transcribe with Whisper
    sendEvent('progress', { percent: 100, step: 'transcribing' });
    const whisperSegments = await transcribeAudio(wavFile);

    // Step 4: Build sentences semantically
    sendEvent('progress', { percent: 100, step: 'parsing' });
    const sentences = buildSentencesFromWhisper(whisperSegments);
    console.log(`📊 Generated ${sentences.length} sentences`);

    // Step 5: Save metadata
    const meta: VideoMeta = {
      videoId,
      title: result.title,
      sourceUrl: url,
      duration: result.duration,
      importedAt: new Date().toISOString(),
      videoFile: path.basename(result.videoFile),
      thumbnailFile: result.thumbnailFile ? path.basename(result.thumbnailFile) : '',
      subtitleFiles: {}, // No longer using static subtitle files
      sentences,
    };

    await saveVideoMeta(videoId, meta);

    // Step 6: Automatic Pattern Recognition
    console.log('🔍 Scanning for sentence patterns...');
    try {
      await scanSentencesForPatterns(videoId, sentences);
    } catch (patternErr) {
      console.error('⚠️ Pattern scanning failed (non-critical):', patternErr);
    }

    const response: ImportVideoResponse = {
      videoId,
      title: result.title,
      duration: result.duration,
      sentenceCount: sentences.length,
      status: sentences.length > 0 ? 'ready' : 'no_subtitles',
    };

    console.log(`✅ Import complete: ${videoId} — ${sentences.length} sentences\n`);
    sendEvent('complete', response);
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Import failed:', message);
    sendEvent('error', { error: `导入失败: ${message}` });
    res.end();
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
