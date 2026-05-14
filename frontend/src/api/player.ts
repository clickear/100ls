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
 * Import a video by URL with SSE progress.
 */
export async function importVideo(
  url: string,
  onProgress?: (percent: number, step: string) => void
): Promise<{
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

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Import failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  return new Promise(async (resolve, reject) => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep the last incomplete chunk
        
        for (const block of lines) {
          const eventMatch = block.match(/event:\s*(.*?)\n/);
          const dataMatch = block.match(/data:\s*(.*)/);
          
          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1].trim();
            const payload = JSON.parse(dataMatch[1].trim());
            
            if (eventType === 'progress' && onProgress) {
              onProgress(payload.percent, payload.step || '');
            } else if (eventType === 'complete') {
              resolve(payload);
            } else if (eventType === 'error') {
              reject(new Error(payload.error));
            }
          }
        }
      }
    } catch (err) {
      reject(err);
    }
  });
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
  const videos = await res.json();
  
  return videos.map((v: any) => {
    if (v.thumbnailUrl && v.thumbnailUrl.startsWith('/media/')) {
      v.thumbnailUrl = `${API_BASE}${v.thumbnailUrl}`;
    }
    return v;
  });
}

/**
 * Update the progress status of a sentence (e.g. marking as Key Sentence).
 */
export async function updateSentenceStatus(
  videoId: string,
  sentenceId: number,
  data: { isKey: boolean }
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/player/${videoId}/sentences/${sentenceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Update failed: ${res.status}`);
  }
}

/**
 * Update the overall video progress (stage and repetition count).
 */
export async function updateVideoProgress(
  videoId: string,
  data: { currentStage?: number; repetitionCount?: number; lastPosition?: number }
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/player/${videoId}/progress`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Update failed: ${res.status}`);
  }
}

/**
 * Delete a video.
 */
export async function deleteVideo(videoId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/videos/${videoId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Delete failed: ${res.status}`);
  }
}
