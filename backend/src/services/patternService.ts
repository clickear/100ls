import db from './db.js';
import type { Sentence } from '../types/player.js';

export interface PatternDefinition {
  text: string;
  description: string;
  regex: RegExp;
}

/**
 * Built-in high-frequency English patterns.
 * "*" is used as a wildcard.
 */
const SEED_PATTERNS: { text: string; description: string }[] = [
  { text: "as soon as *", description: "一...就..." },
  { text: "not only * but also *", description: "不仅...而且..." },
  { text: "it's time to *", description: "该是...的时候了" },
  { text: "be supposed to *", description: "应该/应当..." },
  { text: "used to *", description: "过去常常..." },
  { text: "be looking forward to *", description: "期待..." },
  { text: "had better *", description: "最好..." },
  { text: "it depends on *", description: "取决于..." },
  { text: "make sure *", description: "确保..." },
  { text: "take advantage of *", description: "利用..." },
  { text: "be able to *", description: "能够..." },
  { text: "as far as I'm concerned", description: "就我而言" },
  { text: "by the way", description: "顺便提一下" },
  { text: "in terms of *", description: "在...方面" },
  { text: "no matter what *", description: "无论发生什么" },
  { text: "would rather *", description: "宁愿..." },
  { text: "be worth *ing", description: "值得..." },
  { text: "can't help *ing", description: "忍不住..." },
  { text: "have trouble *ing", description: "在...方面有困难" },
  { text: "take * eyes off *", description: "目不转睛地看/注视..." },
  { text: "I was *", description: "我当时..." },
  { text: "How long *", description: "多久...?" },
  { text: "Would you like *", description: "你想要...吗？" },
  { text: "What if *", description: "如果...怎么办？" },
  { text: "I'm looking for *", description: "我在寻找..." },
  { text: "Can you tell me *", description: "你能告诉我...吗？" },
  { text: "It's because *", description: "是因为..." }
];

/**
 * Convert a pattern with wildcards (*) into a regex.
 */
function patternToRegex(pattern: string): RegExp {
  // Escape special regex chars except "*"
  let escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  // Convert "*" to ".*?" (0 or more chars)
  let regexStr = escaped.replace(/\*/g, '.*?');
  // Match case-insensitively and use word boundaries
  return new RegExp(`\\b${regexStr}\\b`, 'i');
}

const COMPILED_PATTERNS: PatternDefinition[] = SEED_PATTERNS.map(p => ({
  ...p,
  regex: patternToRegex(p.text)
}));

/**
 * Initialize patterns in the database if they don't exist.
 */
export async function initPatterns(): Promise<void> {
  const insert = db.prepare('INSERT OR IGNORE INTO patterns (text, description) VALUES (?, ?)');
  const transaction = db.transaction((patterns: typeof SEED_PATTERNS) => {
    for (const p of patterns) {
      insert.run(p.text, p.description);
    }
  });
  transaction(SEED_PATTERNS);
}

/**
 * Scan a list of sentences for patterns and save instances to the DB.
 */
export async function scanSentencesForPatterns(videoId: string, sentences: Sentence[]): Promise<void> {
  // 1. Ensure seed patterns exist in DB
  await initPatterns();

  // 2. Fetch all patterns from DB to get IDs
  const allPatterns = db.prepare('SELECT id, text FROM patterns').all() as { id: number; text: string }[];
  
  // Create a map for quick lookup
  const patternMap = new Map<string, number>();
  allPatterns.forEach(p => patternMap.set(p.text, p.id));

  // 3. Scan sentences
  const insertInstance = db.prepare(`
    INSERT INTO phrase_instances (patternId, sentenceId, exactText)
    VALUES (?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    for (const sentence of sentences) {
      // sentences table uses 0-based sentenceIndex
      const sentenceIndex = sentence.id - 1;
      const dbSentence = db.prepare('SELECT id FROM sentences WHERE videoId = ? AND sentenceIndex = ?')
        .get(videoId, sentenceIndex) as { id: number } | undefined;
      
      if (!dbSentence) {
        console.warn(`⚠️ Sentence not found in DB: videoId=${videoId}, index=${sentenceIndex}`);
        continue;
      }

      for (const pattern of COMPILED_PATTERNS) {
        const match = sentence.en.match(pattern.regex);
        if (match) {
          const patternId = patternMap.get(pattern.text);
          if (patternId) {
            insertInstance.run(patternId, dbSentence.id, match[0]);
          }
        }
      }
    }
  });

  transaction();
  console.log(`🔍 Pattern scan complete for video ${videoId}`);
}

/**
 * Get all identified patterns across all videos.
 */
export function getAllPatterns() {
  return db.prepare(`
    SELECT p.*, COUNT(pi.id) as count
    FROM patterns p
    JOIN phrase_instances pi ON p.id = pi.patternId
    GROUP BY p.id
    ORDER BY count DESC
  `).all();
}

/**
 * Get all instances of a specific pattern.
 */
export function getPatternInstances(patternId: number) {
  return db.prepare(`
    SELECT pi.*, s.en, s.startTime, s.endTime, v.title as videoTitle, v.id as videoId
    FROM phrase_instances pi
    JOIN sentences s ON pi.sentenceId = s.id
    JOIN videos v ON s.videoId = v.id
    WHERE pi.patternId = ?
    ORDER BY v.importedAt DESC
  `).all(patternId);
}

/**
 * Re-scan all existing videos and sentences in the database.
 */
export async function rescanAllVideos(): Promise<{ videoCount: number; instanceCount: number }> {
  // 1. Ensure patterns exist
  await initPatterns();

  // 2. Get all videos
  const videos = db.prepare('SELECT id FROM videos').all() as { id: string }[];
  
  // 3. Clear existing instances to avoid duplicates
  db.prepare('DELETE FROM phrase_instances').run();

  let totalInstances = 0;
  for (const video of videos) {
    // Fetch sentences for this video
    const sentencesRows = db.prepare('SELECT id, sentenceIndex, en FROM sentences WHERE videoId = ?').all(video.id) as any[];
    
    // Map to the internal Sentence format (simplified for scanning)
    const sentences = sentencesRows.map(row => ({
      id: row.sentenceIndex, // Our scan logic uses 0-based index which matches sentenceIndex
      en: row.en
    }));

    // Perform scan
    // Note: We adjust the scan function slightly to use the raw DB IDs directly for efficiency
    const allPatterns = db.prepare('SELECT id, text FROM patterns').all() as { id: number; text: string }[];
    const patternMap = new Map<string, number>();
    allPatterns.forEach(p => patternMap.set(p.text, p.id));

    const insertInstance = db.prepare(`
      INSERT INTO phrase_instances (patternId, sentenceId, exactText)
      VALUES (?, ?, ?)
    `);

    db.transaction(() => {
      for (const row of sentencesRows) {
        for (const pattern of COMPILED_PATTERNS) {
          const match = row.en.match(pattern.regex);
          if (match) {
            const patternId = patternMap.get(pattern.text);
            if (patternId) {
              insertInstance.run(patternId, row.id, match[0]);
              totalInstances++;
            }
          }
        }
      }
    })();
  }

  return { videoCount: videos.length, instanceCount: totalInstances };
}
