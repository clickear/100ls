/**
 * Video downloader service — wraps yt-dlp to download videos and subtitles.
 */
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

const execFileAsync = promisify(execFile);

export interface DownloadResult {
  title: string;
  duration: number;
  videoFile: string;          // absolute path
  thumbnailFile: string;      // absolute path
}

/**
 * Download video, subtitles, and thumbnail using yt-dlp.
 */
export async function downloadVideo(
  url: string,
  outputDir: string,
  onProgress?: (percent: number) => void
): Promise<DownloadResult> {
  await fs.mkdir(outputDir, { recursive: true });

  // Step 1: Get video metadata first
  const { stdout: metaJson } = await execFileAsync('yt-dlp', [
    '--dump-json',
    '--no-download',
    '--no-playlist',
    '--legacy-server-connect',
    url,
  ], { maxBuffer: 10 * 1024 * 1024 });

  const meta = JSON.parse(metaJson);
  const title: string = meta.title || 'Untitled';
  const duration: number = Math.round(meta.duration || 0);

  // Step 2: Download video (max 720p for faster download + smaller files)
  console.log(`📥 Downloading video: ${title} (${duration}s)...`);
  try {
    await new Promise<void>((resolve, reject) => {
      const args = [
        '-f', 'bestvideo[height<=720]+bestaudio/best[height<=720]/best',
        '--merge-output-format', 'mp4',
        '--no-playlist',
        '--legacy-server-connect',
        '--ignore-errors', // continue on download errors
        '--write-thumbnail',
        '--convert-thumbnails', 'jpg',
        '-o', path.join(outputDir, 'video.%(ext)s'),
        url,
      ];

      const child = spawn('yt-dlp', args);
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        // Look for progress like: [download]  25.0%
        const match = text.match(/\[download\]\s+(\d+\.\d+)%/);
        if (match && onProgress) {
          const percent = parseFloat(match[1]);
          if (!isNaN(percent)) onProgress(percent);
        }
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      const timeoutTimer = setTimeout(() => {
        child.kill();
        reject(new Error('Download timeout exceeded (10 mins)'));
      }, 10 * 60 * 1000);

      child.on('close', (code) => {
        clearTimeout(timeoutTimer);
        if (code !== 0) {
          console.warn(`⚠️ yt-dlp exited with code ${code}, but continuing. Error logs: ${errorOutput.substring(0, 200)}...`);
        }
        resolve(); // Continue anyway since we ignore errors and check if file exists later
      });

      child.on('error', (err) => {
        clearTimeout(timeoutTimer);
        reject(err);
      });
    });
  } catch (err: any) {
    // yt-dlp might exit with code 1 if subtitle downloads fail with 429, but video still downloads.
    // We log the warning and let the rest of the function verify if video.mp4 exists.
    console.warn(`⚠️ yt-dlp reported an error during download, but continuing to check files: ${err.message}`);
  }

  // Step 3: Find downloaded files
  const files = await fs.readdir(outputDir);

  // Find video file
  const videoFile = files.find(f => f.startsWith('video.') && f.endsWith('.mp4'));
  if (!videoFile) {
    throw new Error('Video download failed — no .mp4 file found');
  }

  // Find thumbnail
  const thumbnailFile = files.find(f =>
    f.startsWith('video.') && (f.endsWith('.jpg') || f.endsWith('.webp') || f.endsWith('.png'))
  ) || '';

  console.log(`✅ Download complete: ${videoFile}`);
  console.log(`   Thumbnail: ${thumbnailFile || 'none'}`);

  return {
    title,
    duration,
    videoFile: path.join(outputDir, videoFile),
    thumbnailFile: thumbnailFile ? path.join(outputDir, thumbnailFile) : '',
  };
}
