import type { Request, Response } from 'express';
import { getVideoMeta, toPlayerData } from '../services/videoStore.js';

export async function getPlayerData(req: Request, res: Response): Promise<void> {
  const videoId = req.params.videoId as string;

  const meta = await getVideoMeta(videoId);
  if (!meta) {
    res.status(404).json({ error: `视频 ${videoId} 未找到` });
    return;
  }

  res.json(toPlayerData(meta));
}
