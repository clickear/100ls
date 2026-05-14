import type { PlayerData } from '../types/player';

const API_BASE = 'http://localhost:3001';

/**
 * Fetch player data for a given video from the backend API.
 */
export async function fetchPlayerData(videoId: string): Promise<PlayerData> {
  const res = await fetch(`${API_BASE}/api/player/${videoId}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
