import type { Request, Response } from 'express';
import { mockPlayerData } from '../models/mockData.js';

export function getPlayerData(_req: Request, res: Response) {
  // In production, fetch from database using req.params.videoId
  res.json(mockPlayerData);
}
