import type { Request, Response } from 'express';
import { getVideoMeta, saveVideoMeta, toPlayerData } from '../services/videoStore.js';
import db from '../services/db.js';

export async function getPlayerData(req: Request, res: Response): Promise<void> {
  const videoId = req.params.videoId as string;

  const meta = await getVideoMeta(videoId);
  if (!meta) {
    res.status(404).json({ error: `视频 ${videoId} 未找到` });
    return;
  }

  res.json(toPlayerData(meta));
}

export async function updateSentenceProgress(req: Request, res: Response): Promise<void> {
  const videoId = req.params.videoId as string;
  const sentenceId = parseInt(req.params.sentenceId as string, 10);
  const { isKey } = req.body as { isKey?: boolean };

  if (isNaN(sentenceId) || typeof isKey !== 'boolean') {
    res.status(400).json({ error: '无效的参数' });
    return;
  }

  const result = db.prepare(`UPDATE sentences SET isKey = ? WHERE id = ? AND videoId = ?`).run(
    isKey ? 1 : 0, 
    sentenceId, 
    videoId
  );

  if (result.changes === 0) {
    res.status(404).json({ error: `未找到该句子或视频不匹配` });
    return;
  }

  res.json({ success: true });
}

export async function updateVideoProgress(req: Request, res: Response): Promise<void> {
  const { videoId } = req.params;
  const { currentStage, repetitionCount, lastPosition } = req.body as { 
    currentStage?: number; 
    repetitionCount?: number;
    lastPosition?: number;
  };

  db.prepare(`
    UPDATE videos 
    SET currentStage = COALESCE(?, currentStage),
        repetitionCount = COALESCE(?, repetitionCount),
        lastPosition = COALESCE(?, lastPosition)
    WHERE id = ?
  `).run(
    currentStage ?? null, 
    repetitionCount ?? null, 
    lastPosition ?? null, 
    videoId
  );

  res.json({ success: true });
}
