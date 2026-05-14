/**
 * Subtitle parser — converts VTT/SRT files into structured Sentence objects.
 */
import * as fs from 'node:fs/promises';
import type { Sentence } from '../types/player.js';

export interface SubtitleCue {
  startTime: number;  // seconds
  endTime: number;    // seconds
  text: string;
}

// Common English stop words to filter out from keywords
const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
  'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as',
  'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about',
  'against', 'between', 'through', 'during', 'before', 'after',
  'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
  'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
  'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now',
  'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', 'couldn',
  'didn', 'doesn', 'hadn', 'hasn', 'haven', 'isn', 'ma', 'mightn',
  'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren', 'won', 'wouldn',
  'could', 'would', 'shall', 'might', 'must', 'need',
  'also', 'well', 'like', 'know', 'think', 'go', 'get', 'make',
  'say', 'tell', 'see', 'come', 'want', 'look', 'use', 'find',
  'give', 'take', 'let', 'put', 'try', 'got', 'still', 'back',
  'going', 'really', 'right', 'thing', 'things', 'much', 'way',
  'even', 'good', 'yeah', 'okay', 'oh', 'uh', 'um',
]);

/**
 * Parse VTT timestamp to seconds.
 * Supports: "00:01:23.456" or "01:23.456"
 */
function parseTimestamp(ts: string): number {
  const parts = ts.trim().split(':');
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s);
  } else if (parts.length === 2) {
    const [m, s] = parts;
    return parseInt(m) * 60 + parseFloat(s);
  }
  return 0;
}

/**
 * Parse a VTT file into an array of cues.
 */
export async function parseVTT(filePath: string): Promise<SubtitleCue[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const cues: SubtitleCue[] = [];

  // Split by blank lines
  const blocks = content.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');

    // Find the timestamp line
    let tsLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        tsLineIdx = i;
        break;
      }
    }
    if (tsLineIdx === -1) continue;

    const tsLine = lines[tsLineIdx];
    const tsMatch = tsLine.match(/([\d:.]+)\s*-->\s*([\d:.]+)/);
    if (!tsMatch) continue;

    const startTime = parseTimestamp(tsMatch[1]);
    const endTime = parseTimestamp(tsMatch[2]);

    // Text lines come after the timestamp
    const textLines = lines.slice(tsLineIdx + 1);
    let text = textLines.join(' ').trim();

    // Strip VTT formatting tags like <c>, </c>, <00:01:23.456>, etc.
    text = text.replace(/<[^>]+>/g, '');
    // Strip alignment/position tags
    text = text.replace(/^(align|position|line|size)[^\n]*/gm, '');
    text = text.trim();

    if (!text) continue;

    cues.push({ startTime, endTime, text });
  }

  return cues;
}

/**
 * Parse an SRT file into an array of cues.
 */
export async function parseSRT(filePath: string): Promise<SubtitleCue[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const cues: SubtitleCue[] = [];
  const blocks = content.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    // Find timestamp line (SRT uses comma for milliseconds)
    let tsLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        tsLineIdx = i;
        break;
      }
    }
    if (tsLineIdx === -1) continue;

    const tsLine = lines[tsLineIdx].replace(/,/g, '.');
    const tsMatch = tsLine.match(/([\d:.]+)\s*-->\s*([\d:.]+)/);
    if (!tsMatch) continue;

    const startTime = parseTimestamp(tsMatch[1]);
    const endTime = parseTimestamp(tsMatch[2]);
    const text = lines.slice(tsLineIdx + 1).join(' ').replace(/<[^>]+>/g, '').trim();

    if (!text) continue;
    cues.push({ startTime, endTime, text });
  }

  return cues;
}

/**
 * Auto-detect file format and parse.
 */
export async function parseSubtitleFile(filePath: string): Promise<SubtitleCue[]> {
  if (filePath.endsWith('.srt')) return parseSRT(filePath);
  return parseVTT(filePath);
}

/**
 * Deduplicate consecutive cues with identical text (common in auto-generated subs).
 */
function deduplicateCues(cues: SubtitleCue[]): SubtitleCue[] {
  if (cues.length === 0) return [];
  const result: SubtitleCue[] = [{ ...cues[0] }];

  for (let i = 1; i < cues.length; i++) {
    const prev = result[result.length - 1];
    if (cues[i].text === prev.text) {
      // Extend the previous cue
      prev.endTime = cues[i].endTime;
    } else {
      result.push({ ...cues[i] });
    }
  }
  return result;
}

/**
 * Merge short cues together into sentence-like chunks.
 * Target: each sentence is at least `minDuration` seconds.
 */
function mergeCuesIntoSentences(cues: SubtitleCue[], minDuration = 2): SubtitleCue[] {
  if (cues.length === 0) return [];

  const merged: SubtitleCue[] = [];
  let current: SubtitleCue = { ...cues[0] };

  for (let i = 1; i < cues.length; i++) {
    const cue = cues[i];
    const currentDuration = current.endTime - current.startTime;

    // If current is still short and the next cue is close, merge
    if (currentDuration < minDuration && (cue.startTime - current.endTime) < 1) {
      current.endTime = cue.endTime;
      current.text += ' ' + cue.text;
    } else {
      merged.push(current);
      current = { ...cue };
    }
  }
  merged.push(current);

  return merged;
}

/**
 * Extract keywords from English text.
 * Simple approach: words longer than 3 chars that aren't stop words.
 */
export function extractKeywords(text: string, maxKeywords = 3): string[] {
  const words = text
    .replace(/[^a-zA-Z\s'-]/g, '')
    .split(/\s+/)
    .map(w => w.toLowerCase().replace(/^['-]+|['-]+$/g, ''))
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));

  // Deduplicate and take first N
  const unique = [...new Set(words)];
  return unique.slice(0, maxKeywords);
}

/**
 * Build Sentence[] from English cues (and optional Chinese cues).
 */
export function buildSentences(
  enCues: SubtitleCue[],
  cnCues?: SubtitleCue[],
): Sentence[] {
  // Deduplicate + merge into sentences
  const deduped = deduplicateCues(enCues);
  const sentences = mergeCuesIntoSentences(deduped);

  return sentences.map((cue, idx) => {
    // Try to find matching Chinese subtitle by time overlap
    let cn = '';
    if (cnCues && cnCues.length > 0) {
      const matching = cnCues.filter(
        c => c.startTime < cue.endTime && c.endTime > cue.startTime
      );
      cn = matching.map(c => c.text).join(' ');
    }

    return {
      id: idx + 1,
      en: cue.text,
      cn,
      keywords: extractKeywords(cue.text),
      startTime: Math.round(cue.startTime * 100) / 100,
      endTime: Math.round(cue.endTime * 100) / 100,
      isKey: false,
    };
  });
}
