import type { PlayerData } from '../types/player';

const API_BASE = 'http://localhost:3001';

/**
 * Fetch player data for a given video from the backend API.
 * Resolves relative video/thumbnail URLs to the backend server.
 */
export async function fetchPlayerData(videoId: string): Promise<PlayerData> {
  const res = await fetch(`${API_BASE}/api/player/${videoId}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  const data: PlayerData = await res.json();

  // Resolve relative media URLs to backend absolute URLs
  if (data.videoUrl && data.videoUrl.startsWith('/media/')) {
    data.videoUrl = `${API_BASE}${data.videoUrl}`;
  }
  if (data.thumbnailUrl && data.thumbnailUrl.startsWith('/media/')) {
    data.thumbnailUrl = `${API_BASE}${data.thumbnailUrl}`;
  }
  if (data.subtitleUrls) {
    if (data.subtitleUrls.en && data.subtitleUrls.en.startsWith('/media/')) {
      data.subtitleUrls.en = `${API_BASE}${data.subtitleUrls.en}`;
    }
    if (data.subtitleUrls.cn && data.subtitleUrls.cn.startsWith('/media/')) {
      data.subtitleUrls.cn = `${API_BASE}${data.subtitleUrls.cn}`;
    }
  }

  return data;
}

/**
 * Import a video by URL.
 */
export async function importVideo(url: string): Promise<{
  videoId: string;
  title: string;
  duration: number;
  sentenceCount: number;
  status: string;
}> {
  const res = await fetch(`${API_BASE}/api/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Import failed: ${res.status}`);
  }
  return res.json();
}

/**
 * List all imported videos.
 */
export async function listVideos(): Promise<Array<{
  videoId: string;
  title: string;
  duration: number;
  sentenceCount: number;
  thumbnailUrl: string;
}>> {
  const res = await fetch(`${API_BASE}/api/videos`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
