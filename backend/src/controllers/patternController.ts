import { Request, Response } from 'express';
import { getAllPatterns, getPatternInstances, rescanAllVideos } from '../services/patternService.js';

/**
 * GET /api/patterns — List all identified patterns and their counts.
 */
export async function getPatterns(_req: Request, res: Response): Promise<void> {
  try {
    console.log('🔍 GET /api/patterns called');
    const patterns = await getAllPatterns();
    console.log(`✅ Returning ${patterns.length} patterns`);
    res.json(patterns);
  } catch (err: any) {
    console.error('❌ Error in getPatterns:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/patterns/:patternId — Get all occurrences of a specific pattern.
 */
export async function getPatternDetails(req: Request, res: Response): Promise<void> {
  const { patternId } = req.params;
  try {
    const instances = await getPatternInstances(parseInt(patternId));
    res.json(instances);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/patterns/rescan — Trigger a full re-scan of the library.
 */
export async function rescanPatterns(_req: Request, res: Response): Promise<void> {
  try {
    const result = await rescanAllVideos();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
