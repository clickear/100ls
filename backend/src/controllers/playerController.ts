import type { Request, Response } from 'express';
import { getVideoMeta, toPlayerData } from '../services/videoStore.js';
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
  const videoId = req.params.videoId as string;
  const { currentStage, repetitionCount } = req.body as { currentStage?: number, repetitionCount?: number };

  const updates: string[] = [];
  const params: any[] = [];

  if (typeof currentStage === 'number') {
    updates.push('currentStage = ?');
    params.push(currentStage);
  }

  if (typeof repetitionCount === 'number') {
    updates.push('repetitionCount = ?');
    params.push(repetitionCount);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: '没有提供更新字段' });
    return;
  }

  params.push(videoId);
  const result = db.prepare(`UPDATE videos SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  if (result.changes === 0) {
    res.status(404).json({ error: `未找到视频 ${videoId}` });
    return;
  }

  res.json({ success: true });
}
